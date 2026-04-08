import React, { useState } from 'react';
import SineWave from './SineWave';
import Particles from './Particles';
import FourierSeries from './FourierSeries';
import { motion, AnimatePresence } from 'framer-motion';
import { Waves, Orbit, LayoutGrid, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type LabTab = 'waves' | 'fourier' | 'particles';

export default function VisualLab() {
  const [activeTab, setActiveTab] = useState<LabTab>('waves');
  const navigate = useNavigate();

  const tabs = [
    { id: 'waves', name: 'Sine Explorer', icon: Waves, color: '#60B8FF' },
    { id: 'fourier', name: 'Fourier Series', icon: LayoutGrid, color: '#7C6FF7' },
    { id: 'particles', name: 'Particle Flow', icon: Orbit, color: '#7CF7B5' },
  ];

  const activeColor = tabs.find(t => t.id === activeTab)?.color || '#7C6FF7';

  return (
    <div className="min-h-screen bg-[#050510] text-foreground font-body pb-20 selection:bg-primary/30">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full opacity-[0.08] blur-[150px] transition-colors duration-1000"
          style={{ background: activeColor }}
        />
        <div 
          className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full opacity-[0.08] blur-[150px] transition-colors duration-1000"
          style={{ background: activeColor }}
        />
      </div>

      <nav className="relative z-10 sticky top-0 border-b border-white/5 bg-[#050510]/80 backdrop-blur-xl px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-xl hover:bg-white/5 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
            </button>
            <div>
              <h1 className="text-xl font-display font-black text-white uppercase tracking-tighter flex items-center gap-2">
                NeuroLearn <span className="bg-primary/20 text-primary px-2 py-0.5 rounded text-[10px]">Visual Lab v1.0</span>
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase font-display tracking-widest leading-none mt-1">Interactive STEM Sandbox</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
             {tabs.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as LabTab)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-display font-black uppercase tracking-widest transition-all duration-300 ${
                   activeTab === tab.id 
                    ? 'bg-white/10 text-white shadow-xl shadow-black/20' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                 }`}
               >
                 <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'}`} />
                 {tab.name}
               </button>
             ))}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12 relative z-10">
        <div className="mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div>
              <h2 className="text-4xl font-display font-black text-white mb-2 leading-none uppercase tracking-tighter">
                {tabs.find(t => t.id === activeTab)?.name}
              </h2>
              <p className="text-sm text-muted-foreground font-body max-w-lg">
                Explore the fundamental mechanics of {activeTab === 'particles' ? 'matter and gravity' : activeTab === 'fourier' ? 'wave synthesis' : 'superposition'} through real-time interactive simulations.
              </p>
           </div>
           
           <div className="flex md:hidden items-center justify-center gap-2">
             {tabs.map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as LabTab)}
                 className={`p-3 rounded-xl transition-all ${activeTab === tab.id ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
               >
                 <tab.icon className="w-5 h-5" />
               </button>
             ))}
           </div>
        </div>

        <section className="relative min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {activeTab === 'waves' && <SineWave />}
              {activeTab === 'particles' && <Particles />}
              {activeTab === 'fourier' && <FourierSeries />}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-4 mt-20 text-center">
         <div className="inline-flex items-center gap-4 bg-white/5 border border-white/5 px-6 py-4 rounded-3xl backdrop-blur-xl">
            <div className="text-left border-r border-white/10 pr-6 mr-2">
               <p className="text-[10px] text-muted-foreground font-display uppercase tracking-widest mb-1">Status</p>
               <p className="text-xs font-black text-white font-display uppercase">Sandbox Active</p>
            </div>
            <p className="text-xs text-muted-foreground max-w-xs font-body italic text-left">
              "To see is to understand." This lab is designed to bridge the gap between abstract formulas and tangible reality.
            </p>
         </div>
      </footer>
    </div>
  );
}
