#!/usr/bin/env python3
"""Compile a C poll echo probe and drive 50 real loopback sockets; not the app."""
import argparse
import asyncio
import json
import math
from pathlib import Path
import platform
import shutil
import struct
import subprocess
import tempfile
import time


async def clients(port, count, rounds, payload_bytes):
    gate = asyncio.Event()
    connected = 0
    latencies = []
    async def student(user):
        nonlocal connected
        reader, writer = await asyncio.open_connection("127.0.0.1", port)
        connected += 1
        if connected == count:
            gate.set()
        try:
            await gate.wait()
            for step in range(rounds):
                prefix = f"student={user};round={step};".encode()
                payload = prefix + b"x" * (payload_bytes - len(prefix))
                frame = struct.pack("!I", len(payload)) + payload
                start = time.perf_counter()
                # Deliberately split the header for one peer, then validate bytes.
                if user == 0:
                    writer.write(frame[:2])
                    await writer.drain()
                    await asyncio.sleep(.001)
                    writer.write(frame[2:])
                else:
                    writer.write(frame)
                await writer.drain()
                n = struct.unpack("!I", await reader.readexactly(4))[0]
                assert n == len(payload)
                assert await reader.readexactly(n) == payload
                latencies.append((time.perf_counter() - start) * 1000)
            # Keep all 50 connected until every client has completed its exchanges.
            await done_barrier(user)
        finally:
            writer.close()
            await writer.wait_closed()
    finished = 0
    all_done = asyncio.Event()
    async def done_barrier(_):
        nonlocal finished
        finished += 1
        if finished == count:
            all_done.set()
        await all_done.wait()
    start = time.perf_counter()
    await asyncio.wait_for(asyncio.gather(*(student(i) for i in range(count))), timeout=30)
    elapsed = time.perf_counter() - start
    latencies.sort()
    def at(p):
        return round(latencies[max(0, math.ceil(len(latencies)*p)-1)], 3)
    return {"clients": count, "rounds_per_client": rounds, "payload_bytes": payload_bytes,
            "exchanges": len(latencies), "elapsed_seconds": round(elapsed, 4),
            "roundtrip_ms": {"p50": at(.5), "p95": at(.95), "p99": at(.99), "max": at(1)},
            "payload_one_direction_mib_per_s": round(count * rounds * payload_bytes / elapsed / 2**20, 3),
            "all_echo_payloads_matched": True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    compiler = shutil.which("clang") or shutil.which("cc")
    if not compiler:
        raise RuntimeError("C compiler unavailable")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="exam-transport-probe-") as tmp:
        binary = str(Path(tmp)/"probe")
        command = [compiler, "-O2", "-std=c11", "-Wall", "-Wextra", "-Werror",
                   str(root/"tools/transport_probe.c"), "-o", binary]
        subprocess.run(command, check=True, capture_output=True)
        cases = []
        for size in [512, 32768]:
            process = subprocess.Popen([binary], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            try:
                first = process.stdout.readline()
                if not first.strip().isdigit():
                    raise RuntimeError(f"probe startup failed: {first} {process.stderr.read()}")
                measured = asyncio.run(clients(int(first), 50, 30, size))
                output, error = process.communicate(timeout=5)
                if process.returncode:
                    raise RuntimeError(error)
                server = json.loads(output.strip())
                assert server["peak_connections"] == 50
                assert server["echoed_bytes_including_headers"] == 50 * 30 * (size + 4)
                cases.append({**measured, "server": server})
            finally:
                if process.poll() is None:
                    process.kill()
                    process.communicate()
        result = {"purpose": "C poll framing/echo on loopback only; no SQLite/auth/Electron/domain logic",
                  "platform": platform.platform(), "compiler": subprocess.check_output([compiler,"--version"],text=True).splitlines()[0],
                  "cases": cases}
    args.output.write_text(json.dumps(result, indent=2)+"\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
