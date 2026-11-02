import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, Tooltip } from 'react-leaflet';
import { Activity, Trash2, Truck, CheckCircle, Layers, Clock, AlertTriangle, Navigation, ArrowUpRight, Search, Map as MapIcon, X } from 'lucide-react';
import { useCountUp } from '../hooks/usePremiumUI';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTheme } from '../context/ThemeContext';
import { sharedSeedIncidents, sharedSeedHotspots } from '../data/sharedSeedData';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Setup Icons
const createBinIcon = (fill: number, stream: string, isDark: boolean) => {
  const color = fill > 90 ? 'var(--color-critical)' : fill >= 75 ? 'var(--color-medium)' : 'var(--color-normal)';
  const bg = isDark ? '#0f172a' : '#ffffff';
  const border = isDark ? '#fff' : '#cbd5e1';
  const iconHtml = `
    <div style="background-color: ${bg}; width: 34px; height: 34px; border-radius: 50%; border: 2.5px solid ${border}; display: flex; align-items: center; justify-content: center; position: relative; box-shadow: 0 0 10px ${color};">
      <div style="background-color: ${color}; height: ${Math.min(100, fill)}%; width: 100%; position: absolute; bottom: 0; border-radius: 50%; opacity: 0.6;"></div>
      <span style="font-size: 14px; position: relative; z-index: 10;">${stream === 'Wet' ? '💧' : stream === 'Dry' ? '📦' : stream === 'Sanitary' ? '⚕️' : '♻️'}</span>
    </div>
  `;
  return L.divIcon({ html: iconHtml, className: '', iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -17] });
};

const createTruckIcon = (id: string, isDark: boolean) => {
  const dir = (id.length * 45) % 360;
  const border = isDark ? '#fff' : '#cbd5e1'; 
  return L.divIcon({
    html: `<div style="background-color: var(--color-info); width: 40px; height: 40px; border-radius: 50%; border: 3px solid ${border}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px var(--color-info); position: relative;">
      <span style="font-size: 20px;">🚛</span>
      <div style="position: absolute; top: -8px; left: 50%; transform: translateX(-50%) rotate(${dir}deg); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-bottom: 8px solid ${border};"></div>
    </div>`,
    className: '', iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -20]
  });
}

const facilityIcon = (isDark: boolean) => L.divIcon({
  html: `<div style="background-color: #581c87; width: 30px; height: 30px; border-radius: 8px; border: 2px solid ${isDark ? '#fff' : '#cbd5e1'}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px #581c87;">
    <span style="font-size: 16px;">🏭</span>
  </div>`,
  className: '', iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -15]
});

const createClusterIcon = (count: number, isDark: boolean) => L.divIcon({
  html: `<div style="background-color: var(--color-warning); color: #fff; width: 36px; height: 36px; border-radius: 50%; border: 3px solid ${isDark ? '#fff' : '#cbd5e1'}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; box-shadow: 0 0 10px var(--color-warning);">
    ${count}
  </div>`,
  className: '', iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -18]
});

const dumpBadgeIcon = (severity: string, isDark: boolean) => {
  const color = severity === 'Critical' ? 'var(--color-critical)' : severity === 'High' ? 'var(--color-high)' : 'var(--color-warning)';
  return L.divIcon({
    html: `<div style="background-color: ${color}; color: white; width: 18px; height: 18px; border-radius: 50%; border: 2px solid ${isDark ? 'white' : '#cbd5e1'}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; box-shadow: 0 0 8px ${color}; pointer-events: auto;">!</div>`,
    className: '', iconSize: [18, 18], iconAnchor: [9, 9]
  });
};

const mapCenter: [number, number] = [28.6139, 77.2090];
const facilities = [
  { id: 'F1', name: 'Okhla Waste-to-Energy', lat: 28.528, lng: 77.283, capacity: '2000 TPD' },
  { id: 'F2', name: 'Bhalaswa Landfill', lat: 28.740, lng: 77.160, capacity: 'At Capacity' },
  { id: 'F3', name: 'Ghazipur Processing', lat: 28.625, lng: 77.327, capacity: '1500 TPD' },
  { id: 'F4', name: 'Narela-Bawana WTE', lat: 28.815, lng: 77.065, capacity: '3000 TPD' },
  { id: 'F5', name: 'Tehkhand Plant', lat: 28.515, lng: 77.275, capacity: '1200 TPD' }
];

