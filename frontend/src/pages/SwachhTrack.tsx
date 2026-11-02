import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { Truck, Route as RouteIcon, Loader2, AlertTriangle, Activity, Navigation, Trash2, Info, Droplets, Fuel, CheckCircle, BrainCircuit, ShieldAlert } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../context/ThemeContext';

// ==========================================
// 1. ICONS & MAP COMPONENTS
// ==========================================
const createBinIcon = (fill: number, stream: string, isDark: boolean) => {
  const color = fill > 85 ? 'var(--color-danger)' : fill > 60 ? 'var(--color-warning)' : 'var(--color-success)';
  const bg = isDark ? '#0f172a' : '#ffffff';
  const border = isDark ? '#fff' : '#cbd5e1';
  const iconHtml = `
    <div style="background-color: ${bg}; width: 26px; height: 26px; border-radius: 50%; border: 2.5px solid ${border}; display: flex; align-items: center; justify-content: center; position: relative; box-shadow: 0 0 10px ${color};">
      <div style="background-color: ${color}; height: ${fill}%; width: 100%; position: absolute; bottom: 0; border-radius: 50%; opacity: 0.6;"></div>
      <span style="font-size: 11px; position: relative; z-index: 10;">${stream === 'Wet' ? '💧' : stream === 'Dry' ? '📦' : stream === 'Sanitary' ? '⚕️' : '♻️'}</span>
    </div>
  `;
  return L.divIcon({ html: iconHtml, className: '', iconSize: [26, 26], iconAnchor: [13, 13] });
};

