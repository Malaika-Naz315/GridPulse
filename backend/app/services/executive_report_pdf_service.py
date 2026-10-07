from io import BytesIO
from datetime import datetime
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    KeepTogether,
)

from sqlalchemy.orm import Session

from app.services.report_service import get_executive_report


# ============================================================
# PAGE
# ============================================================

PAGE_WIDTH, PAGE_HEIGHT = A4

LEFT_MARGIN = 17 * mm
RIGHT_MARGIN = 17 * mm
TOP_MARGIN = 20 * mm
BOTTOM_MARGIN = 17 * mm

CONTENT_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN


# ============================================================
# GRIDPULSE BRAND
# ============================================================

BLUE = colors.HexColor("#0284C7")
BLUE_DARK = colors.HexColor("#075985")
BLUE_DEEP = colors.HexColor("#0C4A6E")

BLUE_LIGHT = colors.HexColor("#BAE6FD")
BLUE_PALE = colors.HexColor("#EFF8FF")
BLUE_SOFT = colors.HexColor("#F5FBFF")

NAVY = colors.HexColor("#0F172A")
TEXT = colors.HexColor("#1E293B")
MUTED = colors.HexColor("#64748B")
LIGHT_TEXT = colors.HexColor("#94A3B8")

WHITE = colors.white
BORDER = colors.HexColor("#D8E5EE")
BORDER_LIGHT = colors.HexColor("#E8F0F5")
SOFT_GRAY = colors.HexColor("#F8FAFC")

GREEN = colors.HexColor("#15803D")
GREEN_BG = colors.HexColor("#ECFDF3")

AMBER = colors.HexColor("#B45309")
AMBER_BG = colors.HexColor("#FFF8E7")

RED = colors.HexColor("#B91C1C")
RED_BG = colors.HexColor("#FEF2F2")

PURPLE = colors.HexColor("#6D28D9")
PURPLE_BG = colors.HexColor("#F5F3FF")


# ============================================================
# HELPERS
# ============================================================

def _safe_text(value, default="N/A"):
    if value is None:
        return default

    text = str(value).strip()

    if not text:
        return default

    return escape(text)


def _format_number(value, decimals=2):
    if value is None:
        return "N/A"

    try:
        return f"{float(value):,.{decimals}f}"
    except (TypeError, ValueError):
        return str(value)


def _format_percent(value, decimals=2):
    if value is None:
        return "N/A"

    try:
        return f"{float(value):,.{decimals}f}%"
    except (TypeError, ValueError):
        return str(value)


def _format_date(value):
    if not value:
        return datetime.now().strftime("%d %B %Y, %I:%M %p")

    try:
        if isinstance(value, datetime):
            return value.strftime("%d %B %Y, %I:%M %p")

        parsed = datetime.fromisoformat(
            str(value).replace("Z", "+00:00")
        )

        return parsed.strftime("%d %B %Y, %I:%M %p")

    except Exception:
        return str(value)


def _status_colors(status):
    value = str(status or "").upper()

    if (
        "GOOD" in value
        or "HEALTHY" in value
        or "NORMAL" in value
    ):
        return GREEN, GREEN_BG

    if (
        "ATTENTION" in value
        or "MONITOR" in value
        or "MODERATE" in value
        or "LOW" in value
    ):
        return AMBER, AMBER_BG

    if (
        "CRITICAL" in value
        or "HIGH" in value
        or "FAIL" in value
    ):
        return RED, RED_BG

    return MUTED, SOFT_GRAY


def _clamp(value, minimum=0, maximum=100):
    try:
        return max(minimum, min(maximum, float(value)))
    except (TypeError, ValueError):
        return minimum


# ============================================================
# STYLES
# ============================================================

_styles = getSampleStyleSheet()


COVER_BRAND = ParagraphStyle(
    "CoverBrand",
    parent=_styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=11,
    leading=13,
    textColor=BLUE,
    alignment=TA_LEFT,
)

COVER_TITLE = ParagraphStyle(
    "CoverTitle",
    parent=_styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=27,
    leading=31,
    textColor=NAVY,
    alignment=TA_LEFT,
)

COVER_SUBTITLE = ParagraphStyle(
    "CoverSubtitle",
    parent=_styles["Normal"],
    fontName="Helvetica",
    fontSize=10.5,
    leading=16,
    textColor=MUTED,
    alignment=TA_LEFT,
)

SECTION_TITLE = ParagraphStyle(
    "SectionTitle",
    parent=_styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=15,
    leading=18,
    textColor=NAVY,
)

SECTION_NUMBER = ParagraphStyle(
    "SectionNumber",
    parent=_styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=8,
    leading=10,
    textColor=BLUE,
)

BODY = ParagraphStyle(
    "Body",
    parent=_styles["BodyText"],
    fontName="Helvetica",
    fontSize=9,
    leading=14,
    textColor=TEXT,
)

SMALL = ParagraphStyle(
    "Small",
    parent=_styles["Normal"],
    fontName="Helvetica",
    fontSize=7.5,
    leading=10,
    textColor=MUTED,
)

SMALL_BOLD = ParagraphStyle(
    "SmallBold",
    parent=SMALL,
    fontName="Helvetica-Bold",
    textColor=NAVY,
)

TINY = ParagraphStyle(
    "Tiny",
    parent=_styles["Normal"],
    fontName="Helvetica",
    fontSize=6.7,
    leading=9,
    textColor=LIGHT_TEXT,
)

KPI_VALUE = ParagraphStyle(
    "KPIValue",
    parent=_styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=15,
    leading=18,
    textColor=NAVY,
)

KPI_VALUE_BLUE = ParagraphStyle(
    "KPIValueBlue",
    parent=KPI_VALUE,
    textColor=BLUE_DARK,
)

