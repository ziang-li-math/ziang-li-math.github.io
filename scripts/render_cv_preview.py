"""Render the current CV source as a separately typeset, linked PDF.

Requires reportlab. This is not a LaTeX compiler. It exists because the desktop
LaTeX compiler is unavailable here. For the exact LaTeX layout, use pdfLaTeX.
Usage: python scripts/render_cv_preview.py
"""
from pathlib import Path
import re
from html import escape
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Table, TableStyle, Spacer, HRFlowable,
    KeepTogether,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = Path(__file__).resolve().parents[1]
CV_DIR = ROOT / 'files' if (ROOT / 'files/cv.tex').is_file() else ROOT
tex = (CV_DIR / 'cv.tex').read_text(encoding='utf-8')
tex = '\n'.join(line for line in tex.splitlines() if not line.lstrip().startswith('%'))

def argument(text, pos):
    while text[pos].isspace():
        pos += 1
    assert text[pos] == '{', text[pos:pos + 30]
    start = pos + 1
    depth = 1
    pos += 1
    while depth:
        depth += (text[pos] == '{') - (text[pos] == '}')
        pos += 1
    return text[start:pos - 1], pos

fields = {}
for match in re.finditer(r'\\newcommand\*?\{\\(CV\w+|MasterDates|BachelorDates|MasterThesis|MasterSupervisors)\}', tex):
    fields[match.group(1)] = argument(tex, match.end())[0]

math_font = 'Times-Roman'
cambria = Path('C:/Windows/Fonts/cambria.ttc')
if cambria.is_file():
    pdfmetrics.registerFont(TTFont('CVMath', str(cambria), subfontIndex=0))
    math_font = 'CVMath'

def markup(text):
    for name, value in fields.items():
        text = text.replace('\\' + name, value)
    text = text.replace('$\\mathbb{R}^n$', '@REALN@').replace('$s$', 's')
    text = ' '.join(text.split())
    out = ''
    pos = 0
    while pos < len(text):
        if text[pos] != '\\':
            out += escape(text[pos])
            pos += 1
            continue
        match = re.match(r'\\([A-Za-z]+)', text[pos:])
        if not match:
            out += ' '
            pos += 2
            continue
        name = match.group(1)
        pos += len(match.group())
        if name in ('textbf', 'textit', 'mbox'):
            val, pos = argument(text, pos)
            rendered = markup(val)
            tag = {'textbf': 'b', 'textit': 'i'}.get(name)
            out += f'<{tag}>{rendered}</{tag}>' if tag else rendered
        elif name == 'textcolor':
            color, pos = argument(text, pos)
            val, pos = argument(text, pos)
            out += f'<font color="#2D607D">{markup(val)}</font>'
        elif name == 'cvlink':
            url, pos = argument(text, pos)
            label, pos = argument(text, pos)
            out += f'<link href="{escape(url, quote=True)}" color="#2D607D">{markup(label)}</link>'
        elif name == 'daterange':
            start, pos = argument(text, pos)
            end, pos = argument(text, pos)
            # Each complete date stays intact; the range may wrap after the dash.
            out += markup(start).replace(' ', '&nbsp;') + ' - ' + markup(end).replace(' ', '&nbsp;')
        elif name in ('quad', 'enspace'):
            out += '&nbsp;&nbsp;'
        elif name == 'par':
            out += '<br/>'
        else:
            raise ValueError(f'Unsupported command in preview text: {name}')
    real_n = f'<font name="{math_font}">ℝ</font><super>n</super>'
    return out.replace('@REALN@', real_n).replace('--', '-')

ink = HexColor('#263746')
blue = HexColor('#2D607D')
muted = HexColor('#576A78')
sky = HexColor('#8DCCED')
pale = HexColor('#EDF7FD')
styles = {
    'body': ParagraphStyle('body', fontName='Times-Roman', fontSize=10, leading=11.6, textColor=ink),
    'extra': ParagraphStyle('extra', fontName='Times-Roman', fontSize=10, leading=11.6, textColor=muted),
    'title': ParagraphStyle('title', fontName='Times-Bold', fontSize=10, leading=11.6, textColor=ink),
    'date': ParagraphStyle('date', fontName='Helvetica', fontSize=9.5, leading=11.6, textColor=muted),
    'seminar': ParagraphStyle('seminar', fontName='Times-Roman', fontSize=9, leading=10.5, textColor=ink),
    'seminar_date': ParagraphStyle('seminar_date', fontName='Helvetica', fontSize=8.8, leading=10.5, textColor=muted),
    'heading': ParagraphStyle('heading', fontName='Helvetica-Bold', fontSize=13, leading=15, textColor=blue),
    'subheading': ParagraphStyle('subheading', fontName='Helvetica-Bold', fontSize=10.5, leading=12, textColor=blue),
}

