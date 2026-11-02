import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib

def generate_synthetic_dumpspot_data(num_samples=2000):
    np.random.seed(42)
    
    # Features
    # historical_complaints (count over last 6 months)
    historical_complaints = np.random.poisson(lam=3, size=num_samples)
    
    # is_vacant_land: 0 (No), 1 (Yes)
    is_vacant_land = np.random.choice([0, 1], p=[0.7, 0.3], size=num_samples)
    
    # waste_density (estimated kg per sq meter in the surrounding area)
    waste_density = np.random.uniform(0.1, 5.0, size=num_samples)
    
    # distance_to_main_road (meters) - Accessibility feature
    # Harder to reach spots (further from road) are more likely to be dumping grounds
    distance_to_main_road = np.random.exponential(scale=200, size=num_samples)
    
    # Target: risk_score (0-100)
    # Define a logical relationship where these factors increase risk
    
    # Base risk is low
    base_risk = 10
    
    # More historical complaints heavily increases risk
    complaint_factor = historical_complaints * 5
    
    # Vacant land is a prime spot for dumping
    vacant_factor = is_vacant_land * 25
    
    # Higher general waste density correlates with higher risk
    density_factor = waste_density * 4
    
    # Further from main road = less visibility = higher risk of illegal dumping
    accessibility_factor = (distance_to_main_road / 100) * 5
    
    risk_score = base_risk + complaint_factor + vacant_factor + density_factor + accessibility_factor
    
    # Add some noise
    risk_score += np.random.normal(0, 8, num_samples)
    
    # Clip between 0 and 100
    risk_score = np.clip(risk_score, 0, 100)
    
    df = pd.DataFrame({
        'historical_complaints': historical_complaints,
        'is_vacant_land': is_vacant_land,
        'waste_density': waste_density,
        'distance_to_main_road': distance_to_main_road,
        'risk_score': risk_score
    })
    
    return df

def train_and_save():
    print("Generating synthetic DumpSpot risk dataset...")
    df = generate_synthetic_dumpspot_data(5000)
    
    data_path = os.path.join(os.path.dirname(__file__), 'dumpspot_risk_data.csv')
    df.to_csv(data_path, index=False)
    print(f"Dataset saved to {data_path}")
    
    X = df[['historical_complaints', 'is_vacant_land', 'waste_density', 'distance_to_main_road']]
    y = df['risk_score']
    
    print("Training RandomForestRegressor for Risk Scoring...")
    model = RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42)
    model.fit(X, y)
    
    score = model.score(X, y)
    print(f"Model trained with R^2 score: {score:.4f}")
    
    model_path = os.path.join(os.path.dirname(__file__), 'dumpspot_risk_model.joblib')
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_and_save()
