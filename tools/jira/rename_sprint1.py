#!/usr/bin/env python3
"""Plan, apply or verify summary-only renames for the 44 imported Sprint 1 tasks."""
import argparse
import fcntl
import getpass
import json
from pathlib import Path
import re
import sys
import uuid
import warnings

from import_sprint1 import API, PROJECT, SITE, STATE, Jira, discover, labels, require, source

NAMES = Path(__file__).with_name('ticket_names.json')


def rename_source():
    records = source()
    names = json.loads(NAMES.read_text())
    for sid, row in records.items():
        if row['kind'] == 'Task':
            require(row['summary'] == names[sid]['new'], f'{sid}: tên nguồn khác bảng đổi tên.')
    return records, names


def inspect(issue, sid, row, names):
    fields = issue['fields']
    require(re.fullmatch(r'SCRUM-\d+', issue['key']), 'Key ngoài project đích.')
    require(fields['project']['key'] == PROJECT, f'{sid}: sai project.')
    require(fields['issuetype']['name'] == 'Task', f'{sid}: không phải Task.')
    require(set(labels(sid, row)) <= set(fields['labels']), f'{sid}: nhãn nguồn/owner không khớp.')
    require(fields['summary'] in (names[sid]['old'], names[sid]['new']),
            f'{issue["key"]}: tên đã được sửa ngoài bảng đổi tên; dừng để đối chiếu.')
    return fields['summary']


def run(jira, records, names, mode, state):
    require(jira.get(API + '/serverInfo')['baseUrl'].rstrip('/') == SITE, 'Sai site Jira.')
    require(jira.get(f'{API}/project/{PROJECT}')['key'] == PROJECT, 'Sai project Jira.')
    permissions = jira.get(API + '/mypermissions', projectKey=PROJECT,
                           permissions='BROWSE_PROJECTS,EDIT_ISSUES')['permissions']
    require(all(permissions.get(p, {}).get('havePermission')
                for p in ('BROWSE_PROJECTS', 'EDIT_ISSUES')), 'Thiếu quyền Browse/Edit issues.')
    require(state['pending'] is None, 'Import còn pending; đối soát import trước.')
    issues = discover(jira, records, state['mapping'])
    tasks = {sid: row for sid, row in records.items() if row['kind'] == 'Task'}
    require(len(tasks) == 44 and set(tasks) <= issues.keys(), 'Chưa có đủ 44 task S1.')
    # Validate the complete set before the first write.
    todo = []
    for sid, row in tasks.items():
        issue = issues[sid]
        current = inspect(issue, sid, row, names)
        if current != row['summary']:
            todo.append(sid)
        print(f'{issue["key"]} {sid}: {current} -> {row["summary"]}')
    print(f'{len(todo)} tên cần cập nhật / 44 task.')
    if mode == 'plan':
        return
    if mode == 'check':
        require(not todo, 'Tên Jira chưa đồng bộ; chạy apply.')
    else:
        for sid in todo:
            row, key = tasks[sid], issues[sid]['key']
            current = inspect(jira.issue(key), sid, row, names)
            if current == row['summary']:
                continue
            # Exact field allowlist: no description, Rank, assignee, sprint or status.
            jira.request('PUT', f'{API}/issue/{key}', {'fields': {'summary': row['summary']}})
            require(inspect(jira.issue(key), sid, row, names) == row['summary'],
                    f'{key}: chưa xác nhận tên mới; chạy plan để đối soát.')
        for sid, row in tasks.items():
            require(inspect(jira.issue(issues[sid]['key']), sid, row, names) == row['summary'],
                    f'{sid}: tên thay đổi trong lúc cập nhật.')
    print('RENAME CHECK đạt: 44 task đúng quy tắc đặt tên.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=('offline', 'plan', 'apply', 'check'))
    parser.add_argument('--cloud-id', type=uuid.UUID)
    args = parser.parse_args()
    records, names = rename_source()
    if args.mode == 'offline':
        print('OFFLINE: 44 tên task S1 khớp bảng đổi tên; không gọi Jira.')
        return
    require(sys.stdin.isatty() and sys.stderr.isatty(), 'Chạy trong terminal tương tác.')
    email = input('Email Atlassian: ').strip()
    with warnings.catch_warnings():
        warnings.simplefilter('error', getpass.GetPassWarning)
        token = getpass.getpass('API token: ')
    require(email and token, 'Email và token là bắt buộc.')
    require((STATE / 'state.json').exists(), 'Chạy tại repo có journal import S1.')
    with (STATE / 'import.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        state = json.loads((STATE / 'state.json').read_text())
        run(Jira(email, token, args.cloud_id), records, names, args.mode, state)


if __name__ == '__main__':
    try:
        main()
    except RuntimeError as exc:
        sys.exit(str(exc))
    except (OSError, ValueError, KeyError, TypeError, EOFError, KeyboardInterrupt, getpass.GetPassWarning):
        sys.exit('Dừng do input/file/phản hồi Jira. Chạy plan để đối soát trước khi apply lại.')
