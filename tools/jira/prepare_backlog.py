#!/usr/bin/env python3
"""Validate local Markdown ticket sources and optionally export an offline manifest.

No network, credentials, Jira mutations or fabricated remote identifiers.
"""

import argparse
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PLANNING = ROOT / 'docs' / 'planning'
SOURCES = [PLANNING / 'sprint-1-tickets.md', PLANNING / 'sprint-2-tickets.md']
PEOPLE = {'A': 'Nguyễn Minh Quân', 'B': 'Đặng Hoàng Quân'}
PERSON_ALIASES = {name: alias for alias, name in PEOPLE.items()}


def load_epics():
    text = (PLANNING / 'backlog.md').read_text(encoding='utf-8')
    rows = re.findall(r'^\| (EXAM-E\d{2}) \| ([^|]+) \| ([^|]+) \|$', text, re.M)
    if len(rows) != 4 or {row[0] for row in rows} != {f'EXAM-E{i:02}' for i in range(1, 5)}:
        raise ValueError('Expected four unique Epic source rows in backlog.md')
    return [{'source_id': key, 'summary': title.strip(),
             'description_markdown': description.strip(),
             'source_path': 'docs/planning/backlog.md'}
            for key, title, description in rows]


def load_tickets():
    tickets = []
    for path in SOURCES:
        text = path.read_text(encoding='utf-8')
        starts = list(re.finditer(r'^## (EXAM-T\d{2}) — (.+)$', text, re.M))
        for i, match in enumerate(starts):
            end = starts[i + 1].start() if i + 1 < len(starts) else len(text)
            body = text[match.end():end].split('<a id=')[0].strip()
            fields = dict(re.findall(r'^- \*\*([^:]+):\*\* (.+)$', body, re.M))
            required = {'Epic', 'Sprint', 'Assignee', 'Reviewer', 'Estimate',
                        'Depends on', 'FR', 'Acceptance refs', 'Work packages'}
            if fields.keys() != required:
                raise ValueError(f'{match[1]}: metadata mismatch {fields.keys() ^ required}')
            if not re.fullmatch(r'\d+(?:\.\d+)?h', fields['Estimate']):
                raise ValueError(f'{match[1]}: invalid estimate')
            ticket = {
                'source_id': match[1], 'summary': match[2],
                'epic_source_id': fields['Epic'], 'sprint_alias': fields['Sprint'],
                'assignee_alias': PERSON_ALIASES.get(fields['Assignee'], fields['Assignee']),
                'reviewer_alias': PERSON_ALIASES.get(fields['Reviewer'], fields['Reviewer']),
                'estimate_hours': float(fields['Estimate'][:-1]),
                'depends_on': [] if fields['Depends on'] == 'NONE' else fields['Depends on'].split(', '),
                'fr': fields['FR'].split(', '),
                'acceptance_refs': fields['Acceptance refs'].split(', '),
                'work_packages': fields['Work packages'].split(', '),
                'source_path': str(path.relative_to(ROOT)),
                'source_anchor': match[1].lower(),
                'description_markdown': body,
            }
            tickets.append(ticket)
    return tickets


