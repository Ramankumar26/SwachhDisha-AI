export const sharedSeedIncidents = [
  { id: 'INC-001', lat: 28.6315, lng: 77.2167, ward: 'Connaught Place', type: 'Mixed waste', status: 'pending', severity: 'high', reported_at: '2h ago' },
  { id: 'INC-002', lat: 28.6550, lng: 77.1888, ward: 'Karol Bagh', type: 'Construction debris', status: 'in-progress', severity: 'medium', reported_at: '4h ago' },
  { id: 'INC-003', lat: 28.7495, lng: 77.1165, ward: 'Rohini', type: 'Garden waste', status: 'cleared', severity: 'low', reported_at: '1d ago' },
  { id: 'INC-004', lat: 28.5823, lng: 77.0500, ward: 'Dwarka', type: 'Sanitary', status: 'pending', severity: 'high', reported_at: '1h ago' },
  { id: 'INC-005', lat: 28.5244, lng: 77.2066, ward: 'Saket', type: 'Mixed waste', status: 'pending', severity: 'medium', reported_at: '5h ago' },
  { id: 'INC-006', lat: 28.6280, lng: 77.2200, ward: 'Connaught Place', type: 'Construction debris', status: 'pending', severity: 'high', reported_at: '30m ago' },
  { id: 'INC-007', lat: 28.6600, lng: 77.1900, ward: 'Karol Bagh', type: 'Sanitary', status: 'in-progress', severity: 'high', reported_at: '3h ago' },
  { id: 'INC-008', lat: 28.7400, lng: 77.1200, ward: 'Rohini', type: 'Mixed waste', status: 'cleared', severity: 'medium', reported_at: '2d ago' },
  { id: 'INC-009', lat: 28.5900, lng: 77.0600, ward: 'Dwarka', type: 'Garden waste', status: 'pending', severity: 'low', reported_at: '6h ago' },
  { id: 'INC-010', lat: 28.5300, lng: 77.2100, ward: 'Saket', type: 'Construction debris', status: 'in-progress', severity: 'medium', reported_at: '8h ago' },
  { id: 'INC-011', lat: 28.6350, lng: 77.2150, ward: 'Connaught Place', type: 'Mixed waste', status: 'pending', severity: 'high', reported_at: '15m ago' },
  { id: 'INC-012', lat: 28.5850, lng: 77.0450, ward: 'Dwarka', type: 'Sanitary', status: 'cleared', severity: 'high', reported_at: '1d ago' },
];

export const sharedSeedHotspots = [
  { id: 'HS-1', lat: 28.6330, lng: 77.2180, ward: 'Connaught Place', risk_score: 94, category: 'Critical', peak_time: '20:00', status: 'pending', reason: 'High density of mixed waste complaints near commercial center.', types: ['Mixed waste', 'Sanitary'], factors: [ {name: 'Repeat incidents in 30d', val: 85}, {name: 'Nearby bin overflow', val: 70}, {name: 'Time since cleaning', val: 40} ] },
  { id: 'HS-2', lat: 28.6580, lng: 77.1850, ward: 'Karol Bagh', risk_score: 88, category: 'High', peak_time: '18:30', status: 'in-progress', reason: 'Large unmonitored construction site dumping debris.', types: ['Construction debris'], factors: [ {name: 'Construction proximity', val: 90}, {name: 'Repeat incidents in 30d', val: 65}, {name: 'Time since cleaning', val: 50} ] },
  { id: 'HS-3', lat: 28.5800, lng: 77.0550, ward: 'Dwarka', risk_score: 82, category: 'High', peak_time: '21:00', status: 'pending', reason: 'Vacant land historically used for garden/mixed dumping.', types: ['Garden waste', 'Mixed waste'], factors: [ {name: 'Vacant land', val: 80}, {name: 'Repeat incidents in 30d', val: 60}, {name: 'Time since cleaning', val: 55} ] },
  { id: 'HS-4', lat: 28.5280, lng: 77.2020, ward: 'Saket', risk_score: 75, category: 'Medium', peak_time: '19:00', status: 'pending', reason: 'Overflowing commercial bins spilling onto street.', types: ['Mixed waste'], factors: [ {name: 'Nearby bin overflow', val: 75}, {name: 'Repeat incidents in 30d', val: 45}, {name: 'Commercial density', val: 30} ] },
  { id: 'HS-5', lat: 28.7450, lng: 77.1100, ward: 'Rohini', risk_score: 68, category: 'Medium', peak_time: '17:00', status: 'cleared', reason: 'Residential dead-end accumulating mixed waste.', types: ['Sanitary', 'Mixed waste'], factors: [ {name: 'Time since cleaning', val: 70}, {name: 'Vacant land', val: 50}, {name: 'Repeat incidents in 30d', val: 20} ] },
];