KPI_LABEL = ParagraphStyle(
    "KPILabel",
    parent=_styles["Normal"],
    fontName="Helvetica",
    fontSize=7.2,
    leading=9,
    textColor=MUTED,
)

TABLE_HEADER = ParagraphStyle(
    "TableHeader",
    parent=_styles["Normal"],
    fontName="Helvetica-Bold",
    fontSize=7.5,
    leading=9,
    textColor=NAVY,
)

TABLE_TEXT = ParagraphStyle(
    "TableText",
    parent=_styles["Normal"],
    fontName="Helvetica",
    fontSize=7.8,
    leading=11,
    textColor=TEXT,
)


# ============================================================
# MANAGEMENT INTERPRETATION
# ============================================================

def _management_box(title, text, accent=BLUE):
    content = [
        Paragraph(
            escape(title).upper(),
            ParagraphStyle(
                "ManagementBoxTitle",
                parent=SMALL_BOLD,
                textColor=accent,
                fontSize=7,
                leading=9,
            ),
        ),
        Spacer(1, 3),
        Paragraph(
            escape(str(text)),
            BODY,
        ),
    ]

    table = Table(
        [[content]],
        colWidths=[CONTENT_WIDTH],
    )

    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BLUE_PALE),
                ("BOX", (0, 0), (-1, -1), 0.7, BLUE_LIGHT),
                ("LINEBEFORE", (0, 0), (0, 0), 3, accent),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )

    return table


# ============================================================
# COVER BACKGROUND
# ============================================================

