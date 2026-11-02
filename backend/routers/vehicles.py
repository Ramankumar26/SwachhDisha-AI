from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models import Vehicle, Location
import db_models
from database import get_db

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])

def format_vehicle(db_v: db_models.VehicleDB) -> Vehicle:
    return Vehicle(
        id=db_v.id,
        location=Location(lat=db_v.lat, lng=db_v.lng),
        status=db_v.status,
        driver=db_v.driver,
        capacity=db_v.capacity
    )

@router.get("/", response_model=List[Vehicle])
async def get_vehicles(db: Session = Depends(get_db)):
    vehicles = db.query(db_models.VehicleDB).all()
    return [format_vehicle(v) for v in vehicles]

@router.get("/{vehicle_id}", response_model=Vehicle)
async def get_vehicle(vehicle_id: str, db: Session = Depends(get_db)):
    v = db.query(db_models.VehicleDB).filter(db_models.VehicleDB.id == vehicle_id).first()
    if v:
        return format_vehicle(v)
    raise HTTPException(status_code=404, detail="Vehicle not found")
