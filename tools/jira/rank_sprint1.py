#!/usr/bin/env python3
"""Order existing Sprint 1 tasks on Jira board 1 by dependency and handoff priority."""

import argparse
import fcntl
import getpass
import json
import sys
import time
import uuid
import warnings

from import_sprint1 import (
    API, PROJECT, SITE, STATE, Jira, RejectedWrite, discover, require, save_state, source,
)

BOARD = 1
AGILE = '/rest/agile/1.0'
# Providers precede consumers. A and B pick the first ready task assigned to them.
ORDER = (
    1, 5, 2, 3, 4, 44, 45, 6, 47, 8, 51, 14, 46, 9, 48, 10, 49,
    11, 50, 12, 7, 13, 16, 23, 15, 54, 55, 17, 56, 18, 53, 19, 20,
    21, 59, 52, 57, 58, 22, 60, 24, 61, 25, 26,
)


def task_order(records):
    desired = [f'EXAM-T{number:02}' for number in ORDER]
    tasks = {sid for sid, row in records.items() if row['kind'] == 'Task'}
    require(len(desired) == len(set(desired)) and set(desired) == tasks,
            'Thứ tự Rank phải chứa đủ mỗi task S1 đúng một lần.')
    done = set()
    for sid in desired:
        require(set(records[sid]['depends_on']) <= done,
                f'{sid} đứng trước provider của nó.')
        done.add(sid)
    return desired


def rank_context(jira, keys):
    require(jira.get(API + '/serverInfo')['baseUrl'].rstrip('/') == SITE,
            'Site Jira khác đích dự kiến.')
    require(jira.get(f'{API}/project/{PROJECT}')['key'] == PROJECT, 'Sai project.')
    config = jira.get(f'{AGILE}/board/{BOARD}/configuration')
    rank_id = (config.get('ranking') or {}).get('rankCustomFieldId')
    require(str(rank_id).isdigit() and int(rank_id) > 0,
            'Board chưa cung cấp rankCustomFieldId. Kiểm cấu hình ranking trên board 1.')
    permissions = jira.get(API + '/mypermissions', projectKey=PROJECT,
                           permissions='BROWSE_PROJECTS,EDIT_ISSUES,SCHEDULE_ISSUES')['permissions']
    require(all(permissions.get(p, {}).get('havePermission')
                for p in ('BROWSE_PROJECTS', 'EDIT_ISSUES', 'SCHEDULE_ISSUES')),
            'Tài khoản thiếu quyền Browse/Edit/Schedule issues để sắp Rank.')
    jql = 'key in (' + ','.join(keys) + ')'
    members = list(jira.pages(f'{AGILE}/board/{BOARD}/issue', 'issues',
                             jql=jql, fields='key'))
    require({issue['key'] for issue in members} == set(keys),
            'Board 1 chưa hiển thị đủ 44 task S1. Kiểm filter/visibility trên board.')
    return int(rank_id)


def ranked(jira, mapping, issues, rank_id):
    keys = list(mapping.values())
    jql = 'key in (' + ','.join(keys) + f') ORDER BY cf[{rank_id}] ASC'
    token = None
    seen = set()
    actual = []
    while True:
        query = {'jql': jql, 'fields': 'key', 'maxResults': 50,
                 'reconcileIssues': [issues[sid]['id'] for sid in mapping]}
        if token:
            query['nextPageToken'] = token
        page = jira.get(API + '/search/jql', **query)
        actual.extend(issue['key'] for issue in page['issues'])
        token = page.get('nextPageToken')
        if not token:
            require(page.get('isLast') is not False, 'Thiếu token phân trang Rank.')
            break
        require(token not in seen, 'Token phân trang Rank lặp.')
        seen.add(token)
    require(len(actual) == len(keys) and set(actual) == set(keys),
            'Search Rank chưa trả đủ mỗi task đúng một lần.')
    return actual


def wait_order(jira, mapping, issues, rank_id, condition):
    for delay in (0, 1, 2, 4):
        if delay:
            time.sleep(delay)
        actual = ranked(jira, mapping, issues, rank_id)
        if condition(actual):
            return actual
    raise RuntimeError('Rank chưa xác nhận được sau ghi. Chạy rank_sprint1.py plan để đọc lại.')


