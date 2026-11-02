import { useEffect, useRef } from 'react';
import { ChevronDown, BarChart2, Zap, ShieldCheck, ArrowRight, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIntersectionObserver } from '../hooks/usePremiumUI';

import Background3D from '../components/Background3D';

const ScrollSection = ({ children, index }: { children: React.ReactNode, index: number }) => {
  const { targetRef, isIntersecting } = useIntersectionObserver({ threshold: 0.3 });
  
  return (
    <div 
      ref={targetRef as any}
      className={`min-h-screen flex items-center justify-center relative transition-all duration-1000 transform ${isIntersecting ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-24'}`}
    >
      {children}
    </div>
  );
};

const CityTransformation = () => {
  const navigate = useNavigate();
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ticking = false;

    const updateScrollProgress = () => {
      if (progressBarRef.current) {
        const totalScroll = document.documentElement.scrollTop || document.body.scrollTop;
        const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scroll = (totalScroll / windowHeight) * 100;
        progressBarRef.current.style.width = `${scroll}%`;
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial call
    updateScrollProgress();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="text-white overflow-x-hidden relative min-h-screen font-sans antialiased selection:bg-emerald-500/30">
      
      <Background3D />

      {/* Scroll Progress Bar */}
      <div ref={progressBarRef} className="fixed top-0 left-0 h-1 bg-emerald-500 z-[9999] transition-all duration-75 ease-out" style={{ width: '0%' }}></div>

      <div className="relative z-10 container mx-auto px-6">
        
        {/* Section 1: Hero */}
        <ScrollSection index={0}>
          <div className="text-center max-w-5xl mx-auto pt-10 relative">
            
            {/* Center Glowing Orb behind text */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-[100%] blur-[80px] pointer-events-none z-0"></div>
            
            <div className="relative z-10 inline-block px-5 py-2 rounded-full bg-slate-800/50 border border-white/10 text-emerald-400 font-bold text-xs uppercase tracking-widest mb-8 shadow-[0_0_30px_rgba(16,185,129,0.15)] backdrop-blur-md">
              MCD Digital Command Center
            </div>
            <h1 className="relative z-10 font-display text-6xl md:text-8xl lg:text-[8rem] font-bold mb-4 tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-400 drop-shadow-sm">
              SwachhDisha<span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-teal-600">AI</span>
            </h1>
            <h2 className="relative z-10 text-2xl md:text-4xl font-light mb-12 text-slate-400 tracking-tight font-display">
              Delhi's Clean Revolution.
            </h2>
            <p className="relative z-10 text-lg md:text-xl text-slate-400 font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
              Transforming raw municipal data into actionable intelligence. Predict waste, optimize fleets, and empower citizens in real-time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => navigate('/nagar-mirror')} className="magnetic-btn w-full sm:w-auto px-8 py-4 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all flex items-center justify-center group border border-emerald-400/30">
                Enter Command Center <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
              <ChevronDown className="h-8 w-8 text-slate-500" />
            </div>
          </div>
        </ScrollSection>

        {/* Section 2: The Problem */}
        <ScrollSection index={1}>
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">The Legacy Challenge</h2>
              <p className="text-lg text-slate-400 leading-relaxed mb-8">
                For decades, municipal waste collection relied on static routes and reactive complaint handling. Overflowing bins went unnoticed, fleets burned excess fuel, and illegal dumping thrived in blind spots.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-red-500/10 p-3 rounded-lg mr-4 border border-red-500/20"><BarChart2 className="text-red-400" /></div>
                  <div>
                    <h4 className="font-bold text-white text-lg">Reactive Operations</h4>
                    <p className="text-slate-500 text-sm">Responding only after citizens complain.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-orange-500/10 p-3 rounded-lg mr-4 border border-orange-500/20"><Zap className="text-orange-400" /></div>
                  <div>
                    <h4 className="font-bold text-white text-lg">Inefficient Routing</h4>
                    <p className="text-slate-500 text-sm">Fixed routes waste fuel and time.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#020617] to-transparent z-10 w-1/4 pointer-events-none"></div>
              <img src="https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Urban challenge" className="rounded-2xl border border-white/10 opacity-70 grayscale hover:grayscale-0 transition-all duration-700" />
            </div>
          </div>
        </ScrollSection>

        {/* Section 3: The AI Solution */}
        <ScrollSection index={2}>
          <div className="text-center max-w-5xl mx-auto">
            <h2 className="font-display text-4xl md:text-6xl font-bold mb-6 tracking-tight text-white">Enter <span className="text-emerald-400">SwachhDisha AI</span></h2>
            <p className="text-xl text-slate-400 mb-16 max-w-3xl mx-auto leading-relaxed">We built a digital twin of the city's waste infrastructure. By applying machine learning to historical data, sensor inputs, and citizen reports, we created an ecosystem that thinks ahead.</p>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="glass-panel p-8 rounded-2xl premium-hover text-left group">
                <div className="bg-indigo-500/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform">
                  <BarChart2 className="h-8 w-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">NagarMirror</h3>
                <p className="text-slate-400 text-sm leading-relaxed">A live, 360-degree operational dashboard tracking thousands of bins, vehicles, and complaints in real-time.</p>
              </div>
              
              <div className="glass-panel p-8 rounded-2xl premium-hover text-left group border-emerald-500/30 relative overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="bg-emerald-500/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform relative z-10">
                  <Zap className="h-8 w-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 relative z-10">SwachhTrack AI</h3>
                <p className="text-slate-400 text-sm leading-relaxed relative z-10">Predictive algorithms that forecast bin overflow before it happens, generating optimized dynamic collection routes.</p>
              </div>

              <div className="glass-panel p-8 rounded-2xl premium-hover text-left group">
                <div className="bg-amber-500/10 w-16 h-16 rounded-xl flex items-center justify-center mb-6 border border-amber-500/20 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="h-8 w-8 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">DumpSpot Radar</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Spatial analysis combining citizen reports and urban geometry to identify and monitor illegal dumping hotspots.</p>
              </div>
            </div>
          </div>
        </ScrollSection>

        {/* Section 4: Citizen Empowerment & CTA */}
        <ScrollSection index={3}>
          <div className="glass-card rounded-3xl p-12 md:p-20 text-center max-w-5xl mx-auto border border-white/10 relative overflow-hidden" style={{
            background: 'radial-gradient(circle at 100% 0%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(16, 185, 129, 0.1) 0%, transparent 50%), rgba(30, 41, 59, 0.4)'
          }}>
            <h2 className="font-display text-4xl md:text-6xl font-bold mb-6 tracking-tight text-white relative z-10">The City is Yours.</h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed relative z-10">
              Technology is only half the solution. SwachhDisha empowers citizens with live truck tracking, one-tap reporting, and a gamified rewards system that turns civic duty into civic pride.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 relative z-10">
              <button onClick={() => navigate('/nagar-mirror')} className="magnetic-btn px-10 py-5 bg-white text-slate-900 rounded-xl font-black uppercase tracking-widest hover:bg-slate-200 transition-colors flex items-center">
                <Play className="mr-3 h-5 w-5" /> Start Simulation
              </button>
            </div>
          </div>
        </ScrollSection>

      </div>
    </div>
  );
};

export default CityTransformation;
