#!/usr/bin/env python3
"""Plan, import or verify Sprint 1 candidates in the SCRUM Product Backlog."""

import argparse
import base64
import fcntl
import getpass
import json
import os
from pathlib import Path
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid
import warnings

from prepare_backlog import ROOT, load_epics, load_tickets, validate
from ticket_adf import adf

SITE = 'https://ltm-project.atlassian.net'
PROJECT = 'SCRUM'
API = '/rest/api/3'
LABEL = 'online-exam-sys'
FIELDS = 'project,issuetype,summary,description,parent,labels,issuelinks'
STATE = ROOT / '.local' / 'jira-sprint1'


def require(ok, message):
    if not ok:
        raise RuntimeError(message)


def source():
    tickets = load_tickets()
    validate(tickets)
    selected = [t for t in tickets if t['sprint_alias'] == 'S1']
    epics = {t['epic_source_id'] for t in selected}
    records = {}
    for kind, rows in [('Epic', load_epics()), ('Task', selected)]:
        for row in rows:
            sid = row['source_id']
            if kind == 'Epic' and sid not in epics:
                continue
            records[sid] = {
                **row, 'kind': kind, 'description': adf(row['description_markdown']),
            }
    return records


class RejectedWrite(RuntimeError):
    """Jira explicitly rejected a write before creating an issue or link."""


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class Jira:
    def __init__(self, email, token, cloud_id=None):
        self.base = SITE if cloud_id is None else f'https://api.atlassian.com/ex/jira/{cloud_id}'
        self.auth = 'Basic ' + base64.b64encode(f'{email}:{token}'.encode()).decode()
        self.opener = urllib.request.build_opener(NoRedirect)

    def request(self, method, path, body=None):
        req = urllib.request.Request(
            self.base + path, method=method,
            headers={'Authorization': self.auth, 'Accept': 'application/json',
                     'Content-Type': 'application/json'},
            data=None if body is None else json.dumps(body, ensure_ascii=False).encode(),
        )
        try:
            with self.opener.open(req, timeout=30) as response:
                expected_status = {'GET': 200, 'POST': 201, 'PUT': 204}[method]
                require(response.status == expected_status,
                        f'HTTP {response.status} tại {path.split("?")[0]}.')
                raw = response.read()
                return json.loads(raw) if raw else None
        except urllib.error.HTTPError as exc:
            if method in ('POST', 'PUT') and exc.code in (400, 401, 403, 404, 422):
                raise RejectedWrite(f'Jira từ chối HTTP {exc.code} tại {path}.') from None
            raise RuntimeError(f'HTTP {exc.code} tại {path.split("?")[0]}.') from None
        except (urllib.error.URLError, TimeoutError, OSError, ValueError):
            raise RuntimeError('Lỗi kết nối hoặc phản hồi Jira. Kiểm tra lại bằng plan.') from None

    def get(self, path, **query):
        suffix = '?' + urllib.parse.urlencode(query, doseq=True) if query else ''
        return self.request('GET', path + suffix)

    def post(self, path, body):
        require(path in (API + '/issue', API + '/issueLink'), 'Endpoint ghi ngoài phạm vi.')
        return self.request('POST', path, body)

    def rank(self, body):
        return self.request('PUT', '/rest/agile/1.0/issue/rank', body)

    def pages(self, path, field, **query):
        offset = 0
        while True:
            page = self.get(path, startAt=offset, maxResults=50, **query)
            batch = page[field]
            yield from batch
            offset += len(batch)
            if page.get('isLast') is True or offset >= page.get('total', float('inf')):
                return
            require(batch and offset < 10000, 'Không xác định được trang API cuối.')

    def search(self):
        token = None
        seen = set()
        while True:
            query = {'jql': f'project = {PROJECT} AND labels = "{LABEL}"',
                     'fields': FIELDS, 'maxResults': 50}
            if token:
                query['nextPageToken'] = token
            page = self.get(API + '/search/jql', **query)
            yield from page['issues']
            token = page.get('nextPageToken')
            if not token:
                require(page.get('isLast') is not False, 'Thiếu token phân trang search.')
                return
            require(token not in seen, 'Token phân trang search lặp.')
            seen.add(token)

    def issue(self, key):
        require(re.fullmatch(r'SCRUM-\d+', key), 'Key ngoài project SCRUM.')
        return self.get(f'{API}/issue/{key}', fields=FIELDS)


