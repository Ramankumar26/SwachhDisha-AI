from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models import Complaint, Location
import db_models
from database import get_db

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])

def format_complaint(db_c: db_models.ComplaintDB) -> Complaint:
    return Complaint(
        id=db_c.id,
        location=Location(lat=db_c.lat, lng=db_c.lng),
        status=db_c.status,
        severity=db_c.severity,
        reported_at=db_c.reported_at,
        address=db_c.address
    )

@router.get("/", response_model=List[Complaint])
async def get_complaints(db: Session = Depends(get_db)):
    complaints = db.query(db_models.ComplaintDB).all()
    return [format_complaint(c) for c in complaints]

@router.post("/", response_model=Complaint)
async def create_complaint(complaint: Complaint, db: Session = Depends(get_db)):
    db_comp = db_models.ComplaintDB(
        id=complaint.id,
        lat=complaint.location.lat,
        lng=complaint.location.lng,
        status=complaint.status,
        severity=complaint.severity,
        reported_at=complaint.reported_at,
        address=complaint.address
    )
    db.add(db_comp)
    db.commit()
    db.refresh(db_comp)
    return format_complaint(db_comp)

@router.get("/{complaint_id}", response_model=Complaint)
async def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    c = db.query(db_models.ComplaintDB).filter(db_models.ComplaintDB.id == complaint_id).first()
    if c:
        return format_complaint(c)
    raise HTTPException(status_code=404, detail="Complaint not found")
