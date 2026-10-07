from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
from app.database import get_db

from app.schemas.carbon_intelligence import (
    CarbonIntelligenceSummaryResponse,
    CarbonTrendItem,
    SustainabilityAnalysisResponse,
    SustainabilityReportResponse,
)

from app.services.carbon_intelligence_service import (
    get_carbon_intelligence_summary,
    get_carbon_intelligence_trend,
    get_sustainability_analysis,
    get_sustainability_report,
)
from app.schemas.carbon_ai import (
    CarbonAIInsightResponse,
    CarbonScenarioRequest,
)

from app.services.carbon_ai_service import (
    get_ai_carbon_insights,
    run_carbon_scenario,
)
from app.services.carbon_report_service import (
    generate_carbon_intelligence_pdf,
)
router = APIRouter(
    prefix="/api/v1/carbon-intelligence",
    tags=["Carbon Intelligence"],
)


@router.get(
    "/summary",
    response_model=CarbonIntelligenceSummaryResponse,
)
def carbon_intelligence_summary(
    db: Session = Depends(get_db),
):
    return get_carbon_intelligence_summary(db)


@router.get(
    "/trend",
    response_model=list[CarbonTrendItem],
)
def carbon_intelligence_trend(
    db: Session = Depends(get_db),
):
    return get_carbon_intelligence_trend(db)


@router.get(
    "/sustainability",
    response_model=SustainabilityAnalysisResponse,
)
def sustainability_analysis(
    db: Session = Depends(get_db),
):
    return get_sustainability_analysis(db)


@router.get(
    "/report",
    response_model=SustainabilityReportResponse,
)

def sustainability_report(
    db: Session = Depends(get_db),
):
    return get_sustainability_report(db) 
@router.post(
    "/ai/scenario",
)
def carbon_ai_scenario(
    payload: CarbonScenarioRequest,
    db: Session = Depends(get_db),
):
    return run_carbon_scenario(
        db,
        payload.scenario,
    )


@router.get(
    "/ai/insights",
    response_model=CarbonAIInsightResponse,
)
def carbon_ai_insights(
    db: Session = Depends(get_db),
):
    return get_ai_carbon_insights(db)
@router.get("/report/pdf")
def carbon_intelligence_pdf(
    db: Session = Depends(get_db),
):
    pdf_buffer = generate_carbon_intelligence_pdf(db)

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                'attachment; filename="GridPulse_Carbon_Intelligence_Report.pdf"'
            )
        },
    )