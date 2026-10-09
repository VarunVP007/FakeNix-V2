"""
FAKENIX 2.0 — Forensic report PDF layout (ReportLab)

Pure layout: render_report_pdf() turns the context dict built by
report_service.build_report_context() into a PDF. Nothing here reads the
database or invents values — a field missing from the context is left out of
the document or shown as "Not recorded".

Layout rules that keep text inside the page:
  - every table's column widths are explicit and sum to the frame width,
  - every cell is a Paragraph, so long values wrap instead of overflowing,
  - dynamic text is XML-escaped before it reaches a Paragraph.
"""
import os
import uuid
from functools import partial
from xml.sax.saxutils import escape

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.platypus import HRFlowable, KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

PAGE_SIZE = A4
MARGIN_X = 18 * mm
MARGIN_TOP = 18 * mm
MARGIN_BOTTOM = 22 * mm  # leaves room for the page footer
FRAME_PADDING = 6  # ReportLab's default padding inside the page frame
# Width actually available to flowables. Tables sized to this line up with the text.
CONTENT_WIDTH = PAGE_SIZE[0] - 2 * MARGIN_X - 2 * FRAME_PADDING

BRAND_PRIMARY = HexColor('#4f46e5')
BRAND_PURPLE = HexColor('#7c3aed')
GREY_TEXT = HexColor('#475569')
DARK_TEXT = HexColor('#0f172a')
GRID = HexColor('#cbd5e1')
LABEL_BG = HexColor('#f1f5f9')
HEADER_BG = HexColor('#e2e8f0')
RED = HexColor('#dc2626')
AMBER = HexColor('#d97706')
GREEN = HexColor('#16a34a')

VERDICT_COLORS = {
    'REAL': (GREEN, HexColor('#f0fdf4')),
    'FAKE': (RED, HexColor('#fef2f2')),
    'SUSPICIOUS': (AMBER, HexColor('#fffbeb')),
    'UNDETERMINED': (GREY_TEXT, LABEL_BG),
}
RISK_COLORS = {'low': GREEN, 'medium': AMBER, 'high': RED, 'critical': RED}
INTEGRITY_COLORS = {'match': GREEN, 'mismatch': RED}

VERDICT_MEANING = {
    'REAL': 'The model reported no meaningful signs of manipulation. This is a model assessment, '
            'not proof that the media is authentic.',
    'FAKE': 'The model reported signs of manipulation or AI generation. This is a model assessment, '
            'not proof of manipulation.',
    'SUSPICIOUS': 'The assessment is inconclusive: the evidence is weak, mixed or contradictory. '
                  'The media is neither confirmed authentic nor confirmed manipulated.',
    'UNDETERMINED': 'No verdict is stored for this detection.',
}

S_TITLE = ParagraphStyle('fx_title', fontName='Helvetica-Bold', fontSize=22, leading=26, textColor=BRAND_PRIMARY)
S_SUBTITLE = ParagraphStyle('fx_subtitle', fontName='Helvetica-Bold', fontSize=10, leading=13,
                            textColor=BRAND_PURPLE, spaceAfter=5)
S_H2 = ParagraphStyle('fx_h2', fontName='Helvetica-Bold', fontSize=12, leading=15, textColor=BRAND_PRIMARY,
                      spaceBefore=12, spaceAfter=5)
S_LABEL = ParagraphStyle('fx_label', fontName='Helvetica', fontSize=8.5, leading=11.5, textColor=DARK_TEXT)
S_VALUE = ParagraphStyle('fx_value', fontName='Helvetica-Bold', fontSize=8.5, leading=11.5, textColor=DARK_TEXT)
S_BODY = ParagraphStyle('fx_body', fontName='Helvetica', fontSize=8.5, leading=12, textColor=DARK_TEXT)
S_HEAD = ParagraphStyle('fx_head', fontName='Helvetica-Bold', fontSize=8.5, leading=11.5, textColor=DARK_TEXT)
S_NOTE = ParagraphStyle('fx_note', fontName='Helvetica', fontSize=7.5, leading=10.5, textColor=GREY_TEXT)
S_MONO = ParagraphStyle('fx_mono', fontName='Courier', fontSize=8, leading=11, textColor=DARK_TEXT)
S_VERDICT = ParagraphStyle('fx_verdict', fontName='Helvetica-Bold', fontSize=16, leading=20, alignment=TA_CENTER)
S_VERDICT_NOTE = ParagraphStyle('fx_verdict_note', fontName='Helvetica', fontSize=8.5, leading=12,
                                alignment=TA_CENTER, textColor=DARK_TEXT)
