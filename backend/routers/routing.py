import math
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
import pandas as pd
from typing import List

from database import get_db
import db_models
from models import RoutingResponse, VehicleRoute, RouteStep
from routers.predict import fill_model as ml_model, load_models as load_model

router = APIRouter(prefix="/api/routing", tags=["Routing"])

DEPOT_LOC = (28.6139, 77.2090) # New Delhi center

def calculate_distance(loc1, loc2):
    # Rough approximation of Euclidean distance in meters for routing
    # 1 degree lat/lng is roughly 111km
    dx = (loc1[1] - loc2[1]) * 111000 * math.cos(math.radians(loc1[0]))
    dy = (loc1[0] - loc2[0]) * 111000
    return int(math.sqrt(dx*dx + dy*dy))

@router.get("/optimize-routes", response_model=RoutingResponse)
async def optimize_routes(seed: int = 42, db: Session = Depends(get_db)):
    # 1. Fetch active vehicles
    vehicles = db.query(db_models.VehicleDB).filter(db_models.VehicleDB.status == 'active').all()
    if not vehicles:
        raise HTTPException(status_code=400, detail="No active vehicles found.")
    
    # 2. Fetch all bins
    bins = db.query(db_models.BinDB).all()
    if not bins:
        raise HTTPException(status_code=400, detail="No bins found.")

    # 3. Predict waste for each bin
    global ml_model
    if ml_model is None:
        load_model()

    
    locations = [DEPOT_LOC]
    bin_ids = ["DEPOT"]
    demands = [0] # Depot has 0 demand
    
    def apply_ward_spread(db_bin: db_models.BinDB, seed: int = 42):
        import random
        num = int(''.join(filter(str.isdigit, db_bin.id)) or 0)
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

    for b in bins:
        b = apply_ward_spread(b, seed)
        locations.append((b.lat, b.lng))
        bin_ids.append(b.id)
        
        # Predict fill level
        if ml_model is not None:
            input_df = pd.DataFrame([{
                'hour_of_day': 12, # Assume midday for now
                'day_of_week': 2, # Assume Wednesday
                'zone_type': 1, # Commercial
                'population_density': 0.7
            }])
            predicted_fill = ml_model.predict(input_df)[0]
            # Convert percentage fill to a generic unit (e.g. 100% = 100 units)
            demands.append(int(predicted_fill))
        else:
            # Fallback to current fill level
            demands.append(b.fill_level)
            
    # 4. Prepare data for OR-Tools
    num_vehicles = len(vehicles)
    vehicle_capacities = [2000] * num_vehicles 
    
    distance_matrix = []
    for from_node in locations:
        row = []
        for to_node in locations:
            row.append(calculate_distance(from_node, to_node))
        distance_matrix.append(row)

    # Calculate time windows (deadlines in seconds)
    deadlines = [100000000] # Depot has no deadline
    
    def get_demand_rate(bin_id, fill_level):
        if 50 < fill_level < 85:
            return (100 - fill_level) / 10.0
        else:
            num = int(''.join(filter(str.isdigit, bin_id)) or 0)
            return 1 + ((num % 10) * 0.2)

    for i in range(1, len(bins) + 1):
        b = bins[i-1]
        if b.fill_level >= 100:
            deadlines.append(100000000) # Already full, ignore deadline constraint or let it be 0? The user said "each non-full bin"
        else:
            dr = get_demand_rate(b.id, b.fill_level)
            hrs = (100 - b.fill_level) / dr
            deadlines.append(int(hrs * 3600))
            
    time_matrix = []
    for r in distance_matrix:
        time_matrix.append([int(d / 5.0) for d in r]) # 18 km/h = 5 m/s

    data = {}
    data['distance_matrix'] = distance_matrix
    data['time_matrix'] = time_matrix
    data['deadlines'] = deadlines
    data['demands'] = demands
    data['vehicle_capacities'] = vehicle_capacities
    data['num_vehicles'] = num_vehicles
    data['depot'] = 0
    
    # 5. Create Routing Index Manager and Model
    manager = pywrapcp.RoutingIndexManager(len(data['distance_matrix']),
                                           data['num_vehicles'], data['depot'])
    routing = pywrapcp.RoutingModel(manager)

    def distance_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data['distance_matrix'][from_node][to_node]
        
    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    
    def demand_callback(from_index):
        from_node = manager.IndexToNode(from_index)
        return data['demands'][from_node]
        
    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,  # null capacity slack
        data['vehicle_capacities'],  # vehicle maximum capacities
        True,  # start cumul to zero
        'Capacity')

    def time_callback(from_index, to_index):
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return data['time_matrix'][from_node][to_node]

    time_callback_index = routing.RegisterTransitCallback(time_callback)
    routing.AddDimension(
        time_callback_index,
        0,  # allow waiting time
        100000000,  # maximum time per vehicle
        True,  # start cumul to zero
        'Time')
        
    time_dimension = routing.GetDimensionOrDie('Time')
    # Add penalty for missing deadlines (soft upper bound)
    for node_idx in range(1, len(data['deadlines'])):
        index = manager.NodeToIndex(node_idx)
        # penalty of 1000 cost units per second late
        time_dimension.SetCumulVarSoftUpperBound(index, data['deadlines'][node_idx], 1000)

    # 6. Solve
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
    search_parameters.local_search_metaheuristic = (routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH)
    search_parameters.time_limit.FromSeconds(5)
    
    solution = routing.SolveWithParameters(search_parameters)
    
    if not solution:
        raise HTTPException(status_code=500, detail="No routing solution found.")
        
    # 7. Format Output
    routes = []
    total_dist = 0
    
    for vehicle_id_idx in range(data['num_vehicles']):
        index = routing.Start(vehicle_id_idx)
        route_steps = []
        route_load = 0
        
        while not routing.IsEnd(index):
            node_index = manager.IndexToNode(index)
            if node_index != 0: # Skip depot in the steps list
                route_load += data['demands'][node_index]
                route_steps.append(RouteStep(
                    bin_id=bin_ids[node_index],
                    lat=locations[node_index][0],
                    lng=locations[node_index][1],
                    predicted_waste=data['demands'][node_index]
                ))
            previous_index = index
            index = solution.Value(routing.NextVar(index))
            total_dist += routing.GetArcCostForVehicle(previous_index, index, vehicle_id_idx)
            
        routes.append(VehicleRoute(
            vehicle_id=vehicles[vehicle_id_idx].id,
            route=route_steps,
            total_waste=route_load
        ))
        
    return RoutingResponse(routes=routes, total_distance=total_dist)

