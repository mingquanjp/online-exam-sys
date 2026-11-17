#!/usr/bin/env python3
"""Update only summaries/descriptions for the 44 existing Sprint 1 tasks."""
import argparse
import fcntl
import getpass
import hashlib
import json
from pathlib import Path
import re
import sys
import uuid
import warnings

from import_sprint1 import API, PROJECT, SITE, STATE, Jira, description_signature, discover, labels, require, source
from prepare_backlog import PEOPLE

MIGRATION = Path(__file__).with_name('ticket_description_update.json')


def digest(value):
    canonical = json.dumps(description_signature(value), sort_keys=True,
                           ensure_ascii=False, separators=(',', ':'))
    return hashlib.sha256(canonical.encode()).hexdigest()


def update_source():
    records = source()
    migration = json.loads(MIGRATION.read_text())
    for sid, row in records.items():
        if row['kind'] == 'Task':
            entry = migration[sid]
            require(row['summary'] == entry['new_summary']
                    and digest(row['description']) == entry['new_description_sha256'],
                    f'{sid}: nguồn đã đổi sau khi chuẩn bị migration; cần review lại bản cập nhật.')
    return records, migration


def inspect(issue, sid, row, migration):
    key, fields = issue['key'], issue['fields']
    require(re.fullmatch(r'SCRUM-\d+', key), 'Key ngoài project đích.')
    require(fields['project']['key'] == PROJECT and fields['issuetype']['name'] == 'Task',
            f'{key}: sai project hoặc loại issue.')
    require(set(labels(sid, row)) <= set(fields.get('labels') or []),
            f'{key}: nhãn nguồn/owner không khớp.')
    entry = migration[sid]
    require(fields.get('summary') in (entry['old_summary'], entry['new_summary']),
            f'{key}: tên đã sửa ngoài bản cập nhật; dừng để đối chiếu.')
    actual = digest(fields.get('description'))
    require(actual in (entry['old_description_sha256'], entry['new_description_sha256']),
            f'{key}: mô tả khác cả bản cũ/mới đã review; không ghi đè chỉnh sửa trên Jira.')
    return fields.get('summary') == entry['new_summary'] and actual == entry['new_description_sha256']


def run(jira, records, migration, mode, state):
    require(jira.get(API + '/serverInfo')['baseUrl'].rstrip('/') == SITE, 'Sai site Jira.')
    require(jira.get(f'{API}/project/{PROJECT}')['key'] == PROJECT, 'Sai project Jira.')
    perms = jira.get(API + '/mypermissions', projectKey=PROJECT,
                     permissions='BROWSE_PROJECTS,EDIT_ISSUES')['permissions']
    require(all(perms.get(p, {}).get('havePermission')
                for p in ('BROWSE_PROJECTS', 'EDIT_ISSUES')), 'Thiếu quyền Browse/Edit issues.')
    require(state['pending'] is None, 'Import còn pending; đối soát import trước.')
    issues = discover(jira, records, state['mapping'])
    tasks = {sid: row for sid, row in records.items() if row['kind'] == 'Task'}
    require(len(tasks) == 44 and set(tasks) <= issues.keys(), 'Chưa đủ 44 task S1.')
    todo = []
    # Inspect all targets before writing any target.
    for sid, row in tasks.items():
        issue = issues[sid]
        current = inspect(issue, sid, row, migration)
        if not current:
            todo.append(sid)
        print(f'{issue["key"]} {sid} | {PEOPLE[row["assignee_alias"]]} | '
              f'{"OK" if current else "UPDATE tên/mô tả"} | {row["summary"]}')
    print(f'{len(todo)} / 44 task cần cập nhật; chỉ ghi summary và description.')
    if mode == 'plan':
        return
    if mode == 'check':
        require(not todo, 'Nội dung Jira chưa đồng bộ; chạy apply.')
    else:
        for sid in todo:
            row, key = tasks[sid], issues[sid]['key']
            if inspect(jira.issue(key), sid, row, migration):
                continue
            jira.request('PUT', f'{API}/issue/{key}', {'fields': {
                'summary': row['summary'], 'description': row['description']}})
            require(inspect(jira.issue(key), sid, row, migration),
                    f'{key}: chưa xác nhận nội dung mới; chạy plan để đối soát.')
        for sid, row in tasks.items():
            require(inspect(jira.issue(issues[sid]['key']), sid, row, migration),
                    f'{sid}: nội dung thay đổi trong lúc cập nhật.')
    print('UPDATE CHECK đạt: 44 task đúng tên thành viên và mô tả review.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=('offline', 'plan', 'apply', 'check'))
    parser.add_argument('--cloud-id', type=uuid.UUID)
    args = parser.parse_args()
    records, migration = update_source()
    if args.mode == 'offline':
        print('OFFLINE: 44 task S1 khớp migration nội dung; không gọi Jira.')
        return
    require(sys.stdin.isatty() and sys.stderr.isatty(), 'Chạy trong terminal tương tác.')
    email = input('Email Atlassian: ').strip()
    with warnings.catch_warnings():
        warnings.simplefilter('error', getpass.GetPassWarning)
        token = getpass.getpass('API token: ')
    require(email and token, 'Email và token là bắt buộc.')
    require((STATE / 'state.json').exists(), 'Cần journal import S1 tại repo này.')
    with (STATE / 'import.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        state = json.loads((STATE / 'state.json').read_text())
        run(Jira(email, token, args.cloud_id), records, migration, args.mode, state)


if __name__ == '__main__':
    try:
        main()
    except RuntimeError as exc:
        sys.exit(str(exc))
    except (OSError, ValueError, KeyError, TypeError, EOFError, KeyboardInterrupt, getpass.GetPassWarning):
        sys.exit('Dừng do input/file/phản hồi Jira; chạy plan để đối soát trước khi apply lại.')