def _draw_cover(canvas, doc):
    """Draw a clean, formal GridPulse executive-report cover.

    The cover intentionally contains only the brand, platform identity,
    report title and a subtle energy-wave footer. Report data begins on
    page 2 so the first page remains clean and executive-looking.
    """
    canvas.saveState()

    # --------------------------------------------------------
    # WHITE COVER + THIN PROFESSIONAL BORDER
    # --------------------------------------------------------
    canvas.setFillColor(WHITE)
    canvas.rect(
        0,
        0,
        PAGE_WIDTH,
        PAGE_HEIGHT,
        stroke=0,
        fill=1,
    )

    canvas.setStrokeColor(BLUE_DARK)
    canvas.setLineWidth(0.65)
    canvas.rect(
        10 * mm,
        10 * mm,
        PAGE_WIDTH - 20 * mm,
        PAGE_HEIGHT - 20 * mm,
        stroke=1,
        fill=0,
    )

    # --------------------------------------------------------
    # SMALL GRIDPULSE BRAND AT TOP-LEFT
    # --------------------------------------------------------
    logo_x = 19 * mm
    logo_y = PAGE_HEIGHT - 25 * mm

    # Pulse icon - small, clean and close to the wordmark.
    canvas.setStrokeColor(NAVY)
    canvas.setLineWidth(1.65)
    canvas.setLineCap(1)
    canvas.setLineJoin(1)

    pulse = canvas.beginPath()
    pulse.moveTo(logo_x, logo_y)
    pulse.lineTo(logo_x + 4.0 * mm, logo_y)
    pulse.lineTo(logo_x + 6.0 * mm, logo_y + 5.2 * mm)
    pulse.lineTo(logo_x + 8.7 * mm, logo_y - 5.2 * mm)
    pulse.lineTo(logo_x + 11.0 * mm, logo_y)
    pulse.lineTo(logo_x + 15.0 * mm, logo_y)
    canvas.drawPath(pulse, stroke=1, fill=0)

    # Wordmark: Grid + Pulse, matching the project branding.
    canvas.setFont("Helvetica-Bold", 11.5)
    canvas.setFillColor(NAVY)
    canvas.drawString(
        logo_x + 18 * mm,
        logo_y - 3.7,
        "Grid",
    )

    grid_width = canvas.stringWidth(
        "Grid",
        "Helvetica-Bold",
        11.5,
    )

    canvas.setFillColor(BLUE)
    canvas.drawString(
        logo_x + 18 * mm + grid_width,
        logo_y - 3.7,
        "Pulse",
    )

    # --------------------------------------------------------
    # MAIN CENTER TITLE
    # --------------------------------------------------------
    center_x = PAGE_WIDTH / 2

    # GridPulse
    brand_size = 31
    grid = "Grid"
    pulse_text = "Pulse"

    grid_width = canvas.stringWidth(
        grid,
        "Helvetica-Bold",
        brand_size,
    )
    pulse_width = canvas.stringWidth(
        pulse_text,
        "Helvetica-Bold",
        brand_size,
    )

    total_brand_width = grid_width + pulse_width
    brand_x = center_x - total_brand_width / 2
    brand_y = PAGE_HEIGHT - 84 * mm

    canvas.setFont("Helvetica-Bold", brand_size)
    canvas.setFillColor(NAVY)
    canvas.drawString(brand_x, brand_y, grid)

    canvas.setFillColor(BLUE)
    canvas.drawString(
        brand_x + grid_width,
        brand_y,
        pulse_text,
    )

    # AI-Powered
    canvas.setFont("Helvetica", 14)
    canvas.setFillColor(MUTED)
    ai_text = "AI-Powered"
    ai_width = canvas.stringWidth(
        ai_text,
        "Helvetica",
        14,
    )
    canvas.drawString(
        center_x - ai_width / 2,
        PAGE_HEIGHT - 98 * mm,
        ai_text,
    )

    # Single short divider - deliberately minimal.
    canvas.setStrokeColor(BLUE)
    canvas.setLineWidth(1.6)
    canvas.line(
        center_x - 17 * mm,
        PAGE_HEIGHT - 111 * mm,
        center_x + 17 * mm,
        PAGE_HEIGHT - 111 * mm,
    )

    # Executive Intelligence Report
    title_size = 25
    canvas.setFont("Helvetica-Bold", title_size)
    canvas.setFillColor(NAVY)

    line_one = "Executive"
    line_two = "Intelligence Report"

    line_one_width = canvas.stringWidth(
        line_one,
        "Helvetica-Bold",
        title_size,
    )
    line_two_width = canvas.stringWidth(
        line_two,
        "Helvetica-Bold",
        title_size,
    )

    canvas.drawString(
        center_x - line_one_width / 2,
        PAGE_HEIGHT - 131 * mm,
        line_one,
    )

    canvas.drawString(
        center_x - line_two_width / 2,
        PAGE_HEIGHT - 147 * mm,
        line_two,
    )

    # Platform subtitle
    canvas.setFont("Helvetica", 8.7)
    canvas.setFillColor(MUTED)

    subtitle_one = "AI-Powered Smart Grid Intelligence &"
    subtitle_two = "Demand Forecasting Platform"

    subtitle_one_width = canvas.stringWidth(
        subtitle_one,
        "Helvetica",
        8.7,
    )
    subtitle_two_width = canvas.stringWidth(
        subtitle_two,
        "Helvetica",
        8.7,
    )

    canvas.drawString(
        center_x - subtitle_one_width / 2,
        PAGE_HEIGHT - 160 * mm,
        subtitle_one,
    )

    canvas.drawString(
        center_x - subtitle_two_width / 2,
        PAGE_HEIGHT - 167 * mm,
        subtitle_two,
    )

    # --------------------------------------------------------
    # SUBTLE BOTTOM ENERGY WAVES
    # --------------------------------------------------------
    # These replace the old large blocks/panels and keep the cover
    # visually balanced without making it busy.

    # Lightest wave.
    canvas.setFillColor(colors.HexColor("#F2F7FC"))
    path = canvas.beginPath()
    path.moveTo(10 * mm, 10 * mm)
    path.curveTo(
        48 * mm, 28 * mm,
        78 * mm, 11 * mm,
        119 * mm, 18 * mm,
    )
    path.curveTo(
        157 * mm, 25 * mm,
        188 * mm, 10 * mm,
        PAGE_WIDTH - 10 * mm, 34 * mm,
    )
    path.lineTo(PAGE_WIDTH - 10 * mm, 10 * mm)
    path.close()
    canvas.drawPath(path, stroke=0, fill=1)

    # Ice-blue wave.
    canvas.setFillColor(colors.HexColor("#DCEAF7"))
    path = canvas.beginPath()
    path.moveTo(10 * mm, 10 * mm)
    path.curveTo(
        51 * mm, 31 * mm,
        85 * mm, 13 * mm,
        123 * mm, 20 * mm,
    )
    path.curveTo(
        164 * mm, 28 * mm,
        195 * mm, 11 * mm,
        PAGE_WIDTH - 10 * mm, 43 * mm,
    )
    path.lineTo(PAGE_WIDTH - 10 * mm, 10 * mm)
    path.close()
    canvas.drawPath(path, stroke=0, fill=1)

    # Main navy wave.
    canvas.setFillColor(colors.HexColor("#2C4F7A"))
    path = canvas.beginPath()
    path.moveTo(10 * mm, 10 * mm)
    path.curveTo(
        53 * mm, 18 * mm,
        91 * mm, 8 * mm,
        126 * mm, 15 * mm,
    )
    path.curveTo(
        166 * mm, 23 * mm,
        196 * mm, 9 * mm,
        PAGE_WIDTH - 10 * mm, 28 * mm,
    )
    path.lineTo(PAGE_WIDTH - 10 * mm, 10 * mm)
    path.close()
    canvas.drawPath(path, stroke=0, fill=1)

    # Thin blue wave line over the footer.
    canvas.setStrokeColor(colors.HexColor("#5B9FE0"))
    canvas.setLineWidth(0.75)
    path = canvas.beginPath()
    path.moveTo(10 * mm, 31 * mm)
    path.curveTo(
        52 * mm, 48 * mm,
        85 * mm, 26 * mm,
        124 * mm, 31 * mm,
    )
    path.curveTo(
        163 * mm, 37 * mm,
        195 * mm, 22 * mm,
        PAGE_WIDTH - 10 * mm, 49 * mm,
    )
    canvas.drawPath(path, stroke=1, fill=0)

    # --------------------------------------------------------
    # SMALL COVER FOOTER
    # --------------------------------------------------------
    canvas.setFont("Helvetica", 6.5)
    canvas.setFillColor(LIGHT_TEXT)
    canvas.drawString(
        18 * mm,
        14 * mm,
        "GridPulse Intelligence Platform",
    )
    canvas.drawRightString(
        PAGE_WIDTH - 18 * mm,
        14 * mm,
        "Confidential - Management Use",
    )

    canvas.restoreState()


# ============================================================
# NORMAL PAGE DECORATION
# ============================================================

def _draw_page(canvas, doc):
    canvas.saveState()

    canvas.setFillColor(WHITE)
    canvas.rect(
        0,
        0,
        PAGE_WIDTH,
        PAGE_HEIGHT,
        stroke=0,
        fill=1,
    )

    # Header accent
    canvas.setFillColor(BLUE)
    canvas.rect(
        0,
        PAGE_HEIGHT - 3 * mm,
        PAGE_WIDTH,
        3 * mm,
        stroke=0,
        fill=1,
    )

    canvas.setFillColor(BLUE_DARK)
    canvas.setFont("Helvetica-Bold", 7.5)

    canvas.drawString(
        LEFT_MARGIN,
        PAGE_HEIGHT - 10 * mm,
        "GRIDPULSE",
    )

    canvas.setFont("Helvetica", 7)
    canvas.setFillColor(MUTED)

    canvas.drawRightString(
        PAGE_WIDTH - RIGHT_MARGIN,
        PAGE_HEIGHT - 10 * mm,
        "Executive Intelligence Report",
    )

    # Footer
    canvas.setStrokeColor(BORDER_LIGHT)
    canvas.setLineWidth(0.5)

    canvas.line(
        LEFT_MARGIN,
        12 * mm,
        PAGE_WIDTH - RIGHT_MARGIN,
        12 * mm,
    )

    canvas.setFont("Helvetica", 6.5)
    canvas.setFillColor(LIGHT_TEXT)

    canvas.drawString(
        LEFT_MARGIN,
        7.5 * mm,
        "AI-Powered Smart Grid Intelligence & Demand Forecasting Platform",
    )

    canvas.drawRightString(
        PAGE_WIDTH - RIGHT_MARGIN,
        7.5 * mm,
        f"Page {doc.page}",
    )

    canvas.restoreState()


