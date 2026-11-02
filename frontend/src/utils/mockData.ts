export const mapCenter: [number, number] = [28.6139, 77.2090]; // New Delhi

export const dashboardStats = {
  totalCollections: 12450,
  activeTrucks: 84,
  reportedDumps: 112,
  clearedDumps: 78,
  cleanlinessScore: 82,
};

export const mockTrucks = [
  { id: 'TRK-001', location: [28.6150, 77.2100], status: 'active', driver: 'Ramesh K.', capacity: '80%' },
  { id: 'TRK-002', location: [28.6110, 77.2050], status: 'idle', driver: 'Suresh M.', capacity: '10%' },
  { id: 'TRK-003', location: [28.6200, 77.2150], status: 'active', driver: 'Amit S.', capacity: '45%' },
  { id: 'TRK-004', location: [28.6050, 77.2100], status: 'offline', driver: 'Vikash J.', capacity: '0%' },
  { id: 'TRK-005', location: [28.6300, 77.2200], status: 'active', driver: 'Deepak T.', capacity: '95%' },
];

export const mockDumpSpots = [
  { id: 'DMP-101', location: [28.6120, 77.2080], status: 'pending', severity: 'high', reportedAt: '2 hours ago', address: 'Connaught Place Sec 4' },
  { id: 'DMP-102', location: [28.6180, 77.2120], status: 'cleared', severity: 'medium', reportedAt: '1 day ago', address: 'Barakhamba Road' },
  { id: 'DMP-103', location: [28.6250, 77.2050], status: 'in-progress', severity: 'low', reportedAt: '5 hours ago', address: 'Gole Market Area' },
  { id: 'DMP-104', location: [28.6080, 77.2180], status: 'pending', severity: 'high', reportedAt: '30 mins ago', address: 'India Gate Circle' },
];

export const zoneStats = [
  { name: 'Central Zone', score: 85, trend: '+2%' },
  { name: 'South Zone', score: 78, trend: '-1%' },
  { name: 'West Zone', score: 90, trend: '+5%' },
  { name: 'East Zone', score: 72, trend: '+1%' },
];