def preflight(jira):
    server = jira.get(API + '/serverInfo')
    require(server['baseUrl'].rstrip('/') == SITE, 'Site Jira khác đích dự kiến.')
    project = jira.get(f'{API}/project/{PROJECT}')
    require(project['key'] == PROJECT, 'Sai project Jira.')
    permissions = ['BROWSE_PROJECTS', 'CREATE_ISSUES', 'LINK_ISSUES']
    granted = jira.get(API + '/mypermissions', projectKey=PROJECT,
                       permissions=','.join(permissions))['permissions']
    require(all(granted.get(p, {}).get('havePermission') for p in permissions),
            'Tài khoản thiếu quyền Browse/Create/Link tại SCRUM.')
    meta_path = f'{API}/issue/createmeta/{PROJECT}/issuetypes'
    types = list(jira.pages(meta_path, 'issueTypes'))
    type_ids = {}
    for kind in ('Epic', 'Task'):
        matches = [t for t in types if t['name'] == kind and not t.get('subtask')]
        require(len(matches) == 1, f'Cần xác định duy nhất issue type {kind}.')
        type_ids[kind] = str(matches[0]['id'])
        fields = {f.get('fieldId', f.get('key')): f for f in
                  jira.pages(f'{meta_path}/{type_ids[kind]}', 'fields')}
        sent = {'project', 'issuetype', 'summary', 'description', 'labels'}
        if kind == 'Task':
            sent.add('parent')
        require(sent <= fields.keys(), f'{kind} thiếu trường tạo issue: {sent - fields.keys()}.')
        required = {k for k, f in fields.items() if f.get('required') and not f.get('hasDefaultValue')}
        require(required <= sent, f'{kind} có trường bắt buộc chưa hỗ trợ: {required - sent}.')
    types = jira.get(API + '/issueLinkType')['issueLinkTypes']
    links = [str(t['id']) for t in types if t['outward'].casefold() == 'blocks'
             and t['inward'].casefold() == 'is blocked by']
    require(len(links) == 1, 'Cần xác định duy nhất link type Blocks.')
    return type_ids, links[0]


def labels(sid, row):
    result = [LABEL, sid.lower()]
    if row['kind'] == 'Task':
        result.extend(['exam-s1-candidate', f'exam-owner-{row["assignee_alias"].lower()}'])
    return result


def payload(sid, row, type_ids, mapping):
    fields = {
        'project': {'key': PROJECT}, 'issuetype': {'id': type_ids[row['kind']]},
        'summary': row['summary'], 'description': row['description'], 'labels': labels(sid, row),
    }
    if row['kind'] == 'Task':
        fields['parent'] = {'key': mapping[row['epic_source_id']]}
    return fields


def description_signature(value):
    """Compare ADF content while allowing Jira's editor presentation metadata."""
    if isinstance(value, list):
        return [description_signature(item) for item in value]
    if not isinstance(value, dict):
        return value
    result = {key: description_signature(item) for key, item in value.items()
              if key != 'attrs'}
    attrs = dict(value.get('attrs') or {})
    attrs.pop('localId', None)
    if value.get('type') == 'table':
        for key in ('layout', 'width', 'isNumberColumnEnabled', 'displayMode'):
            attrs.pop(key, None)
    if value.get('type') in ('tableCell', 'tableHeader'):
        attrs.pop('colwidth', None)
        attrs.pop('background', None)
        for key in ('colspan', 'rowspan'):
            if attrs.get(key) == 1:
                attrs.pop(key)
    if value.get('type') == 'orderedList' and attrs.get('order') == 1:
        attrs.pop('order')
    if attrs:
        result['attrs'] = description_signature(attrs)
    return result


