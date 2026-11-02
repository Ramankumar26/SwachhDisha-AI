import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap, Polyline } from 'react-leaflet';
import { Camera, MapPin, Send, Loader2, CheckCircle, Truck, Bell, Smartphone, Clock, Trophy, Gift, Medal, ArrowUpCircle, Star, Info, Upload, ChevronRight, X, User } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { sharedSeedIncidents, sharedSeedHotspots } from '../data/sharedSeedData';
import { useTheme } from '../context/ThemeContext';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const truckIcon = (isDark: boolean) => L.divIcon({
  html: `<div style="background-color: var(--color-info); width: 40px; height: 40px; border-radius: 50%; border: 3px solid ${isDark ? '#fff' : '#cbd5e1'}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px var(--color-info); position: relative;"><span style="font-size: 20px;">🚛</span></div>`,
  className: '', iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -20]
});
const homeIcon = (isDark: boolean) => L.divIcon({
  html: `<div style="background-color: var(--color-success); width: 32px; height: 32px; border-radius: 50%; border: 2px solid ${isDark ? '#fff' : '#cbd5e1'}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px var(--color-success);"><span style="font-size: 16px;">🏠</span></div>`,
  className: '', iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16]
});
const customPinIcon = (isDark: boolean) => L.divIcon({
  html: `<div style="background-color: var(--color-danger); width: 24px; height: 24px; border-radius: 50% 50% 50% 0; border: 2px solid ${isDark ? '#fff' : '#cbd5e1'}; transform: rotate(-45deg); box-shadow: 0 0 10px var(--color-danger);"></div>`,
  className: '', iconSize: [24, 24], iconAnchor: [12, 24]
});

const wardCenters = [
  { name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
  { name: 'Karol Bagh', lat: 28.6550, lng: 77.1888 },
  { name: 'Rohini', lat: 28.7495, lng: 77.1165 },
  { name: 'Dwarka', lat: 28.5823, lng: 77.0500 },
  { name: 'Saket', lat: 28.5244, lng: 77.2066 },
];

const getNearestWard = (lat: number, lng: number) => {
  let minD = Infinity; let nearest = 'Central';
  wardCenters.forEach(w => {
    const d = Math.sqrt(Math.pow(w.lat - lat, 2) + Math.pow(w.lng - lng, 2));
    if (d < minD) { minD = d; nearest = w.name; }
  });
  return nearest;
};

const MapBoundsFitter = ({ bounds }: { bounds: L.LatLngBounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds.isValid()) {
       map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [bounds, map]);
  return null;
};

const LocationPicker = ({ position, setPosition, setWard, setAddress, isDark }: any) => {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setWard(getNearestWard(e.latlng.lat, e.latlng.lng));
      setAddress('Detected location near ' + getNearestWard(e.latlng.lat, e.latlng.lng));
    },
  });
  return position ? <Marker position={position} icon={customPinIcon(isDark)} draggable eventHandlers={{ dragend: (e) => { const latlng = e.target.getLatLng(); setPosition(latlng); setWard(getNearestWard(latlng.lat, latlng.lng)); setAddress('Detected location near ' + getNearestWard(latlng.lat, latlng.lng)); } }}></Marker> : null;
};

