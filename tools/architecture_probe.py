#!/usr/bin/env python3
"""SQLite/queue microbenchmark, NOT the C server or a 50-client LAN test.

Uses only Python's standard library; writes throwaway DBs into an output folder.
Synthetic student IDs represent concurrent producers, not network connections.
"""
import argparse
import concurrent.futures
import json
import math
import os
from pathlib import Path
import platform
import queue
import sqlite3
import statistics
import tempfile
import threading
import time


def percentiles(values):
    values = sorted(values)
    def at(p):
        return round(values[max(0, math.ceil(len(values) * p) - 1)] * 1000, 3)
    return {"n": len(values), "p50_ms": at(.50), "p95_ms": at(.95),
            "p99_ms": at(.99), "max_ms": at(1)}


def run_case(directory, fullfsync, students, questions, rounds):
    path = directory / f"probe_fullfsync_{int(fullfsync)}.sqlite3"
    jobs = queue.Queue(maxsize=512)
    ready = concurrent.futures.Future()
    metrics = {"queue_wait": [], "service": [], "total": []}
    failures = []
    peak_queue = 0

    def worker():
        db = None
        try:
            db = sqlite3.connect(path, isolation_level=None)
            db.execute("PRAGMA foreign_keys=ON")
            db.execute("PRAGMA journal_mode=WAL")
            db.execute("PRAGMA synchronous=FULL")
            db.execute(f"PRAGMA fullfsync={int(fullfsync)}")
            db.executescript("""
                CREATE TABLE attempts(id INTEGER PRIMARY KEY, state TEXT NOT NULL,
                    correct_count INTEGER, total_count INTEGER NOT NULL);
                CREATE TABLE items(attempt INTEGER, position INTEGER, prompt TEXT,
                    correct INTEGER NOT NULL, PRIMARY KEY(attempt,position),
                    FOREIGN KEY(attempt) REFERENCES attempts(id));
                CREATE TABLE answers(attempt INTEGER, position INTEGER,
                    selected INTEGER NOT NULL, revision INTEGER NOT NULL,
                    PRIMARY KEY(attempt,position),
                    FOREIGN KEY(attempt,position) REFERENCES items(attempt,position));
                CREATE TABLE operations(user_id INTEGER, op TEXT, fingerprint TEXT,
                    receipt INTEGER NOT NULL, PRIMARY KEY(user_id,op));
            """)
            settings = {p: db.execute(f"PRAGMA {p}").fetchone()[0] for p in
                        ("journal_mode", "synchronous", "foreign_keys", "fullfsync",
                         "wal_autocheckpoint", "page_size")}
            started = time.perf_counter()
            db.execute("BEGIN IMMEDIATE")
            for user in range(students):
                db.execute("INSERT INTO attempts VALUES(?, 'OPEN', NULL, ?)",
                           (user, questions))
                db.executemany("INSERT INTO items VALUES(?,?,?,?)",
                    [(user, pos, "x" * 1024, pos % 4) for pos in range(questions)])
            db.execute("COMMIT")
            ready.set_result({"settings": settings,
                              "snapshot_prepare_commit_ms": round(
                                  (time.perf_counter() - started) * 1000, 3)})
            while True:
                job = jobs.get()
                if job is None:
                    jobs.task_done()
                    break
                user, step, submitted, future = job
                begun = time.perf_counter()
                try:
                    db.execute("BEGIN IMMEDIATE")
                    op = "submit" if step == "submit" else f"save:{step}"
                    fingerprint = op
                    prior = db.execute(
                        "SELECT fingerprint,receipt FROM operations WHERE user_id=? AND op=?",
                        (user, op)).fetchone()
                    if prior:
                        if prior[0] != fingerprint:
                            raise RuntimeError("operation ID reused with different payload")
                        result = prior[1]
                    elif step == "submit":
                        count = db.execute("""SELECT count(*) FROM answers a JOIN items i
                            ON a.attempt=i.attempt AND a.position=i.position
                            WHERE a.attempt=? AND a.selected=i.correct""", (user,)).fetchone()[0]
                        db.execute("UPDATE attempts SET state='FINALIZED',correct_count=? WHERE id=? AND state='OPEN'",
                                   (count, user))
                        if db.execute("SELECT changes()").fetchone()[0] != 1:
                            raise RuntimeError("unexpected second finalization")
                        result = count
                        db.execute("INSERT INTO operations VALUES(?,?,?,?)",
                                   (user, op, fingerprint, result))
                    else:
                        if db.execute("SELECT state FROM attempts WHERE id=?", (user,)).fetchone()[0] != "OPEN":
                            raise RuntimeError("write after finalize")
                        pos = step % questions
                        selected = step % 4
                        db.execute("""INSERT INTO answers VALUES(?,?,?,1)
                            ON CONFLICT(attempt,position) DO UPDATE SET
                            selected=excluded.selected,revision=answers.revision+1""",
                            (user, pos, selected))
                        result = db.execute("SELECT revision FROM answers WHERE attempt=? AND position=?",
                                            (user, pos)).fetchone()[0]
                        db.execute("INSERT INTO operations VALUES(?,?,?,?)",
                                   (user, op, fingerprint, result))
                    db.execute("COMMIT")
                    done = time.perf_counter()
                    metrics["queue_wait"].append(begun - submitted)
                    metrics["service"].append(done - begun)
                    metrics["total"].append(done - submitted)
                    future.set_result(result)
                except Exception as exc:
                    if db.in_transaction:
                        db.execute("ROLLBACK")
                    future.set_exception(exc)
                finally:
                    jobs.task_done()
        except Exception as exc:
            failures.append(repr(exc))
            if not ready.done():
                ready.set_exception(exc)
        finally:
            if db:
                db.close()

    thread = threading.Thread(target=worker, daemon=True)
    thread.start()
    setup = ready.result(timeout=30)

    def batch(step):
        nonlocal peak_queue
        futures = []
        start = time.perf_counter()
        for user in range(students):
            f = concurrent.futures.Future()
            jobs.put((user, step, time.perf_counter(), f), timeout=5)
            peak_queue = max(peak_queue, jobs.qsize())
            futures.append(f)
        for f in futures:
            f.result(timeout=30)
        return round((time.perf_counter() - start) * 1000, 3)

    started = time.perf_counter()
    bursts = [batch(step) for step in range(rounds)]
    # Duplicate the last save: its operation must not add a revision.
    retry_ms = batch(rounds - 1)
    submit_ms = batch("submit")
    submit_retry_ms = batch("submit")
    elapsed = time.perf_counter() - started
    jobs.put(None)
    thread.join(timeout=5)
    if thread.is_alive() or failures:
        raise RuntimeError(f"worker failed: {failures}")

    db = sqlite3.connect(path)
    assert db.execute("PRAGMA integrity_check").fetchone()[0] == "ok"
    assert db.execute("PRAGMA foreign_key_check").fetchall() == []
    assert db.execute("SELECT count(*) FROM attempts WHERE state='FINALIZED'").fetchone()[0] == students
    assert db.execute("SELECT sum(revision) FROM answers").fetchone()[0] == students * rounds
    assert db.execute("SELECT count(*) FROM operations").fetchone()[0] == students * (rounds + 1)
    # Independently compute every student's final selections and expected score.
    last = {}
    for step in range(rounds):
        last[step % questions] = step % 4
    expected_score = sum(selected == pos % 4 for pos, selected in last.items())
    assert db.execute("SELECT count(*) FROM attempts WHERE correct_count=?",
                      (expected_score,)).fetchone()[0] == students
    db.close()
    return {**setup, "students_synthetic": students, "questions_each": questions,
            "question_prompt_bytes": 1024, "save_rounds": rounds,
            "save_operations": students * rounds, "max_observed_queue": peak_queue,
            "all_operation_latency": {k: percentiles(v) for k, v in metrics.items()},
            "save_burst_ms": {"median": round(statistics.median(bursts), 3), "max": max(bursts)},
            "retry_last_save_burst_ms": retry_ms, "submit_burst_ms": submit_ms,
            "submit_retry_burst_ms": submit_retry_ms, "elapsed_seconds": round(elapsed, 3),
            "db_bytes_after_clean_close": path.stat().st_size,
            "checks": "integrity, foreign keys, revisions, dedup count, finalization and scores passed"}