S_BANNER = ParagraphStyle('fx_banner', fontName='Helvetica', fontSize=8.5, leading=12, textColor=HexColor('#7c2d12'))
S_DISCLAIMER = ParagraphStyle('fx_disclaimer', fontName='Helvetica', fontSize=7.5, leading=11, textColor=GREY_TEXT)

CELL_PADDING = 4
NOT_RECORDED = 'Not recorded'


def _t(value) -> str:
    """Dynamic text made safe for a Paragraph: escaped and limited to the font's character set."""
    text = '' if value is None else str(value)
    # The built-in PDF fonts cover Windows-1252 only; anything else would render as a blank box.
    text = text.encode('cp1252', 'replace').decode('cp1252')
    return escape(text)


def _p(value, style=S_VALUE) -> Paragraph:
    return Paragraph(_t(value), style)


def _pct(value) -> str:
    return NOT_RECORDED if value is None else f'{float(value):.1f}%'


def _grid_style(extra=()) -> TableStyle:
    return TableStyle([
        ('GRID', (0, 0), (-1, -1), 0.5, GRID),
        ('LEFTPADDING', (0, 0), (-1, -1), CELL_PADDING),
        ('RIGHTPADDING', (0, 0), (-1, -1), CELL_PADDING),
        ('TOPPADDING', (0, 0), (-1, -1), CELL_PADDING),
        ('BOTTOMPADDING', (0, 0), (-1, -1), CELL_PADDING),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        *extra,
    ])


def _kv_table(rows, label_width=40 * mm) -> Table:
    """Two-column label/value table. A value may be text or a ready-made flowable."""
    data = [[_p(label, S_LABEL), value if hasattr(value, 'wrap') else _p(value)] for label, value in rows]
    table = Table(data, colWidths=[label_width, CONTENT_WIDTH - label_width])
    table.setStyle(_grid_style([('BACKGROUND', (0, 0), (0, -1), LABEL_BG)]))
    return table


def _pairs_table(pairs, label_width=32 * mm) -> Table:
    """Four-column table holding two label/value pairs per row."""
    value_width = CONTENT_WIDTH / 2 - label_width
    data, extra = [], [('BACKGROUND', (0, 0), (0, -1), LABEL_BG)]
    for i in range(0, len(pairs), 2):
        row = [_p(pairs[i][0], S_LABEL), _p(pairs[i][1])]
        if i + 1 < len(pairs):
            row += [_p(pairs[i + 1][0], S_LABEL), _p(pairs[i + 1][1])]
            extra.append(('BACKGROUND', (2, len(data)), (2, len(data)), LABEL_BG))
        else:
            # An odd last pair gets the full width instead of two empty cells.
            row += ['', '']
            extra.append(('SPAN', (1, len(data)), (3, len(data))))
        data.append(row)
    table = Table(data, colWidths=[label_width, value_width, label_width, value_width])
    table.setStyle(_grid_style(extra))
    return table


def _box(flowables, background, border) -> Table:
    table = Table([[flowables]], colWidths=[CONTENT_WIDTH])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), background),
        ('BOX', (0, 0), (-1, -1), 0.8, border),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 7),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
    ]))
    return table


def _present(pairs):
    """Drop label/value pairs whose value is missing, so no empty field is printed."""
    return [(label, value) for label, value in pairs if value not in (None, '')]