def run(jira, records, mode, import_state, rank_path):
    desired = task_order(records)
    issues = discover(jira, records, import_state['mapping'])
    require(import_state['pending'] is None,
            'Lượt import còn thao tác chưa đối soát. Chạy import_sprint1.py plan trước.')
    require(all(sid in issues for sid in desired), 'Chưa nhập đủ 44 task S1.')
    mapping = {sid: issues[sid]['key'] for sid in desired}
    for sid, key in mapping.items():
        row = issues[sid]
        require(key.startswith(PROJECT + '-') and
                row['fields']['project']['key'] == PROJECT and
                {'online-exam-sys', sid.lower(), 'exam-s1-candidate',
                 f'exam-owner-{records[sid]["assignee_alias"].lower()}'}
                <= set(row['fields']['labels']),
                f'{sid} chưa khớp project/nhãn owner của S1.')
    rank_id = rank_context(jira, list(mapping.values()))
    expected = list(mapping.values())
    actual = ranked(jira, mapping, issues, rank_id)
    print(f'Thứ tự ưu tiên S1 trên board {BOARD}, Rank field {rank_id}:')
    for position, sid in enumerate(desired, 1):
        row = records[sid]
        print(f'{position:02}. {mapping[sid]} [{row["assignee_alias"]}] {row["summary"]}')
    if mode == 'plan':
        print('RANK đã đúng.' if actual == expected else 'Cần sắp lại Rank của 44 task theo thứ tự trên.')
        return
    if mode == 'check':
        require(actual == expected, 'Thứ tự Rank chưa khớp kế hoạch.')
        print('RANK CHECK đạt: 44 task đúng thứ tự ưu tiên.')
        return
    state = {'board_id': BOARD, 'rank_field_id': rank_id,
             'mapping': mapping, 'desired': expected, 'pending': None}
    # Each operation places a task immediately before the next desired task.
    # Processing backwards builds an ordered suffix and supports read-first resume.
    for index in range(len(expected) - 2, -1, -1):
        key, anchor = expected[index:index + 2]
        actual = ranked(jira, mapping, issues, rank_id)
        if actual.index(key) + 1 == actual.index(anchor):
            continue
        state['pending'] = {'issue': key, 'before': anchor}
        save_state(rank_path, state)
        try:
            jira.rank({'issues': [key], 'rankBeforeIssue': anchor,
                       'rankCustomFieldId': rank_id})
        except RejectedWrite:
            state['pending'] = None
            save_state(rank_path, state)
            raise
        wait_order(jira, mapping, issues, rank_id,
                   lambda order: order.index(key) + 1 == order.index(anchor))
        state['pending'] = None
        save_state(rank_path, state)
        print(f'RANK {key} trước {anchor}', flush=True)
    wait_order(jira, mapping, issues, rank_id, lambda order: order == expected)
    state['pending'] = None
    save_state(rank_path, state)
    print('RANK CHECK đạt: 44 task đúng thứ tự ưu tiên.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=('offline', 'plan', 'apply', 'check'))
    parser.add_argument('--cloud-id', type=uuid.UUID)
    args = parser.parse_args()
    records = source()
    order = task_order(records)
    if args.mode == 'offline':
        for position, sid in enumerate(order, 1):
            print(f'{position:02}. {sid} [{records[sid]["assignee_alias"]}] {records[sid]["summary"]}')
        return
    require(sys.stdin.isatty() and sys.stderr.isatty(), 'Chạy trong terminal tương tác.')
    email = input('Email Atlassian: ').strip()
    with warnings.catch_warnings():
        warnings.simplefilter('error', getpass.GetPassWarning)
        token = getpass.getpass('API token: ')
    require(email and token, 'Email và token là bắt buộc.')
    STATE.mkdir(mode=0o700, parents=True, exist_ok=True)
    with (STATE / 'import.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        path = STATE / 'state.json'
        require(path.is_file(), 'Thiếu journal import. Chạy trên máy đã nhập Jira.')
        state = json.loads(path.read_text())
        run(Jira(email, token, args.cloud_id), records, args.mode, state,
            STATE / 'rank-state.json')


if __name__ == '__main__':
    try:
        main()
    except RuntimeError as exc:
        sys.exit(str(exc))
    except (OSError, ValueError, KeyError, TypeError, EOFError,
            getpass.GetPassWarning, KeyboardInterrupt):
        sys.exit('Dừng do input, API hoặc thao tác bị gián đoạn. Chạy rank_sprint1.py plan để đối soát.')