# ============================================================
# SECTION HEADER
# ============================================================

def _section_title(number, title, description=None):
    elements = []

    number_box = Table(
        [[Paragraph(f"{number:02d}", SECTION_NUMBER)]],
        colWidths=[12 * mm],
        rowHeights=[9 * mm],
    )

    number_box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BLUE_PALE),
                ("BOX", (0, 0), (-1, -1), 0.5, BLUE_LIGHT),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    title_block = [
        Paragraph(escape(title), SECTION_TITLE),
    ]

    if description:
        title_block.append(
            Paragraph(
                escape(description),
                SMALL,
            )
        )

    wrapper = Table(
        [[number_box, title_block]],
        colWidths=[
            14 * mm,
            CONTENT_WIDTH - 14 * mm,
        ],
    )

    wrapper.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    elements.append(wrapper)

    # Blue section line
    line = Table(
        [[""]],
        colWidths=[CONTENT_WIDTH],
        rowHeights=[1.2],
    )

    line.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), BLUE_LIGHT),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    elements.extend(
        [
            Spacer(1, 4),
            line,
            Spacer(1, 10),
        ]
    )

    return elements


# ============================================================
# STATUS BADGE
# ============================================================

def _status_badge(status, width=31 * mm):
    fg, bg = _status_colors(status)

    style = ParagraphStyle(
        "BadgeStyle",
        parent=SMALL_BOLD,
        fontSize=7,
        leading=9,
        textColor=fg,
        alignment=TA_CENTER,
    )

    table = Table(
        [[Paragraph(_safe_text(status).upper(), style)]],
        colWidths=[width],
    )

    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), bg),
                ("BOX", (0, 0), (-1, -1), 0.6, fg),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )

    return table


# ============================================================
# KPI CARD
# ============================================================

def _kpi_card(value, label, status=None, accent=BLUE, compact=False):
    value_style = (
        ParagraphStyle(
            "KPIValueCompact",
            parent=KPI_VALUE,
            fontSize=8,
            leading=10,
        )
        if compact
        else KPI_VALUE
    )

    rows = [
        [Paragraph(_safe_text(value), value_style)],
        [Paragraph(_safe_text(label), KPI_LABEL)],
    ]

    if status:
        fg, bg = _status_colors(status)

        status_style = ParagraphStyle(
            "CardStatus",
            parent=SMALL_BOLD,
            fontSize=6.5,
            leading=8,
            textColor=fg,
        )

        rows.append(
            [Paragraph(_safe_text(status).upper(), status_style)]
        )

    table = Table(
        rows,
        colWidths=[CONTENT_WIDTH / 4 - 5 * mm],
    )

    commands = [
        ("BACKGROUND", (0, 0), (-1, -1), WHITE),
        ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
        ("LINEBEFORE", (0, 0), (0, -1), 2.8, accent),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]

    if status:
        fg, bg = _status_colors(status)
        commands.append(
            ("BACKGROUND", (0, 2), (-1, 2), bg)
        )

    table.setStyle(TableStyle(commands))

    return table


def _kpi_row(cards):
    table = Table(
        [cards],
        colWidths=[
            CONTENT_WIDTH / len(cards)
            for _ in cards
        ],
    )

    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 2.5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 2.5),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    return table


# ============================================================
# VISUAL METRIC BAR
# ============================================================

