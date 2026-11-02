import os
from fastapi import APIRouter, HTTPException
import joblib
import pandas as pd
from models import PredictionRequest, PredictionResponse, RiskScoreRequest, RiskScoreResponse

router = APIRouter(prefix="/api/predict", tags=["Prediction"])

fill_model = None
risk_model = None

fill_model_path = os.path.join(os.path.dirname(__file__), '..', 'ml', 'waste_fill_model.joblib')
risk_model_path = os.path.join(os.path.dirname(__file__), '..', 'ml', 'dumpspot_risk_model.joblib')

def load_models():
    global fill_model, risk_model
    if fill_model is None:
        if os.path.exists(fill_model_path):
            fill_model = joblib.load(fill_model_path)
        else:
            print(f"Warning: Fill Model not found at {fill_model_path}.")
            
    if risk_model is None:
        if os.path.exists(risk_model_path):
            risk_model = joblib.load(risk_model_path)
        else:
            print(f"Warning: Risk Model not found at {risk_model_path}.")

@router.on_event("startup")
async def startup_event():
    load_models()

@router.post("/fill-level", response_model=PredictionResponse)
async def predict_fill_level(req: PredictionRequest):
    global fill_model
    if fill_model is None:
        load_models()
    
    if fill_model is None:
        raise HTTPException(status_code=503, detail="Fill Prediction model is not loaded or trained yet.")
    
    input_data = pd.DataFrame([{
        'hour_of_day': req.hour_of_day,
        'day_of_week': req.day_of_week,
        'zone_type': req.zone_type,
        'population_density': req.population_density
    }])
    
    predicted_value = fill_model.predict(input_data)[0]
    return PredictionResponse(predicted_fill_level=round(predicted_value, 2))

@router.post("/dumpspot-risk", response_model=RiskScoreResponse)
async def predict_dumpspot_risk(req: RiskScoreRequest):
    global risk_model
    if risk_model is None:
        load_models()
        
    if risk_model is None:
        raise HTTPException(status_code=503, detail="Risk Scoring model is not loaded or trained yet.")
        
    input_data = pd.DataFrame([{
        'historical_complaints': req.historical_complaints,
        'is_vacant_land': req.is_vacant_land,
        'waste_density': req.waste_density,
        'distance_to_main_road': req.distance_to_main_road
    }])
    
    risk_score = risk_model.predict(input_data)[0]
    
    # Categorize the risk
    if risk_score > 75:
        category = "High"
    elif risk_score > 40:
        category = "Medium"
    else:
        category = "Low"
        
    return RiskScoreResponse(
        risk_score=round(risk_score, 2),
        risk_category=category
    )