const rawDumpZones = (sharedSeedHotspots || []).map(h => ({
  id: h.id,
  lat: h.lat,
  lng: h.lng,
  radius: h.risk_score * 5,
  label: h.category,
  risk_score: h.risk_score
}));

const MapBoundsFitter = ({ allLocations, layoutKey }: { allLocations: [number, number][], layoutKey: any }) => {
  const map = useMap();
  useEffect(() => {
    if (allLocations.length === 0) return;
    const bounds = L.latLngBounds(allLocations);
    if (!bounds.isValid()) return;
    const handleResize = () => {
      try {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
      } catch(e) {}
    };
    handleResize();
    const t1 = setTimeout(handleResize, 150);
    const t2 = setTimeout(handleResize, 500);
    window.addEventListener('resize', handleResize);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener('resize', handleResize); };
  }, [allLocations, map, layoutKey]);
  return null;
};

const StatCard = ({ title, value, numericValue, unit, icon: Icon, colorClass, tooltip, trend }: any) => {
  const animatedNumber = useCountUp(numericValue || 0, 1500);
  const displayValue = numericValue !== undefined ? Number(animatedNumber).toLocaleString() : value;
  
  const isTrendGood = title.includes('Incidents') ? trend < 0 : trend > 0;
  const trendColor = isTrendGood ? 'text-success' : 'text-danger';

  return (
    <div className={`glass-card rounded-xl p-2.5 flex items-center relative h-16`} title={tooltip}>
      <div className={`p-2 rounded-lg mr-3 bg-surface-2 border border-border shadow-sm ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-center w-full mb-0.5">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest truncate">{title}</p>
          {trend && <span className={`flex items-center text-[9px] font-bold ${trendColor} ml-2 whitespace-nowrap`}><ArrowUpRight className={`w-2.5 h-2.5 ${trend < 0 ? 'rotate-90' : ''}`} /> {Math.abs(trend)}%</span>}
        </div>
        <h3 className="text-xl font-black text-primary flex items-baseline leading-none mt-1">
          {displayValue} 
          {unit && <span className="text-[10px] font-bold text-secondary ml-1 uppercase tracking-widest">{unit}</span>}
        </h3>
      </div>
    </div>
  );
};

export default function NagarMirror() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [wasteData, setWasteData] = useState<any>(null);
  const [bins, setBins] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>((sharedSeedIncidents || []).map(inc => ({
    id: inc.id,
    ward: inc.ward,
    status: inc.status,
    severity: inc.severity,
    reported_at: inc.reported_at,
    location: { lat: inc.lat, lng: inc.lng },
    type: inc.type
  })));
  
  const [mapRef, setMapRef] = useState<L.Map | null>(null);
  const [streamFilter, setStreamFilter] = useState<string>('All');
  const [alertFilter, setAlertFilter] = useState<string>('All');
  const [timeOffset, setTimeOffset] = useState<number>(0);
  
  const [legendOpen, setLegendOpen] = useState(window.innerWidth >= 1600);
  const [layersOpen, setLayersOpen] = useState(false);
  const markerRefs = useRef<{[key: string]: L.Marker}>({});

  useEffect(() => {
    const handleResize = () => setLegendOpen(window.innerWidth >= 1600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [layers, setLayers] = useState({
    bins: true,
    vehicles: true,
    complaints: true,
    overflowRisk: true,
    dumpZones: true,
    facilities: true
  });

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/waste-data/').then(res => res.json()).then(setWasteData).catch(console.error);
    fetch('http://127.0.0.1:8000/api/bins/').then(res => res.json()).then(data => {
      const realWards = ['Karol Bagh', 'Dwarka', 'Rohini', 'Saket'];
      const streamTypes = ['Wet', 'Dry', 'Sanitary', 'Mixed'];
      const enriched = (Array.isArray(data) ? data : []).map((b, i) => {
        const num = parseInt(b.id.replace(/\D/g, '') || '0');
        return {
          ...b,
          ward: realWards[i % 4],
          stream_type: streamTypes[i % 4],
          demandRate: (b.fill_level > 50 && b.fill_level < 85) ? (100 - b.fill_level) / 10 : 1 + ((num % 10) * 0.2)
        };
      });
      setBins(enriched);
    }).catch(console.error);
    fetch('http://127.0.0.1:8000/api/vehicles/').then(res => res.json()).then(data => setVehicles(Array.isArray(data) ? data : [])).catch(console.error);
  }, []);

  const toggleLayer = (layer: keyof typeof layers) => setLayers(prev => ({ ...prev, [layer]: !prev[layer] }));

  const activeComplaints = complaints.filter(c => c.status !== 'cleared');
  const visibleBins = bins.filter(b => streamFilter === 'All' || b.stream_type.toUpperCase() === streamFilter.toUpperCase());
  
  const projectedBins = visibleBins.map(b => {
     const projectedFill = Math.min(100, b.fill_level + (b.demandRate * timeOffset));
     return { ...b, projectedFill };
  });

  const clusteredComplaints = useMemo(() => {
    const clusters: any[] = [];
    activeComplaints.forEach(c => {
      let clustered = false;
      for (const cluster of clusters) {
        const d = Math.sqrt(Math.pow(cluster.lat - c.location.lat, 2) + Math.pow(cluster.lng - c.location.lng, 2));
        if (d < 0.02) {
          cluster.items.push(c);
          clustered = true;
          break;
        }
      }
      if (!clustered) clusters.push({ lat: c.location.lat, lng: c.location.lng, items: [c] });
    });
    return clusters;
  }, [activeComplaints]);

  const dumpZones = useMemo(() => {
    const adjusted = [...rawDumpZones].map(z => ({...z, badgeLat: z.lat, badgeLng: z.lng}));
    const minDistance = 0.005; 
    for (let i = 0; i < adjusted.length; i++) {
       let collided = true;
       let loops = 0;
       while(collided && loops < 50) {
          collided = false;
          for (let j = 0; j < i; j++) {
             const dist = Math.sqrt(Math.pow(adjusted[i].badgeLat - adjusted[j].badgeLat, 2) + Math.pow(adjusted[i].badgeLng - adjusted[j].badgeLng, 2));
             if (dist < minDistance) {
                collided = true;
                adjusted[i].badgeLat += 0.002;
                adjusted[i].badgeLng += 0.002;
             }
          }
          loops++;
       }
    }
    return adjusted;
  }, []);

  const sortedAlerts = useMemo(() => {
    const projectedAlerts = projectedBins
      .filter(b => b.projectedFill >= 100)
      .map((b) => {
         const hoursTo100 = Math.max(0, Math.round((100 - b.fill_level) / b.demandRate));
         const isFull = b.fill_level >= 100 || hoursTo100 === 0;
         return {
           id: b.id,
           ward: b.ward,
           severity: isFull ? 'critical' : hoursTo100 <= 6 ? 'high' : 'medium',
           description: isFull ? `Bin full - dispatch now` : `Overflow predicted. Dispatch highly recommended.`,
           reported_at: isFull ? 'NOW' : `Full in ${hoursTo100}h`,
           location: b.location,
           isForecast: !isFull,
           title: isFull ? 'Bin full' : 'Overflow predicted'
         };
      });

    const limitedProjected = projectedAlerts.sort((a,b) => {
       const p = { 'critical': 3, 'high': 2, 'medium': 1, 'low': 0 };
       return (p[b.severity as keyof typeof p] || 0) - (p[a.severity as keyof typeof p] || 0);
    }).slice(0, 3);

    const activeWithTitle = activeComplaints.map(c => ({...c, title: c.id.startsWith('DMP') ? 'Illegal dumping' : 'Citizen incident'}));
    const allAlerts = [...activeWithTitle, ...limitedProjected];

    return allAlerts
      .filter(a => alertFilter === 'All' || a.severity.toLowerCase() === alertFilter.toLowerCase())
      .sort((a,b) => {
        const p = { 'critical': 3, 'high': 2, 'medium': 1, 'low': 0 };
        return (p[b.severity as keyof typeof p] || 0) - (p[a.severity as keyof typeof p] || 0);
      }).slice(0, 8);
  }, [activeComplaints, projectedBins, alertFilter]);

  const allMapLocations: [number, number][] = useMemo(() => {
    const locs: [number, number][] = [];
    if (layers.bins) projectedBins.forEach(b => locs.push([b.location.lat, b.location.lng]));
    if (layers.vehicles) vehicles.forEach(v => locs.push([v.location.lat, v.location.lng]));
    if (layers.facilities) facilities.forEach(f => locs.push([f.lat, f.lng]));
    if (layers.complaints) activeComplaints.forEach(c => locs.push([c.location.lat, c.location.lng]));
    if (layers.dumpZones) dumpZones.forEach(d => locs.push([d.badgeLat, d.badgeLng]));
    return locs;
  }, [layers, projectedBins, vehicles, facilities, activeComplaints, dumpZones]);

  return (
    <div className="h-full flex flex-col p-4 gap-3 box-border overflow-hidden bg-background transition-colors duration-200">
      
      <div className="flex justify-between items-end flex-shrink-0 animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h2 className="text-3xl font-extrabold text-primary tracking-tight leading-none">NagarMirror</h2>
            <span className="px-2 py-0.5 rounded-full bg-info-bg text-info border border-info/30 text-[10px] font-bold uppercase tracking-widest flex items-center">
              <Activity className="w-3 h-3 mr-1"/> Simulated Data
            </span>
          </div>
          <p className="text-secondary font-medium text-sm">Digital Twin & Municipal Command Dashboard</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-primary bg-surface/60 backdrop-blur-md px-4 py-2 rounded-lg border border-border shadow-sm">
          <Activity className="h-4 w-4 text-success animate-pulse" />
          <span className="font-bold tracking-wide uppercase text-[12px] text-success">Simulated Data Feed</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <StatCard title="Total Collections" numericValue={wasteData?.total_collections ?? 12450} unit="kg" icon={Trash2} colorClass="text-info" trend={4.2} tooltip="Total collections today" />
        <StatCard title="Active Fleet" numericValue={vehicles.filter(v=>v.status==='active').length || 32} icon={Truck} colorClass="text-success" tooltip="Total vehicles currently active on route" />
        <StatCard title="Active Incidents" numericValue={activeComplaints.length} icon={AlertTriangle} colorClass="text-warning" trend={-12.5} tooltip="Total pending and in-progress incidents" />
        <StatCard title="Cleanliness Score" numericValue={wasteData?.cleanliness_score ?? 86} unit="/100" icon={CheckCircle} colorClass="text-accent" trend={1.8} tooltip="Weighted formula: 40% Bin Fill Level, 30% Collection Timeliness, 30% Incident Resolution Time" />
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        
        {/* Main Map Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 relative">
          
          <div className="flex items-center justify-between glass-card p-2 px-3 rounded-xl border border-border flex-shrink-0 bg-surface/40">
            <div className="flex gap-2 items-center">
              <span className="text-[12px] font-bold text-muted uppercase tracking-widest mr-2">Time slider:</span>
              {[0, 6, 12, 24].map(h => (
                <button key={h} onClick={() => setTimeOffset(h)} className={`px-4 py-1 text-[12px] font-bold rounded uppercase tracking-widest transition-all ${timeOffset === h ? 'bg-accent text-accent-contrast shadow-sm' : 'bg-surface-2 text-secondary hover:bg-surface'}`}>
                  {h === 0 ? 'NOW' : `+${h}H`}
                </button>
              ))}
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-[12px] font-bold text-muted uppercase tracking-widest mr-2">Stream:</span>
              {['All', 'Wet', 'Dry', 'Mixed', 'Sanitary'].map(s => (
                <button key={s} onClick={() => setStreamFilter(s)} className={`px-3 py-1 rounded text-[12px] font-bold uppercase tracking-widest border transition-all ${streamFilter.toUpperCase() === s.toUpperCase() ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-surface/60 border-border text-muted hover:bg-surface-2'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 rounded-xl shadow-lg border border-border overflow-hidden relative bg-background flex">
            
            {/* Map Container */}
            <div className="flex-1 relative bg-background overflow-hidden">
              
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-surface-translucent backdrop-blur-md px-4 py-1.5 rounded-full border border-border shadow-md pointer-events-none">
                <span className="text-[12px] font-black text-accent uppercase tracking-widest flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1.5" /> TIME: {timeOffset === 0 ? 'NOW' : `+${timeOffset}H`}
                </span>
              </div>

              {/* Map Layers Overlay */}
              <div className="absolute top-4 right-4 z-[400] flex flex-col items-end pointer-events-none">
                <div className="pointer-events-auto">
                  <button onClick={() => setLayersOpen(!layersOpen)} className={`px-4 py-2 rounded-full border shadow-md flex items-center gap-2 transition-all ${layersOpen ? 'bg-accent text-accent-contrast border-accent' : 'bg-surface-translucent text-primary border-border hover:bg-surface-2 backdrop-blur-md'}`}>
                    <Layers className="w-4 h-4"/> <span className="text-[11px] font-bold uppercase tracking-widest">Map Layers</span>
                  </button>
                </div>

                {layersOpen && (
                  <div className="mt-3 w-64 bg-surface-translucent backdrop-blur-xl rounded-xl border border-border shadow-xl pointer-events-auto animate-fade-in flex flex-col overflow-hidden max-h-[70vh]">
                     <div className="p-4 flex-1 overflow-y-auto space-y-4">
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-2.5">
                            <input type="checkbox" className="accent-accent w-4 h-4" checked={layers.bins} onChange={() => toggleLayer('bins')} />
                            <span className="text-[11px] font-bold text-primary group-hover:text-accent transition-colors">Waste bins</span>
                          </div>
                          <span className="text-[9px] text-secondary font-bold bg-surface-2 px-1.5 py-0.5 rounded">{projectedBins.length}</span>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-2.5">
                            <input type="checkbox" className="accent-accent w-4 h-4" checked={layers.vehicles} onChange={() => toggleLayer('vehicles')} />
                            <span className="text-[11px] font-bold text-primary group-hover:text-accent transition-colors">Active fleet</span>
                          </div>
                          <span className="text-[9px] text-secondary font-bold bg-surface-2 px-1.5 py-0.5 rounded">{vehicles.length}</span>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-2.5">
                            <input type="checkbox" className="accent-accent w-4 h-4" checked={layers.facilities} onChange={() => toggleLayer('facilities')} />
                            <span className="text-[11px] font-bold text-primary group-hover:text-accent transition-colors">Facilities</span>
                          </div>
                          <span className="text-[9px] text-secondary font-bold bg-surface-2 px-1.5 py-0.5 rounded">{facilities.length}</span>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group border-t border-border pt-4 mt-2">
                          <div className="flex items-center gap-2.5">
                            <input type="checkbox" className="accent-accent w-4 h-4" checked={layers.complaints} onChange={() => toggleLayer('complaints')} />
                            <span className="text-[11px] font-bold text-primary group-hover:text-accent transition-colors">Complaints</span>
                          </div>
                          <span className="text-[9px] text-secondary font-bold bg-surface-2 px-1.5 py-0.5 rounded">{activeComplaints.length}</span>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-2.5">
                            <input type="checkbox" className="accent-accent w-4 h-4" checked={layers.overflowRisk} onChange={() => toggleLayer('overflowRisk')} />
                            <span className="text-[11px] font-bold text-primary group-hover:text-accent transition-colors">AI risk</span>
                          </div>
                        </label>
                        <label className="flex items-center justify-between cursor-pointer group">
                          <div className="flex items-center gap-2.5">
                            <input type="checkbox" className="accent-accent w-4 h-4" checked={layers.dumpZones} onChange={() => toggleLayer('dumpZones')} />
                            <span className="text-[11px] font-bold text-primary group-hover:text-accent transition-colors">Dump zones</span>
                          </div>
                        </label>
                     </div>
                     
                     <div className="p-4 border-t border-border bg-surface-2/60">
                       <h4 className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Live Forecast Summary</h4>
                       <div className="space-y-2">
                         <div className="flex justify-between items-center text-[11px]">
                           <span className="text-secondary font-bold tracking-wide uppercase">Critical Bins</span>
                           <span className="font-bold text-critical">{projectedBins.filter(b => b.projectedFill > 90).length}</span>
                         </div>
                         <div className="flex justify-between items-center text-[11px]">
                           <span className="text-secondary font-bold tracking-wide uppercase">Active Fleet</span>
                           <span className="font-bold text-success">{vehicles.length}</span>
                         </div>
                         <div className="flex justify-between items-center text-[11px]">
                           <span className="text-secondary font-bold tracking-wide uppercase">High-Risk Zones</span>
                           <span className="font-bold text-warning">{dumpZones.filter(d => d.label === 'Critical' || d.label === 'High').length}</span>
                         </div>
                       </div>
                     </div>
                  </div>
                )}
              </div>

              {/* Compact Legend */}
              <div className="absolute bottom-6 left-6 z-[400] flex flex-col items-start pointer-events-none">
                <div className="pointer-events-auto">
                {legendOpen ? (
                  <div className="bg-surface-translucent backdrop-blur-md p-3 rounded-xl border border-border shadow-xl animate-fade-in min-w-[220px]">
                    <div className="flex justify-between items-center mb-3 border-b border-border pb-2">
                      <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest">Map Legend</h4>
                      <button onClick={() => setLegendOpen(false)} className="text-muted hover:text-primary transition-colors bg-surface-2 rounded px-1.5 py-0.5"><X className="w-3 h-3"/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[9px] text-primary font-bold tracking-widest uppercase">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[var(--color-normal)] border border-border shadow-sm"></div> Normal</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[var(--color-critical)] border border-border shadow-sm"></div> Critical</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[var(--color-info)] border border-border shadow-sm"></div> Truck</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-purple-800 border border-border shadow-sm"></div> Facility</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[var(--color-warning)] border border-border shadow-sm"></div> Complaint</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[var(--color-danger-bg)] border border-[var(--color-danger)]"></div> AI Risk</div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-dashed border-[var(--color-high)] bg-[var(--color-warning-bg)]"></div> Dump Zone</div>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setLegendOpen(true)} className="bg-surface-translucent backdrop-blur-md p-2.5 rounded-xl border border-border shadow-md text-secondary hover:text-primary transition-colors flex items-center gap-2">
                    <MapIcon className="w-4 h-4"/> <span className="text-[10px] font-bold uppercase tracking-widest">Legend</span>
                  </button>
                )}
                </div>
              </div>

              <MapContainer center={mapCenter} zoom={12} className={`h-full w-full absolute inset-0 z-0 ${isDark ? 'dark-map-tiles opacity-80' : 'opacity-100'}`} zoomControl={false} ref={setMapRef}>
                {isDark ? (
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                ) : (
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap & Carto' />
                )}
                <MapBoundsFitter allLocations={allMapLocations} layoutKey={layersOpen} />

                {/* AI Dump Zones */}
                {layers.dumpZones && dumpZones.map(zone => (
                  <React.Fragment key={zone.id}>
                    <Circle center={[zone.lat, zone.lng]} radius={zone.radius} pathOptions={{ fillColor: 'var(--color-high)', color: 'var(--color-high)', fillOpacity: 0.25, weight: 2, dashArray: '6, 6' }} />
                    <Marker position={[zone.badgeLat, zone.badgeLng]} icon={dumpBadgeIcon(zone.label, isDark)}>
                      <Tooltip direction="top" offset={[0, -5]} className="bg-surface border border-border shadow-xl text-warning font-bold uppercase tracking-widest text-[11px] px-2 py-1 rounded-full">
                        Dump Risk: {zone.label}
                      </Tooltip>
                    </Marker>
                  </React.Fragment>
                ))}

                {/* AI Overflow Risk Zones */}
                {layers.overflowRisk && projectedBins.filter(b => b.projectedFill > 90).map(bin => (
                  <Circle key={`risk-${bin.id}`} center={[bin.location.lat, bin.location.lng]} radius={bin.projectedFill * 10} pathOptions={{ fillColor: 'var(--color-danger)', color: 'var(--color-danger)', weight: 2, fillOpacity: Math.min(0.8, 0.35 + ((bin.projectedFill - 90) / 20)) }} className="transition-all duration-1000 ease-in-out animate-pulse">
                  </Circle>
                ))}

                {/* Facilities */}
                {layers.facilities && facilities.map(fac => (
                  <Marker key={fac.id} position={[fac.lat, fac.lng]} icon={facilityIcon(isDark)}>
                    <Popup>
                      <div className="font-sans min-w-[160px]">
                        <h3 className="font-bold text-[12px] text-accent border-b border-border pb-1.5 mb-1.5 tracking-widest uppercase">🏭 {fac.name}</h3>
                        <p className="text-[12px] mb-1 text-primary"><span className="text-secondary font-bold uppercase">Capacity:</span> {fac.capacity}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Vehicles */}
                {layers.vehicles && vehicles.map(truck => (
                  <Marker key={truck.id} position={[truck.location.lat, truck.location.lng]} icon={createTruckIcon(truck.id, isDark)}>
                    <Popup>
                      <div className="font-sans min-w-[120px]">
                        <h3 className="font-bold text-[12px] border-b border-border pb-1.5 mb-1.5 tracking-widest uppercase text-info">🚛 {truck.id}</h3>
                        <p className="text-[12px] text-primary"><span className="text-secondary font-bold uppercase">Status:</span> {truck.status}</p>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Complaints Clustering */}
                {layers.complaints && clusteredComplaints.map((cluster, i) => (
                  <Marker key={`comp-${i}`} position={[cluster.lat, cluster.lng]} icon={createClusterIcon(cluster.items.length, isDark)} ref={(r) => { if(r) cluster.items.forEach((c: any) => markerRefs.current[c.id] = r); }}>
                    <Popup>
                      <div className="font-sans min-w-[150px] max-h-[200px] overflow-y-auto">
                        <h3 className="font-bold text-[12px] border-b border-border pb-1.5 mb-1.5 text-warning uppercase tracking-widest">{cluster.items.length} Incidents</h3>
                        {cluster.items.map((c: any, idx: number) => (
                          <div key={idx} className="mb-2 pb-2 border-b border-border last:border-0 last:pb-0 last:mb-0">
                            <p className="text-[11px] mb-0.5 text-primary"><strong className="text-secondary">ID:</strong> {c.id}</p>
                            <p className="text-[11px] text-primary"><strong className="text-secondary">Severity:</strong> <span className={`uppercase font-bold ${c.severity==='critical'?'text-critical':c.severity==='high'?'text-high':'text-warning'}`}>{c.severity}</span></p>
                          </div>
                        ))}
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {/* Bins */}
                {layers.bins && projectedBins.map(bin => {
                  const to100 = bin.fill_level >= 100 ? 0 : (100 - bin.fill_level) / bin.demandRate;
                  const isFull = to100 <= 0;
                  return (
                    <Marker key={bin.id} position={[bin.location.lat, bin.location.lng]} icon={createBinIcon(bin.projectedFill, bin.stream_type, isDark)} ref={(r) => { if(r) markerRefs.current[bin.id] = r; }}>
                      <Popup>
                        <div className="font-sans min-w-[200px]">
                          <div className="flex justify-between items-center border-b border-border pb-2 mb-2">
                            <h3 className="font-bold text-primary text-sm m-0 tracking-wide">{bin.id}</h3>
                            <span className="text-[10px] font-bold text-secondary bg-surface-2 px-1.5 py-0.5 rounded uppercase tracking-widest">{bin.ward}</span>
                          </div>
                          <div className="space-y-1 text-[12px] text-primary">
                            <p><strong className="text-muted uppercase tracking-widest mr-1">Stream:</strong> {bin.stream_type}</p>
                            <p><strong className="text-muted uppercase tracking-widest mr-1">Current fill:</strong> <span className="font-bold">{bin.fill_level}%</span></p>
                            <p><strong className="text-muted uppercase tracking-widest mr-1">Projected fill:</strong> <span className={`font-bold ${bin.projectedFill > 90 ? 'text-critical' : 'text-success'}`}>{Math.round(bin.projectedFill)}%</span></p>
                            <p><strong className="text-muted uppercase tracking-widest mr-1">Time to 100%:</strong> {isFull ? 'Bin full - dispatch now' : `Full in ${to100.toFixed(1)}h`}</p>
                          </div>
                          <button onClick={() => navigate('/swachh-track')} className="w-full mt-3 bg-accent hover:bg-accent/90 text-accent-contrast text-[11px] font-bold uppercase tracking-widest py-1.5 rounded transition-colors flex items-center justify-center gap-1">
                            <Navigation className="w-3 h-3" /> Open in SwachhTrack
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        </div>

        {/* Right Side Panel: Alerts & Complaints */}
        <div className="w-80 flex flex-col gap-4 min-h-0 flex-shrink-0">
          <div className="glass-card rounded-xl border border-border flex flex-col min-h-0 bg-surface/60 shadow-lg h-full">
             <div className="p-4 border-b border-border bg-surface/80 sticky top-0 flex-shrink-0 z-10 flex flex-col gap-3">
                <h3 className="font-bold text-primary text-[12px] uppercase tracking-widest flex items-center">
                  <Activity className="w-4 h-4 mr-1.5 text-warning" /> Alerts & Incidents
                </h3>
                <div className="flex gap-1.5">
                  {['All', 'Critical', 'High', 'Medium', 'Low'].map(f => (
                    <button key={f} onClick={() => setAlertFilter(f)} className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest border transition-all ${alertFilter === f ? 'bg-accent text-accent-contrast border-accent/50' : 'bg-surface-2 text-secondary border-border hover:bg-surface'}`}>
                      {f}
                    </button>
                  ))}
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-3 scrollbar-hide space-y-3">
                {sortedAlerts.map(alert => (
                   <div key={alert.id} className="p-3 rounded-xl border bg-surface-2/40 border-border hover:bg-surface-2/80 transition-all flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                         <div>
                           <h4 className="font-bold text-primary text-[12px] leading-tight mb-0.5">{alert.title}</h4>
                           <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{alert.id} • {alert.ward || 'Central'}</p>
                         </div>
                         <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shadow-sm ${alert.severity === 'critical' ? 'bg-danger text-white border-danger' : alert.severity === 'high' ? 'bg-warning text-white border-warning' : 'bg-surface-2 text-warning border-warning/30'}`}>
                           {alert.severity}
                         </span>
                      </div>
                      <p className="text-[11px] text-secondary line-clamp-2 leading-relaxed mt-0.5">{alert.description}</p>
                      
                      <div className="flex justify-between items-end mt-1">
                         <span className="flex items-center gap-1 text-[11px] font-bold text-secondary uppercase tracking-widest"><Clock className="w-3.5 h-3.5"/> {alert.reported_at || '2 hours ago'}</span>
                         <button onClick={() => {
                            mapRef?.flyTo([alert.location.lat, alert.location.lng], 16, { animate: true, duration: 1.5 });
                            setTimeout(() => { if (markerRefs.current[alert.id]) markerRefs.current[alert.id].openPopup(); }, 600);
                         }} className="px-3 py-1 bg-surface border border-border hover:bg-accent hover:text-white hover:border-accent rounded text-primary text-[10px] font-bold uppercase tracking-widest flex items-center transition-all shadow-sm">
                            <Search className="w-3 h-3 mr-1"/> Locate
                         </button>
                      </div>
                   </div>
                ))}
                {sortedAlerts.length === 0 && (
                  <div className="flex items-center justify-center h-full text-muted text-[12px] uppercase font-bold tracking-widest">No matching alerts</div>
                )}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}