def _metric_bar(label, value, percent, accent=BLUE):
    percent = _clamp(percent)

    label_row = Table(
        [[
            Paragraph(
                _safe_text(label),
                SMALL_BOLD,
            ),
            Paragraph(
                _safe_text(value),
                SMALL_BOLD,
            ),
        ]],
        colWidths=[
            CONTENT_WIDTH * 0.72,
            CONTENT_WIDTH * 0.28,
        ],
    )

    label_row.setStyle(
        TableStyle(
            [
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )

    # Background bar
    bar_width = CONTENT_WIDTH
    filled_width = max(1, bar_width * percent / 100)

    bar = Table(
        [[""]],
        colWidths=[bar_width],
        rowHeights=[5 * mm],
    )

    bar.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EAF2F7")),
                ("BOX", (0, 0), (-1, -1), 0.3, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    filled = Table(
        [[""]],
        colWidths=[filled_width],
        rowHeights=[5 * mm],
    )

    filled.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), accent),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    bar_wrapper = Table(
        [[filled]],
        colWidths=[bar_width],
        rowHeights=[5 * mm],
    )

    bar_wrapper.setStyle(
        TableStyle(
            [
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    return [
        label_row,
        bar,
        Spacer(1, -5 * mm),
        bar_wrapper,
        Spacer(1, 7),
    ]


# ============================================================
# INFO TABLE
# ============================================================

def _info_table(rows):
    data = [
        [
            Paragraph("Metric", TABLE_HEADER),
            Paragraph("Value", TABLE_HEADER),
        ]
    ]

    for label, value in rows:
        data.append(
            [
                Paragraph(_safe_text(label), TABLE_TEXT),
                Paragraph(_safe_text(value), TABLE_TEXT),
            ]
        )

    table = Table(
        data,
        colWidths=[
            CONTENT_WIDTH * 0.62,
            CONTENT_WIDTH * 0.38,
        ],
        repeatRows=1,
    )

    style = [
        ("BACKGROUND", (0, 0), (-1, 0), BLUE_PALE),
        ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
        ("INNERGRID", (0, 1), (-1, -1), 0.3, BORDER_LIGHT),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]

    for row in range(1, len(data)):
        if row % 2 == 0:
            style.append(
                (
                    "BACKGROUND",
                    (0, row),
                    (-1, row),
                    SOFT_GRAY,
                )
            )

    table.setStyle(TableStyle(style))

    return table


# ============================================================
# EXECUTIVE STATUS PANEL
# ============================================================

def _executive_status_panel(status, score):
    fg, bg = _status_colors(status)

    score_text = _format_number(score, 2)

    score_box = Table(
        [
            [Paragraph("OVERALL SCORE", SMALL_BOLD)],
            [
                Paragraph(
                    f"{score_text} <font size='10'>/100</font>",
                    KPI_VALUE,
                )
            ],
            [
                Paragraph(
                    "Current platform health",
                    KPI_LABEL,
                )
            ],
        ],
        colWidths=[48 * mm],
    )

    score_box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), WHITE),
                ("BOX", (0, 0), (-1, -1), 0.7, BORDER),
                ("LINEABOVE", (0, 0), (-1, 0), 3, BLUE),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )

    left = [
        Paragraph(
            "EXECUTIVE GRID STATUS",
            SMALL_BOLD,
        ),
        Spacer(1, 5),
        _status_badge(status, 38 * mm),
        Spacer(1, 5),
        Paragraph(
            "The current intelligence layer indicates "
            "where operational attention should be focused.",
            SMALL,
        ),
    ]

    panel = Table(
        [[left, score_box]],
        colWidths=[
            CONTENT_WIDTH - 52 * mm,
            52 * mm,
        ],
    )

    panel.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), bg),
                ("BOX", (0, 0), (-1, -1), 0.7, fg),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 12),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )

    return panel


# ============================================================
# INSIGHT CARDS
# ============================================================

def _insight_cards(insights):
    cards = []

    for index, insight in enumerate(insights, start=1):
        if isinstance(insight, dict):
            text = (
                insight.get("insight")
                or insight.get("message")
                or insight.get("description")
                or str(insight)
            )
        else:
            text = str(insight)

        card = Table(
            [
                [Paragraph(f"AI INSIGHT {index:02d}", SMALL_BOLD)],
                [
                    Paragraph(
                        _safe_text(text),
                        ParagraphStyle(
                            "InsightBody",
                            parent=BODY,
                            fontSize=8,
                            leading=11,
                        ),
                    )
                ],
            ],
            colWidths=[(CONTENT_WIDTH - 7) / 2],
        )

        card.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), BLUE_SOFT),
                    ("BOX", (0, 0), (-1, -1), 0.6, BLUE_LIGHT),
                    ("LINEBEFORE", (0, 0), (0, -1), 3, BLUE),
                    ("LEFTPADDING", (0, 0), (-1, -1), 9),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ]
            )
        )
        cards.append(card)

    rows = []
    for i in range(0, len(cards), 2):
        row = cards[i:i + 2]
        if len(row) == 1:
            row.append("")
        rows.append(row)

    grid = Table(
        rows,
        colWidths=[
            (CONTENT_WIDTH - 7) / 2,
            (CONTENT_WIDTH - 7) / 2,
        ],
        hAlign="LEFT",
    )

    grid.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )

    return [grid, Spacer(1, 5)]


# ============================================================
# RECOMMENDATION CARDS
# ============================================================

def _recommendation_cards(recommendations):
    elements = []

    for recommendation in recommendations:
        if isinstance(recommendation, dict):
            priority = recommendation.get("priority", "N/A")
            category = recommendation.get("category", "N/A")
            text = (
                recommendation.get("recommendation")
                or recommendation.get("message")
                or recommendation.get("description")
                or "N/A"
            )
        else:
            priority = "N/A"
            category = "N/A"
            text = str(recommendation)

        priority_upper = str(priority).upper()

        if priority_upper == "HIGH":
            fg = RED
            bg = RED_BG
        elif priority_upper == "MEDIUM":
            fg = AMBER
            bg = AMBER_BG
        else:
            fg = BLUE
            bg = BLUE_PALE

        priority_box = Table(
            [
                [
                    Paragraph(
                        priority_upper,
                        ParagraphStyle(
                            "Priority",
                            parent=SMALL_BOLD,
                            textColor=fg,
                            alignment=TA_CENTER,
                        ),
                    )
                ]
            ],
            colWidths=[25 * mm],
        )

        priority_box.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), bg),
                    ("BOX", (0, 0), (-1, -1), 0.5, fg),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )

        card = Table(
            [
                [
                    priority_box,
                    [
                        Paragraph(
                            _safe_text(category).upper(),
                            SMALL_BOLD,
                        ),
                        Spacer(1, 2),
                        Paragraph(
                            _safe_text(text),
                            BODY,
                        ),
                    ],
                ]
            ],
            colWidths=[
                30 * mm,
                CONTENT_WIDTH - 30 * mm,
            ],
        )

        card.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), WHITE),
                    ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 9),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ]
            )
        )

        elements.append(card)
        elements.append(Spacer(1, 7))

    return elements


# ============================================================
# COVER
# ============================================================

def _build_cover(report):
    """Reserve the first page for the canvas-drawn cover only."""
    return [PageBreak()]


# ============================================================
# MAIN GENERATOR
# ============================================================