def build_story(ctx: dict) -> list:
    """The report as a list of flowables laid out for a frame CONTENT_WIDTH wide."""
    story = []
    verdict = ctx.get('verdict') or 'UNDETERMINED'
    verdict_color, verdict_bg = VERDICT_COLORS.get(verdict, VERDICT_COLORS['UNDETERMINED'])
    is_demo = bool(ctx.get('is_demo'))

    # ── Header ──────────────────────────────────────────────
    story.append(Paragraph('FAKENIX', S_TITLE))
    story.append(Paragraph('AI-Powered Deepfake Detection &amp; Digital Forensics', S_SUBTITLE))
    story.append(HRFlowable(width='100%', color=BRAND_PRIMARY, thickness=2, spaceAfter=8))

    if is_demo:
        story.append(_box([Paragraph(
            '<b>DEMO / SIMULATED ANALYSIS.</b> This result was produced by the application\'s demo mode. '
            'No AI model analysed this media. The verdict, scores and indicators below are illustrative '
            'placeholders and must not be relied on for any decision.', S_BANNER,
        )], HexColor('#fff7ed'), HexColor('#ea580c')))
        story.append(Spacer(1, 3 * mm))

    # ── Report details ──────────────────────────────────────
    story.append(_pairs_table(_present([
        ('Report ID', ctx.get('report_id')),
        ('Generated (UTC)', ctx.get('generated_at')),
        ('Report Type', ctx.get('report_type')),
        ('Generated By', ctx.get('generated_by')),
        ('Evidence ID', ctx.get('evidence_id') or 'None (no evidence file)'),
        ('Detection ID', ctx.get('detection_id')),
    ])))

    # ── Detection result ────────────────────────────────────
    story.append(Paragraph('Detection Result', S_H2))
    verdict_style = ParagraphStyle('fx_verdict_colored', parent=S_VERDICT, textColor=verdict_color)
    verdict_note = VERDICT_MEANING.get(verdict, VERDICT_MEANING['UNDETERMINED'])
    if is_demo:
        verdict_note = 'Simulated demo result — no model analysed this media.'
    story.append(_box([
        Paragraph(f'VERDICT: {_t(ctx.get("verdict_label") or verdict)}', verdict_style),
        Spacer(1, 2),
        Paragraph(_t(verdict_note), S_VERDICT_NOTE),
    ], verdict_bg, verdict_color))
    story.append(Spacer(1, 2 * mm))

    risk = (ctx.get('risk_level') or '').lower()
    risk_style = ParagraphStyle('fx_risk', parent=S_VALUE, textColor=RISK_COLORS.get(risk, DARK_TEXT))
    result_rows = [
        ('Manipulation likelihood', _pct(ctx.get('fake_likelihood'))),
        ('Authentic complement', _pct(ctx.get('authentic_complement'))),
        ('Risk level', Paragraph(_t(risk.upper() or NOT_RECORDED), risk_style)),
        ('Analysis type', ctx.get('analysis_kind') or NOT_RECORDED),
        ('Model', ctx.get('model') or NOT_RECORDED),
        ('Provider', ctx.get('provider') or NOT_RECORDED),
    ]
    if ctx.get('analyzed_at'):
        result_rows.append(('Analysed (UTC)', ctx['analyzed_at']))
    story.append(_kv_table(result_rows))
    for note in ctx.get('notes') or []:
        story.append(Spacer(1, 1.5 * mm))
        story.append(Paragraph(f'<b>Note:</b> {_t(note)}', S_BODY))
    story.append(Spacer(1, 2 * mm))
    if is_demo:
        story.append(Paragraph(
            '<b>These values were simulated by demo mode and measure nothing about this media.</b>', S_NOTE))
    story.append(Paragraph(
        '<b>How to read these values.</b> <i>Manipulation likelihood</i> is the analysing model\'s own '
        '0–100% estimate that the media is fake (0% = certainly real, 100% = certainly fake). It is a '
        'self-reported judgement, not a statistically calibrated probability and not an error rate. '
        '<i>Authentic complement</i> is 100% minus that value; it is not a separate measurement. '
        f'<i>Risk level</i> is derived from the likelihood ({_t(ctx.get("risk_bands") or "see application settings")}). '
        'The <i>verdict</i> is the model\'s own classification; an answer whose verdict contradicts its '
        'likelihood is recorded as SUSPICIOUS.', S_NOTE,
    ))

    # ── File information ────────────────────────────────────
    file = ctx.get('file') or {}
    story.append(Paragraph('File Information', S_H2))
    size = file.get('size_display')
    if size and file.get('size_bytes') is not None:
        size = f'{size} ({file["size_bytes"]:,} bytes)'
    story.append(_pairs_table(_present([
        ('File name', file.get('name')),
        ('File size', size),
        ('Media type', file.get('media_type')),
        ('Filename extension', file.get('extension')),
        ('Detected format', file.get('detected_format') or 'Not determined'),
        ('MIME type (detected)', file.get('mime') or 'Not determined'),
        ('Dimensions', file.get('dimensions')),
        ('Duration', file.get('duration')),
        ('Frame rate', file.get('fps')),
        ('Video codec', file.get('codec')),
        ('Source URL', file.get('source_url')),
        ('Uploaded (UTC)', file.get('uploaded_at')),
    ])))
    for issue in file.get('inconsistencies') or []:
        story.append(Spacer(1, 1.5 * mm))
        story.append(_box([Paragraph(f'<b>Metadata inconsistency:</b> {_t(issue)}', S_BANNER)],
                          HexColor('#fff7ed'), HexColor('#ea580c')))
    if file.get('source_note'):
        story.append(Spacer(1, 1.5 * mm))
        story.append(Paragraph(_t(file['source_note']), S_NOTE))

    # ── Evidence integrity ──────────────────────────────────
    integrity = ctx.get('integrity') or {}
    integrity_block = [Paragraph('Evidence Integrity', S_H2)]
    state_style = ParagraphStyle('fx_state', parent=S_VALUE,
                                 textColor=INTEGRITY_COLORS.get(integrity.get('state'), AMBER))
    integrity_rows = []
    if integrity.get('sha256'):
        integrity_rows.append(('SHA-256 (recorded)', _p(integrity['sha256'], S_MONO)))
    if integrity.get('md5'):
        integrity_rows.append(('MD5 (reference only)', _p(integrity['md5'], S_MONO)))
    if integrity.get('recorded_at'):
        integrity_rows.append(('Hash recorded (UTC)', integrity['recorded_at']))
    integrity_rows.append(('Verification for this report',
                           Paragraph(_t(integrity.get('state_label') or 'NOT VERIFIED'), state_style)))
    if integrity.get('actual_sha256'):
        integrity_rows.append(('SHA-256 (stored file now)', _p(integrity['actual_sha256'], S_MONO)))
    integrity_block.append(_kv_table(integrity_rows))
    integrity_block.append(Spacer(1, 1.5 * mm))
    integrity_block.append(Paragraph(
        'A matching hash shows only that the file held by FAKENIX is byte-for-byte identical to the file '
        'that was hashed when the evidence record was created. It does not show that the media is genuine, '
        'unedited, or was unaltered before it was uploaded. MD5 is listed for cross-referencing only and is '
        'not collision-resistant.', S_NOTE,
    ))
    story.append(KeepTogether(integrity_block))

    custody = ctx.get('custody') or []
    if custody:
        story.append(Spacer(1, 2.5 * mm))
        rows = [[_p('Recorded handling event', S_HEAD), _p('Recorded by', S_HEAD), _p('Time (UTC)', S_HEAD)]]
        rows += [[_p(e.get('action'), S_BODY), _p(e.get('by'), S_BODY), _p(e.get('time'), S_BODY)] for e in custody]
        table = Table(rows, colWidths=[74 * mm, 55 * mm, CONTENT_WIDTH - 129 * mm], repeatRows=1)
        table.setStyle(_grid_style([('BACKGROUND', (0, 0), (-1, 0), HEADER_BG)]))
        story.append(table)
        story.append(Spacer(1, 1.5 * mm))
        story.append(Paragraph(
            'These events are logged by the application itself. They are not cryptographically signed or '
            'independently witnessed and do not constitute a complete legal chain of custody.', S_NOTE,
        ))

    # ── Indicators ──────────────────────────────────────────
    story.append(Paragraph('Simulated Indicators' if is_demo else 'Model-Reported Indicators', S_H2))
    indicators = ctx.get('indicators') or []
    if indicators:
        rows = [[_p('Indicator', S_HEAD), _p('Simulated strength' if is_demo else 'Model-rated strength', S_HEAD),
                 _p('Severity', S_HEAD)]]
        for ind in indicators:
            cell = [_p(ind.get('name') or 'Unnamed indicator')]
            if ind.get('evidence'):
                cell.append(_p(ind['evidence'], S_BODY))
            score = ind.get('score')
            rows.append([
                cell,
                _p('Not given' if score is None else f'{float(score) * 100:.0f}%', S_BODY),
                _p((ind.get('severity') or 'Not given').upper(), S_BODY),
            ])
        table = Table(rows, colWidths=[CONTENT_WIDTH - 66 * mm, 38 * mm, 28 * mm], repeatRows=1)
        table.setStyle(_grid_style([('BACKGROUND', (0, 0), (-1, 0), HEADER_BG)]))
        story.append(table)
    else:
        story.append(Paragraph(_t(ctx.get('no_indicators_text') or 'No indicators were reported.'), S_BODY))
    story.append(Spacer(1, 1.5 * mm))
    story.append(Paragraph(f'<b>Source:</b> {_t(ctx.get("indicator_source") or NOT_RECORDED)}', S_NOTE))

    frames = ctx.get('frames') or []
    if frames:
        story.append(Paragraph('Sampled Video Frames', S_H2))
        rows = [[_p('Frame', S_HEAD), _p('Timestamp', S_HEAD), _p('Manipulation likelihood', S_HEAD),
                 _p('Model notes', S_HEAD)]]
        for frame in frames:
            rows.append([
                _p(frame.get('frameNum'), S_BODY),
                _p(frame.get('timestamp') or NOT_RECORDED, S_BODY),
                _p(_pct(frame.get('probability')), S_BODY),
                _p('; '.join(str(a) for a in frame.get('anomalies') or []) or 'None given', S_BODY),
            ])
        table = Table(rows, colWidths=[20 * mm, 24 * mm, 36 * mm, CONTENT_WIDTH - 80 * mm], repeatRows=1)
        table.setStyle(_grid_style([('BACKGROUND', (0, 0), (-1, 0), HEADER_BG)]))
        story.append(table)
        story.append(Spacer(1, 1.5 * mm))
        story.append(Paragraph(
            'Only these sampled frames were analysed; the rest of the video and its audio track were not examined.',
            S_NOTE,
        ))

    # ── Observations ────────────────────────────────────────
    story.append(Paragraph('Analysis Observations', S_H2))
    if ctx.get('observations'):
        story.append(_box([Paragraph(_t(ctx['observations']), S_BODY)], LABEL_BG, GRID))
    else:
        story.append(Paragraph(_t(ctx.get('no_observations_text') or 'No written observations are stored.'), S_BODY))
    story.append(Spacer(1, 1.5 * mm))
    story.append(Paragraph(f'<b>Source:</b> {_t(ctx.get("observations_source") or NOT_RECORDED)}', S_NOTE))

    # ── Limitations and disclaimer ──────────────────────────
    limitations = [Paragraph('Limitations', S_H2)]
    for line in ctx.get('limitations') or []:
        limitations.append(Paragraph(f'•&nbsp;&nbsp;{_t(line)}', S_BODY))
    limitations.append(Spacer(1, 4 * mm))
    limitations.append(_box([Paragraph(
        '<b>LEGAL DISCLAIMER:</b> This report is generated automatically by FAKENIX software for '
        'investigation support, awareness and research. It is not an official government document, a '
        'certificate of authenticity, or expert testimony, and it does not by itself establish that any media '
        'is genuine or manipulated. Findings should be reviewed by a qualified human examiner before being '
        'relied on in legal, disciplinary or other consequential proceedings.', S_DISCLAIMER,
    )], LABEL_BG, GRID))
    story.append(KeepTogether(limitations))

    return story


