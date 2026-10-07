from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.emergency_response_service import (
    get_emergency_response,
)

router = APIRouter(
    prefix="/api/v1/emergency-response",
    tags=["Emergency Response"],
)


@router.get("")
def emergency_response(
    db: Session = Depends(get_db),
):
    try:
        return get_emergency_response(db)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Emergency response failed: {str(exc)}",
        )