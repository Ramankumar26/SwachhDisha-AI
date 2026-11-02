from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from routers import bins, vehicles, complaints, cleaning, waste, predict, routing
from database import engine, Base
from seed import seed_db

app = FastAPI(
    title="SwachhDisha AI Backend",
    description="API for SwachhDisha AI command center frontend (PostgreSQL & ML)",
    version="1.0.0"
)

# Initialize database schema and run seed if empty
@app.on_event("startup")
def on_startup():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Seeding database...")
    seed_db()

# Configure CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(bins.router)
app.include_router(vehicles.router)
app.include_router(complaints.router)
app.include_router(cleaning.router)
app.include_router(waste.router)
app.include_router(predict.router)
app.include_router(routing.router)

@app.get("/")
async def root():
    return {"message": "Welcome to SwachhDisha AI API. Go to /docs for the Swagger UI."}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