class _NumberedCanvas(canvas.Canvas):
    """Canvas that draws 'Page X of Y' once the total page count is known."""

    def __init__(self, *args, footer_text: str = '', **kwargs):
        super().__init__(*args, **kwargs)
        self._footer_text = footer_text
        self._page_states = []

    def showPage(self):
        self._page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        total = len(self._page_states)
        for state in self._page_states:
            self.__dict__.update(state)
            self._draw_footer(total)
            super().showPage()
        super().save()

    def _draw_footer(self, total: int):
        y = 12 * mm
        self.saveState()
        self.setStrokeColor(GRID)
        self.setLineWidth(0.5)
        self.line(MARGIN_X, y + 4 * mm, PAGE_SIZE[0] - MARGIN_X, y + 4 * mm)
        self.setFont('Helvetica', 7.5)
        self.setFillColor(GREY_TEXT)
        self.drawString(MARGIN_X, y, self._footer_text)
        self.drawRightString(PAGE_SIZE[0] - MARGIN_X, y, f'Page {self._pageNumber} of {total}')
        self.restoreState()


def render_report_pdf(path: str, ctx: dict) -> None:
    """
    Write the report PDF to `path`. The file is written to a temporary name and
    moved into place, so a failed or concurrent build never leaves a half-written
    PDF under the final name. Raises on failure.
    """
    report_id = str(ctx.get('report_id') or '')
    footer = f'FAKENIX Forensic Analysis Report  ·  {report_id}'
    if ctx.get('is_demo'):
        footer += '  ·  DEMO / SIMULATED'
    footer = footer.encode('cp1252', 'replace').decode('cp1252')

    tmp_path = f'{path}.{uuid.uuid4().hex}.tmp'
    doc = SimpleDocTemplate(
        tmp_path,
        pagesize=PAGE_SIZE,
        leftMargin=MARGIN_X, rightMargin=MARGIN_X,
        topMargin=MARGIN_TOP, bottomMargin=MARGIN_BOTTOM,
        title=f'FAKENIX Forensic Analysis Report {report_id}',
        author='FAKENIX',
        subject='Deepfake detection forensic analysis report',
    )
    try:
        doc.build(build_story(ctx), canvasmaker=partial(_NumberedCanvas, footer_text=footer))
        os.replace(tmp_path, path)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
