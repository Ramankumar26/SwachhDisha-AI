from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
import datetime

class BinDB(Base):
    __tablename__ = "bins"
    
    id = Column(String, primary_key=True, index=True)
    lat = Column(Float)
    lng = Column(Float)
    fill_level = Column(Integer)
    status = Column(String)
    last_collected = Column(String)
    ward = Column(String, default="Central")
    stream_type = Column(String, default="Mixed")
    capacity = Column(String, default="Standard")

class VehicleDB(Base):
    __tablename__ = "vehicles"
    
    id = Column(String, primary_key=True, index=True)
    lat = Column(Float)
    lng = Column(Float)
    status = Column(String)
    driver = Column(String)
    capacity = Column(String)

class ComplaintDB(Base):
    __tablename__ = "complaints"
    
    id = Column(String, primary_key=True, index=True)
    lat = Column(Float)
    lng = Column(Float)
    status = Column(String)
    severity = Column(String)
    reported_at = Column(String)
    address = Column(String)

class CleaningRecordDB(Base):
    __tablename__ = "cleaning_records"
    
    id = Column(String, primary_key=True, index=True)
    zone = Column(String)
    date = Column(String)
    staff_id = Column(String)
    status = Column(String)

# Since WasteData is more of a dashboard aggregate, we can store it as a single row in a settings/stats table,
# or calculate it dynamically. For this prototype, we'll store it as a single row.
class WasteDataDB(Base):
    __tablename__ = "waste_data"
    
    id = Column(Integer, primary_key=True, index=True, default=1)
    total_collections = Column(Integer)
    active_trucks = Column(Integer)
    reported_dumps = Column(Integer)
    cleared_dumps = Column(Integer)
    cleanliness_score = Column(Integer)
    
class ZoneStatDB(Base):
    __tablename__ = "zone_stats"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String)
    score = Column(Integer)
    trend = Column(String)