def first_difference(expected, actual, path='description'):
    if type(expected) is not type(actual):
        return f'{path}: kiểu dữ liệu khác nhau'
    if isinstance(expected, dict):
        if expected.keys() != actual.keys():
            return f'{path}: thiếu {sorted(expected.keys() - actual.keys())}, thêm {sorted(actual.keys() - expected.keys())}'
        for key in expected:
            if expected[key] != actual[key]:
                return first_difference(expected[key], actual[key], f'{path}.{key}')
    elif isinstance(expected, list):
        if len(expected) != len(actual):
            return f'{path}: số phần tử {len(expected)} nguồn / {len(actual)} Jira'
        for index, item in enumerate(expected):
            if item != actual[index]:
                return first_difference(item, actual[index], f'{path}[{index}]')
    return f'{path}: giá trị khác nhau'


def verify(issue, expected):
    fields = issue['fields']
    differences = []
    for field in ('project', 'issuetype', 'parent'):
        if field in expected and any(str((fields.get(field) or {}).get(key)) != str(value)
                                     for key, value in expected[field].items()):
            differences.append(field)
    if fields.get('summary') != expected['summary']:
        differences.append('summary')
    if not set(expected['labels']) <= set(fields.get('labels') or []):
        differences.append('labels')
    actual_adf = description_signature(fields.get('description'))
    expected_adf = description_signature(expected['description'])
    if actual_adf != expected_adf:
        differences.append(first_difference(expected_adf, actual_adf))
    require(not differences, f'{issue["key"]} khác nguồn tại: {"; ".join(differences)}.')


def discover(jira, records, saved):
    issues = {}
    for issue in jira.search():
        source_ids = {label.upper() for label in issue['fields']['labels']} & records.keys()
        if not source_ids:
            continue
        require(len(source_ids) == 1, f'{issue["key"]} có nhiều nhãn mã nguồn.')
        sid = source_ids.pop()
        require(sid not in issues, f'Có nhiều issue cho {sid}.')
        issues[sid] = issue
    for sid, key in saved.items():
        require(sid in records and (sid not in issues or issues[sid]['key'] == key),
                f'Journal và Jira lệch mapping {sid}.')
        issues[sid] = jira.issue(key)
    require(len({i['key'] for i in issues.values()}) == len(issues),
            'Một Jira key được gán cho nhiều mã nguồn.')
    return issues


def has_link(issue, target_key, link_id, end='outwardIssue'):
    return any(str(link['type']['id']) == link_id
               and link.get(end, {}).get('key') == target_key
               for link in issue['fields'].get('issuelinks', []))


def save_state(path, state):
    temp = path.with_suffix('.tmp')
    with temp.open('w', encoding='utf-8') as output:
        json.dump(state, output, ensure_ascii=False, indent=2)
        output.flush()
        os.fsync(output.fileno())
    temp.replace(path)


def write(jira, endpoint, body, path, state, pending):
    state['pending'] = pending
    save_state(path, state)
    try:
        return jira.post(endpoint, body)
    except RejectedWrite:
        state['pending'] = None
        save_state(path, state)
        raise


