from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import WasteData
import db_models
from database import get_db

router = APIRouter(prefix="/api/waste-data", tags=["Waste Data"])

@router.get("/", response_model=WasteData)
async def get_waste_data(db: Session = Depends(get_db)):
    waste = db.query(db_models.WasteDataDB).first()
    if not waste:
        # Fallback if DB is completely empty and seed wasn't run
        raise HTTPException(status_code=404, detail="Waste data not found. Did you seed the database?")
        
    zones = db.query(db_models.ZoneStatDB).all()
    
    zone_stats = [
        {"name": z.name, "score": z.score, "trend": z.trend}
        for z in zones
    ]
    
    return WasteData(
        total_collections=waste.total_collections,
        active_trucks=waste.active_trucks,
        reported_dumps=waste.reported_dumps,
        cleared_dumps=waste.cleared_dumps,
        cleanliness_score=waste.cleanliness_score,
        zone_stats=zone_stats
    )
