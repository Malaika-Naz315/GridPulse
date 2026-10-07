from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.reports import ExecutiveReportResponse
from app.services.report_service import get_executive_report
from app.services.executive_report_pdf_service import (
    generate_executive_report_pdf,
)


router = APIRouter(
    prefix="/api/v1/reports",
    tags=["Reports"],
)


@router.get(
    "/executive",
    response_model=ExecutiveReportResponse,
)
def executive_report(
    db: Session = Depends(get_db),
):
    return get_executive_report(db)


@router.get("/executive/pdf")
def download_executive_report_pdf(
    db: Session = Depends(get_db),
):
    pdf_bytes = generate_executive_report_pdf(db)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                "attachment; "
                "filename=GridPulse_Executive_Intelligence_Report.pdf"
            )
        },
    )

