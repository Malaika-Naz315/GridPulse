from io import BytesIO
from datetime import datetime

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

from app.services.carbon_intelligence_service import (
    get_carbon_intelligence_summary,
    get_carbon_intelligence_trend,
    get_sustainability_analysis,
    get_sustainability_report,
)

from app.services.carbon_ai_service import (
    get_ai_carbon_insights,
)


# ---------------------------------------------------------
# COLORS
# ---------------------------------------------------------

ICE_BLUE = colors.HexColor("#0EA5E9")
DARK_BLUE = colors.HexColor("#075985")
LIGHT_BLUE = colors.HexColor("#F0F9FF")
PALE_BLUE = colors.HexColor("#E0F2FE")

GREEN = colors.HexColor("#16A34A")
LIGHT_GREEN = colors.HexColor("#F0FDF4")

DARK = colors.HexColor("#0F172A")
SLATE = colors.HexColor("#475569")
MUTED = colors.HexColor("#64748B")

WHITE = colors.white
BORDER = colors.HexColor("#CBD5E1")
LIGHT_GRAY = colors.HexColor("#F8FAFC")


# ---------------------------------------------------------
# HELPERS
# ---------------------------------------------------------

def _number(value, decimals=2):
    try:
        return f"{float(value):,.{decimals}f}"
    except (TypeError, ValueError):
        return "0.00"


def _percent(value):
    try:
        return f"{float(value):.2f}%"
    except (TypeError, ValueError):
        return "0.00%"


def _safe(value, default="N/A"):
    if value is None:
        return default
    return str(value)


def _add_page_number(canvas, doc):
    canvas.saveState()

    width, height = A4

    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(
        18 * mm,
        14 * mm,
        width - 18 * mm,
        14 * mm,
    )

    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)

    canvas.drawString(
        18 * mm,
        9 * mm,
        "GridPulse • Carbon Intelligence",
    )

    canvas.drawRightString(
        width - 18 * mm,
        9 * mm,
        f"Page {doc.page}",
    )

    canvas.restoreState()


# ---------------------------------------------------------
# MAIN PDF GENERATOR
# ---------------------------------------------------------