def generate_executive_report_pdf(db: Session) -> bytes:

    report = get_executive_report(db)

    if report is None:
        report = {}

    if hasattr(report, "model_dump"):
        report = report.model_dump()
    elif hasattr(report, "dict"):
        report = report.dict()

    # --------------------------------------------------------
    # Data
    # --------------------------------------------------------

    overall_status = report.get(
        "overall_status",
        "UNKNOWN",
    )

    overall_score = report.get(
        "overall_score",
        0,
    )

    energy = report.get(
        "energy_performance"
    ) or {}

    forecast = report.get(
        "forecast_performance"
    ) or {}

    renewable = report.get(
        "renewable_performance"
    ) or {}

    carbon = report.get(
        "carbon_performance"
    ) or {}

    grid = report.get(
        "grid_performance"
    ) or {}

    insights = report.get(
        "ai_insights"
    ) or []

    recommendations = report.get(
        "recommendations"
    ) or []

    data_quality = report.get(
        "data_quality"
    ) or {}

    # --------------------------------------------------------
    # Document
    # --------------------------------------------------------

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=LEFT_MARGIN,
        rightMargin=RIGHT_MARGIN,
        topMargin=TOP_MARGIN,
        bottomMargin=BOTTOM_MARGIN,
        title="GridPulse Executive Intelligence Report",
        author="GridPulse",
        subject=(
            "AI-Powered Smart Grid Intelligence & "
            "Demand Forecasting Platform"
        ),
    )

    story = []

    # ========================================================
    # COVER
    # ========================================================

    story.extend(
        _build_cover(report)
    )

    # ========================================================
    # 01 EXECUTIVE OVERVIEW
    # ========================================================

    story.extend(
        _section_title(
            1,
            "Executive Overview",
            "A clear management view of where GridPulse stands right now.",
        )
    )

    story.append(
        _executive_status_panel(
            overall_status,
            overall_score,
        )
    )

    story.append(Spacer(1, 9))

    story.append(
        Paragraph(
            "GridPulse brings together the platform's latest energy, "
            "forecasting, renewable, carbon and grid intelligence into "
            "one operational view. The current position highlights both "
            "areas performing well and areas that deserve management attention.",
            BODY,
        )
    )

    story.append(
        Paragraph(
            "Executive Snapshot",
            ParagraphStyle(
                "SnapshotTitle",
                parent=SECTION_TITLE,
                fontSize=11,
                leading=14,
            ),
        )
    )

    snapshot_cards = [
        _kpi_card(
            f"{_format_number(energy.get('total_demand_kwh'))} kWh",
            "Recorded Energy Demand",
            "NORMAL",
            BLUE,
        ),
        _kpi_card(
            f"{_format_number(renewable.get('total_renewable_generation_kwh'))} kWh",
            "Renewable Generation",
            "MONITOR",
            GREEN,
        ),
        _kpi_card(
            f"{_format_number(carbon.get('co2_avoided_kg'))} kg",
            "CO2 Avoided",
            "GOOD",
            GREEN,
        ),
        _kpi_card(
            _format_number(forecast.get("r2_score"), 4),
            "Forecast R2",
            forecast.get("evaluation_status"),
            PURPLE,
        ),
    ]

    story.append(
        _kpi_row(snapshot_cards)
    )

    story.append(Spacer(1, 11))

    # ========================================================
    # 02 SYSTEM KPI OVERVIEW
    # ========================================================

    story.extend(
        _section_title(
            2,
            "System KPI Overview",
            "The four indicators that best summarize the current platform position.",
        )
    )

    story.append(
        _kpi_row(
            [
                _kpi_card(
                    f"{_format_number(energy.get('total_demand_kwh'))} kWh",
                    "Total Energy Demand",
                    "NORMAL",
                    BLUE,
                ),
                _kpi_card(
                    f"{_format_number(renewable.get('total_renewable_generation_kwh'))} kWh",
                    "Renewable Generation",
                    "MONITOR",
                    GREEN,
                ),
                _kpi_card(
                    f"{_format_number(carbon.get('co2_avoided_kg'))} kg",
                    "CO2 Avoided",
                    "GOOD",
                    GREEN,
                ),
                _kpi_card(
                    f"{_format_number(carbon.get('sustainability_score'), 2)} / 100",
                    "Sustainability Score",
                    "MONITOR",
                    AMBER,
                ),
            ]
        )
    )

    story.append(Spacer(1, 12))

    # ========================================================
    # 03 ENERGY PERFORMANCE
    # ========================================================

    story.extend(
        _section_title(
            3,
            "Energy Performance",
            "Demand levels recorded by the current GridPulse energy layer.",
        )
    )

    story.append(
        _kpi_row(
            [
                _kpi_card(
                    f"{_format_number(energy.get('total_demand_kwh'))}",
                    "Total Demand (kWh)",
                    accent=BLUE,
                ),
                _kpi_card(
                    f"{_format_number(energy.get('average_demand_kwh'))}",
                    "Average Demand (kWh)",
                    accent=BLUE,
                ),
                _kpi_card(
                    f"{_format_number(energy.get('peak_demand_kwh'))}",
                    "Peak Demand (kWh)",
                    accent=AMBER,
                ),
                _kpi_card(
                    str(energy.get("energy_records", "N/A")),
                    "Energy Records",
                    accent=PURPLE,
                ),
            ]
        )
    )

    story.append(Spacer(1, 12))

    story.append(
        _info_table(
            [
                (
                    "Total Energy Demand",
                    f"{_format_number(energy.get('total_demand_kwh'))} kWh",
                ),
                (
                    "Average Demand",
                    f"{_format_number(energy.get('average_demand_kwh'))} kWh",
                ),
                (
                    "Peak Demand",
                    f"{_format_number(energy.get('peak_demand_kwh'))} kWh",
                ),
                (
                    "Energy Records",
                    str(energy.get("energy_records", "N/A")),
                ),
            ]
        )
    )

    # ========================================================
    # 04 FORECASTING
    # ========================================================

    forecast_section = []

    forecast_section.extend(
        _section_title(
            4,
            "Demand Forecasting Performance",
            "How accurately the current demand forecasting model is performing.",
        )
    )

    forecast_cards = [
        _kpi_card(
            _format_number(forecast.get("mae"), 2),
            "MAE",
            accent=PURPLE,
        ),
        _kpi_card(
            _format_number(forecast.get("rmse"), 2),
            "RMSE",
            accent=PURPLE,
        ),
        _kpi_card(
            _format_number(forecast.get("r2_score"), 4),
            "R2 Score",
            forecast.get("evaluation_status"),
            PURPLE,
        ),
        _kpi_card(
            "RF Model"
            if str(forecast.get("model_name", "")).lower() == "randomforest"
            else forecast.get("model_name", "N/A"),
            "Forecast Model",
            accent=BLUE,
            compact=True,
        ),
    ]

    forecast_section.append(_kpi_row(forecast_cards))
    forecast_section.append(Spacer(1, 10))

    forecast_section.append(
        _info_table(
            [
                ("Model", forecast.get("model_name", "N/A")),
                ("Model Version", forecast.get("model_version", "-")),
                ("MAE", _format_number(forecast.get("mae"), 2)),
                ("RMSE", _format_number(forecast.get("rmse"), 2)),
                ("R2 Score", _format_number(forecast.get("r2_score"), 4)),
                (
                    "Evaluation Status",
                    forecast.get("evaluation_status", "N/A"),
                ),
            ]
        )
    )


    story.append(KeepTogether(forecast_section))

    # ========================================================
    # 05 RENEWABLE + STORAGE
    # ========================================================

    story.extend(
        _section_title(
            5,
            "Renewable Energy & Storage",
            "A visual view of renewable contribution and the current storage position.",
        )
    )

    renewable_cards = [
        _kpi_card(
            f"{_format_number(renewable.get('solar_generation_kwh'))} kWh",
            "Solar Generation",
            accent=colors.HexColor("#0EA5E9"),
        ),
        _kpi_card(
            f"{_format_number(renewable.get('wind_generation_kwh'))} kWh",
            "Wind Generation",
            accent=GREEN,
        ),
        _kpi_card(
            f"{_format_number(renewable.get('total_renewable_generation_kwh'))} kWh",
            "Total Renewable",
            "MONITOR",
            GREEN,
        ),
        _kpi_card(
            f"{_format_number(renewable.get('average_battery_storage_kwh'))} kWh",
            "Average Battery",
            "HEALTHY",
            BLUE,
        ),
    ]

    story.append(_kpi_row(renewable_cards))
    story.append(Spacer(1, 12))

    renewable_percent = renewable.get(
        "renewable_contribution_percent",
        0,
    )

    story.extend(
        _metric_bar(
            "Renewable contribution to recorded demand",
            _format_percent(renewable_percent, 2),
            renewable_percent,
            GREEN,
        )
    )

    story.append(
        _info_table(
            [
                (
                    "Solar Generation",
                    f"{_format_number(renewable.get('solar_generation_kwh'))} kWh",
                ),
                (
                    "Wind Generation",
                    f"{_format_number(renewable.get('wind_generation_kwh'))} kWh",
                ),
                (
                    "Total Renewable Generation",
                    f"{_format_number(renewable.get('total_renewable_generation_kwh'))} kWh",
                ),
                (
                    "Renewable Contribution",
                    _format_percent(
                        renewable.get("renewable_contribution_percent"),
                        2,
                    ),
                ),
                (
                    "Average Battery Storage",
                    f"{_format_number(renewable.get('average_battery_storage_kwh'))} kWh",
                ),
            ]
        )
    )

    # ========================================================
    # 06 CARBON INTELLIGENCE
    # ========================================================

    carbon_section = []

    carbon_section.extend(
        _section_title(
            6,
            "Carbon Intelligence",
            "Current carbon impact translated into measurable sustainability indicators.",
        )
    )

    carbon_cards = [
        _kpi_card(
            f"{_format_number(carbon.get('baseline_co2_kg'))} kg",
            "Baseline CO2",
            accent=BLUE,
        ),
        _kpi_card(
            f"{_format_number(carbon.get('estimated_grid_co2_kg'))} kg",
            "Estimated Grid CO2",
            accent=AMBER,
        ),
        _kpi_card(
            f"{_format_number(carbon.get('co2_avoided_kg'))} kg",
            "CO2 Avoided",
            "GOOD",
            GREEN,
        ),
        _kpi_card(
            _format_percent(carbon.get("carbon_reduction_percent"), 2),
            "Carbon Reduction",
            accent=GREEN,
        ),
    ]

    carbon_section.append(_kpi_row(carbon_cards))
    carbon_section.append(Spacer(1, 11))

    carbon_reduction_percent = carbon.get(
        "carbon_reduction_percent",
        0,
    )

    sustainability = carbon.get(
        "sustainability_score",
        0,
    )

    carbon_section.extend(
        _metric_bar(
            "Carbon reduction",
            _format_percent(carbon_reduction_percent, 2),
            carbon_reduction_percent,
            GREEN,
        )
    )

    carbon_section.extend(
        _metric_bar(
            "Sustainability score",
            f"{_format_number(sustainability, 2)} / 100",
            sustainability,
            BLUE,
        )
    )

    carbon_section.append(
        _info_table(
            [
                (
                    "Baseline CO2",
                    f"{_format_number(carbon.get('baseline_co2_kg'))} kg",
                ),
                (
                    "Estimated Grid CO2",
                    f"{_format_number(carbon.get('estimated_grid_co2_kg'))} kg",
                ),
                (
                    "CO2 Avoided",
                    f"{_format_number(carbon.get('co2_avoided_kg'))} kg",
                ),
                (
                    "Carbon Reduction",
                    _format_percent(
                        carbon.get("carbon_reduction_percent"),
                        2,
                    ),
                ),
                (
                    "Sustainability Score",
                    f"{_format_number(carbon.get('sustainability_score'))} / 100",
                ),
            ]
        )
    )


    story.append(KeepTogether(carbon_section))

    # ========================================================
    # 07 GRID PERFORMANCE
    # ========================================================

    grid_section = []

    grid_section.extend(
        _section_title(
            7,
            "Grid Performance",
            "Operational condition across demand, renewable generation and storage.",
        )
    )

    grid_items = [
        (
            "Overall Grid",
            grid.get("grid_status", "N/A"),
        ),
        (
            "Demand",
            grid.get("demand_status", "N/A"),
        ),
        (
            "Renewable",
            grid.get("renewable_status", "N/A"),
        ),
        (
            "Storage",
            grid.get("storage_status", "N/A"),
        ),
    ]

    grid_cells = []

    for label, value in grid_items:
        fg, bg = _status_colors(value)

        cell = Table(
            [
                [Paragraph(label.upper(), SMALL_BOLD)],
                [_status_badge(value, 34 * mm)],
            ],
            colWidths=[CONTENT_WIDTH / 4 - 4],
        )

        cell.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), bg),
                    ("BOX", (0, 0), (-1, -1), 0.6, fg),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )

        grid_cells.append(cell)

    grid_section.append(_kpi_row(grid_cells))
    grid_section.append(Spacer(1, 12))

    grid_section.append(
        Paragraph(
            "GridPulse currently shows a monitor-level operating position, "
            "with storage remaining healthy while renewable contribution "
            "is the clearest area for improvement.",
            BODY,
        )
    )

    story.append(KeepTogether(grid_section))

    # ========================================================
    # 08 AI INSIGHTS
    # ========================================================

    story.extend(
        _section_title(
            8,
            "AI Insights",
            "Key observations surfaced by the current GridPulse intelligence services.",
        )
    )

    if insights:
        story.extend(
            _insight_cards(insights)
        )
    else:
        story.append(
            Paragraph(
                "No AI insights are currently available.",
                BODY,
            )
        )

    # ========================================================
    # 09 RECOMMENDATIONS
    # ========================================================

    story.extend(
        _section_title(
            9,
            "Executive Recommendations",
            "Practical actions based on the current intelligence state.",
        )
    )

    if recommendations:
        story.extend(
            _recommendation_cards(recommendations)
        )
    else:
        story.append(
            Paragraph(
                "No executive recommendations are currently available.",
                BODY,
            )
        )

    # ========================================================
    # 10 DATA QUALITY
    # ========================================================

    story.extend(
        _section_title(
            10,
            "Data Quality",
            "The evidence base supporting the current executive assessment.",
        )
    )

    quality = data_quality.get(
        "status",
        "N/A",
    )

    quality_section = [
        _management_box(
            "Overall Data Quality",
            f"Current data quality status: {quality}.",
            GREEN if str(quality).upper() == "GOOD" else AMBER,
        ),
        Spacer(1, 10),
        _info_table(
            [
                (
                    "Energy Consumption Records",
                    data_quality.get(
                        "energy_records",
                        "N/A",
                    ),
                ),
                (
                    "Forecast Results",
                    data_quality.get(
                        "forecast_records",
                        "N/A",
                    ),
                ),
                (
                    "Renewable Energy Records",
                    data_quality.get(
                        "renewable_records",
                        "N/A",
                    ),
                ),
                (
                    "Carbon Intelligence Records",
                    data_quality.get(
                        "carbon_records",
                        "N/A",
                    ),
                ),
                (
                    "Overall Data Quality",
                    quality,
                ),
            ]
        )
    ]

    story.append(KeepTogether(quality_section))

    # ========================================================
    # 11 METHODOLOGY
    # ========================================================

    story.extend(
        _section_title(
            11,
            "Methodology & Report Notes",
            "How the management indicators in this report should be interpreted.",
        )
    )

    methodology = [
        "Energy performance is calculated from the available GridPulse energy consumption records.",
        "Demand forecasting performance uses the existing GridPulse forecast evaluation service and reports MAE, RMSE and R2 metrics.",
        "Renewable contribution is calculated from recorded solar and wind generation relative to recorded energy demand.",
        "Battery storage performance is represented using the average recorded battery storage value.",
        "Carbon performance is derived from the existing GridPulse Carbon Intelligence service.",
        "AI recommendations are generated by the Explainable Carbon Optimization Engine and support operational analysis rather than replace operational decision-making.",
        "The executive score combines the indicators defined by the existing GridPulse scoring logic.",
        "The report reflects the currently available database records and should be interpreted together with the data-quality indicators.",
    ]

    note_rows = []

    for index, note in enumerate(
        methodology,
        start=1,
    ):
        note_rows.append(
            [
                Paragraph(
                    f"{index:02d}",
                    ParagraphStyle(
                        "NoteNumber",
                        parent=SMALL_BOLD,
                        textColor=BLUE,
                    ),
                ),
                Paragraph(
                    escape(note),
                    ParagraphStyle(
                        "MethodBodyCompact",
                        parent=BODY,
                        fontSize=7.5,
                        leading=10,
                    ),
                ),
            ]
        )

    methodology_table = Table(
        note_rows,
        colWidths=[
            12 * mm,
            CONTENT_WIDTH - 12 * mm,
        ],
    )

    methodology_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), BLUE_PALE),
                ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.3, BORDER_LIGHT),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (0, 0), (0, -1), "CENTER"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )

    story.append(methodology_table)

    # ========================================================
    # BUILD
    # ========================================================

    doc.build(
        story,
        onFirstPage=_draw_cover,
        onLaterPages=_draw_page,
    )

    buffer.seek(0)

    return buffer.getvalue()

