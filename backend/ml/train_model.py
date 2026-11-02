import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib

def generate_synthetic_data(num_samples=1000):
    np.random.seed(42)
    
    # Features
    # hour_of_day: 0 to 23
    hour_of_day = np.random.randint(0, 24, num_samples)
    
    # day_of_week: 0 (Monday) to 6 (Sunday)
    day_of_week = np.random.randint(0, 7, num_samples)
    
    # zone_type: 0 (Residential), 1 (Commercial), 2 (Industrial)
    zone_type = np.random.randint(0, 3, num_samples)
    
    # population_density: normalized 0 to 1
    population_density = np.random.rand(num_samples)
    
    # Target: fill_level (percentage 0-100)
    # Let's create a realistic but noisy relationship
    # Base fill level increases over the day, peaks in evening
    base_fill = (hour_of_day / 23.0) * 50
    
    # Weekends (5,6) have slightly higher fill in residential, lower in commercial
    weekend_effect = np.where((day_of_week >= 5) & (zone_type == 0), 20, 
                     np.where((day_of_week >= 5) & (zone_type == 1), -10, 0))
                     
    # Population density increases fill
    density_effect = population_density * 30
    
    fill_level = base_fill + weekend_effect + density_effect + np.random.normal(0, 5, num_samples)
    
    # Clip between 0 and 100
    fill_level = np.clip(fill_level, 0, 100)
    
    df = pd.DataFrame({
        'hour_of_day': hour_of_day,
        'day_of_week': day_of_week,
        'zone_type': zone_type,
        'population_density': population_density,
        'fill_level': fill_level
    })
    
    return df

def train_and_save():
    print("Generating synthetic historical waste dataset...")
    df = generate_synthetic_data(5000)
    
    # Save the dataset just for reference
    data_path = os.path.join(os.path.dirname(__file__), 'historical_waste_data.csv')
    df.to_csv(data_path, index=False)
    print(f"Dataset saved to {data_path}")
    
    X = df[['hour_of_day', 'day_of_week', 'zone_type', 'population_density']]
    y = df['fill_level']
    
    print("Training RandomForestRegressor...")
    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(X, y)
    
    score = model.score(X, y)
    print(f"Model trained with R^2 score: {score:.4f}")
    
    model_path = os.path.join(os.path.dirname(__file__), 'waste_fill_model.joblib')
    joblib.dump(model, model_path)
    print(f"Model saved to {model_path}")

if __name__ == "__main__":
    train_and_save()