def generate_carbon_intelligence_pdf(db):
    """
    Generate a professional GridPulse Carbon Intelligence
    & Sustainability PDF report using ReportLab.
    """

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=20 * mm,
        title="GridPulse Carbon Intelligence Report",
        author="GridPulse",
        subject="Carbon Intelligence & Sustainability Analysis",
    )

    styles = getSampleStyleSheet()

    # -----------------------------------------------------
    # CUSTOM STYLES
    # -----------------------------------------------------

    title_style = ParagraphStyle(
        "GridPulseTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=25,
        leading=30,
        textColor=DARK_BLUE,
        alignment=TA_LEFT,
        spaceAfter=8,
    )

    subtitle_style = ParagraphStyle(
        "GridPulseSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=15,
        textColor=SLATE,
        spaceAfter=6,
    )

    section_style = ParagraphStyle(
        "SectionTitle",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=DARK_BLUE,
        spaceBefore=8,
        spaceAfter=10,
    )

    subsection_style = ParagraphStyle(
        "SubsectionTitle",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=DARK,
        spaceBefore=5,
        spaceAfter=6,
    )

    body_style = ParagraphStyle(
        "BodyTextCustom",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9,
        leading=14,
        textColor=SLATE,
        spaceAfter=6,
    )

    small_style = ParagraphStyle(
        "SmallText",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=11,
        textColor=MUTED,
    )

    card_value_style = ParagraphStyle(
        "CardValue",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=19,
        textColor=DARK_BLUE,
        alignment=TA_CENTER,
    )

    card_label_style = ParagraphStyle(
        "CardLabel",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10,
        textColor=MUTED,
        alignment=TA_CENTER,
    )

    score_style = ParagraphStyle(
        "Score",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=GREEN,
        alignment=TA_CENTER,
    )

    bullet_style = ParagraphStyle(
        "Bullet",
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        bulletIndent=0,
        spaceAfter=5,
    )

    # -----------------------------------------------------
    # LOAD GRIDPULSE DATA
    # -----------------------------------------------------

    summary = get_carbon_intelligence_summary(db)
    trend = get_carbon_intelligence_trend(db)
    sustainability = get_sustainability_analysis(db)
    report = get_sustainability_report(db)
    ai = get_ai_carbon_insights(db)

    generated_at = datetime.now().strftime(
        "%d %B %Y, %I:%M %p"
    )

    story = []

    # -----------------------------------------------------
    # COVER / HEADER
    # -----------------------------------------------------

    header_table = Table(
        [
            [
                Paragraph(
                    "<b>GRID</b><br/>"
                    "<font color='#0EA5E9'><b>PULSE</b></font>",
                    ParagraphStyle(
                        "Logo",
                        fontName="Helvetica-Bold",
                        fontSize=18,
                        leading=18,
                        textColor=DARK_BLUE,
                    ),
                ),
                Paragraph(
                    "<b>CARBON INTELLIGENCE</b><br/>"
                    "AI-Powered Sustainability & Emissions Analysis",
                    ParagraphStyle(
                        "HeaderRight",
                        fontName="Helvetica-Bold",
                        fontSize=9,
                        leading=13,
                        textColor=SLATE,
                        alignment=TA_LEFT,
                    ),
                ),
            ]
        ],
        colWidths=[45 * mm, 125 * mm],
    )

    header_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BLUE),
                ("BOX", (0, 0), (-1, -1), 0.8, PALE_BLUE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ]
        )
    )

    story.append(header_table)
    story.append(Spacer(1, 12))

    story.append(
        Paragraph(
            "Carbon & Sustainability Report",
            title_style,
        )
    )

    story.append(
        Paragraph(
            "GridPulse AI-Powered Smart Grid Intelligence Platform",
            subtitle_style,
        )
    )

    story.append(
        Paragraph(
            f"Report generated: {generated_at}",
            small_style,
        )
    )

    story.append(Spacer(1, 15))

    # -----------------------------------------------------
    # EXECUTIVE OVERVIEW
    # -----------------------------------------------------

    story.append(
        Paragraph(
            "Executive Overview",
            section_style,
        )
    )

    overview_text = (
        "This report provides a consolidated view of GridPulse "
        "carbon performance, renewable energy utilization, "
        "energy efficiency and sustainability intelligence. "
        "The analysis combines energy consumption telemetry, "
        "renewable generation data and an explainable AI-based "
        "carbon optimization engine."
    )

    story.append(
        Paragraph(
            overview_text,
            body_style,
        )
    )

    # -----------------------------------------------------
    # KPI CARDS
    # -----------------------------------------------------

    kpi_data = [
        [
            Paragraph(
                _number(summary["total_energy_demand_kwh"]),
                card_value_style,
            ),
            Paragraph(
                _number(summary["total_renewable_generation_kwh"]),
                card_value_style,
            ),
            Paragraph(
                _number(summary["estimated_co2_avoided_kg"]),
                card_value_style,
            ),
            Paragraph(
                _percent(summary["sustainability_score"]),
                card_value_style,
            ),
        ],
        [
            Paragraph("Energy Demand (kWh)", card_label_style),
            Paragraph("Renewable Generation (kWh)", card_label_style),
            Paragraph("CO₂ Avoided (kg)", card_label_style),
            Paragraph("Sustainability Score", card_label_style),
        ],
    ]

    kpi_table = Table(
        kpi_data,
        colWidths=[
            42 * mm,
            42 * mm,
            42 * mm,
            42 * mm,
        ],
    )

    kpi_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), WHITE),
                ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, 0), 10),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
                ("TOPPADDING", (0, 1), (-1, 1), 3),
                ("BOTTOMPADDING", (0, 1), (-1, 1), 10),
            ]
        )
    )

    story.append(kpi_table)
    story.append(Spacer(1, 15))

    # -----------------------------------------------------
    # CARBON PERFORMANCE
    # -----------------------------------------------------

    story.append(
        Paragraph(
            "1. Carbon Performance",
            section_style,
        )
    )

    carbon_data = [
        [
            Paragraph("<b>Metric</b>", body_style),
            Paragraph("<b>Value</b>", body_style),
        ],
        [
            "Baseline CO₂",
            f"{_number(summary['baseline_co2_kg'])} kg",
        ],
        [
            "Estimated Grid CO₂",
            f"{_number(summary['estimated_grid_co2_kg'])} kg",
        ],
        [
            "CO₂ Avoided",
            f"{_number(summary['estimated_co2_avoided_kg'])} kg",
        ],
        [
            "Carbon Reduction",
            _percent(summary["carbon_reduction_percent"]),
        ],
        [
            "Carbon Intensity",
            f"{_number(summary['carbon_intensity_kg_per_kwh'])} kg/kWh",
        ],
    ]

    carbon_table = Table(
        carbon_data,
        colWidths=[100 * mm, 68 * mm],
        repeatRows=1,
    )

    carbon_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), PALE_BLUE),
                ("TEXTCOLOR", (0, 0), (-1, 0), DARK_BLUE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (0, -1), "Helvetica"),
                ("FONTNAME", (1, 1), (1, -1), "Helvetica-Bold"),
                ("TEXTCOLOR", (0, 1), (-1, -1), SLATE),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("BACKGROUND", (0, 1), (-1, -1), WHITE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )

    story.append(carbon_table)
    story.append(Spacer(1, 12))

    story.append(
        Paragraph(
            "Carbon performance is estimated from GridPulse "
            "telemetry using the configured operational carbon "
            "intensity factor.",
            small_style,
        )
    )

    # -----------------------------------------------------
    # RENEWABLE PERFORMANCE
    # -----------------------------------------------------

    story.append(
        Paragraph(
            "2. Renewable Energy Performance",
            section_style,
        )
    )

    renewable_data = [
        [
            Paragraph("<b>Metric</b>", body_style),
            Paragraph("<b>Value</b>", body_style),
        ],
        [
            "Solar Generation",
            f"{_number(summary['total_solar_generation_kwh'])} kWh",
        ],
        [
            "Wind Generation",
            f"{_number(summary['total_wind_generation_kwh'])} kWh",
        ],
        [
            "Total Renewable Generation",
            f"{_number(summary['total_renewable_generation_kwh'])} kWh",
        ],
        [
            "Renewable Contribution",
            _percent(summary["renewable_contribution_percent"]),
        ],
        [
            "Energy Records",
            str(summary["energy_records"]),
        ],
        [
            "Renewable Records",
            str(summary["renewable_records"]),
        ],
    ]

    renewable_table = Table(
        renewable_data,
        colWidths=[100 * mm, 68 * mm],
        repeatRows=1,
    )

    renewable_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GREEN),
                ("TEXTCOLOR", (0, 0), (-1, 0), GREEN),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("FONTNAME", (1, 1), (1, -1), "Helvetica-Bold"),
                ("TEXTCOLOR", (0, 1), (-1, -1), SLATE),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )

    story.append(renewable_table)
    story.append(Spacer(1, 15))

    # -----------------------------------------------------
    # SUSTAINABILITY ASSESSMENT
    # -----------------------------------------------------

    story.append(
        Paragraph(
            "3. Sustainability Assessment",
            section_style,
        )
    )

    score_value = _number(
        sustainability["sustainability_score"],
        2,
    )

    score_table = Table(
        [
            [
                Paragraph(
                    score_value,
                    score_style,
                ),
                Paragraph(
                    f"<b>{_safe(sustainability['sustainability_status'])}</b><br/>"
                    "Current sustainability assessment",
                    body_style,
                ),
            ]
        ],
        colWidths=[50 * mm, 118 * mm],
    )

    score_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), LIGHT_GREEN),
                ("BACKGROUND", (1, 0), (1, 0), LIGHT_GRAY),
                ("BOX", (0, 0), (-1, -1), 0.6, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, BORDER),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )

    story.append(score_table)
    story.append(Spacer(1, 10))

    sustainability_metrics = [
        [
            "Renewable Contribution",
            _percent(
                sustainability[
                    "renewable_contribution_percent"
                ]
            ),
        ],
        [
            "Carbon Reduction",
            _percent(
                sustainability[
                    "carbon_reduction_percent"
                ]
            ),
        ],
        [
            "Energy Efficiency Score",
            _number(
                sustainability[
                    "energy_efficiency_score"
                ]
            ),
        ],
        [
            "CO₂ Avoided",
            f"{_number(sustainability['estimated_co2_avoided_kg'])} kg",
        ],
    ]

    sustainability_table = Table(
        sustainability_metrics,
        colWidths=[100 * mm, 68 * mm],
    )

    sustainability_table.setStyle(
        TableStyle(
            [
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("BACKGROUND", (0, 0), (0, -1), LIGHT_BLUE),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("TEXTCOLOR", (0, 0), (-1, -1), SLATE),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )

    story.append(sustainability_table)
    story.append(Spacer(1, 15))

    # -----------------------------------------------------
    # AI CARBON ADVISOR
    # -----------------------------------------------------

    story.append(
        Paragraph(
            "4. AI Carbon Advisor",
            section_style,
        )
    )

    story.append(
        Paragraph(
            "GridPulse evaluates multiple operational scenarios "
            "and identifies the scenario with the strongest "
            "projected sustainability impact.",
            body_style,
        )
    )

    ai_recommendation = _safe(
        ai.get("recommended_scenario")
    )

    ai_summary = [
        [
            "AI Engine",
            _safe(ai.get("engine")),
        ],
        [
            "Optimization Type",
            _safe(ai.get("optimization_type")),
        ],
        [
            "Recommended Scenario",
            ai_recommendation.replace("_", " ").title(),
        ],
        [
            "Expected CO₂ Saving",
            f"{_number(ai.get('expected_co2_saving_kg'))} kg",
        ],
        [
            "Sustainability Improvement",
            _number(
                ai.get(
                    "sustainability_score_change"
                )
            ),
        ],
        [
            "Model Confidence",
            _safe(ai.get("model_confidence")),
        ],
    ]

    ai_table = Table(
        ai_summary,
        colWidths=[65 * mm, 103 * mm],
    )

    ai_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, -1), PALE_BLUE),
                ("BACKGROUND", (1, 0), (1, -1), WHITE),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("TEXTCOLOR", (0, 0), (-1, -1), SLATE),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )

    story.append(ai_table)
    story.append(Spacer(1, 10))

    story.append(
        Paragraph(
            "<b>AI Reasoning</b>",
            subsection_style,
        )
    )

    for reason in ai.get("reasons", []):
        story.append(
            Paragraph(
                f"• {_safe(reason)}",
                bullet_style,
            )
        )

    # -----------------------------------------------------
    # SCENARIO COMPARISON
    # -----------------------------------------------------

    scenarios = ai.get("all_scenarios", [])

    if scenarios:
        story.append(
            Paragraph(
                "AI Scenario Comparison",
                subsection_style,
            )
        )

        scenario_rows = [
            [
                Paragraph("<b>Scenario</b>", small_style),
                Paragraph("<b>CO₂ Saving</b>", small_style),
                Paragraph("<b>Score Change</b>", small_style),
            ]
        ]

        for scenario in scenarios:
            scenario_name = _safe(
                scenario.get("scenario")
            ).replace("_", " ").title()

            scenario_rows.append(
                [
                    scenario_name,
                    f"{_number(scenario.get('expected_co2_saving_kg'))} kg",
                    _number(
                        scenario.get(
                            "sustainability_score_change"
                        )
                    ),
                ]
            )

        scenario_table = Table(
            scenario_rows,
            colWidths=[85 * mm, 42 * mm, 42 * mm],
            repeatRows=1,
        )

        scenario_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), PALE_BLUE),
                    ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                    ("TEXTCOLOR", (0, 0), (-1, -1), SLATE),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTNAME", (1, 1), (-1, -1), "Helvetica-Bold"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 7),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )

        story.append(scenario_table)
        story.append(Spacer(1, 15))

    # -----------------------------------------------------
    # RECOMMENDATIONS
    # -----------------------------------------------------

    story.append(
        Paragraph(
            "5. Sustainability Recommendations",
            section_style,
        )
    )

    recommendations = sustainability.get(
        "recommendations",
        [],
    )

    for recommendation in recommendations:
        story.append(
            Paragraph(
                f"• {_safe(recommendation)}",
                bullet_style,
            )
        )

    story.append(Spacer(1, 10))

    # -----------------------------------------------------
    # TREND SNAPSHOT
    # -----------------------------------------------------

    if trend:
        story.append(
            Paragraph(
                "6. Carbon Trend Snapshot",
                section_style,
            )
        )

        trend_rows = [
            [
                Paragraph("<b>Date</b>", small_style),
                Paragraph("<b>Demand</b>", small_style),
                Paragraph("<b>Renewable</b>", small_style),
                Paragraph("<b>CO₂ Avoided</b>", small_style),
                Paragraph("<b>Reduction</b>", small_style),
            ]
        ]

        # Keep the PDF compact while still showing the trend.
        selected_trend = trend[-12:]

        for item in selected_trend:
            trend_rows.append(
                [
                    _safe(item.get("date")),
                    f"{_number(item.get('energy_demand_kwh'))} kWh",
                    f"{_number(item.get('renewable_generation_kwh'))} kWh",
                    f"{_number(item.get('co2_avoided_kg'))} kg",
                    _percent(
                        item.get(
                            "carbon_reduction_percent"
                        )
                    ),
                ]
            )

        trend_table = Table(
            trend_rows,
            colWidths=[
                34 * mm,
                34 * mm,
                36 * mm,
                36 * mm,
                30 * mm,
            ],
            repeatRows=1,
        )

        trend_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), LIGHT_BLUE),
                    ("GRID", (0, 0), (-1, -1), 0.4, BORDER),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("TEXTCOLOR", (0, 0), (-1, -1), SLATE),
                    ("FONTSIZE", (0, 0), (-1, -1), 7),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )

        story.append(trend_table)
        story.append(Spacer(1, 15))

    # -----------------------------------------------------
    # METHODOLOGY
    # -----------------------------------------------------

    story.append(
        Paragraph(
            "7. Methodology & Assumptions",
            section_style,
        )
    )

    methodology = [
        "Carbon emissions are estimated using the configurable "
        "GridPulse grid carbon-intensity factor.",
        "Renewable contribution is calculated from solar and "
        "wind generation relative to energy demand.",
        "The AI Carbon Advisor uses explainable multi-scenario "
        "optimization rather than claiming a trained machine "
        "learning model.",
        "AI scenarios evaluate operational changes such as solar "
        "boost, wind boost, renewable boost and battery optimization.",
        "Results are based on the telemetry currently available "
        "in the GridPulse database.",
    ]

    for item in methodology:
        story.append(
            Paragraph(
                f"• {item}",
                bullet_style,
            )
        )

    story.append(Spacer(1, 8))

    story.append(
        Paragraph(
            "<b>Prototype assumption:</b> The current carbon "
            "intensity factor is an operational estimate configured "
            "for the GridPulse prototype and should be replaced "
            "with an authoritative grid-specific factor for "
            "production deployment.",
            small_style,
        )
    )

    story.append(Spacer(1, 18))

    # -----------------------------------------------------
    # FINAL FOOTER MESSAGE
    # -----------------------------------------------------

    final_box = Table(
        [
            [
                Paragraph(
                    "<b>GridPulse Carbon Intelligence</b><br/>"
                    "AI-powered smart grid sustainability monitoring "
                    "and explainable carbon optimization.",
                    body_style,
                )
            ]
        ],
        colWidths=[168 * mm],
    )

    final_box.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BLUE),
                ("BOX", (0, 0), (-1, -1), 0.8, PALE_BLUE),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )

    story.append(final_box)

    # -----------------------------------------------------
    # BUILD PDF
    # -----------------------------------------------------

    doc.build(
        story,
        onFirstPage=_add_page_number,
        onLaterPages=_add_page_number,
    )

    buffer.seek(0)

    return buffer