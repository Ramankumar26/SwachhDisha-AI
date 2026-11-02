from pydantic import BaseModel
from typing import List, Optional

class Location(BaseModel):
    lat: float
    lng: float

class Bin(BaseModel):
    id: str
    location: Location
    fill_level: int # percentage 0-100
    status: str # normal, full, overflow
    last_collected: str
    ward: str = "Central"
    stream_type: str = "Mixed"
    capacity: str = "Standard"

class Vehicle(BaseModel):
    id: str
    location: Location
    status: str # active, idle, offline
    driver: str
    capacity: str # e.g. "80%"

class Complaint(BaseModel):
    id: str
    location: Location
    status: str # pending, in-progress, cleared
    severity: str # low, medium, high
    reported_at: str
    address: str

class CleaningRecord(BaseModel):
    id: str
    zone: str
    date: str
    staff_id: str
    status: str # completed, scheduled, missed

class WasteData(BaseModel):
    total_collections: int
    active_trucks: int
    reported_dumps: int
    cleared_dumps: int
    cleanliness_score: int
    zone_stats: List[dict]

class PredictionRequest(BaseModel):
    hour_of_day: int
    day_of_week: int
    zone_type: int
    population_density: float

class PredictionResponse(BaseModel):
    predicted_fill_level: float

class RouteStep(BaseModel):
    bin_id: str
    lat: float
    lng: float
    predicted_waste: int

class VehicleRoute(BaseModel):
    vehicle_id: str
    route: List[RouteStep]
    total_waste: int

class RoutingResponse(BaseModel):
    routes: List[VehicleRoute]
    total_distance: float

class RiskScoreRequest(BaseModel):
    historical_complaints: int
    is_vacant_land: int
    waste_density: float
    distance_to_main_road: float

class RiskScoreResponse(BaseModel):
    risk_score: float
    risk_category: str
