'use client';

// ==============================================================================
// TataDana Smartphone Simulator Frame
// Allows desktop users to interact with the app inside a realistic phone mockup
// ==============================================================================

import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Wifi, Battery, Signal } from 'lucide-react';

interface PhoneSimulatorFrameProps {
  children: React.ReactNode;
}

export default function PhoneSimulatorFrame({ children }: PhoneSimulatorFrameProps) {
  const [isPhoneMode, setIsPhoneMode] = useState<boolean>(false);

  // Restore saved simulator preference
  useEffect(() => {
    const saved = localStorage.getItem('tatadana_phone_mode');
    if (saved === 'true') {
      setIsPhoneMode(true);
    }
  }, []);

  const togglePhoneMode = () => {
    const nextVal = !isPhoneMode;
    setIsPhoneMode(nextVal);
    localStorage.setItem('tatadana_phone_mode', String(nextVal));
  };

  return (
    <div className="relative min-h-screen">
      {/* Floating Toggle Switch (Desktop only) */}
      <div className="hidden lg:block fixed top-3 right-4 z-50">
        <button
          onClick={togglePhoneMode}
          className="px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md border flex items-center gap-1.5 bg-white text-slate-700 hover:text-brand-600 border-slate-200 hover:border-brand-300"
          title="Beralih antara tampilan normal desktop dan simulasi smartphone"
        >
          {isPhoneMode ? (
            <>
              <Monitor className="w-3.5 h-3.5 text-blue-500" />
              <span>Kembali ke Desktop</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-brand-500" />
              <span>Tampilan Smartphone 📱</span>
            </>
          )}
        </button>
      </div>

      {/* Single subtree rendering to prevent duplicate mounts */}
      {isPhoneMode ? (
        <div className="min-h-screen lg:bg-slate-900/90 lg:py-8 lg:flex lg:items-center lg:justify-center lg:backdrop-blur-md">
          {/* Realistic iPhone Chassis Mockup on Desktop */}
          <div className="w-full lg:w-[412px] min-h-screen lg:min-h-0 lg:h-[870px] bg-slate-50 lg:bg-slate-950 lg:rounded-[55px] lg:p-3 lg:shadow-[0_25px_70px_rgba(0,0,0,0.6)] lg:border-4 lg:border-slate-800 lg:ring-1 lg:ring-white/20 flex flex-col relative">
            {/* Outer Volume & Power Buttons (Desktop only) */}
            <div className="hidden lg:block absolute -left-[7px] top-28 w-[3px] h-10 bg-slate-700 rounded-l-sm" />
            <div className="hidden lg:block absolute -left-[7px] top-42 w-[3px] h-12 bg-slate-700 rounded-l-sm" />
            <div className="hidden lg:block absolute -right-[7px] top-36 w-[3px] h-16 bg-slate-700 rounded-r-sm" />

            {/* Inner Screen */}
            <div className="relative w-full h-full bg-slate-50 lg:rounded-[44px] overflow-hidden flex flex-col lg:shadow-inner">
              {/* Dynamic Island / Status Bar (Desktop only) */}
              <div className="hidden lg:flex h-10 bg-white/90 backdrop-blur-sm px-6 pt-2 items-center justify-between text-slate-800 text-[11px] font-bold z-30 shrink-0 select-none border-b border-slate-100">
                <span>09:41</span>
                {/* Dynamic Island Pill */}
                <div className="w-24 h-4 bg-black rounded-full mx-auto" />
                <div className="flex items-center gap-1.5">
                  <Signal className="w-3 h-3 text-slate-700" />
                  <Wifi className="w-3 h-3 text-slate-700" />
                  <Battery className="w-3.5 h-3.5 text-slate-700" />
                </div>
              </div>

              {/* Scrollable Smartphone Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar relative lg:pb-16">
                {children}
              </div>

              {/* Bottom Home Indicator Bar (Desktop only) */}
              <div className="hidden lg:block absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-400 rounded-full z-40 pointer-events-none" />
            </div>
          </div>
        </div>
      ) : (
        <div>
          {children}
        </div>
      )}
    </div>
  );
}