width, height = A4
mm = 72 / 25.4
margin = 19 * mm
usable = width - 2 * margin
right_width = usable - 31 * mm

def para(text, style='body', raw=False):
    return Paragraph(text if raw else markup(text), styles[style])

def details(text):
    if not text.strip():
        return []
    match = re.search(r'\\coursework\{', text)
    if not match:
        return [para(text, 'extra')]
    before = text[:match.start()]
    content, end = argument(text, match.end() - 1)
    parts = [para(before.rstrip().removesuffix('\\par'), 'extra')]
    cells = []
    for row in content.split('\\\\'):
        vals = row.strip().split('&')
        assert len(vals) == 2, row
        cells.append([para(vals[0], 'extra'), '', para(vals[1], 'extra')])
    table = Table(cells, colWidths=[right_width * .57, right_width * .04, right_width * .39])
    table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), .5),
    ]))
    parts.append(table)
    return parts

body = tex.split('\\begin{document}', 1)[1]
events = []
for match in re.finditer(r'\\(section|subsection|cventry|seminarentry)\{', body):
    kind = match.group(1)
    pos = match.end() - 1
    args = []
    for _ in range({'cventry': 4, 'seminarentry': 3}.get(kind, 1)):
        val, pos = argument(body, pos)
        args.append(val)
    events.append((kind, args))

story = []
header = [
    Paragraph(escape(fields['CVName']), ParagraphStyle('name', fontName='Helvetica-Bold', fontSize=27, leading=30, textColor=blue)),
    Spacer(1, 2),
    Paragraph("Master's student in mathematics", ParagraphStyle('role', fontName='Helvetica', fontSize=11, leading=13, textColor=ink)),
    Paragraph('University of Regensburg | Regensburg, Germany', ParagraphStyle('affiliation', fontName='Helvetica', fontSize=9.5, leading=12, textColor=ink)),
    Spacer(1, 2),
    Paragraph(f'<link href="mailto:{fields["CVEmail"]}" color="#2D607D">{fields["CVEmail"]}</link>', ParagraphStyle('email', fontName='Helvetica', fontSize=9.5, leading=12)),
]
banner = Table([[header]], colWidths=[usable])
banner.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), pale),
    ('LEFTPADDING', (0, 0), (-1, -1), 10),
    ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ('TOPPADDING', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
]))
story.append(banner)
pending = []

def append_entry(item):
    global pending
    if pending:
        story.append(KeepTogether(pending + [item]))
        pending = []
    else:
        story.append(item)

for kind, args in events:
    if kind in ('section', 'subsection'):
        if pending:
            story.extend(pending)
        title = args[0]
        if kind == 'section':
            pending = [Spacer(1, 9), para(title, 'heading'), Spacer(1, 2),
                       HRFlowable(width='100%', thickness=.7, color=sky), Spacer(1, 5)]
        else:
            pending = [Spacer(1, 4), para(title, 'subheading'), Spacer(1, 3)]
        if title == 'Research interests':
            append_entry(para('Geometric topology, especially knot theory and the topology of 3- and 4-manifolds.'))
        continue
    seminar = kind == 'seminarentry'
    date, title = args[:2]
    if seminar:
        cell = [para(f'{markup(title)} &nbsp; <font color="#576A78">({markup(args[2])})</font>', 'seminar', raw=True)]
        columns = [41 * mm, 4 * mm, usable - 45 * mm]
    else:
        detail, extra = args[2:]
        cell = [para(title, 'title')]
        if detail.strip():
            cell.append(para(detail))
        cell.extend(details(extra))
        columns = [27 * mm, 4 * mm, right_width]
    row = Table([[para(date, 'seminar_date' if seminar else 'date'), '', cell]], colWidths=columns)
    row.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (2, 0), (2, 0), .5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1 if seminar else 3),
    ]))
    append_entry(row)
story.extend(pending)
story.extend([Spacer(1, 9), para('Last updated: ' + fields['CVUpdated'] + '.', 'seminar_date')])

def footer(canvas, doc):
    canvas.setTitle('Curriculum vitae - Ziang Li')
    canvas.setAuthor(fields['CVName'])
    canvas.setStrokeColor(sky)
    canvas.setLineWidth(.4)
    canvas.line(margin, 37, width - margin, 37)
    canvas.setFillColor(muted)
    canvas.setFont('Helvetica', 8)
    canvas.drawString(margin, 24, fields['CVName'] + ' / Curriculum vitae')
    canvas.drawRightString(width - margin, 24, str(doc.page))

doc = SimpleDocTemplate(str(CV_DIR / 'cv.pdf'), pagesize=A4,
                        leftMargin=margin, rightMargin=margin,
                        topMargin=17 * mm, bottomMargin=19 * mm)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print('Updated cv.pdf from current source, with automatic pagination and clickable report/program links.')
