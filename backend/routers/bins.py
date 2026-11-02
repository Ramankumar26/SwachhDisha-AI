from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from models import Bin, Location
import db_models
from database import get_db

router = APIRouter(prefix="/api/bins", tags=["Bins"])

import random

def format_bin(db_bin: db_models.BinDB) -> Bin:
    return Bin(
        id=db_bin.id,
        location=Location(lat=db_bin.lat, lng=db_bin.lng),
        fill_level=db_bin.fill_level,
        status=db_bin.status,
        last_collected=db_bin.last_collected
    )

def apply_ward_spread(db_bin: db_models.BinDB, seed: int = 42):
    num = int(''.join(filter(str.isdigit, db_bin.id)) or 0)
    wards = ['Karol Bagh', 'Dwarka', 'Rohini', 'Saket']
    coords = [
        (28.6519, 77.1888),
        (28.5823, 77.0500),
        (28.7366, 77.1130),
        (28.5246, 77.2066)
    ]
    w_idx = num % 4
    base_lat, base_lng = coords[w_idx]
    
    random.seed(num + seed)
    offset_lat = random.uniform(-50, 50) * 0.0005
    offset_lng = random.uniform(-50, 50) * 0.0005
    
    db_bin.lat = base_lat + offset_lat
    db_bin.lng = base_lng + offset_lng
    return db_bin

@router.get("/", response_model=List[Bin])
async def get_bins(seed: int = 42, db: Session = Depends(get_db)):
    bins = db.query(db_models.BinDB).all()
    for b in bins:
        apply_ward_spread(b, seed)
    return [format_bin(b) for b in bins]

@router.get("/{bin_id}", response_model=Bin)
async def get_bin(bin_id: str, db: Session = Depends(get_db)):
    b = db.query(db_models.BinDB).filter(db_models.BinDB.id == bin_id).first()
    if b:
        return format_bin(b)
    raise HTTPException(status_code=404, detail="Bin not found")