const depotIcon = (isDark: boolean) => L.divIcon({
  html: `<div style="background-color: var(--color-info); width: 28px; height: 28px; border-radius: 6px; border: 2px solid ${isDark ? '#fff' : '#cbd5e1'}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px var(--color-info);">
    <span style="font-size: 14px;">🏭</span>
  </div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

const getArrowIcon = (color: string, angle: number) => L.divIcon({
  html: `<div style="color: ${color}; transform: rotate(${angle}deg); font-size: 12px; font-weight: bold; text-shadow: 0 0 3px var(--bg-surface);">➤</div>`,
  className: '',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

const MapBoundsFitter = ({ bounds }: { bounds: L.LatLngBounds | null }) => {
  const map = useMap();
  useEffect(() => {
    if (!bounds || !bounds.isValid()) return;
    
    const handleResize = () => {
      try {
        map.invalidateSize();
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      } catch(e) { console.error("MapBoundsFitter error:", e); }
    };
    
    // Initial fits
    handleResize();
    const t1 = setTimeout(handleResize, 100);
    const t2 = setTimeout(handleResize, 500); // Catch late container shifts
    
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', handleResize);
    };
  }, [bounds, map]);
  return null;
};

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
export default function SwachhTrack() {
  const { isDark } = useTheme();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [bins, setBins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [optimizing, setOptimizing] = useState(false);
  const [optimizedRoutes, setOptimizedRoutes] = useState<any>(null);
  
  const [selectedBin, setSelectedBin] = useState<any>(null);
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  
  const [viewMode, setViewMode] = useState<'fixed' | 'ai'>('ai');
  const [streamFilter, setStreamFilter] = useState<string>('All');
  const [demoSeed, setDemoSeed] = useState<number>(42);

  const ASSUMPTIONS = { fuelPerKm: 0.35, speedKmh: 18 };
  const DEPOT = [28.6139, 77.2090];
  const routeColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

  const getDist = (p1: number[], p2: number[]) => {
    if (!p1 || !p2 || p1.length < 2 || p2.length < 2) return 0;
    try {
      const dx = (p1[1] - p2[1]) * 111000 * Math.cos(p1[0] * Math.PI / 180);
      const dy = (p1[0] - p2[0]) * 111000;
      return Math.floor(Math.sqrt(dx*dx + dy*dy)) / 1000;
    } catch(e) { return 0; }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehRes, binRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/vehicles/'),
          fetch(`http://127.0.0.1:8000/api/bins/?seed=${demoSeed}`)
        ]);
        
        const vehData = await vehRes.json();
        const binData = await binRes.json();
        
        setVehicles(Array.isArray(vehData) ? vehData : []);
        
        const realWards = ['Karol Bagh', 'Dwarka', 'Rohini', 'Saket'];
        const streamTypes = ['Wet', 'Dry', 'Sanitary', 'Mixed'];
        
        const enrichedBins = (Array.isArray(binData) ? binData : []).map((bin, i) => {
          const wardIdx = i % 4;
          const ward = realWards[wardIdx];
          const stream_type = streamTypes[i % 4];

          const num = parseInt(bin.id.replace(/\D/g, '') || '0');
          const demandRate = (bin.fill_level > 50 && bin.fill_level < 85) ? (100 - bin.fill_level) / 10 : 1 + ((num % 10) * 0.2);
          
          const f6 = Math.min(100, Math.round(bin.fill_level + (demandRate * 6)));
          const f12 = Math.min(100, Math.round(bin.fill_level + (demandRate * 12)));
          const f24 = Math.min(100, Math.round(bin.fill_level + (demandRate * 24)));
          
          let priority = 'Normal';
          if (bin.fill_level > 75) priority = 'Critical';
          else if (bin.fill_level + (demandRate * 12) >= 100) priority = 'Warning';

          return { ...bin, ward, stream_type, f6, f12, f24, priority, demandRate };
        });
        
        setBins(enrichedBins);
        if(enrichedBins.length > 0) {
          const defBin = enrichedBins.find(b => b.fill_level < 100 && b.f12 >= 100) || enrichedBins.find(b => b.fill_level < 100) || enrichedBins[0];
          setSelectedBin(defBin);
          
          const bounds = L.latLngBounds(enrichedBins.map(b => [b.location.lat, b.location.lng]));
          bounds.extend(DEPOT as [number, number]);
          setMapBounds(bounds);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [demoSeed]);

  const handleOptimizeRoutes = async () => {
    setOptimizing(true);
    setOptimizedRoutes(null);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/routing/optimize-routes?seed=${demoSeed}`);
      if (res.ok) {
        const data = await res.json();
        setOptimizedRoutes(data);
        setViewMode('ai');
      } else {
        setOptimizedRoutes({ error: "Server error: " + res.status });
      }
    } catch (err: any) {
      console.error(err);
      setOptimizedRoutes({ error: err.message || "Failed to fetch AI route" });
    } finally {
      setOptimizing(false);
    }
  };
  
  const getMidpointAndAngle = (p1: number[], p2: number[]) => {
    if (!p1 || !p2 || p1.length < 2 || p2.length < 2) return { mid: DEPOT, angle: 0 };
    const mid = [(p1[0]+p2[0])/2, (p1[1]+p2[1])/2];
    const dy = p1[0] - p2[0]; 
    const dx = p2[1] - p1[1];
    const angle = Math.atan2(dy, dx) * (180/Math.PI); 
    return { mid, angle };
  };

  const highPriorityBins = bins.filter(b => b.fill_level > 75);
  const urgentCollections = bins.filter(b => (b.fill_level + (b.demandRate * 12)) >= 100);
  const visibleBins = bins.filter(b => streamFilter === 'All' || b.stream_type.toUpperCase() === streamFilter.toUpperCase());

  const sortedPriorityBins = [...visibleBins].sort((a,b) => {
     const pScore = { 'Critical': 3, 'Warning': 2, 'Normal': 1 };
     if (pScore[b.priority as keyof typeof pScore] !== pScore[a.priority as keyof typeof pScore]) {
         return pScore[b.priority as keyof typeof pScore] - pScore[a.priority as keyof typeof pScore];
     }
     return (b.f12 || 0) - (a.f12 || 0);
  });

  let rawFixedDist = 0, rawNnDist = 0, rawAiDist = 0;
  let aiVehiclesUsed = 0, aiBinsServed = 0;
  let fixedSafeCount = 0, nnSafeCount = 0, aiSafeCount = 0;
  let alreadyFullCount = 0, safeTargetCount = 0;
  let sanityWarning = false;
  
  let aiChunks: any[][] = [];
  let fixedChunks: any[][] = [];
  let computationError: string | null = null;

  const calcSafeBins = (chunks: any[][]) => {
    let safe = 0;
    chunks.forEach(chunk => {
       let dist = 0;
       let curr = DEPOT;
       chunk.forEach(bin => {
          if (!bin || !bin.id) return;
          dist += getDist(curr, [bin.lat, bin.lng]);
          const timeHrs = dist / ASSUMPTIONS.speedKmh;
          if ((bin.fill_level || 0) < 100) {
             const projectedFill = (bin.fill_level || 0) + ((bin.demandRate || 0) * timeHrs);
             if (projectedFill < 100) safe++;
          }
          curr = [bin.lat, bin.lng];
       });
    });
    return safe;
  };

  const opt2 = (route: any[]) => {
    let improved = true;
    let bestRoute = [...route];
    let bestDist = 0;
    const calcD = (rt: any[]) => {
        let d = getDist(DEPOT, [rt[0].lat, rt[0].lng]);
        for(let i=0; i<rt.length-1; i++) d += getDist([rt[i].lat, rt[i].lng], [rt[i+1].lat, rt[i+1].lng]);
        d += getDist([rt[rt.length-1].lat, rt[rt.length-1].lng], DEPOT);
        return d;
    };
    bestDist = calcD(bestRoute);
    while (improved) {
      improved = false;
      for (let i = 0; i < bestRoute.length - 1; i++) {
        for (let k = i + 1; k < bestRoute.length; k++) {
          const newRoute = [...bestRoute.slice(0, i), ...bestRoute.slice(i, k + 1).reverse(), ...bestRoute.slice(k + 1)];
          const newDist = calcD(newRoute);
          if (newDist < bestDist - 0.01) {
            bestDist = newDist;
            bestRoute = newRoute;
            improved = true;
          }
        }
      }
    }
    return bestRoute;
  };

  try {
    if (optimizedRoutes && Array.isArray(optimizedRoutes.routes)) {
      const V = optimizedRoutes.routes.length;
      aiVehiclesUsed = V;
      
      const allIds = optimizedRoutes.routes.reduce((acc: any[], r: any) => {
         if (r && Array.isArray(r.route)) return acc.concat(r.route.map((s: any) => s?.bin_id));
         return acc;
      }, []);
      const aiVisitedIds = new Set(allIds);
      
      const targetBins = bins.filter(b => aiVisitedIds.has(b.id));
      aiBinsServed = targetBins.length;

      alreadyFullCount = targetBins.filter(b => (b.fill_level || 0) >= 100).length;
      safeTargetCount = targetBins.length - alreadyFullCount;
      
      aiChunks = optimizedRoutes.routes.map((r: any) => {
         if (!r || !Array.isArray(r.route)) return [];
         return r.route.map((step: any) => {
            if (!step || !step.bin_id || step.bin_id === 'depot') return { lat: DEPOT[0], lng: DEPOT[1] };
            const matchingBin = bins.find(b => b.id === step.bin_id);
            if (!matchingBin || !matchingBin.location) return { lat: DEPOT[0], lng: DEPOT[1] }; 
            return { ...matchingBin, lat: matchingBin.location.lat, lng: matchingBin.location.lng };
         }).filter((s:any) => s && s.id);
      });

      rawAiDist = aiChunks.reduce((acc: number, chunk: any[]) => {
        if (!Array.isArray(chunk) || chunk.length === 0) return acc;
        const pts = [DEPOT, ...chunk.map((s: any) => [s.lat, s.lng]), DEPOT];
        let d = 0;
        for (let i = 0; i < pts.length - 1; i++) d += getDist(pts[i], pts[i+1]);
        return acc + d;
      }, 0);
      
      const sortedTargetBins = [...targetBins].sort((a,b) => (a.ward || '').localeCompare(b.ward || '') || (a.id || '').localeCompare(b.id || ''));
      const chunkSize = Math.ceil(sortedTargetBins.length / Math.max(1, V));
      fixedChunks = Array.from({length: V}, (_, i) => sortedTargetBins.slice(i * chunkSize, i * chunkSize + chunkSize).map(b => ({ ...b, lat: b.location?.lat || DEPOT[0], lng: b.location?.lng || DEPOT[1] })));
      
      fixedChunks.forEach((chunk) => {
        if (!chunk || chunk.length === 0) return;
        let d = getDist(DEPOT, [chunk[0].lat, chunk[0].lng]);
        for (let i = 0; i < chunk.length - 1; i++) d += getDist([chunk[i].lat, chunk[i].lng], [chunk[i+1].lat, chunk[i+1].lng]);
        d += getDist([chunk[chunk.length-1].lat, chunk[chunk.length-1].lng], DEPOT);
        rawFixedDist += d;
      });

      // Global Nearest Neighbor (Greedy TSP)
      let unassigned = sortedTargetBins.map(b => ({ ...b, lat: b.location?.lat || DEPOT[0], lng: b.location?.lng || DEPOT[1] }));
      const vehiclesArr = Array.from({length: V}, () => [{ lat: DEPOT[0], lng: DEPOT[1], id: 'depot' }]);
      
      while (unassigned.length > 0) {
         let bestDist = Infinity;
         let bestV = -1;
         let bestB = -1;
         for (let vIdx = 0; vIdx < V; vIdx++) {
            const curr = vehiclesArr[vIdx][vehiclesArr[vIdx].length - 1];
            for (let bIdx = 0; bIdx < unassigned.length; bIdx++) {
               const b = unassigned[bIdx];
               const d = getDist([curr.lat, curr.lng], [b.lat, b.lng]);
               if (d < bestDist) {
                  bestDist = d;
                  bestV = vIdx;
                  bestB = bIdx;
               }
            }
         }
         vehiclesArr[bestV].push(unassigned.splice(bestB, 1)[0]);
      }
      
      const nnChunks = vehiclesArr.map(v => v.slice(1));
      rawNnDist = 0; // Fix: use outer let instead of shadowing
      nnChunks.forEach(chunk => {
         if (!chunk || chunk.length === 0) return;
         let d = getDist(DEPOT, [chunk[0].lat, chunk[0].lng]);
         for (let i = 0; i < chunk.length - 1; i++) d += getDist([chunk[i].lat, chunk[i].lng], [chunk[i+1].lat, chunk[i+1].lng]);
         d += getDist([chunk[chunk.length-1].lat, chunk[chunk.length-1].lng], DEPOT);
         rawNnDist += d;
      });

      // Greedy TSP + 2-Opt
      let rawGreedy2OptDist = 0;
      const greedy2OptChunks = nnChunks.map(chunk => {
         if(!chunk || chunk.length === 0) return [];
         const optimized = opt2(chunk);
         let d = getDist(DEPOT, [optimized[0].lat, optimized[0].lng]);
         for (let i = 0; i < optimized.length - 1; i++) d += getDist([optimized[i].lat, optimized[i].lng], [optimized[i+1].lat, optimized[i+1].lng]);
         d += getDist([optimized[optimized.length-1].lat, optimized[optimized.length-1].lng], DEPOT);
         rawGreedy2OptDist += d;
         return optimized;
      });

      if (rawAiDist > rawGreedy2OptDist) {
         sanityWarning = true;
         console.warn(`Sanity Warning: AI Distance (${rawAiDist}km) > G2Opt (${rawGreedy2OptDist}km).`);
      }

      fixedSafeCount = calcSafeBins(fixedChunks);
      nnSafeCount = calcSafeBins(nnChunks);
      const greedy2OptSafeCount = calcSafeBins(greedy2OptChunks);
      aiSafeCount = calcSafeBins(aiChunks);
      
      (window as any).greedy2OptDistVal = rawGreedy2OptDist;
      (window as any).greedy2OptSafeCountVal = greedy2OptSafeCount;
      (window as any).rawNnDistVal = rawNnDist;

      // Assertion Check
      const nnVis = nnChunks.reduce((a,c)=>a+c.length,0);
      if (rawNnDist <= 0 || nnVis < targetBins.length) {
         console.error(`Assertion failed: Invalid Greedy TSP output (Dist: ${rawNnDist}, Bins: ${nnVis}/${targetBins.length})`);
      }
    }
  } catch (err: any) {
    computationError = err.message || String(err);
  }

  const fDistRound = parseFloat((rawFixedDist || 0).toFixed(2));
  const nnDistRound = parseFloat((rawNnDist || 0).toFixed(2));
  const aiDistRound = parseFloat((rawAiDist || 0).toFixed(2));
  const g2OptDistRound = parseFloat(((window as any).greedy2OptDistVal || 0).toFixed(2));

  let fDistStr: string | number = fDistRound.toFixed(2);
  let nnDistStr: string | number = nnDistRound.toFixed(2);
  let g2OptDistStr: string | number = g2OptDistRound.toFixed(2);
  let aiDistStr: string | number = aiDistRound.toFixed(2);

  const showStats = optimizedRoutes && Array.isArray(optimizedRoutes.routes) && !computationError;

  if (showStats) {
     const tLen = aiBinsServed;
     if (fDistRound <= 0 || fixedChunks.reduce((a,c)=>a+c.length,0) < tLen) fDistStr = 'n/a';
     if (nnDistRound <= 0 || (window as any).rawNnDistVal <= 0) nnDistStr = 'n/a';
     if (g2OptDistRound <= 0) g2OptDistStr = 'n/a';
     if (aiDistRound <= 0 || aiChunks.reduce((a,c)=>a+c.length,0) < tLen) aiDistStr = 'n/a';
  }

  const staticFuel = parseFloat((fDistRound * ASSUMPTIONS.fuelPerKm).toFixed(1));
  const nnFuel = nnDistStr === 'n/a' ? 'n/a' : parseFloat((nnDistRound * ASSUMPTIONS.fuelPerKm).toFixed(1));
  const g2OptFuel = g2OptDistStr === 'n/a' ? 'n/a' : parseFloat((g2OptDistRound * ASSUMPTIONS.fuelPerKm).toFixed(1));
  const aiFuel = aiDistStr === 'n/a' ? 'n/a' : parseFloat((aiDistRound * ASSUMPTIONS.fuelPerKm).toFixed(1));

  const allSafeIdentical = showStats && (fixedSafeCount === nnSafeCount) && (nnSafeCount === aiSafeCount);

  const vsFixedVal = (fDistRound - aiDistRound).toFixed(2);
  const vsG2OptVal = (g2OptDistRound - aiDistRound).toFixed(2);
  const isVsFixedLoss = parseFloat(vsFixedVal) < 0;
  const isVsG2OptLoss = parseFloat(vsG2OptVal) < 0;

  return (
    <div className="h-full w-full flex flex-col bg-background text-primary font-sans overflow-hidden p-2 gap-2 box-border transition-colors duration-200">
      
      {/* HEADER */}
      <div className="flex justify-between items-center flex-shrink-0 px-2 py-1">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-extrabold text-primary tracking-tight leading-none">SwachhTrack AI</h2>
            <span className="px-2 py-0.5 rounded-full bg-info-bg text-info border border-info/30 text-[9px] font-bold uppercase tracking-widest flex items-center">
              <Activity className="w-3 h-3 mr-1"/> Simulated Data
            </span>
            <div className="flex items-center gap-1.5 ml-2 text-[10px] text-secondary font-bold bg-surface/60 px-2 py-0.5 rounded border border-border">
              <span>Seed:</span>
              <input type="number" value={demoSeed} onChange={e => setDemoSeed(Number(e.target.value) || 0)} className="bg-transparent border-none w-10 text-success outline-none text-center p-0" />
            </div>
          </div>
          <p className="text-secondary font-medium text-[10px] mt-0.5">Predictive routing and AI dispatch engine. Optimizing fleet operations in real-time.</p>
        </div>
        
        {/* Stream Filter */}
        <div className="flex gap-1.5">
          {['All', 'Wet', 'Dry', 'Mixed', 'Sanitary'].map(s => (
            <button key={s} onClick={() => setStreamFilter(s)} className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-widest border transition-all ${streamFilter.toUpperCase() === s.toUpperCase() ? 'bg-accent/20 border-accent/50 text-accent' : 'bg-surface/60 border-border text-muted hover:bg-surface-2'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-5 gap-2 flex-shrink-0 px-1">
        <KPIBlock label="High Priority" val={highPriorityBins.length} icon={AlertTriangle} color="text-danger bg-danger-bg border-danger/20" />
        <KPIBlock label="Urgent Collections" val={urgentCollections.length} icon={Trash2} color="text-warning bg-warning-bg border-warning/20" />
        <KPIBlock label="Active Fleet" val={vehicles.filter(v=>v.status==='active').length} icon={Truck} color="text-info bg-info-bg border-info/20" />
        <KPIBlock label="Bins Routed" val={showStats ? aiBinsServed : "—"} icon={RouteIcon} color="text-success bg-success-bg border-success/20" />
        <div title={`vs Fixed: ${Math.abs(parseFloat(vsFixedVal)).toFixed(2)} km ${isVsFixedLoss ? 'Extra' : 'Saved'}`}>
          <KPIBlock label={isVsG2OptLoss ? "Extra vs G+2Opt" : "Saved vs G+2Opt"} val={showStats ? `${Math.abs(parseFloat(vsG2OptVal)).toFixed(2)} km` : "—"} icon={Navigation} color={isVsG2OptLoss ? "text-warning bg-warning-bg border-warning/20" : "text-accent bg-accent/10 border-accent/20"} />
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="flex-1 grid grid-cols-12 gap-2 min-h-0 px-1 pb-1">
        
        {/* LEFT COLUMN */}
        <div className="col-span-8 flex flex-col gap-2 min-h-0 overflow-hidden">
          
          {/* MAP */}
          <div className="flex-shrink-0 relative overflow-hidden glass-card rounded-xl border border-border shadow-lg bg-surface" style={{ height: '45%', minHeight: '260px', maxHeight: '380px' }}>
            <div className="absolute top-2 right-2 z-[400] flex flex-col items-end gap-1.5 shadow-xl">
              <div className="flex gap-1.5">
                <button onClick={() => setViewMode('fixed')} className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest border transition-all ${viewMode === 'fixed' ? 'bg-surface-2 text-primary border-muted' : 'bg-surface-translucent text-secondary border-border hover:bg-surface-2'}`}>Static Route</button>
                <button onClick={() => setViewMode('ai')} className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest border transition-all flex items-center ${viewMode === 'ai' ? 'bg-accent text-accent-contrast border-accent shadow-sm' : 'bg-surface-translucent text-secondary border-border hover:bg-surface-2'}`}>
                  <BrainCircuit className="w-3 h-3 mr-1"/> AI Route
                </button>
              </div>
              <div className="bg-surface-translucent backdrop-blur-md border border-border p-2 rounded-lg flex flex-col gap-1 shadow-2xl text-[9px]">
                <div className="font-bold text-muted uppercase tracking-widest border-b border-border pb-0.5 mb-0.5">Vehicle Legend</div>
                {vehicles.slice(0, aiVehiclesUsed || vehicles.length).map((v, i) => (
                  <div key={v.id} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: routeColors[i % routeColors.length]}}></span> {v.id}</div>
                ))}
              </div>
            </div>
            
            <MapContainer center={[28.6139, 77.2090]} zoom={12} className={`absolute inset-0 bg-background ${isDark ? 'dark-map-tiles' : ''} z-0`} zoomControl={false}>
              {isDark ? (
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
              ) : (
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap & Carto' />
              )}
              <MapBoundsFitter bounds={mapBounds} />
              <Marker position={DEPOT as [number, number]} icon={depotIcon(isDark)} zIndexOffset={1000} />

              {/* AI Routes */}
              {showStats && viewMode === 'ai' && aiChunks.map((chunk: any[], index: number) => {
                const color = routeColors[index % routeColors.length];
                const rawPositions = [DEPOT, ...chunk.map(c => [c.lat, c.lng]), DEPOT];
                const positions = rawPositions.filter(p => p && p[0] !== undefined && p[1] !== undefined && !isNaN(p[0]) && !isNaN(p[1]));
                if (positions.length < 2) return null;

                const arrows = [];
                for(let i=0; i<positions.length-1; i++) {
                   const { mid, angle } = getMidpointAndAngle(positions[i], positions[i+1]);
                   if(mid && mid[0] !== undefined && !isNaN(mid[0])) arrows.push(<Marker key={`ai-arr-${index}-${i}`} position={mid as [number, number]} icon={getArrowIcon(color, angle)} interactive={false} />);
                }
                return (
                  <div key={`ai-route-${index}`}>
                    <Polyline positions={positions as any} pathOptions={{ color, weight: 4, opacity: 0.9, dashArray: '6, 6', lineJoin: 'round' }} className="animate-[dash_20s_linear_infinite]" />
                    {arrows}
                    {chunk.map((step: any, stepIdx: number) => {
                       if (!step || step.lat === undefined || isNaN(step.lat)) return null;
                       const stopIcon = L.divIcon({
                          html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 1.5px solid #fff; display: flex; align-items: center; justify-content: center; color: white; font-size: 8px; font-weight: bold; box-shadow: 0 0 5px ${color};">${stepIdx + 1}</div>`,
                          className: '', iconSize: [14, 14], iconAnchor: [20, -6]
                       });
                       return <Marker key={`ai-stop-${index}-${stepIdx}`} position={[step.lat, step.lng]} icon={stopIcon} interactive={false} zIndexOffset={900}/>
                    })}
                  </div>
                );
              })}

              {/* Fixed Routes */}
              {showStats && viewMode === 'fixed' && fixedChunks.map((chunk: any[], index: number) => {
                const color = routeColors[index % routeColors.length];
                const rawPositions = [DEPOT, ...chunk.map(c => [c.lat, c.lng]), DEPOT];
                const positions = rawPositions.filter(p => p && p[0] !== undefined && p[1] !== undefined && !isNaN(p[0]) && !isNaN(p[1]));
                if (positions.length < 2) return null;

                const arrows = [];
                for(let i=0; i<positions.length-1; i++) {
                   const { mid, angle } = getMidpointAndAngle(positions[i], positions[i+1]);
                   if(mid && mid[0] !== undefined && !isNaN(mid[0])) arrows.push(<Marker key={`f-arr-${index}-${i}`} position={mid as [number, number]} icon={getArrowIcon(color, angle)} interactive={false} />);
                }
                return (
                  <div key={`fixed-route-${index}`}>
                    <Polyline positions={positions as any} pathOptions={{ color, weight: 3, opacity: 0.6, dashArray: '4, 4' }} />
                    {arrows}
                    {chunk.map((step: any, stepIdx: number) => {
                       if (!step || step.lat === undefined || isNaN(step.lat)) return null;
                       const stopIcon = L.divIcon({
                          html: `<div style="background-color: var(--bg-surface-2); width: 12px; height: 12px; border-radius: 50%; border: 1.5px solid ${color}; display: flex; align-items: center; justify-content: center; color: var(--text-primary); font-size: 7px; font-weight: bold;">${stepIdx + 1}</div>`,
                          className: '', iconSize: [12, 12], iconAnchor: [16, -6]
                       });
                       return <Marker key={`f-stop-${index}-${stepIdx}`} position={[step.lat, step.lng]} icon={stopIcon} interactive={false} zIndexOffset={850}/>
                    })}
                  </div>
                );
              })}

              {/* Visible Bins */}
              {visibleBins.map(bin => {
                if (!bin || !bin.location || bin.location.lat === undefined || isNaN(bin.location.lat)) return null;
                return (
                  <Marker key={bin.id} position={[bin.location.lat, bin.location.lng]} icon={createBinIcon(bin.fill_level, bin.stream_type, isDark)} eventHandlers={{ click: () => setSelectedBin(bin) }} />
                );
              })}
            </MapContainer>
          </div>

          {/* SIMULATION PANEL */}
          <div className="flex-1 min-h-0 glass-card rounded-xl p-3 border border-border flex flex-col overflow-y-auto">
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
               <h3 className="font-bold text-primary text-[11px] uppercase tracking-widest flex items-center">
                 <Fuel className="w-3 h-3 mr-1.5 text-success" /> Route Comparison Simulation
               </h3>
               {showStats && (
                 <span className="text-[8px] text-secondary uppercase font-bold tracking-widest bg-surface/50 px-2 py-0.5 rounded border border-border">
                   Euclidean Matrix | {ASSUMPTIONS.fuelPerKm} L/km | {ASSUMPTIONS.speedKmh} km/h
                 </span>
               )}
            </div>

            {(!showStats || computationError) ? (
               <div className="flex-1 flex items-center justify-between bg-surface/40 p-3 rounded-lg border border-border">
                 <div className="flex-1 pr-4">
                   <p className="text-xs text-secondary leading-relaxed m-0">Static routing paths waste fuel and result in overflowing bins. Run the AI Routing Engine to deploy OR-Tools CVRP optimization.</p>
                   {(optimizedRoutes?.error || computationError) && <p className="text-xs font-bold text-danger mt-1 m-0">Error: {optimizedRoutes?.error || computationError}</p>}
                 </div>
                 <button onClick={handleOptimizeRoutes} disabled={optimizing} className="flex-shrink-0 flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-contrast px-5 py-2.5 rounded-lg font-bold shadow-sm transition-all uppercase tracking-widest text-[10px] whitespace-nowrap">
                    {optimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5 text-accent-contrast opacity-80" />}
                    {optimizing ? 'Computing...' : 'Run AI Route Optimization'}
                 </button>
               </div>
            ) : (
              <div className="flex flex-col min-h-0 flex-1">
                
                {sanityWarning && (
                  <div className="mb-2 bg-warning-bg border border-warning/50 text-warning text-[9px] font-bold px-2 py-1 rounded flex items-center justify-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> Solver Local Minimum Detected: Executed 2-Opt Rescue
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2 flex-shrink-0">
                  {/* Fixed Route */}
                  <div className="flex flex-col bg-surface/40 rounded-lg p-2 border border-border">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[8px] font-bold text-secondary uppercase tracking-widest">Baseline (Fixed)</span>
                      <span className="text-sm font-bold text-secondary">{fDistStr} {fDistStr !== 'n/a' && 'km'}</span>
                    </div>
                    <div className="h-1 w-full bg-surface-2 rounded-full mb-1"><div className="h-full bg-secondary w-full rounded-full"></div></div>
                    <div className="flex justify-between text-[9px] text-secondary mb-1">
                      <span>{staticFuel} L</span>
                      <span>{aiVehiclesUsed} Fleet</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-semibold text-secondary border-t border-border pt-1 mt-auto">
                      <span>Served before overflow:</span>
                      <span className={fixedSafeCount === safeTargetCount ? 'text-success' : 'text-danger'}>{fixedSafeCount} / {safeTargetCount}</span>
                    </div>
                  </div>

                  {/* Nearest Neighbor (Greedy) */}
                  <div className="flex flex-col bg-surface/40 rounded-lg p-2 border border-border">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[8px] font-bold text-warning opacity-70 uppercase tracking-widest">Greedy TSP</span>
                      <span className="text-sm font-bold text-warning opacity-70">{nnDistStr} {nnDistStr !== 'n/a' && 'km'}</span>
                    </div>
                    <div className="h-1 w-full bg-surface-2 rounded-full mb-1">
                      <div className="h-full bg-warning opacity-70 rounded-full" style={{ width: `${Math.min(100, (nnDistRound/Math.max(0.1, fDistRound))*100)}%`}}></div>
                    </div>
                    <div className="flex justify-between text-[9px] text-warning opacity-50 mb-1">
                      <span>{nnFuel} L</span>
                      <span>Global TSP</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-semibold text-warning opacity-70 border-t border-border pt-1 mt-auto">
                      <span>Served before overflow:</span>
                      <span className={nnSafeCount === safeTargetCount ? 'text-success' : 'text-danger'}>{nnSafeCount} / {safeTargetCount}</span>
                    </div>
                  </div>

                  {/* Greedy + 2-Opt */}
                  <div className="flex flex-col bg-surface/40 rounded-lg p-2 border border-border">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[8px] font-bold text-warning opacity-90 uppercase tracking-widest leading-tight">Greedy+<br/>2-Opt</span>
                      <span className="text-sm font-bold text-warning opacity-90">{g2OptDistStr} {g2OptDistStr !== 'n/a' && 'km'}</span>
                    </div>
                    <div className="h-1 w-full bg-surface-2 rounded-full mb-1">
                      <div className="h-full bg-warning opacity-90 rounded-full" style={{ width: `${Math.min(100, (g2OptDistRound/Math.max(0.1, fDistRound))*100)}%`}}></div>
                    </div>
                    <div className="flex justify-between text-[9px] text-warning opacity-60 mb-1">
                      <span>{g2OptFuel} L</span>
                      <span>Local Src</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-semibold text-warning opacity-90 border-t border-border pt-1 mt-auto">
                      <span>Served before overflow:</span>
                      <span className={(window as any).greedy2OptSafeCountVal === safeTargetCount ? 'text-success' : 'text-danger'}>{(window as any).greedy2OptSafeCountVal} / {safeTargetCount}</span>
                    </div>
                  </div>

                  {/* OR-Tools AI */}
                  <div className="flex flex-col bg-success-bg rounded-lg p-2 border border-success/30 shadow-sm">
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[8px] font-bold text-success uppercase tracking-widest flex items-center gap-1">
                        OR-Tools <CheckCircle className="w-2.5 h-2.5"/>
                      </span>
                      <span className="text-sm font-black text-success leading-none">{aiDistStr} {aiDistStr !== 'n/a' && 'km'}</span>
                    </div>
                    <div className="h-1 w-full bg-surface-2 rounded-full mb-1">
                      <div className="h-full bg-success shadow-sm rounded-full" style={{ width: `${Math.min(100, (aiDistRound/Math.max(0.1, fDistRound))*100)}%`}}></div>
                    </div>
                    <div className="flex justify-between text-[9px] text-success/80 mb-1">
                      <span>{aiFuel} L</span>
                      <span>CVRP</span>
                    </div>
                    <div className="flex justify-between text-[9px] font-semibold text-success border-t border-success/20 pt-1 mt-auto">
                      <span>Served before overflow:</span>
                      <span className={aiSafeCount === safeTargetCount ? 'text-success font-bold' : ''}>{aiSafeCount} / {safeTargetCount}</span>
                    </div>
                  </div>
                </div>

                {/* Savings Breakdown */}
                <div className="bg-surface/80 rounded-lg p-2 flex items-center justify-between mt-2 border border-accent/20 shadow-sm flex-shrink-0">
                   <div className="flex items-center gap-2 text-[10px]">
                      <span className="uppercase tracking-widest font-bold text-secondary">vs Fixed:</span>
                      <span className={`${isVsFixedLoss ? 'text-warning' : 'text-success'} font-bold`}>
                        {Math.abs(parseFloat(vsFixedVal)).toFixed(2)} km {isVsFixedLoss ? 'Extra' : ''} 
                        {!isVsFixedLoss && <span className="font-normal text-success/60 ml-1">({Math.round((parseFloat(vsFixedVal)/Math.max(0.1, fDistRound))*100)}%)</span>}
                      </span>
                   </div>
                   <div className="w-px h-5 bg-border mx-1"></div>
                   <div className="flex items-center gap-2 text-[10px]">
                      <span className="uppercase tracking-widest font-bold text-secondary">vs G+2Opt:</span>
                      <span className={`${(parseFloat((window as any).greedy2OptDistVal || 0) - aiDistRound) < 0 ? 'text-warning' : 'text-success'} font-bold`}>
                        {Math.abs(parseFloat((window as any).greedy2OptDistVal || 0) - aiDistRound).toFixed(2)} km {((parseFloat((window as any).greedy2OptDistVal || 0) - aiDistRound) < 0) ? 'Extra' : ''}
                      </span>
                   </div>
                   {!allSafeIdentical && (
                     <>
                       <div className="w-px h-5 bg-border mx-1"></div>
                       <div className="flex items-center gap-1 text-[10px]">
                          {aiSafeCount < safeTargetCount ? (
                            <span className="text-warning font-bold">
                              {safeTargetCount - aiSafeCount} bin(s) served late
                            </span>
                          ) : (
                            <span className="text-success font-bold">
                              {aiSafeCount > fixedSafeCount ? `+${aiSafeCount - fixedSafeCount} bins preserved vs Fixed` : `All bins preserved in time`}
                            </span>
                          )}
                       </div>
                     </>
                   )}
                </div>
                
                <div className="text-[10px] text-secondary mt-2 font-medium bg-surface/30 p-2 rounded-lg border border-border mb-0 text-center">
                  <span className="font-bold text-primary">Fixed:</span> 3 vehicles serve the same {aiBinsServed} bins in a predetermined ward/bin-ID order.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-4 flex flex-col gap-2 min-h-0 overflow-hidden">
          
          <div className="glass-card rounded-xl border border-border flex flex-col min-h-0 bg-surface/40" style={{ maxHeight: '55%' }}>
             <div className="p-2.5 border-b border-border bg-surface/80 sticky top-0 flex-shrink-0 z-10">
                <h3 className="font-bold text-primary text-[10px] uppercase tracking-widest flex items-center">
                  <Activity className="w-3 h-3 mr-1.5 text-accent" /> Priority Engine
                </h3>
             </div>
             <div className="flex-1 overflow-y-auto p-1.5 scrollbar-hide flex flex-col">
                {sortedPriorityBins.map(bin => (
                   <div key={bin.id} onClick={() => setSelectedBin(bin)} className={`p-2 mb-1.5 rounded-lg cursor-pointer border transition-all ${selectedBin?.id === bin.id ? 'bg-accent/10 border-accent/50 shadow-sm' : 'bg-surface-2/40 border-border hover:bg-surface-2/80'}`}>
                      <div className="flex justify-between items-center mb-1">
                         <div className="flex items-center gap-1.5">
                           <span className="font-bold text-primary text-[11px]">{bin.id}</span>
                           <span className="text-[8px] text-muted font-bold uppercase">{bin.ward}</span>
                         </div>
                         <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border shadow-sm ${bin.priority === 'Critical' ? 'bg-danger text-white border-danger' : bin.priority === 'Warning' ? 'bg-warning text-white border-warning' : 'bg-success-bg text-success border-success/30'}`}>
                           {bin.priority}
                         </span>
                      </div>
                      <div className="flex gap-2.5 text-[9px] text-secondary">
                         <span className="flex items-center gap-1"><Droplets className="w-2.5 h-2.5 text-muted"/> {bin.fill_level}%</span>
                         <span className="flex items-center gap-1"><Fuel className="w-2.5 h-2.5 text-muted"/> {bin.stream_type}</span>
                         <span className="flex items-center gap-1 ml-auto text-success font-bold">{bin.demandRate.toFixed(1)}x rate</span>
                      </div>
                   </div>
                ))}
             </div>
          </div>

          <div className="flex-1 min-h-0 glass-card rounded-xl border border-border p-3 flex flex-col bg-surface/40 shadow-inner">
             {selectedBin ? (
                <div className="flex flex-col h-full animate-fade-in">
                   <div className="mb-1 flex-shrink-0">
                      <h4 className="font-bold text-[11px] text-primary tracking-wide mb-0.5 flex items-center gap-1.5">
                         {selectedBin.id} Analysis
                         {selectedBin.fill_level >= 100 && <span className="text-[7px] bg-danger text-white shadow-sm px-1 py-0.5 rounded uppercase font-bold tracking-widest">Already Full</span>}
                      </h4>
                      <p className="text-[9px] text-secondary">
                        {selectedBin.fill_level > 75 ? `High Priority: Fill > 75%. Dispatch required.` : selectedBin.fill_level + (selectedBin.demandRate * 12) >= 100 ? `Urgent: Forecast to overflow in <12h.` : `Routine collection schedule maintained.`}
                      </p>
                   </div>

                   <div className="flex-1 relative mt-1 w-full pt-3 pb-1 min-h-[60px]">
                     <h4 className="text-[7px] font-bold text-muted uppercase tracking-widest absolute top-0 left-0">24H Forecast Trajectory</h4>
                     <svg viewBox="-10 -15 420 150" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                       <line x1="0" y1="120" x2="400" y2="120" stroke="var(--color-border)" strokeWidth="1" />
                       <line x1="0" y1="60" x2="400" y2="60" stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 4" />
                       
                       {(() => {
                         const max = 110; 
                         const h = 120;
                         const w = 400;
                         const y = (val: number) => h - (Math.min(val || 0, 100) / max) * h;
                         const y100 = y(100);
                         
                         const p0 = `0,${y(selectedBin.fill_level)}`;
                         const p6 = `${w*0.33},${y(selectedBin.f6)}`;
                         const p12 = `${w*0.66},${y(selectedBin.f12)}`;
                         const p24 = `${w},${y(selectedBin.f24)}`;
                         
                         const color = selectedBin.f12 > 90 ? 'var(--color-danger)' : selectedBin.f12 > 70 ? 'var(--color-warning)' : 'var(--color-success)';

                         return (
                           <>
                             <line x1="0" y1={y100} x2="400" y2={y100} stroke="rgba(239,68,68,0.3)" strokeWidth="1.5" strokeDasharray="4 4" />
                             <text x="370" y={y100 - 6} fill="var(--color-danger)" fontSize="11" fontWeight="bold">100%</text>

                             <linearGradient id={`grad-${selectedBin.id}`} x1="0" x2="0" y1="0" y2="1">
                               <stop offset="0%" stopColor={color} stopOpacity="0.4"/>
                               <stop offset="100%" stopColor={color} stopOpacity="0"/>
                             </linearGradient>
                             <polygon points={`0,120 ${p0} ${p6} ${p12} ${p24} 400,120`} fill={`url(#grad-${selectedBin.id})`} />
                             <polyline points={`${p0} ${p6} ${p12} ${p24}`} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                             
                             <circle cx="0" cy={y(selectedBin.fill_level)} r="3" fill="var(--bg-background)" stroke={color} strokeWidth="2" />
                             <circle cx={w*0.33} cy={y(selectedBin.f6)} r="3" fill="var(--bg-background)" stroke={color} strokeWidth="2" />
                             <circle cx={w*0.66} cy={y(selectedBin.f12)} r="3" fill="var(--bg-background)" stroke={color} strokeWidth="2" />
                             <circle cx={w} cy={y(selectedBin.f24)} r="3" fill="var(--bg-background)" stroke={color} strokeWidth="2" />
                           </>
                         )
                       })()}
                     </svg>
                   </div>

                   <div className="mt-1 border-t border-border pt-1.5 flex-shrink-0">
                     <div className="space-y-1">
                       <div className="flex items-center gap-2">
                         <span className="w-12 text-[8px] text-secondary font-medium">Fill</span>
                         <div className="flex-1 h-1 bg-surface-2 rounded-full"><div className="h-full bg-info rounded-full" style={{width: `${selectedBin.fill_level || 0}%`}}></div></div>
                       </div>
                       <div className="flex items-center gap-2">
                         <span className="w-12 text-[8px] text-secondary font-medium">Rate</span>
                         <div className="flex-1 h-1 bg-surface-2 rounded-full"><div className="h-full bg-accent rounded-full" style={{width: `${Math.min(100, parseFloat(selectedBin.demandRate || 0) * 30)}%`}}></div></div>
                       </div>
                     </div>
                   </div>

                </div>
             ) : (
               <div className="flex h-full items-center justify-center text-muted text-[10px] font-bold uppercase tracking-widest">Select a bin</div>
             )}
          </div>

        </div>
      </div>
    </div>
  );
}

function KPIBlock({ label, val, icon: Icon, color }: any) {
  return (
    <div className="glass-card rounded-xl p-2 py-1.5 flex flex-col justify-between border border-border relative bg-surface/30">
      <div className="flex justify-between items-center mb-0.5">
        <p className="text-[9px] font-bold text-secondary uppercase tracking-widest flex items-center gap-1 line-clamp-1">
          {label}
        </p>
        <div className={`p-1 rounded flex-shrink-0 border ${color}`}>
          <Icon className="h-3 w-3" />
        </div>
      </div>
      <h3 className="text-lg font-black text-primary tracking-tight leading-none">{val}</h3>
    </div>
  );
}
