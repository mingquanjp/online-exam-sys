"""Summary/description migration preserves assignments and rejects unknown edits."""
import contextlib
import copy
import io
import unittest

import update_sprint1 as update
from prepare_backlog import load_tickets
from test_rename_sprint1 import FakeJira as BaseFake


class FakeJira(BaseFake):
    def request(self, method, path, body):
        assert method == 'PUT' and set(body) == {'fields'}
        assert set(body['fields']) == {'summary', 'description'}
        key = path.rsplit('/', 1)[-1]
        self.rows[key]['fields'].update(copy.deepcopy(body['fields']))
        self.writes.append(key)
        if self.timeout:
            self.timeout = False
            raise RuntimeError('Lost response after accepted PUT')


class UpdateTests(unittest.TestCase):
    def setUp(self):
        self.records, self.migration = update.update_source()
        names = {sid: {'old': row['summary']} for sid, row in self.records.items()}
        self.jira = FakeJira(self.records, names)
        self.state = {'mapping': self.jira.mapping, 'pending': None}
        # Independent legacy fixtures exercise old/new fingerprint recognition.
        self.migration = copy.deepcopy(self.migration)
        for sid, entry in self.migration.items():
            if sid not in self.records:
                continue
            old = {'version': 1, 'type': 'doc', 'content': [{
                'type': 'paragraph', 'content': [{'type': 'text', 'text': 'Legacy ' + sid}]}]}
            issue = self.jira.rows[self.jira.mapping[sid]]
            issue['fields']['description'] = old
            issue['fields']['summary'] = entry['old_summary']
            entry['old_description_sha256'] = update.digest(old)

    def run_mode(self, mode):
        with contextlib.redirect_stdout(io.StringIO()):
            update.run(self.jira, self.records, self.migration, mode, self.state)

    def test_apply_preserves_all_other_fields_and_is_idempotent(self):
        before = copy.deepcopy(self.jira.rows)
        self.run_mode('plan')
        self.assertEqual(before, self.jira.rows)
        with self.assertRaises(RuntimeError):
            self.run_mode('check')
        self.run_mode('apply')
        self.run_mode('check')
        self.run_mode('apply')
        self.assertEqual(len(self.jira.writes), 44)
        for key, issue in self.jira.rows.items():
            expected = before[key]
            if issue['fields']['issuetype']['name'] == 'Task':
                for field in ('summary', 'description'):
                    expected['fields'][field] = issue['fields'][field]
            self.assertEqual(expected, issue)

    def test_manual_edit_in_last_task_prevents_all_writes(self):
        issue = self.jira.rows[self.jira.mapping['EXAM-T61']]
        issue['fields']['description']['content'][0]['content'][0]['text'] = 'Manual Jira edit'
        with self.assertRaises(RuntimeError):
            self.run_mode('apply')
        self.assertFalse(self.jira.writes)

    def test_accepted_write_timeout_resumes_by_reading_actual_content(self):
        self.jira.timeout = True
        with self.assertRaises(RuntimeError):
            self.run_mode('apply')
        self.run_mode('plan')
        self.run_mode('apply')
        self.run_mode('check')
        self.assertEqual(len(self.jira.writes), 44)

    def test_editor_local_id_does_not_cause_false_conflict(self):
        issue = self.jira.rows[self.jira.mapping['EXAM-T61']]
        issue['fields']['description']['content'][0]['attrs'] = {'localId': 'jira-generated'}
        self.run_mode('apply')
        self.run_mode('check')

    def test_all_65_sources_use_names_policy_and_expected_hashes(self):
        import json
        migration = json.loads(update.MIGRATION.read_text())
        tickets = load_tickets()
        for row in tickets:
            from ticket_adf import adf
            text = row['description_markdown']
            # A/B là phương án hợp lệ; chỉ metadata người phụ trách phải dùng tên.
            self.assertNotRegex(text, r'\d+ (?:Minh Quân|Hoàng Quân)\b')
            self.assertIn('**Cách review:**', text)
            self.assertIn('**Assignee:** ' + update.PEOPLE[row['assignee_alias']], text)
            self.assertIn('**Reviewer:** ' + update.PEOPLE[row['reviewer_alias']], text)
            self.assertEqual(update.digest(adf(text)), migration[row['source_id']]['new_description_sha256'])
        self.assertEqual(sum('Buổi review/demo chung' in row['description_markdown'] for row in tickets), 4)

    def test_incomplete_import_or_wrong_owner_is_rejected(self):
        key = self.jira.mapping['EXAM-T61']
        self.jira.rows[key]['fields']['labels'].remove('exam-owner-b')
        with self.assertRaises(RuntimeError):
            self.run_mode('apply')
        self.assertFalse(self.jira.writes)


if __name__ == '__main__':
    unittest.main()
