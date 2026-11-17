"""Summary-only updates, preflight conflict detection and ambiguous-write recovery."""
import contextlib
import copy
import io
import unittest

import import_sprint1 as importer
import rename_sprint1 as rename
from prepare_backlog import load_tickets, PLANNING


class FakeJira:
    def __init__(self, records, names):
        self.rows = {}
        self.mapping = {}
        self.writes = []
        self.timeout = False
        for n, (sid, row) in enumerate(records.items(), 5):
            key = f'SCRUM-{n}'
            self.mapping[sid] = key
            self.rows[key] = {'key': key, 'fields': {
                'project': {'key': importer.PROJECT}, 'issuetype': {'name': row['kind']},
                'labels': importer.labels(sid, row),
                'summary': names[sid]['old'] if row['kind'] == 'Task' else row['summary'],
                'description': copy.deepcopy(row['description']),
                'assignee': {'accountId': 'manual-assignment'}, 'rank': n,
                'sprint': 1, 'status': 'To Do',
            }}

    def get(self, path, **query):
        if path.endswith('serverInfo'):
            return {'baseUrl': importer.SITE}
        if path.endswith('project/SCRUM'):
            return {'key': 'SCRUM'}
        if path.endswith('mypermissions'):
            return {'permissions': {p: {'havePermission': True}
                                    for p in query['permissions'].split(',')}}
        raise AssertionError(path)

    def search(self):
        return copy.deepcopy(list(self.rows.values()))

    def issue(self, key):
        return copy.deepcopy(self.rows[key])

    def request(self, method, path, body):
        assert method == 'PUT'
        assert set(body) == {'fields'} and set(body['fields']) == {'summary'}
        key = path.rsplit('/', 1)[-1]
        self.rows[key]['fields']['summary'] = body['fields']['summary']
        self.writes.append(key)
        if self.timeout:
            self.timeout = False
            raise RuntimeError('Lost response after accepted PUT')


class RenameTests(unittest.TestCase):
    def setUp(self):
        self.records, self.names = rename.rename_source()
        self.jira = FakeJira(self.records, self.names)
        self.state = {'mapping': self.jira.mapping, 'pending': None}

    def run_mode(self, mode):
        with contextlib.redirect_stdout(io.StringIO()):
            rename.run(self.jira, self.records, self.names, mode, self.state)

    def test_all_65_titles_match_source_index_and_naming_rule(self):
        index = (PLANNING / 'backlog.md').read_text()
        tickets = load_tickets()
        self.assertEqual(len(tickets), 65)
        self.assertEqual(len({row['summary'] for row in tickets}), 65)
        for row in tickets:
            title = row['summary']
            self.assertEqual(title, self.names[row['source_id']]['new'])
            self.assertRegex(title, r'^\[[A-Za-z ]+\] \S+')
            self.assertLessEqual(len(title), 120)
            self.assertIn(' | ' + title + ' | ', index)

    def test_only_summaries_change_and_rerun_is_noop(self):
        before = copy.deepcopy(self.jira.rows)
        self.run_mode('plan')
        self.assertEqual(self.jira.rows, before)
        with self.assertRaises(RuntimeError):
            self.run_mode('check')
        self.run_mode('apply')
        self.assertEqual(len(self.jira.writes), 44)
        self.run_mode('check')
        self.run_mode('apply')
        self.assertEqual(len(self.jira.writes), 44)
        for key, issue in self.jira.rows.items():
            expected = before[key]
            if issue['fields']['issuetype']['name'] == 'Task':
                expected['fields']['summary'] = issue['fields']['summary']
            self.assertEqual(issue, expected)

    def test_conflict_in_last_task_stops_before_any_write(self):
        key = self.jira.mapping['EXAM-T61']
        self.jira.rows[key]['fields']['summary'] = 'Manually changed scope'
        with self.assertRaises(RuntimeError):
            self.run_mode('apply')
        self.assertFalse(self.jira.writes)

    def test_lost_response_can_be_reconciled_without_duplicate_updates(self):
        self.jira.timeout = True
        with self.assertRaises(RuntimeError):
            self.run_mode('apply')
        self.run_mode('plan')
        self.run_mode('apply')
        self.run_mode('check')
        self.assertEqual(len(self.jira.writes), 44)

    def test_wrong_owner_label_stops_all_writes(self):
        issue = self.jira.rows[self.jira.mapping['EXAM-T61']]
        issue['fields']['labels'].remove('exam-owner-b')
        with self.assertRaises(RuntimeError):
            self.run_mode('apply')
        self.assertFalse(self.jira.writes)


if __name__ == '__main__':
    unittest.main()