export default function CitizenView() {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'report' | 'track' | 'rewards'>('report');
  
  // -- User State (Simulated) --
  const [myReports, setMyReports] = useState<any[]>([]);
  const [greenCredits, setGreenCredits] = useState(450);
  const [pointsHistory, setPointsHistory] = useState([
    { id: 1, action: 'Weekly Segregation Streak', points: 20, date: '2 days ago' },
    { id: 2, action: 'Report Verified (INC-008)', points: 50, date: '1 week ago' },
  ]);

  // -- Report Issue State --
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [ward, setWard] = useState<string>('');
  const [category, setCategory] = useState('');
  const [severity, setSeverity] = useState('Low');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<any>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // Use my location
  const useMyLocation = () => {
    const lat = 28.6139 + (Math.random() * 0.05 - 0.025);
    const lng = 77.2090 + (Math.random() * 0.05 - 0.025);
    setPosition(L.latLng(lat, lng));
    setWard(getNearestWard(lat, lng));
    setAddress('Detected location near ' + getNearestWard(lat, lng));
  };

  const handlePhotoUpload = (e: any) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setPhoto(url);
    }
  };

  const submitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!position || !category) return;
    setSubmitting(true);
    
    setTimeout(() => {
      // Check duplicate
      const dup = sharedSeedIncidents.find(inc => inc.type === category && Math.sqrt(Math.pow(inc.lat - position.lat, 2) + Math.pow(inc.lng - position.lng, 2)) < 0.001);
      if (dup) {
        setIsDuplicate(true);
      } else {
        const newId = `INC-${Math.floor(100 + Math.random() * 900)}`;
        const newReport = { id: newId, lat: position.lat, lng: position.lng, ward, type: category, status: 'pending', severity: severity.toLowerCase(), reported_at: 'Just now' };
        sharedSeedIncidents.unshift(newReport);
        setMyReports([newReport, ...myReports]);
        setIsDuplicate(false);
        setSubmittedReport(newReport);
      }
      setSubmitting(false);
    }, 1200);
  };

  const simulateVerification = () => {
    if (!submittedReport) return;
    setMyReports(prev => prev.map(r => r.id === submittedReport.id ? { ...r, status: 'in-progress' } : r));
    const inc = sharedSeedIncidents.find(i => i.id === submittedReport.id);
    if (inc) inc.status = 'in-progress';
    setGreenCredits(prev => prev + 50);
    setPointsHistory([{ id: Date.now(), action: `Report Verified (${submittedReport.id})`, points: 50, date: 'Just now' }, ...pointsHistory]);
  };

  // -- Track My Truck State --
  const truckRoute = [
    { lat: 28.6315, lng: 77.2167 },
    { lat: 28.6350, lng: 77.2150 },
    { lat: 28.6400, lng: 77.2100 },
    { lat: 28.6450, lng: 77.2050 }, // User home approx
  ];
  const [truckStep, setTruckStep] = useState(0);
  const [smsPhone, setSmsPhone] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const [smsScheduled, setSmsScheduled] = useState(false);
  const truckEta = Math.max(0, (truckRoute.length - 1 - (truckStep / 10)) * 5); // 5 mins per segment
  
  useEffect(() => {
    let int: any;
    if (activeTab === 'track' && truckStep < (truckRoute.length - 1) * 10) {
      int = setInterval(() => setTruckStep(prev => prev + 1), 1000);
    }
    return () => clearInterval(int);
  }, [activeTab, truckStep]);

  const currentTruckPos = useMemo(() => {
    const seg = Math.floor(truckStep / 10);
    if (seg >= truckRoute.length - 1) return truckRoute[truckRoute.length - 1];
    const p1 = truckRoute[seg]; const p2 = truckRoute[seg + 1];
    const frac = (truckStep % 10) / 10;
    return { lat: p1.lat + (p2.lat - p1.lat) * frac, lng: p1.lng + (p2.lng - p1.lng) * frac };
  }, [truckStep]);

  const handleSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (smsPhone.length === 10 && smsConsent) {
      setSmsScheduled(true);
      if (!pointsHistory.find(p => p.action === 'Truck SMS Subscription')) {
        setGreenCredits(prev => prev + 10);
        setPointsHistory([{ id: Date.now(), action: 'Truck SMS Subscription', points: 10, date: 'Just now' }, ...pointsHistory]);
      }
    }
  };

  return (
    <div className="h-full flex flex-col p-6 bg-background overflow-y-auto lg:overflow-hidden text-[12px] transition-colors duration-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 shrink-0 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black text-primary tracking-wide">Citizen Portal</h1>
            <span className="bg-success-bg text-success border border-success/30 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">SIMULATED DATA</span>
          </div>
          <p className="text-secondary">Participate in making Delhi cleaner and earn rewards.</p>
        </div>
        
        {/* TABS */}
        <div className="flex space-x-2 bg-surface border border-border p-1.5 rounded-xl self-stretch md:self-auto overflow-x-auto">
          <button onClick={() => setActiveTab('report')} className={`px-4 py-2 rounded-lg font-bold uppercase tracking-widest transition-all flex items-center whitespace-nowrap ${activeTab === 'report' ? 'bg-accent text-accent-contrast' : 'text-secondary hover:text-primary'}`} aria-label="Report Issue">
            <Camera className="w-4 h-4 mr-2" /> Report Issue
          </button>
          <button onClick={() => setActiveTab('track')} className={`px-4 py-2 rounded-lg font-bold uppercase tracking-widest transition-all flex items-center whitespace-nowrap ${activeTab === 'track' ? 'bg-accent text-accent-contrast' : 'text-secondary hover:text-primary'}`} aria-label="Track My Truck">
            <Truck className="w-4 h-4 mr-2" /> Track My Truck
          </button>
          <button onClick={() => setActiveTab('rewards')} className={`px-4 py-2 rounded-lg font-bold uppercase tracking-widest transition-all flex items-center whitespace-nowrap ${activeTab === 'rewards' ? 'bg-success text-accent-contrast' : 'text-secondary hover:text-primary'}`} aria-label="Swachh Rewards">
            <Trophy className="w-4 h-4 mr-2" /> Swachh Rewards
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* --- REPORT ISSUE TAB --- */}
        {activeTab === 'report' && (
          <>
            <div className="w-full lg:w-7/12 flex flex-col gap-4 min-h-0 animate-fade-in shrink-0 lg:shrink">
              <div className="glass-card bg-surface/60 rounded-xl border border-border p-5 flex flex-col h-full overflow-y-auto scrollbar-hide">
                {submittedReport || isDuplicate ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <div className="w-20 h-20 bg-success-bg rounded-full flex items-center justify-center mb-4 border border-success/30 mx-auto">
                      <CheckCircle className="w-10 h-10 text-success" />
                    </div>
                    <h2 className="text-xl font-black text-primary mb-2 uppercase tracking-widest">{isDuplicate ? 'Already Reported' : 'Report Submitted'}</h2>
                    <p className="text-secondary max-w-md mb-6 leading-relaxed mx-auto">
                      {isDuplicate ? "Another citizen recently reported this issue near this location. We've added your vote to prioritize it." : `Your report (${submittedReport.id}) in ${submittedReport.ward} has been logged. ETA for review is 2 hours.`}
                    </p>
                    {submittedReport && (
                      <div className="bg-warning-bg border border-warning/30 px-4 py-2 rounded-lg mb-6 flex items-center justify-center text-warning font-bold text-sm uppercase tracking-widest mx-auto max-w-sm">
                        <Star className="w-4 h-4 mr-2 fill-warning" /> +50 pts pending verification
                      </div>
                    )}
                    <div className="flex gap-4 w-full max-w-sm mx-auto">
                       <button onClick={() => { setSubmittedReport(null); setIsDuplicate(false); setPosition(null); setCategory(''); setAddress(''); }} className="flex-1 bg-surface-2 hover:bg-surface-2/80 text-primary py-3 rounded-lg font-bold uppercase tracking-widest border border-border transition-colors">Submit Another</button>
                       {!isDuplicate && <button onClick={() => navigate('/dump-spot')} className="flex-1 bg-accent hover:bg-accent/90 text-accent-contrast py-3 rounded-lg font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2">View Map <ChevronRight className="w-4 h-4"/></button>}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={submitReport} className="flex flex-col gap-5 h-full">
                    <div className="flex justify-between items-center shrink-0">
                      <h2 className="text-lg font-bold text-primary tracking-widest uppercase">New Civic Issue</h2>
                      <button type="button" onClick={useMyLocation} className="text-accent hover:text-accent/80 font-bold uppercase tracking-widest flex items-center gap-1.5 bg-accent/10 px-3 py-1.5 rounded border border-accent/20"><MapPin className="w-3.5 h-3.5"/> Use My Location</button>
                    </div>

                    <div className="h-[300px] shrink-0 rounded-xl overflow-hidden border border-border relative">
                      <MapContainer center={[28.6139, 77.2090]} zoom={12} className={`h-full w-full ${isDark ? 'opacity-90' : 'opacity-100'}`}>
                        {isDark ? (
                          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OSM' />
                        ) : (
                          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; OSM & Carto' />
                        )}
                        <LocationPicker position={position} setPosition={setPosition} setWard={setWard} setAddress={setAddress} isDark={isDark} />
                      </MapContainer>
                      {!position && <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[400]"><span className="bg-accent text-accent-contrast px-4 py-2 rounded-full font-bold uppercase tracking-widest shadow-lg">Tap map to set location</span></div>}
                      {ward && <div className="absolute bottom-4 left-4 z-[400] bg-surface/90 text-primary px-3 py-1.5 rounded-lg border border-border font-bold uppercase tracking-widest shadow-lg text-[10px]">{ward} Ward Detected</div>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                      <div>
                        <label className="block font-bold text-secondary uppercase tracking-widest mb-1.5">Category *</label>
                        <select required value={category} onChange={e=>setCategory(e.target.value)} className="w-full bg-surface border border-border rounded-lg p-3 text-primary outline-none focus:border-accent">
                          <option value="">Select issue type</option>
                          <option value="Overflowing bin">Overflowing bin</option>
                          <option value="Illegal dump">Illegal dump</option>
                          <option value="Construction debris">Construction debris</option>
                          <option value="Sanitary waste">Sanitary waste</option>
                          <option value="Garden waste">Garden waste</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-secondary uppercase tracking-widest mb-1.5">Severity</label>
                        <select value={severity} onChange={e=>setSeverity(e.target.value)} className="w-full bg-surface border border-border rounded-lg p-3 text-primary outline-none focus:border-accent">
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <label className="block font-bold text-secondary uppercase tracking-widest mb-1.5">Landmark *</label>
                      <input required type="text" value={address} onChange={e=>setAddress(e.target.value)} placeholder="Enter nearby landmark" className="w-full bg-surface border border-border rounded-lg p-3 text-primary outline-none focus:border-accent" />
                    </div>

                    <div className="shrink-0 flex gap-4">
                      <div className="flex-1">
                        <label className="block font-bold text-secondary uppercase tracking-widest mb-1.5">Description (Opt)</label>
                        <input type="text" maxLength={200} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Additional details..." className="w-full bg-surface border border-border rounded-lg p-3 text-primary outline-none focus:border-accent" />
                      </div>
                      <div className="w-32">
                        <label className="block font-bold text-secondary uppercase tracking-widest mb-1.5">Photo</label>
                        <label className="w-full h-[46px] bg-surface-2 hover:bg-surface-2/80 rounded-lg border border-border flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden">
                          {photo ? <img src={photo} className="absolute inset-0 w-full h-full object-cover opacity-60"/> : <Upload className="w-4 h-4 text-muted" />}
                          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                        </label>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 shrink-0 border-t border-border">
                      <button disabled={!position || !category || submitting} type="submit" className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:hover:bg-accent text-accent-contrast p-3.5 rounded-lg font-bold uppercase tracking-widest transition-colors flex justify-center items-center gap-2 shadow-sm">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {submitting ? 'Processing...' : 'Submit Report'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="w-full lg:w-5/12 flex flex-col gap-4 min-h-0 animate-fade-in stagger-1 shrink-0 lg:shrink">
              <div className="glass-card bg-surface/60 rounded-xl border border-border p-5 flex flex-col h-full overflow-hidden">
                <h3 className="font-bold text-primary uppercase tracking-widest mb-4 flex items-center shrink-0"><User className="w-4 h-4 mr-2 text-accent"/> My Reports</h3>
                <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide pr-2">
                  {myReports.length === 0 ? (
                    <div className="text-center text-muted font-bold uppercase tracking-widest mt-10">No reports yet</div>
                  ) : myReports.map((r, i) => (
                    <div key={i} className="bg-surface-2/50 border border-border rounded-xl p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-primary text-sm">{r.type}</p>
                          <p className="text-[10px] text-secondary uppercase tracking-widest">{r.id} • {r.ward}</p>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${r.status === 'pending' ? 'bg-warning-bg text-warning border-warning/30' : r.status === 'in-progress' ? 'bg-accent/20 text-accent border-accent/30' : 'bg-success-bg text-success border-success/30'}`}>
                          {r.status === 'pending' ? 'Reported' : r.status === 'in-progress' ? 'Verified' : 'Cleared'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-4 text-[10px] text-muted font-bold uppercase tracking-widest w-full">
                         <div className={`flex-1 h-1.5 rounded-full ${r.status==='pending' || r.status==='in-progress' || r.status==='cleared' ? 'bg-warning' : 'bg-surface-2'}`}></div>
                         <div className={`flex-1 h-1.5 rounded-full ${r.status==='in-progress' || r.status==='cleared' ? 'bg-accent' : 'bg-surface-2'}`}></div>
                         <div className={`flex-1 h-1.5 rounded-full ${r.status==='cleared' ? 'bg-success' : 'bg-surface-2'}`}></div>
                      </div>
                      <div className="flex justify-between text-[8px] text-muted uppercase tracking-widest mt-1">
                        <span>Reported</span><span>Verified</span><span>Cleared</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 bg-accent/10 border border-accent/20 rounded-xl p-4 shrink-0">
                  <h4 className="font-bold text-accent uppercase tracking-widest mb-1 flex items-center"><Info className="w-3.5 h-3.5 mr-1.5"/> How your report helps</h4>
                  <p className="text-secondary leading-relaxed text-[11px]">Your reports instantly update the municipal Digital Twin, feeding the AI hotspot prediction model. Your ward currently has <strong className="text-primary">{sharedSeedIncidents.filter(i=>i.ward===ward).length} active reports</strong>.</p>
                  {submittedReport && submittedReport.status === 'pending' && (
                    <button onClick={simulateVerification} className="mt-3 w-full bg-surface-2 hover:bg-surface-2/80 text-accent py-2.5 rounded-lg font-bold uppercase tracking-widest text-[10px] border border-accent/30 transition-colors">Simulate MCD Verification</button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- TRACK TRUCK TAB --- */}
        {activeTab === 'track' && (
          <>
            <div className="w-full lg:w-7/12 flex flex-col gap-4 min-h-0 animate-fade-in shrink-0 lg:shrink">
              <div className="glass-card bg-surface/60 rounded-xl border border-border p-5 flex flex-col h-full relative">
                <div className="absolute top-8 left-8 z-[400] bg-surface/90 text-primary px-3 py-1.5 rounded border border-border shadow-sm flex items-center font-bold uppercase tracking-widest">
                  <span className="w-2 h-2 rounded-full bg-success mr-2 animate-pulse"></span> Simulated GPS Tracking
                </div>
                
                <div className="h-full rounded-xl overflow-hidden border border-border">
                  <MapContainer center={[28.6380, 77.2100]} zoom={14} className={`h-full w-full ${isDark ? 'dark-map-tiles opacity-90' : 'opacity-100'}`}>
                    {isDark ? (
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OSM" />
                    ) : (
                      <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OSM & Carto" />
                    )}
                    <Polyline positions={truckRoute} pathOptions={{ color: 'var(--color-info)', weight: 4, opacity: 0.5, dashArray: '8,8' }} />
                    <Marker position={truckRoute[truckRoute.length - 1]} icon={homeIcon(isDark)}><Popup>Your Home</Popup></Marker>
                    <Marker position={currentTruckPos} icon={truckIcon(isDark)}><Popup>TRK-002</Popup></Marker>
                  </MapContainer>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-5/12 flex flex-col gap-4 min-h-0 animate-fade-in stagger-1 shrink-0 lg:shrink">
              <div className="glass-card bg-surface/60 rounded-xl border border-border p-5 shrink-0">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-xl font-black text-primary uppercase tracking-widest">TRK-002</h2>
                    <p className="text-secondary font-bold uppercase tracking-widest">Wet & Dry Waste Collection</p>
                  </div>
                  <span className="bg-accent/20 text-accent border border-accent/30 px-3 py-1 rounded-full font-black uppercase tracking-widest">{truckEta > 0 ? 'On the way' : 'Arrived'}</span>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-surface-2 p-4 rounded-xl border border-border shadow-inner">
                    <Clock className="w-8 h-8 text-accent" />
                  </div>
                  <div>
                    <p className="text-secondary font-bold uppercase tracking-widest mb-0.5">Estimated Arrival</p>
                    <p className="text-4xl font-black text-primary tracking-tight">{Math.ceil(truckEta)} <span className="text-sm text-secondary font-bold">MINS</span></p>
                  </div>
                </div>
                
                <div className="bg-surface-2/50 rounded-xl p-4 border border-border">
                  <p className="text-secondary font-bold uppercase tracking-widest mb-3 flex items-center"><Smartphone className="w-4 h-4 mr-1.5"/> SMS Notification</p>
                  {smsScheduled ? (
                    <div className="bg-success-bg border border-success/30 p-3 rounded-lg flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-success shrink-0" />
                      <p className="text-success leading-relaxed font-bold">Demo notification scheduled; no SMS is actually sent. <span className="text-success ml-1">+10 Pts earned.</span></p>
                    </div>
                  ) : (
                    <form onSubmit={handleSms} className="space-y-3">
                      <input required type="text" pattern="[0-9]{10}" value={smsPhone} onChange={e=>setSmsPhone(e.target.value)} placeholder="10-digit mobile number" className="w-full bg-surface border border-border rounded-lg p-3 text-primary outline-none focus:border-accent font-mono" />
                      <label className="flex items-start gap-2 cursor-pointer mt-2 mb-2">
                        <input required type="checkbox" checked={smsConsent} onChange={e=>setSmsConsent(e.target.checked)} className="mt-1" />
                        <span className="text-secondary leading-snug">I agree to receive a demo notification</span>
                      </label>
                      <button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-contrast p-3 rounded-lg font-bold uppercase tracking-widest transition-colors shadow-sm">Alert me when near</button>
                    </form>
                  )}
                </div>
              </div>
              
              <div className="glass-card bg-surface/60 rounded-xl border border-border p-5 flex-1 shrink-0 overflow-y-auto">
                <h3 className="font-bold text-primary uppercase tracking-widest mb-4">Collection Schedule</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-surface-2/50 border border-border p-3.5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-success shadow-[0_0_8px_var(--color-success)]"></span>
                      <span className="font-bold text-primary uppercase tracking-widest">Wet Waste</span>
                    </div>
                    <span className="text-secondary font-bold">Daily, 8:00 AM</span>
                  </div>
                  <div className="flex justify-between items-center bg-surface-2/50 border border-border p-3.5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-info shadow-[0_0_8px_var(--color-info)]"></span>
                      <span className="font-bold text-primary uppercase tracking-widest">Dry Waste</span>
                    </div>
                    <span className="text-secondary font-bold">Mon/Wed/Fri, 9:00 AM</span>
                  </div>
                  <div className="flex justify-between items-center bg-surface-2/50 border border-border p-3.5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-danger shadow-[0_0_8px_var(--color-danger)]"></span>
                      <span className="font-bold text-primary uppercase tracking-widest">Sanitary</span>
                    </div>
                    <span className="text-secondary font-bold">Tue/Thu, 10:00 AM</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* --- REWARDS TAB --- */}
        {activeTab === 'rewards' && (
          <>
            <div className="w-full lg:w-4/12 flex flex-col gap-4 min-h-0 animate-fade-in shrink-0 lg:shrink">
              <div className="glass-card bg-surface/60 rounded-xl border border-success/30 p-6 shadow-sm text-center shrink-0">
                <Trophy className="w-12 h-12 text-warning mx-auto mb-3" />
                <p className="text-secondary font-bold uppercase tracking-widest mb-1">Available Balance</p>
                <p className="text-5xl font-black text-primary tracking-tight mb-2">{greenCredits}</p>
                <p className="text-success font-bold uppercase tracking-widest mb-4">Green Credits</p>
                <div className="h-1.5 w-full bg-surface-2 rounded-full overflow-hidden mb-2">
                   <div className="h-full bg-success" style={{width: '60%'}}></div>
                </div>
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest">150 pts to Level 4 (Green Neighbour)</p>
              </div>

              <div className="glass-card bg-surface/60 rounded-xl border border-border p-5 flex-1 overflow-y-auto shrink-0">
                <h3 className="font-bold text-primary uppercase tracking-widest mb-4">Sample Leaderboard</h3>
                <div className="space-y-3">
                  {[
                    {name: 'Anjali D.', pts: 1250, init: 'AD'},
                    {name: 'Rahul M.', pts: 980, init: 'RM'},
                    {name: 'Vikram S.', pts: 840, init: 'VS'},
                    {name: 'You', pts: greenCredits, init: 'ME', user: true},
                  ].sort((a,b)=>b.pts-a.pts).map((u, i) => (
                    <div key={i} className={`flex justify-between items-center p-3 rounded-lg border ${u.user ? 'bg-success-bg border-success/30' : 'bg-surface-2/50 border-border'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-muted font-black w-4">{i+1}</span>
                        <div className="w-8 h-8 rounded-full bg-surface-2 flex items-center justify-center text-[10px] font-bold text-primary shadow-inner">{u.init}</div>
                        <span className={`font-bold ${u.user ? 'text-success' : 'text-primary'}`}>{u.name}</span>
                      </div>
                      <span className="font-black text-primary">{u.pts}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-muted text-center uppercase tracking-widest mt-4">Simulated Rankings</p>
              </div>
            </div>

            <div className="w-full lg:w-8/12 flex flex-col gap-4 min-h-0 animate-fade-in stagger-1 shrink-0 lg:shrink">
              <div className="flex flex-col md:flex-row gap-4 shrink-0">
                <div className="glass-card bg-surface/60 rounded-xl border border-border p-5 flex-1">
                  <h3 className="font-bold text-primary uppercase tracking-widest mb-4">Points Ledger</h3>
                  <div className="space-y-3">
                    {pointsHistory.map((h, i) => (
                      <div key={i} className="flex justify-between items-center border-b border-border pb-3 last:border-0">
                        <div>
                          <p className="text-primary font-bold">{h.action}</p>
                          <p className="text-muted text-[10px] uppercase tracking-widest mt-0.5">{h.date}</p>
                        </div>
                        <span className="text-success font-black">+{h.points}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2">
                       <p className="text-muted font-bold">Earlier points (Demo)</p>
                       <span className="text-success font-black">+{greenCredits - pointsHistory.reduce((s,x)=>s+x.points,0)}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted italic mt-4 border-t border-border pt-3">Note: Points are credited after MCD verification.</p>
                </div>
                <div className="glass-card bg-surface/60 rounded-xl border border-border p-5 flex-1">
                  <h3 className="font-bold text-primary uppercase tracking-widest mb-4">How to Earn</h3>
                  <ul className="space-y-3 text-secondary font-medium">
                    <li className="flex justify-between p-2 hover:bg-surface-2 rounded-lg transition-colors"><span className="flex items-center"><Camera className="w-4 h-4 mr-3 text-accent"/> Verified report</span> <span className="font-bold text-success">+50</span></li>
                    <li className="flex justify-between p-2 hover:bg-surface-2 rounded-lg transition-colors"><span className="flex items-center"><Smartphone className="w-4 h-4 mr-3 text-accent"/> Truck SMS alert</span> <span className="font-bold text-success">+10</span></li>
                    <li className="flex justify-between p-2 hover:bg-surface-2 rounded-lg transition-colors"><span className="flex items-center"><CheckCircle className="w-4 h-4 mr-3 text-accent"/> Weekly segregation</span> <span className="font-bold text-success">+20</span></li>
                    <li className="flex justify-between p-2 hover:bg-surface-2 rounded-lg transition-colors"><span className="flex items-center"><Medal className="w-4 h-4 mr-3 text-accent"/> RWA Campaign</span> <span className="font-bold text-success">+30</span></li>
                  </ul>
                </div>
              </div>

              <div className="glass-card bg-surface/60 rounded-xl border border-border p-5 flex-1 overflow-y-auto shrink-0">
                <h3 className="font-bold text-primary uppercase tracking-widest mb-1">Redemption Center</h3>
                <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-5">Proposed incentives (to be agreed with MCD)</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-surface-2/80 border border-border rounded-xl p-4 flex flex-col">
                    <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center mb-3">
                      <Medal className="w-6 h-6 text-accent" />
                    </div>
                    <h4 className="font-bold text-primary mb-1 text-sm">Recognition Certificate</h4>
                    <p className="text-secondary text-xs mb-4 flex-1">Digital certificate as a Swachh Citizen.</p>
                    <button className="w-full bg-success hover:bg-success/90 text-accent-contrast py-2.5 rounded-lg font-bold uppercase tracking-widest transition-colors shadow-sm">Redeem 300 pts</button>
                  </div>
                  <div className="bg-surface-2/80 border border-border rounded-xl p-4 flex flex-col">
                    <div className="w-12 h-12 bg-success-bg rounded-lg flex items-center justify-center mb-3">
                      <Gift className="w-6 h-6 text-success" />
                    </div>
                    <h4 className="font-bold text-primary mb-1 text-sm">Tree Sapling</h4>
                    <p className="text-secondary text-xs mb-4 flex-1">Collect a sapling from your nearest MCD nursery.</p>
                    <button className="w-full bg-success hover:bg-success/90 text-accent-contrast py-2.5 rounded-lg font-bold uppercase tracking-widest transition-colors shadow-sm">Redeem 400 pts</button>
                  </div>
                  <div className="bg-surface-2/40 border border-border rounded-xl p-4 flex flex-col opacity-60">
                    <div className="w-12 h-12 bg-surface-2 rounded-lg flex items-center justify-center mb-3">
                      <Trophy className="w-6 h-6 text-secondary" />
                    </div>
                    <h4 className="font-bold text-primary mb-1 text-sm">Community Event Pass</h4>
                    <p className="text-muted text-xs mb-4 flex-1">VIP entry to local cultural events.</p>
                    <button disabled className="w-full bg-surface-2 text-muted py-2.5 rounded-lg font-bold uppercase tracking-widest">50 pts to go</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="shrink-0 text-center mt-4 border-t border-border pt-4">
        <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Demo: no SMS, payments or real accounts are used.</p>
      </div>
    </div>
  );
}
