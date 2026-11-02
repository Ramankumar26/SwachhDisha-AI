from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import db_models
from data import bins, vehicles, complaints, cleaning_records, waste_data

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if we already have bins
    if db.query(db_models.BinDB).first():
        db.close()
        return # Database is already seeded
    
    # Insert Bins
    for b in bins:
        db_bin = db_models.BinDB(
            id=b.id, lat=b.location.lat, lng=b.location.lng,
            fill_level=b.fill_level, status=b.status, last_collected=b.last_collected,
            ward=b.ward, stream_type=b.stream_type, capacity=b.capacity
        )
        db.add(db_bin)

    # Insert Vehicles
    for v in vehicles:
        db_veh = db_models.VehicleDB(
            id=v.id, lat=v.location.lat, lng=v.location.lng,
            status=v.status, driver=v.driver, capacity=v.capacity
        )
        db.add(db_veh)
        
    # Insert Complaints
    for c in complaints:
        db_comp = db_models.ComplaintDB(
            id=c.id, lat=c.location.lat, lng=c.location.lng,
            status=c.status, severity=c.severity, reported_at=c.reported_at, address=c.address
        )
        db.add(db_comp)
        
    # Insert Cleaning Records
    for r in cleaning_records:
        db_rec = db_models.CleaningRecordDB(
            id=r.id, zone=r.zone, date=r.date, staff_id=r.staff_id, status=r.status
        )
        db.add(db_rec)
        
    # Insert Waste Data Stats
    db_waste = db_models.WasteDataDB(
        id=1,
        total_collections=waste_data.total_collections,
        active_trucks=waste_data.active_trucks,
        reported_dumps=waste_data.reported_dumps,
        cleared_dumps=waste_data.cleared_dumps,
        cleanliness_score=waste_data.cleanliness_score
    )
    db.add(db_waste)
    
    # Insert Zone Stats
    for zs in waste_data.zone_stats:
        db_zone = db_models.ZoneStatDB(name=zs["name"], score=zs["score"], trend=zs["trend"])
        db.add(db_zone)

    db.commit()
    db.close()
    print("Database seeded successfully!")

if __name__ == "__main__":
    seed_db()
