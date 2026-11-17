"""Convert ticket Markdown to ADF. Adapted from ai-staffing/scripts/jira/auth_import.py."""

import re


def inline(text):
    """Chỉ hỗ trợ inline Markdown được dùng trong bộ ticket đã duyệt."""
    result = []
    pattern = r'(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`)'
    for part in re.split(pattern, text):
        if not part:
            continue
        marks = []
        if part.startswith('**') and part.endswith('**'):
            part = part[2:-2]
            marks = [{'type': 'strong'}]
        elif part.startswith('`') and part.endswith('`'):
            part = part[1:-1]
            marks = [{'type': 'code'}]
        elif re.fullmatch(r'\[[^\]]+\]\([^)]+\)', part):
            label, href = re.fullmatch(r'\[([^\]]+)\]\(([^)]+)\)', part).groups()
            if href.startswith('https://'):
                part, marks = label, [{'type': 'link', 'attrs': {'href': href}}]
            else:
                part = f'{label} ({href})'
        node = {'type': 'text', 'text': part}
        if marks:
            node['marks'] = marks
        result.append(node)
    return result


def paragraph(text):
    return {'type': 'paragraph', 'content': inline(text)}


def adf(markdown):
    """Bảng là table ADF; checkbox chỉ là tiêu chí, không tự tick Done."""
    lines = markdown.strip().splitlines()
    nodes, i = [], 0
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        if line.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                cells = [x.strip() for x in lines[i].strip().strip('|').split('|')]
                i += 1
                if all(re.fullmatch(r':?-+:?', c) for c in cells):
                    continue
                kind = 'tableHeader' if not rows else 'tableCell'
                rows.append({'type': 'tableRow', 'content': [
                    {'type': kind, 'content': [paragraph(c)]} for c in cells]})
            if not rows or len({len(r['content']) for r in rows}) != 1:
                raise ValueError('Bảng Markdown không đều.')
            nodes.append({'type': 'table', 'content': rows})
            continue
        heading = re.fullmatch(r'\*\*([^*]+)\*\*', line)
        if heading:
            nodes.append({'type': 'heading', 'attrs': {'level': 3}, 'content': inline(heading[1])})
        elif re.match(r'^(?:- |\d+\. )', line):
            ordered = bool(re.match(r'^\d+\. ', line))
            items = []
            while i < len(lines) and re.match(r'^\d+\. ' if ordered else r'^- ', lines[i].strip()):
                value = re.sub(r'^\d+\. |^- ', '', lines[i].strip())
                value = value.replace('[ ] ', '☐ ', 1)
                items.append({'type': 'listItem', 'content': [paragraph(value)]})
                i += 1
            nodes.append({'type': 'orderedList' if ordered else 'bulletList', 'content': items})
            continue
        else:
            if line.startswith('```'):
                raise ValueError('Cần hỗ trợ fenced code trong bộ chuyển ADF.')
            nodes.append(paragraph(line))
        i += 1
    return {'type': 'doc', 'version': 1, 'content': nodes}