@router.get("/run-test")
async def run_test():
    import random
    
    def get_dist(p1, p2):
        dx = (p1[1] - p2[1]) * 111000 * math.cos(math.radians(p1[0]))
        dy = (p1[0] - p2[0]) * 111000
        return math.floor(math.sqrt(dx*dx + dy*dy)) / 1000.0

    def opt2(route):
        improved = True
        best_route = list(route)
        def calc_d(rt):
            d = get_dist(DEPOT_LOC, rt[0])
            for i in range(len(rt)-1): d += get_dist(rt[i], rt[i+1])
            d += get_dist(rt[-1], DEPOT_LOC)
            return d
        best_dist = calc_d(best_route)
        while improved:
            improved = False
            for i in range(len(best_route) - 1):
                for k in range(i + 1, len(best_route)):
                    new_route = best_route[:i] + best_route[i:k + 1][::-1] + best_route[k + 1:]
                    new_dist = calc_d(new_route)
                    if new_dist < best_dist - 0.001:
                        best_dist = new_dist
                        best_route = new_route
                        improved = True
        return best_route

    results = []
    
    for seed in range(5):
        random.seed(seed)
        locs = [(28.6 + random.uniform(-0.1, 0.1), 77.2 + random.uniform(-0.1, 0.1)) for _ in range(15)]
        
        # Fixed
        fixed_dist = 0
        fixed_chunks = [locs[0:5], locs[5:10], locs[10:15]]
        for chunk in fixed_chunks:
            d = get_dist(DEPOT_LOC, chunk[0])
            for i in range(len(chunk)-1): d += get_dist(chunk[i], chunk[i+1])
            d += get_dist(chunk[-1], DEPOT_LOC)
            fixed_dist += d
            
        # Greedy
        unassigned = list(locs)
        vehicles = [[], [], []]
        while unassigned:
            best_d = float('inf')
            best_v = -1
            best_b = -1
            for v_idx in range(3):
                curr = vehicles[v_idx][-1] if vehicles[v_idx] else DEPOT_LOC
                for b_idx, b in enumerate(unassigned):
                    d = get_dist(curr, b)
                    if d < best_d:
                        best_d = d
                        best_v = v_idx
                        best_b = b_idx
            vehicles[best_v].append(unassigned.pop(best_b))
            
        greedy_dist = 0
        for chunk in vehicles:
            if not chunk: continue
            d = get_dist(DEPOT_LOC, chunk[0])
            for i in range(len(chunk)-1): d += get_dist(chunk[i], chunk[i+1])
            d += get_dist(chunk[-1], DEPOT_LOC)
            greedy_dist += d
            
        # Greedy + 2opt
        greedy_2opt_dist = 0
        for chunk in vehicles:
            if not chunk: continue
            opt_chunk = opt2(chunk)
            d = get_dist(DEPOT_LOC, opt_chunk[0])
            for i in range(len(opt_chunk)-1): d += get_dist(opt_chunk[i], opt_chunk[i+1])
            d += get_dist(opt_chunk[-1], DEPOT_LOC)
            greedy_2opt_dist += d
            
        # OR-Tools
        all_nodes = [DEPOT_LOC] + locs
        dm = []
        for n1 in all_nodes:
            row = []
            for n2 in all_nodes:
                row.append(int(get_dist(n1, n2)*1000))
            dm.append(row)
            
        manager = pywrapcp.RoutingIndexManager(16, 3, 0)
        routing = pywrapcp.RoutingModel(manager)
        def dist_cb(f, t):
            return dm[manager.IndexToNode(f)][manager.IndexToNode(t)]
        tci = routing.RegisterTransitCallback(dist_cb)
        routing.SetArcCostEvaluatorOfAllVehicles(tci)
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
        search_parameters.local_search_metaheuristic = routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
        search_parameters.time_limit.FromSeconds(2)
        sol = routing.SolveWithParameters(search_parameters)
        
        ortools_dist = 0
        if sol:
            for v in range(3):
                idx = routing.Start(v)
                while not routing.IsEnd(idx):
                    prev = idx
                    idx = sol.Value(routing.NextVar(idx))
                    ortools_dist += routing.GetArcCostForVehicle(prev, idx, v)
        ortools_dist /= 1000.0
        
        results.append({
            "seed": seed,
            "fixed": round(fixed_dist, 2),
            "greedy": round(greedy_dist, 2),
            "greedy_2opt": round(greedy_2opt_dist, 2),
            "ortools": round(ortools_dist, 2),
            "saving_vs_g2opt": round(greedy_2opt_dist - ortools_dist, 2)
        })
        
    return {"results": results}