def run(jira, records, mode, state_path, state):
    type_ids, link_id = preflight(jira)
    issues = discover(jira, records, state['mapping'])
    mapping = {sid: i['key'] for sid, i in issues.items()}
    for sid, issue in issues.items():
        verify(issue, payload(sid, records[sid], type_ids, mapping))
    edges = sorted((p, sid) for sid, row in records.items() for p in row.get('depends_on', []))

    def link_exists(provider, consumer):
        if provider not in issues or consumer not in mapping:
            return False
        issue = issues[provider]
        key = mapping[consumer]
        require(not has_link(issue, key, link_id, 'inwardIssue'),
                f'Blocks đảo chiều: {provider}, {consumer}.')
        return has_link(issue, key, link_id)

    pending = state['pending']
    if pending:
        if pending['kind'] == 'create':
            resolved = pending['sid'] in issues
        else:
            resolved = link_exists(*pending['edge'])
        require(resolved, 'Journal có thao tác chưa rõ kết quả. Đối soát Jira trước khi chạy lại.')
    missing = [sid for sid in records if sid not in mapping]
    links = [(p, c) for p, c in edges if not link_exists(p, c)]
    print(f'{PROJECT} Product Backlog | tạo {len(missing)} issue | thêm {len(links)} Blocks')
    for sid, row in records.items():
        print(f'{mapping.get(sid, "NEW")} {sid} [{row.get("assignee_alias", "Epic")}] {row["summary"]}')
    for provider, consumer in links:
        print(f'LINK {provider} blocks {consumer}')
    if mode == 'plan':
        return
    if mode == 'check':
        require(not missing and not links, 'Chưa đủ issue hoặc Blocks.')
        print('CHECK đạt.')
        return
    state.update(mapping=mapping, pending=None)
    save_state(state_path, state)
    for sid in missing:
        candidates = [issue for issue in jira.search()
                      if sid.lower() in issue['fields']['labels']]
        require(not candidates, f'{sid} xuất hiện sau plan. Chạy plan lại để đối soát.')
        fields = payload(sid, records[sid], type_ids, mapping)
        created = write(jira, API + '/issue', {'fields': fields}, state_path, state,
                        {'kind': 'create', 'sid': sid})
        key = created['key']
        require(re.fullmatch(r'SCRUM-\d+', key), 'Jira trả key ngoài SCRUM.')
        mapping[sid] = key
        save_state(state_path, state)
        issues[sid] = jira.issue(key)
        verify(issues[sid], fields)
        state['pending'] = None
        save_state(state_path, state)
        print(f'{sid} -> {key}', flush=True)
    for provider, consumer in links:
        issues[provider] = jira.issue(mapping[provider])
        if link_exists(provider, consumer):
            continue
        write(jira, API + '/issueLink', {
            'type': {'id': link_id}, 'inwardIssue': {'key': mapping[provider]},
            'outwardIssue': {'key': mapping[consumer]},
        }, state_path, state, {'kind': 'link', 'edge': [provider, consumer]})
        issues[provider] = jira.issue(mapping[provider])
        require(link_exists(provider, consumer), 'Link chưa hiển thị. Kiểm lại bằng plan.')
        state['pending'] = None
        save_state(state_path, state)
    issues = discover(jira, records, mapping)
    require({sid: issue['key'] for sid, issue in issues.items()} == mapping,
            'Mapping thay đổi trong lượt import.')
    for sid in mapping:
        verify(issues[sid], payload(sid, records[sid], type_ids, mapping))
    require(all(link_exists(p, c) for p, c in edges), 'Đối soát cuối thiếu Blocks.')
    print(f'CHECK đạt: {len(mapping)} issue, {len(edges)} Blocks.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=('offline', 'plan', 'apply', 'check'))
    parser.add_argument('--cloud-id', type=uuid.UUID, help='Cloud ID nếu dùng API token có scope')
    args = parser.parse_args()
    records = source()
    if args.mode == 'offline':
        tasks = sum(r['kind'] == 'Task' for r in records.values())
        edges = sum(len(r.get('depends_on', [])) for r in records.values())
        print(f'OFFLINE: {tasks} Task, {len(records) - tasks} Epic, {edges} Blocks. ADF đã tạo.')
        return
    require(sys.stdin.isatty() and sys.stderr.isatty(), 'Chạy trong terminal tương tác.')
    email = input('Email Atlassian: ').strip()
    with warnings.catch_warnings():
        warnings.simplefilter('error', getpass.GetPassWarning)
        token = getpass.getpass('API token: ')
    require(email and token, 'Email và token là bắt buộc.')
    STATE.mkdir(mode=0o700, parents=True, exist_ok=True)
    path = STATE / 'state.json'
    with (STATE / 'import.lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        state = json.loads(path.read_text()) if path.exists() else {'mapping': {}, 'pending': None}
        run(Jira(email, token, args.cloud_id), records, args.mode, path, state)


if __name__ == '__main__':
    try:
        main()
    except RuntimeError as exc:
        sys.exit(str(exc))
    except (OSError, ValueError, KeyError, TypeError, getpass.GetPassWarning, EOFError, KeyboardInterrupt):
        sys.exit('Dừng do input, file, phản hồi Jira hoặc thao tác bị gián đoạn. Dùng plan để đối soát.')
