import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, ZoomControl, Pane } from 'react-leaflet';
import { AlertTriangle, Clock, MapPin, CheckCircle, Radar, Loader2, Flame, Activity, Navigation, Search, Info, Map as MapIcon, ArrowUpRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCountUp } from '../hooks/usePremiumUI';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';
import { sharedSeedIncidents as seedIncidents, sharedSeedHotspots as seedHotspots } from '../data/sharedSeedData';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const wards = ['Connaught Place', 'Karol Bagh', 'Rohini', 'Dwarka', 'Saket'];

const getIncidentIcon = (severity: string, status: string, isDark: boolean, isCluster: boolean = false, count: number = 1) => {
  const border = isDark ? 'white' : '#cbd5e1';
  if (isCluster) {
    return L.divIcon({
      html: `<div style="background-color: var(--color-warning); color: white; width: 32px; height: 32px; border-radius: 50%; border: 2px solid ${border}; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 13px; box-shadow: 0 0 10px var(--color-warning);">${count}</div>`,
      className: '', iconSize: [32, 32], iconAnchor: [16, 16]
    });
  }
  const color = status === 'cleared' ? 'var(--color-success)' : severity === 'high' ? 'var(--color-danger)' : severity === 'medium' ? 'var(--color-warning)' : 'var(--color-info)';
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${border}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px ${color};">
      ${status === 'cleared' ? '✓' : '!'}
    </div>`,
    className: 'text-white font-bold text-[12px]', iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12]
  });
};

const hotspotBadgeIcon = (score: number) => {
  return L.divIcon({
    html: `<div style="background-color: var(--bg-surface); color: var(--color-danger); width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--color-danger); display: flex; align-items: center; justify-content: center; font-weight: black; font-size: 11px; box-shadow: 0 0 15px var(--color-danger);">${score}</div>`,
    className: '', iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14]
  });
};

const HourlyChart = ({ peakTime }: { peakTime: string }) => {
   const peakHour = parseInt(peakTime.split(':')[0]);
   return (
     <div className="flex items-end gap-[1px] h-10 mt-3 mb-2 px-1">
        {Array.from({length: 24}).map((_, i) => {
           const dist = Math.abs(i - peakHour);
           const height = Math.max(15, 100 - (Math.pow(dist, 1.5) * 5));
           const isPeak = i === peakHour;
           return (
             <div key={i} className="flex-1 flex flex-col items-center gap-1 relative group">
               <div className={`w-full rounded-t-sm transition-all ${isPeak ? 'bg-danger shadow-sm' : height > 60 ? 'bg-warning/60' : 'bg-info/30'}`} style={{ height: `${height}%` }}></div>
               {isPeak && <span className="absolute -top-4 text-[8px] text-danger font-bold bg-surface-2 px-1 rounded">{peakTime}</span>}
             </div>
           );
        })}
     </div>
   );
};

const MapBoundsFitter = ({ allLocations }: { allLocations: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (allLocations.length === 0) return;
    const bounds = L.latLngBounds(allLocations);
    if (!bounds.isValid()) return;
    const handleResize = () => {
      try {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 12 });
      } catch(e) {}
    };
    handleResize();
    const t1 = setTimeout(handleResize, 150);
    window.addEventListener('resize', handleResize);
    return () => { clearTimeout(t1); window.removeEventListener('resize', handleResize); };
  }, [allLocations, map]);
  return null;
};

const StatCard = ({ title, value, numericValue, unit, icon: Icon, colorClass, tooltip, trend }: any) => {
  const animatedNumber = useCountUp(numericValue || 0, 1500);
  const displayValue = numericValue !== undefined ? Number(animatedNumber).toLocaleString() : value;
  const isTrendGood = trend < 0;
  const trendColor = isTrendGood ? 'text-success' : 'text-danger';

  return (
    <div className={`glass-card rounded-xl p-2.5 flex items-center relative overflow-hidden h-16`} title={tooltip}>
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
          {unit && <span className="text-[10px] font-bold text-muted ml-1 uppercase tracking-widest">{unit}</span>}
        </h3>
      </div>
    </div>
  );
};

export default function DumpSpot() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [mapRef, setMapRef] = useState<L.Map | null>(null);

  const [statusFilter, setStatusFilter] = useState('all');
  const [tab, setTab] = useState('incidents');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [wardFilter, setWardFilter] = useState('all');

  const [scanning, setScanning] = useState(false);
  const [predicted, setPredicted] = useState(false);
  
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>(null);
  const hotspotRefs = useRef<{[key: string]: L.Marker}>({});
  
  const [legendOpen, setLegendOpen] = useState(window.innerWidth >= 1600);
  useEffect(() => {
    const handleResize = () => setLegendOpen(window.innerWidth >= 1600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePredict = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setPredicted(true);
      setTab('hotspots');
      const topHotspot = seedHotspots.filter(h => statusFilter === 'all' || h.status === statusFilter).sort((a,b) => b.risk_score - a.risk_score)[0];
      if (topHotspot) {
         handleHotspotSelect(topHotspot);
      }
    }, 2000);
  };

  const filteredIncidents = seedIncidents.filter(inc => statusFilter === 'all' || inc.status === statusFilter);
  const filteredHotspots = seedHotspots.filter(h => statusFilter === 'all' || h.status === statusFilter);

  const handleHotspotSelect = (h: any) => {
    setSelectedHotspot(h.id);
    mapRef?.flyTo([h.lat, h.lng], 15, { animate: true, duration: 1.5 });
    setTimeout(() => {
      if (hotspotRefs.current[h.id]) {
         hotspotRefs.current[h.id].openPopup();
      }
    }, 600);
  };

  const clusteredIncidents = useMemo(() => {
    const clusters: any[] = [];
    filteredIncidents.forEach(inc => {
      let clustered = false;
      for (const c of clusters) {
        const d = Math.sqrt(Math.pow(c.lat - inc.lat, 2) + Math.pow(c.lng - inc.lng, 2));
        if (d < 0.015) {
          c.items.push(inc);
          clustered = true; break;
        }
      }
      if (!clustered) clusters.push({ lat: inc.lat, lng: inc.lng, items: [inc] });
    });
    return clusters;
  }, [filteredIncidents]);

  const filteredListIncidents = filteredIncidents.filter(inc => 
    (severityFilter === 'all' || inc.severity === severityFilter) &&
    (wardFilter === 'all' || inc.ward === wardFilter)
  );

  const allMapLocations: [number, number][] = useMemo(() => {
    const locs: [number, number][] = [];
    filteredIncidents.forEach(inc => locs.push([inc.lat, inc.lng]));
    if (predicted) filteredHotspots.forEach(h => locs.push([h.lat, h.lng]));
    return locs;
  }, [filteredIncidents, filteredHotspots, predicted]);

  const openIncidentsCount = filteredIncidents.filter(i => i.status !== 'cleared').length;

  return (
    <div className="h-full flex flex-col p-6 gap-3 box-border overflow-hidden bg-background transition-colors duration-200">
      
      {/* Header */}
      <div className="flex justify-between items-end flex-shrink-0 animate-fade-in">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h2 className="text-3xl font-extrabold text-primary tracking-tight leading-none">DumpSpot</h2>
            <span className="px-2 py-0.5 rounded-full bg-info-bg text-info border border-info/30 text-[10px] font-bold uppercase tracking-widest flex items-center">
              <Activity className="w-3 h-3 mr-1"/> Simulated Data
            </span>
          </div>
          <p className="text-secondary font-medium text-sm">Predictive illegal-dumping hotspots & citizen reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-surface-2 p-1 rounded-lg border border-border shadow-sm">
            {['All', 'Pending', 'In-progress', 'Cleared'].map(f => (
              <button key={f} onClick={() => setStatusFilter(f.toLowerCase())} className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest transition-all ${statusFilter === f.toLowerCase() ? 'bg-background text-primary shadow' : 'text-muted hover:text-secondary'}`}>
                {f}
              </button>
            ))}
          </div>
          <button onClick={handlePredict} disabled={scanning || predicted} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all border ${predicted ? 'bg-success-bg text-success border-success/50' : 'bg-accent hover:bg-accent/90 text-accent-contrast border-accent shadow-sm'}`}>
            {scanning ? <Loader2 className="w-4 h-4 animate-spin"/> : predicted ? <CheckCircle className="w-4 h-4"/> : <Radar className="w-4 h-4"/>}
            {scanning ? 'Analyzing Data...' : predicted ? 'Prediction Active' : 'Predict AI Hotspots'}
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-3 flex-shrink-0">
        <StatCard title="Open Incidents" numericValue={openIncidentsCount} icon={AlertTriangle} colorClass="text-warning" tooltip="Total pending and in-progress incidents" />
        <StatCard title="Predicted Hotspots" value={predicted ? filteredHotspots.length : '—'} numericValue={predicted ? filteredHotspots.length : undefined} icon={Radar} colorClass="text-info" tooltip="AI predicted zones with risk score ≥ 60" />
        <StatCard title="High-Risk Zones" value={predicted ? filteredHotspots.filter(h => h.category === 'High').length : '—'} numericValue={predicted ? filteredHotspots.filter(h => h.category === 'High').length : undefined} icon={Flame} colorClass="text-danger" tooltip="Zones with AI risk score ≥ 80" />
        <StatCard title="Avg Response Time" value="1.2h" icon={Clock} colorClass="text-success" trend={-8.5} tooltip="Mean time from logged to cleared (hours)" />
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        
        {/* Main Map Area */}
        <div className="flex-1 rounded-xl shadow-lg border border-border overflow-hidden relative bg-background flex">
          
          <div className="absolute top-4 left-4 z-[400] bg-surface-translucent backdrop-blur-md border border-border px-3 py-2 rounded-lg pointer-events-none shadow-md">
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest flex items-center">
              <Radar className="h-3 w-3 mr-1.5 text-info" /> Tactical View
            </p>
          </div>

          {/* Compact Legend */}
          <div className="absolute bottom-6 left-6 z-[400] flex flex-col items-start pointer-events-none">
            <div className="pointer-events-auto">
            {legendOpen ? (
              <div className="bg-surface-translucent backdrop-blur-md p-3 rounded-xl border border-border shadow-xl animate-fade-in min-w-[200px]">
                <div className="flex justify-between items-center mb-3 border-b border-border pb-2">
                  <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest">Map Legend</h4>
                  <button onClick={() => setLegendOpen(false)} className="text-muted hover:text-primary transition-colors bg-surface-2 rounded px-1.5 py-0.5"><MapIcon className="w-3 h-3"/></button>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-[9px] text-primary font-bold tracking-widest uppercase">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[var(--color-danger)] border border-border shadow-sm"></div> High Sev</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[var(--color-warning)] border border-border shadow-sm"></div> Med Sev</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[var(--color-info)] border border-border shadow-sm"></div> Low Sev</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[var(--color-success)] border border-border shadow-sm"></div> Cleared</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[var(--color-danger-bg)] border border-[var(--color-danger)]"></div> Hotspot</div>
                </div>
              </div>
            ) : (
              <button onClick={() => setLegendOpen(true)} className="bg-surface-translucent backdrop-blur-md p-2.5 rounded-xl border border-border shadow-md text-secondary hover:text-primary transition-colors flex items-center gap-2">
                <MapIcon className="w-4 h-4"/> <span className="text-[10px] font-bold uppercase tracking-widest">Legend</span>
              </button>
            )}
            </div>
          </div>

          <MapContainer center={[28.6139, 77.2090]} zoom={11} className={`h-full w-full absolute inset-0 z-0 ${isDark ? 'dark-map-tiles opacity-80' : 'opacity-100'}`} zoomControl={false} ref={setMapRef}>
            {isDark ? (
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
            ) : (
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap & Carto' />
            )}
            <ZoomControl position="bottomright" />
            <MapBoundsFitter allLocations={allMapLocations} />

            {/* Predicted Hotspots Pane (Higher Z-Index) */}
            <Pane name="hotspotsPane" style={{ zIndex: 500 }}>
              {predicted && filteredHotspots.map(spot => {
                const isSelected = selectedHotspot === spot.id;
                return (
                <React.Fragment key={spot.id}>
                  <Circle center={[spot.lat, spot.lng]} radius={spot.risk_score * 5} pathOptions={{ fillColor: spot.category === 'High' ? 'var(--color-danger)' : 'var(--color-warning)', color: spot.category === 'High' ? 'var(--color-danger)' : 'var(--color-warning)', weight: isSelected ? 3 : 2, fillOpacity: isSelected ? 0.4 : 0.15 + (spot.risk_score / 600) }} className="transition-all duration-1000 ease-in-out animate-pulse" />
                  <Marker 
                    position={[spot.lat, spot.lng]} 
                    icon={hotspotBadgeIcon(spot.risk_score)}
                    ref={(r) => { if (r) hotspotRefs.current[spot.id] = r; }}
                    eventHandlers={{ click: () => handleHotspotSelect(spot) }}
                  >
                  </Marker>
                </React.Fragment>
              )})}
            </Pane>

            {/* Incidents Pane (Lower Z-Index) */}
            <Pane name="incidentsPane" style={{ zIndex: 450 }}>
              {clusteredIncidents.map((cluster, i) => (
                cluster.items.length > 1 ? (
                  <Marker key={`cluster-${i}`} position={[cluster.lat, cluster.lng]} icon={getIncidentIcon('high', 'pending', isDark, true, cluster.items.length)}>
                    <Popup>
                      <div className="font-sans min-w-[180px] max-h-[200px] overflow-y-auto pr-1">
                        <h3 className="font-bold text-[12px] border-b border-border pb-1.5 mb-2 text-warning uppercase tracking-widest">{cluster.items.length} Incidents</h3>
                        {cluster.items.map((inc: any, idx: number) => (
                          <div key={idx} className="mb-2 pb-2 border-b border-border last:border-0 last:pb-0 last:mb-0">
                            <p className="text-[11px] font-bold text-primary mb-0.5">{inc.id} • {inc.type}</p>
                            <div className="flex justify-between items-center">
                              <span className={`text-[9px] font-black uppercase tracking-widest ${inc.severity==='high'?'text-danger':inc.severity==='medium'?'text-warning':'text-info'}`}>{inc.severity}</span>
                              <span className="text-[9px] font-bold text-secondary uppercase tracking-widest">{inc.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Popup>
                  </Marker>
                ) : (
                  <Marker key={cluster.items[0].id} position={[cluster.items[0].lat, cluster.items[0].lng]} icon={getIncidentIcon(cluster.items[0].severity, cluster.items[0].status, isDark)}>
                    <Popup>
                      <div className="font-sans min-w-[200px]">
                        <div className="flex justify-between items-center border-b border-border pb-2 mb-2">
                          <h3 className="font-bold text-primary text-sm m-0 tracking-wide">{cluster.items[0].id}</h3>
                          <span className="text-[10px] font-bold text-secondary bg-surface-2 px-1.5 py-0.5 rounded uppercase tracking-widest">{cluster.items[0].ward}</span>
                        </div>
                        <div className="space-y-1 text-[12px] mb-3 text-primary">
                          <p><strong className="text-muted uppercase tracking-widest mr-1">Type:</strong> {cluster.items[0].type}</p>
                          <p><strong className="text-muted uppercase tracking-widest mr-1">Severity:</strong> <span className={`font-bold ${cluster.items[0].severity==='high'?'text-danger':cluster.items[0].severity==='medium'?'text-warning':'text-info'} uppercase`}>{cluster.items[0].severity}</span></p>
                          <p><strong className="text-muted uppercase tracking-widest mr-1">Status:</strong> <span className={`font-bold uppercase ${cluster.items[0].status==='cleared'?'text-success':'text-warning'}`}>{cluster.items[0].status}</span></p>
                          <p><strong className="text-muted uppercase tracking-widest mr-1">Logged:</strong> {cluster.items[0].reported_at}</p>
                        </div>
                        <button onClick={() => navigate('/nagar-mirror')} className="w-full bg-surface-2 hover:bg-border text-primary border border-border text-[11px] font-bold uppercase tracking-widest py-1.5 rounded transition-colors flex items-center justify-center gap-1">
                          <Info className="w-3 h-3" /> View details
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </Pane>
          </MapContainer>
        </div>

        {/* Right Panel */}
        <div className="w-[340px] flex flex-col gap-4 min-h-0 flex-shrink-0">
          <div className="glass-card rounded-xl border border-border flex flex-col min-h-0 bg-surface/60 shadow-lg h-full">
             <div className="p-3 border-b border-border bg-surface/80 sticky top-0 flex-shrink-0 z-10">
                <div className="flex bg-surface-2/50 p-1 rounded-lg mb-3">
                  <button onClick={() => setTab('hotspots')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${tab==='hotspots'?'bg-accent text-accent-contrast shadow-sm':'text-secondary hover:text-primary'}`}>Predicted Hotspots</button>
                  <button onClick={() => setTab('incidents')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded transition-all ${tab==='incidents'?'bg-accent text-accent-contrast shadow-sm':'text-secondary hover:text-primary'}`}>Reported Incidents</button>
                </div>
                
                {tab === 'incidents' && (
                  <div className="flex gap-2">
                    <select value={severityFilter} onChange={e=>setSeverityFilter(e.target.value)} className="bg-surface-2 text-primary text-[10px] font-bold uppercase tracking-widest rounded px-2 py-1.5 border border-border flex-1 outline-none">
                      <option value="all">All Severities</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    <select value={wardFilter} onChange={e=>setWardFilter(e.target.value)} className="bg-surface-2 text-primary text-[10px] font-bold uppercase tracking-widest rounded px-2 py-1.5 border border-border flex-1 outline-none">
                      <option value="all">All Wards</option>
                      {wards.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                )}
             </div>
             
             <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-hide">
                {tab === 'hotspots' && (!predicted ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted opacity-70">
                    <Radar className="w-8 h-8 mb-2 animate-pulse" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Run Prediction to view</p>
                  </div>
                ) : (
                  filteredHotspots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted opacity-70">
                      <p className="text-[10px] font-bold uppercase tracking-widest">No hotspots for this status</p>
                    </div>
                  ) : (
                    filteredHotspots.map((h, i) => (
                      <div key={h.id} className={`p-3 rounded-xl border transition-all flex flex-col gap-2 relative overflow-hidden animate-fade-in ${selectedHotspot === h.id ? 'bg-info-bg border-info/50 shadow-sm' : 'bg-surface-2/40 border-border hover:bg-surface-2/80'}`} style={{ animationDelay: `${i * 100}ms` }}>
                         <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                              <span className="bg-info-bg text-info font-black text-[12px] px-1.5 py-0.5 rounded border border-info/30">#{i+1}</span>
                              <div>
                                <h4 className="font-bold text-primary text-[12px] leading-tight mb-0.5">{h.ward}</h4>
                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest">Peak: {h.peak_time}</p>
                              </div>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border shadow-sm ${h.category === 'High' ? 'bg-danger text-white border-danger' : 'bg-warning text-white border-warning'}`}>
                              {h.risk_score} Risk
                            </span>
                         </div>
                         
                         <p className="text-[11px] text-secondary leading-snug line-clamp-2 italic">"{h.reason}"</p>
                         <div className="flex flex-wrap gap-1 mt-1 mb-1">
                            {h.types.map((t: string) => <span key={t} className="text-[8px] font-bold uppercase tracking-widest bg-surface text-secondary border border-border px-1.5 py-0.5 rounded">{t}</span>)}
                         </div>
  
                         <div className="grid grid-cols-3 gap-1.5 mt-1">
                            <button onClick={() => handleHotspotSelect(h)} className="bg-surface border border-border hover:bg-accent text-primary hover:text-white text-[9px] font-bold uppercase tracking-widest py-1.5 rounded flex items-center justify-center gap-1 transition-all shadow-sm">
                              <Info className="w-3 h-3" /> Why?
                            </button>
                            <button onClick={() => navigate('/swachh-track', { state: { selectedLocation: [h.lat, h.lng] } })} className="bg-accent hover:bg-accent/80 text-white text-[9px] font-bold uppercase tracking-widest py-1.5 rounded flex items-center justify-center gap-1 transition-colors shadow-sm">
                              <Navigation className="w-3 h-3" /> Dispatch
                            </button>
                            <button onClick={() => { setSelectedHotspot(h.id); mapRef?.flyTo([h.lat, h.lng], 16, { animate: true, duration: 1.5 })}} className="bg-surface border border-border hover:bg-accent text-primary hover:text-white text-[9px] font-bold uppercase tracking-widest py-1.5 rounded flex items-center justify-center gap-1 transition-all shadow-sm">
                              <Search className="w-3 h-3" /> Locate
                            </button>
                         </div>
                      </div>
                    ))
                  )
                ))}

                {tab === 'incidents' && (
                  filteredListIncidents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted opacity-70">
                      <p className="text-[10px] font-bold uppercase tracking-widest">No matching incidents</p>
                    </div>
                  ) : (
                    filteredListIncidents.map((inc, i) => (
                      <div key={inc.id} className="p-3 rounded-xl border bg-surface-2/40 border-border hover:bg-surface-2/80 transition-all flex flex-col gap-2 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                         <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-primary text-[12px] leading-tight mb-0.5">{inc.type}</h4>
                              <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{inc.id} • {inc.ward}</p>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border shadow-sm ${inc.status === 'cleared' ? 'bg-success-bg text-success border-success/30' : inc.severity === 'high' ? 'bg-danger text-white border-danger' : inc.severity === 'medium' ? 'bg-warning text-white border-warning' : 'bg-info-bg text-info border-info/30'}`}>
                              {inc.status === 'cleared' ? 'Cleared' : inc.severity}
                            </span>
                         </div>
                         <div className="flex justify-between items-end mt-1">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-secondary uppercase tracking-widest"><Clock className="w-3 h-3"/> {inc.reported_at}</span>
                            <button onClick={() => mapRef?.flyTo([inc.lat, inc.lng], 16, { animate: true, duration: 1.5 })} className="px-2 py-1 bg-surface border border-border hover:bg-accent rounded text-primary hover:text-white text-[9px] font-bold uppercase tracking-widest flex items-center transition-all shadow-sm">
                               <Search className="w-2.5 h-2.5 mr-1"/> Locate
                            </button>
                         </div>
                      </div>
                    ))
                  )
                )}
             </div>

             {/* Explainability Card embedded at bottom of panel */}
             {selectedHotspot && tab === 'hotspots' && (
               <div className="border-t border-border bg-surface/95 shadow-[0_-15px_30px_rgba(0,0,0,0.1)] z-20 p-4 max-h-[50%] overflow-y-auto scrollbar-hide flex-shrink-0 animate-slide-in-bottom">
                 <div className="flex justify-between items-center mb-2">
                   <h3 className="font-bold text-[12px] text-info tracking-widest uppercase flex items-center">
                     <Radar className="w-3 h-3 mr-1.5" /> AI Risk Analysis
                   </h3>
                   <button onClick={() => setSelectedHotspot(null)} className="text-secondary hover:text-primary bg-surface-2 rounded p-0.5"><X className="w-3 h-3"/></button>
                 </div>
                 {(() => {
                   const spot = seedHotspots.find(s => s.id === selectedHotspot);
                   if (!spot) return null;
                   return (
                     <div className="font-sans">
                        <div className="flex justify-between items-center mb-3">
                           <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Risk Score</span>
                           <span className={`text-[12px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${spot.category === 'High' ? 'bg-danger-bg text-danger border border-danger/30' : 'bg-warning-bg text-warning border border-warning/30'}`}>{spot.risk_score} - {spot.category}</span>
                        </div>
                        
                        <p className="text-[11px] text-primary italic mb-3 leading-relaxed border-l-2 border-info/50 pl-2">"{spot.reason}"</p>
                  
                        <div className="space-y-2 mb-2">
                          <p className="text-[9px] font-bold text-muted uppercase tracking-widest mb-1">Why did the AI flag this zone?</p>
                          {spot.factors.map((f: any) => (
                            <div key={f.name}>
                              <div className="flex justify-between text-[10px] mb-0.5">
                                <span className="text-primary">{f.name}</span>
                                <span className="text-secondary font-bold">{f.val}%</span>
                              </div>
                              <div className="w-full bg-surface-2 rounded-full h-1.5 overflow-hidden border border-border">
                                <div className="bg-info h-full rounded-full" style={{ width: `${f.val}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <HourlyChart peakTime={spot.peak_time} />
                  
                        <div className="bg-info-bg/50 border border-info/30 p-2 rounded mb-3 mt-2">
                           <p className="text-[10px] font-bold text-info uppercase tracking-widest mb-0.5">Recommended Action</p>
                           <p className="text-[10px] text-primary">Dispatch tactical cleanup fleet before {spot.peak_time}.</p>
                        </div>
                        <button onClick={() => navigate('/swachh-track', { state: { selectedLocation: [spot.lat, spot.lng] } })} className="w-full bg-accent hover:bg-accent/90 text-accent-contrast text-[11px] font-bold uppercase tracking-widest py-2 rounded transition-colors flex items-center justify-center gap-1 mb-2">
                          <Navigation className="w-3 h-3" /> Dispatch Cleanup
                        </button>
                        <p className="text-[8px] text-muted text-center uppercase tracking-widest">Model trained on synthetic data</p>
                     </div>
                   );
                 })()}
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}
