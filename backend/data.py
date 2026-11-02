from models import Bin, Vehicle, Complaint, CleaningRecord, WasteData, Location

import random

# Central Depot Location
DEPOT_LAT, DEPOT_LNG = 28.6139, 77.2090

bins = [
    # South Ward (5 bins)
    Bin(id="BIN-S01", location=Location(lat=28.5355, lng=77.2110), fill_level=20, status="normal", last_collected="2 hours ago", ward="South", stream_type="Wet", capacity="Large"),
    Bin(id="BIN-S02", location=Location(lat=28.5385, lng=77.2150), fill_level=80, status="normal", last_collected="1 day ago", ward="South", stream_type="Dry", capacity="Standard"),
    Bin(id="BIN-S03", location=Location(lat=28.5420, lng=77.2050), fill_level=95, status="full", last_collected="3 days ago", ward="South", stream_type="Mixed", capacity="Large"),
    Bin(id="BIN-S04", location=Location(lat=28.5450, lng=77.2180), fill_level=40, status="normal", last_collected="6 hours ago", ward="South", stream_type="Wet", capacity="Standard"),
    Bin(id="BIN-S05", location=Location(lat=28.5300, lng=77.2020), fill_level=100, status="overflow", last_collected="4 days ago", ward="South", stream_type="Sanitary", capacity="Small"),

    # Central Ward (4 bins)
    Bin(id="BIN-C01", location=Location(lat=28.6100, lng=77.2000), fill_level=10, status="normal", last_collected="1 hour ago", ward="Central", stream_type="Wet", capacity="Standard"),
    Bin(id="BIN-C02", location=Location(lat=28.6150, lng=77.2100), fill_level=88, status="full", last_collected="2 days ago", ward="Central", stream_type="Mixed", capacity="Large"),
    Bin(id="BIN-C03", location=Location(lat=28.6180, lng=77.1950), fill_level=65, status="normal", last_collected="12 hours ago", ward="Central", stream_type="Dry", capacity="Standard"),
    Bin(id="BIN-C04", location=Location(lat=28.6250, lng=77.2150), fill_level=15, status="normal", last_collected="3 hours ago", ward="Central", stream_type="Sanitary", capacity="Small"),

    # North Ward (4 bins)
    Bin(id="BIN-N01", location=Location(lat=28.7000, lng=77.2000), fill_level=75, status="normal", last_collected="18 hours ago", ward="North", stream_type="Dry", capacity="Standard"),
    Bin(id="BIN-N02", location=Location(lat=28.7050, lng=77.2100), fill_level=100, status="overflow", last_collected="5 days ago", ward="North", stream_type="Mixed", capacity="Large"),
    Bin(id="BIN-N03", location=Location(lat=28.7100, lng=77.1950), fill_level=30, status="normal", last_collected="8 hours ago", ward="North", stream_type="Wet", capacity="Standard"),
    Bin(id="BIN-N04", location=Location(lat=28.6950, lng=77.2150), fill_level=55, status="normal", last_collected="10 hours ago", ward="North", stream_type="Sanitary", capacity="Small"),

    # East Ward (4 bins)
    Bin(id="BIN-E01", location=Location(lat=28.6300, lng=77.3000), fill_level=85, status="full", last_collected="2 days ago", ward="East", stream_type="Mixed", capacity="Standard"),
    Bin(id="BIN-E02", location=Location(lat=28.6350, lng=77.2900), fill_level=20, status="normal", last_collected="4 hours ago", ward="East", stream_type="Wet", capacity="Large"),
    Bin(id="BIN-E03", location=Location(lat=28.6400, lng=77.3100), fill_level=90, status="full", last_collected="3 days ago", ward="East", stream_type="Dry", capacity="Large"),
    Bin(id="BIN-E04", location=Location(lat=28.6250, lng=77.3200), fill_level=60, status="normal", last_collected="1 day ago", ward="East", stream_type="Sanitary", capacity="Small"),
]

vehicles = [
    Vehicle(id="TRK-001", location=Location(lat=DEPOT_LAT, lng=DEPOT_LNG), status="active", driver="Ramesh K.", capacity="1500kg"),
    Vehicle(id="TRK-002", location=Location(lat=DEPOT_LAT, lng=DEPOT_LNG), status="active", driver="Suresh M.", capacity="1500kg"),
    Vehicle(id="TRK-003", location=Location(lat=DEPOT_LAT, lng=DEPOT_LNG), status="active", driver="Amit S.", capacity="2000kg"),
]

complaints = [
    Complaint(id="DMP-101", location=Location(lat=28.6120, lng=77.2080), status="pending", severity="high", reported_at="2 hours ago", address="Connaught Place Sec 4"),
    Complaint(id="DMP-102", location=Location(lat=28.6180, lng=77.2120), status="cleared", severity="medium", reported_at="1 day ago", address="Barakhamba Road"),
    Complaint(id="DMP-103", location=Location(lat=28.6250, lng=77.2050), status="in-progress", severity="low", reported_at="5 hours ago", address="Gole Market Area"),
    Complaint(id="DMP-104", location=Location(lat=28.6080, lng=77.2180), status="pending", severity="high", reported_at="30 mins ago", address="India Gate Circle"),
]

cleaning_records = [
    CleaningRecord(id="REC-001", zone="Central Zone", date="2024-05-18", staff_id="STF-102", status="completed"),
    CleaningRecord(id="REC-002", zone="South Zone", date="2024-05-18", staff_id="STF-105", status="completed"),
    CleaningRecord(id="REC-003", zone="West Zone", date="2024-05-19", staff_id="STF-108", status="scheduled"),
]

waste_data = WasteData(
    total_collections=12450,
    active_trucks=84,
    reported_dumps=112,
    cleared_dumps=78,
    cleanliness_score=82,
    zone_stats=[
        {"name": "Central Zone", "score": 85, "trend": "+2%"},
        {"name": "South Zone", "score": 78, "trend": "-1%"},
        {"name": "West Zone", "score": 90, "trend": "+5%"},
        {"name": "East Zone", "score": 72, "trend": "+1%"},
    ]
)
