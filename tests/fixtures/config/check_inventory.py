"""Check fixture inventory/default expectations; this is NOT a config loader."""

import json
import posixpath
import re
from pathlib import Path


def main():
    fixture_dir = Path(__file__).resolve().parent
    root = fixture_dir.parents[2]
    manifest = json.loads((fixture_dir / "manifest.json").read_text())
    assert manifest["contract"] == "SCRUM-9/V03-DRAFT"
    assert manifest["runtime_status"] == "NOT_RUN"
    samples = {
        kind: json.loads((root / f"config/{kind}.example.json").read_text())
        for kind in ("server", "client")
    }
    table_text = (root / "config/README.md").read_text()
    server_table = table_text.split("### Server — đủ 20 trường mẫu\n", 1)[1].split(
        "### Client — đủ 6 trường mẫu\n", 1
    )[0]
    client_table = table_text.split("### Client — đủ 6 trường mẫu\n", 1)[1].split(
        "### Chuỗi, đường dẫn và quan hệ\n", 1
    )[0]
    for kind, table in (("server", server_table), ("client", client_table)):
        fields = re.findall(r"^\| ([a-z][a-z_]+) \|", table, re.M)
        assert len(fields) == len(set(fields))
        assert set(fields) == set(samples[kind]), (kind, fields)

    ids, inputs, expectations = set(), set(), set()
    accepted = 0
    for case in manifest["cases"]:
        assert case["id"] not in ids
        ids.add(case["id"])
        assert case["kind"] in samples
        assert case["input"] not in inputs
        inputs.add(case["input"])
        assert (fixture_dir / case["input"]).is_file()
        assert posixpath.isabs(case["config_path"])
        if not case["expected"]["accept"]:
            assert case["expected"]["category"]
            assert "effective_config" not in case
            # Rejected input stays raw: do not implement/pretend to run validation.
            continue
        accepted += 1
        provided = json.loads((fixture_dir / case["input"]).read_text())
        assert set(provided) <= samples[case["kind"]].keys()
        expected = samples[case["kind"]] | provided
        if case["kind"] == "server":
            for field in ("database_path", "log_directory", "business_entry_path"):
                expected[field] = posixpath.normpath(
                    posixpath.join(posixpath.dirname(case["config_path"]), expected[field])
                )
            if posixpath.isabs(expected["node_executable"]):
                expected["node_executable"] = posixpath.normpath(expected["node_executable"])
        path = case["effective_config"]
        assert path not in expectations
        expectations.add(path)
        assert json.loads((fixture_dir / path).read_text()) == expected, case["id"]

    assert inputs == {str(p.relative_to(fixture_dir)) for p in (fixture_dir / "inputs").glob("*.json")}
    assert expectations == {str(p.relative_to(fixture_dir)) for p in (fixture_dir / "expected").glob("*.json")}
    for context in manifest["path_contexts"]:
        assert context["case_id"] in ids
        assert context["expected_same_effective_config"] is True
    field_count = sum(len(sample) for sample in samples.values())
    print(f"STATIC PASS: {field_count} config fields; {len(ids)} inputs; {accepted} default/path expectations")
    print("C/TS loader, rejection behavior, cwd runtime, socket/DB/BP: NOT_RUN")


if __name__ == "__main__":
    main()