def head_of_line(delay_ms):
    # Deliberate sleep models occupied business worker; NOT an Argon2 measurement.
    q = queue.Queue()
    for _ in range(10):
        q.put("synthetic_hash")
    for _ in range(50):
        q.put("answer")
    start = time.perf_counter()
    first = None
    while not q.empty():
        if q.get() == "synthetic_hash":
            time.sleep(delay_ms / 1000)
        elif first is None:
            first = (time.perf_counter() - start) * 1000
    return {"synthetic_auth_jobs": 10, "delay_each_ms": delay_ms,
            "first_answer_wait_ms": round(first, 3),
            "note": "synthetic occupancy demonstration; not real password hashing"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--students", type=int, default=50)
    parser.add_argument("--questions", type=int, default=30)
    parser.add_argument("--rounds", type=int, default=30)
    args = parser.parse_args()
    if min(args.students, args.questions, args.rounds) < 1:
        parser.error("counts must be positive")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="exam-db-probe-", dir=args.output.parent) as tmp:
        result = {"purpose": "SQLite component feasibility only; no TCP/C/Electron/LAN benchmark",
                  "platform": platform.platform(), "python": platform.python_version(),
                  "sqlite": sqlite3.sqlite_version, "cpu_count_reported": os.cpu_count(),
                  "cases": [run_case(Path(tmp), full, args.students, args.questions, args.rounds)
                            for full in ([False, True] if platform.system() == "Darwin" else [False])],
                  "head_of_line": head_of_line(100)}
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
