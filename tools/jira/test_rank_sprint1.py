"""Regression tests for Jira ranking and interruption recovery using a fake server."""

import contextlib
import copy
import io
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import import_sprint1 as importer
import rank_sprint1 as ranking


class FakeJira:
    def __init__(self, records):
        self.issues = {}
        self.mapping = {}
        self.writes = []
        self.timeout_after_write = False
        for number, (sid, record) in enumerate(records.items(), 5):
            key = f'SCRUM-{number}'
            self.mapping[sid] = key
            self.issues[key] = {
                'key': key, 'id': str(number),
                'fields': {
                    'project': {'key': 'SCRUM'}, 'labels': importer.labels(sid, record),
                    'summary': record['summary'], 'assignee': {'accountId': 'user-assigned-later'},
                },
            }
        tasks = [self.mapping[sid] for sid, record in records.items() if record['kind'] == 'Task']
        self.order = ['SCRUM-1000', *tasks, 'SCRUM-1001']
        self.original_fields = copy.deepcopy(self.issues)

    def search(self):
        return copy.deepcopy(list(self.issues.values()))

    def issue(self, key):
        return copy.deepcopy(self.issues[key])

    def get(self, path, **query):
        if path.endswith('/serverInfo'):
            return {'baseUrl': importer.SITE}
        if path.endswith('/project/SCRUM'):
            return {'key': 'SCRUM'}
        if path.endswith('/configuration'):
            # A team-managed board may use "simple". Ranking uses its actual field.
            return {'type': 'simple', 'ranking': {'rankCustomFieldId': 10019}}
        if path.endswith('/mypermissions'):
            return {'permissions': {
                p: {'havePermission': True} for p in query['permissions'].split(',')
            }}
        if path.endswith('/search/jql'):
            keys = query['jql'].split('(')[1].split(')')[0].split(',')
            assert 'ORDER BY cf[10019] ASC' in query['jql']
            assert len(query['reconcileIssues']) == 44
            return {'issues': [{'key': key} for key in self.order if key in keys], 'isLast': True}
        raise AssertionError(path)

    def pages(self, path, field, **query):
        assert path.endswith('/board/1/issue') and field == 'issues'
        keys = query['jql'].split('(')[1].split(')')[0].split(',')
        return [{'key': key} for key in self.order if key in keys]

    def rank(self, body):
        assert body['rankCustomFieldId'] == 10019
        key = body['issues'][0]
        anchor = body['rankBeforeIssue']
        self.writes.append((key, anchor))
        self.order.remove(key)
        self.order.insert(self.order.index(anchor), key)
        if self.timeout_after_write:
            self.timeout_after_write = False
            raise RuntimeError('timeout after rank accepted')


class RankingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.records = importer.source()

    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / 'rank-state.json'
        self.jira = FakeJira(self.records)
        self.state = {'mapping': self.jira.mapping, 'pending': None}
        self.stdout = contextlib.redirect_stdout(io.StringIO())
        self.stdout.__enter__()
        self.addCleanup(self.stdout.__exit__, None, None, None)

    def execute(self, mode):
        ranking.run(self.jira, self.records, mode, self.state, self.path)

    def test_order_covers_tasks_and_all_dependency_edges(self):
        order = ranking.task_order(self.records)
        self.assertEqual(len(order), 44)
        positions = {sid: index for index, sid in enumerate(order)}
        for sid in order:
            for provider in self.records[sid]['depends_on']:
                self.assertLess(positions[provider], positions[sid])
        self.assertEqual(order[:2], ['EXAM-T01', 'EXAM-T05'])

    def test_plan_read_only_and_apply_readback_and_rerun(self):
        self.execute('plan')
        self.assertEqual(self.jira.writes, [])
        self.assertFalse(self.path.exists())
        with self.assertRaisesRegex(RuntimeError, 'chưa khớp'):
            self.execute('check')
        self.execute('apply')
        self.execute('check')
        writes = len(self.jira.writes)
        self.assertGreater(writes, 0)
        self.execute('apply')
        self.assertEqual(len(self.jira.writes), writes)
        self.assertEqual(self.jira.issues, self.jira.original_fields)
        self.assertEqual([key for key in self.jira.order if key.startswith('SCRUM-100')],
                         ['SCRUM-1000', 'SCRUM-1001'])
        epic_keys = {self.jira.mapping[sid] for sid, row in self.records.items()
                     if row['kind'] == 'Epic'}
        self.assertTrue(all(key not in epic_keys and anchor not in epic_keys
                            for key, anchor in self.jira.writes))

    def test_resume_after_rank_response_lost(self):
        self.jira.timeout_after_write = True
        with self.assertRaisesRegex(RuntimeError, 'timeout'):
            self.execute('apply')
        first_write = self.jira.writes[0]
        self.execute('plan')
        self.assertEqual(len(self.jira.writes), 1)
        self.execute('apply')
        self.execute('check')
        self.assertEqual(self.jira.writes.count(first_write), 1)

    def test_partial_import_is_rejected_before_rank(self):
        del self.state['mapping']['EXAM-T01']
        del self.jira.issues['SCRUM-9']
        with self.assertRaisesRegex(RuntimeError, 'Chưa nhập đủ'):
            self.execute('apply')
        self.assertFalse(self.jira.writes)

    def test_order_violation_is_rejected(self):
        with patch.object(ranking, 'ORDER', tuple(reversed(ranking.ORDER))):
            with self.assertRaisesRegex(RuntimeError, 'đứng trước'):
                ranking.task_order(self.records)

    def test_transport_accepts_204_and_rejects_partial_207(self):
        jira = importer.Jira('test@example.invalid', 'fake')
        class Response:
            def __init__(self, status):
                self.status = status
            def __enter__(self):
                return self
            def __exit__(self, *args):
                pass
            def read(self):
                return b''
        with patch.object(jira.opener, 'open', return_value=Response(204)):
            self.assertIsNone(jira.rank({'issues': ['SCRUM-9'], 'rankBeforeIssue': 'SCRUM-10'}))
        with patch.object(jira.opener, 'open', return_value=Response(207)):
            with self.assertRaisesRegex(RuntimeError, 'HTTP 207'):
                jira.rank({'issues': ['SCRUM-9'], 'rankBeforeIssue': 'SCRUM-10'})


if __name__ == '__main__':
    unittest.main()