def validate(tickets):
    ids = {t['source_id'] for t in tickets}
    if len(ids) != len(tickets) or ids != {f'EXAM-T{i:02}' for i in range(1, 66)}:
        raise ValueError('Expected unique EXAM-T01..T65')
    index = {t['source_id']: t for t in tickets}
    reference_sources = {
        'FR': ROOT / 'docs/01-requirements-and-business-flows.md',
        'AC': ROOT / 'docs/01-requirements-and-business-flows.md',
        'PT': ROOT / 'docs/03-protocol-specification.md',
        'LT': ROOT / 'docs/04-capacity-and-validation.md',
    }
    references = {prefix: set(re.findall(r'^\| (' + prefix + r'-\d{2}) \|',
                                       path.read_text(), re.M))
                  for prefix, path in reference_sources.items()}
    coverage = defaultdict(set)
    packages = set()
    totals = defaultdict(lambda: defaultdict(float))
    for ticket in tickets:
        name = ticket['source_id']
        owner, reviewer = ticket['assignee_alias'], ticket['reviewer_alias']
        if {owner, reviewer} != {'A', 'B'}:
            raise ValueError(f'{name}: owner/reviewer must be opposite A/B')
        if ticket['epic_source_id'] not in {f'EXAM-E{i:02}' for i in range(1, 5)}:
            raise ValueError(f'{name}: unknown epic')
        if ticket['sprint_alias'] not in ('S1', 'S2') or not 2 <= ticket['estimate_hours'] <= 8:
            raise ValueError(f'{name}: invalid sprint/estimate')
        for dep in ticket['depends_on']:
            if dep not in ids or dep == name:
                raise ValueError(f'{name}: invalid dependency {dep}')
            if ticket['sprint_alias'] == 'S1' and index[dep]['sprint_alias'] != 'S1':
                raise ValueError(f'{name}: S1 cannot depend on S2')
        for field, expected in (
            ('Is blocked by', set(ticket['depends_on'])),
            ('Blocks', {t['source_id'] for t in tickets if name in t['depends_on']}),
        ):
            rows = re.findall(r'^- ' + field + r': (.+)$', ticket['description_markdown'], re.M)
            actual = re.findall(r'\[(EXAM-T\d{2})\]', rows[0]) if len(rows) == 1 else []
            if (len(rows) != 1 or set(actual) != expected
                    or len(actual) != len(set(actual))
                    or (not expected and rows[0] != 'NONE')):
                raise ValueError(f'{name}: description {field} disagrees with dependency metadata')
        for ref in ticket['fr'] + ticket['acceptance_refs']:
            prefix = ref.split('-')[0]
            if ref not in references.get(prefix, set()):
                raise ValueError(f'{name}: unknown reference {ref}')
            coverage[ref].add(name)
        packages.update(ticket['work_packages'])
        if any(not re.fullmatch(r'W(?:0[1-9]|1\d|2[0-6])', p) for p in ticket['work_packages']):
            raise ValueError(f'{name}: unknown work package')
        body = ticket['description_markdown']
        for section in ('Mục tiêu', 'Đầu vào và điều kiện bắt đầu', 'Nguồn', 'Phạm vi',
                        'Các bước thực hiện', 'Hành vi và tình huống cần đạt', 'Tiêu chí nghiệm thu',
                        'Kiểm tra và bằng chứng', 'Phụ thuộc và cách bàn giao',
                        'Bàn giao/ngoài phạm vi', 'Checkpoint bảo vệ', 'Truy vết nhập Jira'):
            if f'**{section}:**' not in body:
                raise ValueError(f'{name}: missing {section}')
        if len(re.findall(r'^- \[ \] ', body, re.M)) < 3:
            raise ValueError(f'{name}: expected concrete unchecked acceptance criteria')
        case_table = body.split('**Hành vi và tình huống cần đạt:**', 1)[1].split('**Tiêu chí nghiệm thu:**', 1)[0]
        case_rows = [line for line in case_table.splitlines() if line.startswith('|')]
        if len(case_rows) < 5 or any(not cell.strip() for row in case_rows for cell in row.split('|')[1:-1]):
            raise ValueError(f'{name}: expected a nonempty two-column scenario table with at least three cases')
        totals[ticket['sprint_alias']][owner] += ticket['estimate_hours']
    expected_refs = set.union(*references.values())
    missing = expected_refs - coverage.keys()
    if missing:
        raise ValueError(f'Uncovered requirement/test references: {sorted(missing)}')
    if packages != {f'W{i:02}' for i in range(1, 27)}:
        raise ValueError('Work-package coverage is incomplete')
    visiting, done = set(), set()

    def visit(name):
        if name in visiting:
            raise ValueError(f'Dependency cycle at {name}')
        if name in done:
            return
        visiting.add(name)
        for dep in index[name]['depends_on']:
            visit(dep)
        visiting.remove(name)
        done.add(name)

    for name in ids:
        visit(name)
    return dict(coverage), {s: dict(v) for s, v in totals.items()}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--manifest', type=Path, help='Optional new JSON output path; never overwrites')
    parser.add_argument('--sprint', choices=('S1',),
                        help='Export only Sprint 1 and its referenced epics after validating the full backlog')
    args = parser.parse_args()
    if args.sprint and not args.manifest:
        parser.error('--sprint requires --manifest')
    epics = load_epics()
    tickets = load_tickets()
    coverage, totals = validate(tickets)
    if args.manifest:
        selected = [ticket for ticket in tickets
                    if not args.sprint or ticket['sprint_alias'] == args.sprint]
        referenced_epics = {ticket['epic_source_id'] for ticket in selected}
        # Exclusive create avoids silently replacing a prepared/reviewed artifact.
        with args.manifest.open('x', encoding='utf-8') as handle:
            json.dump({'schema_version': 1, 'status': 'LOCAL_DRAFT_NOT_IMPORTED',
                       'target_site': 'https://ltm-project.atlassian.net',
                       'target_project': 'SCRUM', 'target_board_from_url': 1,
                       'remote_metadata_verified': False, 'source_revision': 'backlog-v2-small-tasks',
                       'estimate_bounds_hours': [2, 8],
                       'epics': [epic for epic in epics if epic['source_id'] in referenced_epics],
                       'tickets': selected},
                      handle, ensure_ascii=False, indent=2)
            handle.write('\n')
    print(json.dumps({'status': 'PASS_LOCAL_VALIDATION', 'epic_count': len(epics), 'ticket_count': len(tickets),
                      'coverage_reference_count': len(coverage), 'owner_hours': totals,
                      'estimate_min_hours': min(t['estimate_hours'] for t in tickets),
                      'estimate_max_hours': max(t['estimate_hours'] for t in tickets),
                      'dependency_edges': sum(len(t['depends_on']) for t in tickets),
                      'dependency_cycle': False, 'jira_mutations': 0},
                     ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
