from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from models import CleaningRecord
import db_models
from database import get_db

router = APIRouter(prefix="/api/cleaning-records", tags=["Cleaning Records"])

def format_record(db_r: db_models.CleaningRecordDB) -> CleaningRecord:
    return CleaningRecord(
        id=db_r.id,
        zone=db_r.zone,
        date=db_r.date,
        staff_id=db_r.staff_id,
        status=db_r.status
    )

@router.get("/", response_model=List[CleaningRecord])
async def get_cleaning_records(db: Session = Depends(get_db)):
    records = db.query(db_models.CleaningRecordDB).all()
    return [format_record(r) for r in records]
