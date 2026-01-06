
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, FocusConfig } from './types';
import { getMotivationalQuote } from './services/geminiService';

// --- Sub-components (Defined outside to prevent re-renders) ---

const SetupView: React.FC<{ onStart: (duration: number) => void }> = ({ onStart }) => {
  const [minutes, setMinutes] = useState<number>(10);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-fade-in">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold tracking-tighter mb-4 text-blue-500">ZENLOCK</h1>
        <p className="text-gray-400 text-lg">Uninterrupted focus starts now.</p>
      </div>

      <div className="w-full max-w-sm glass rounded-3xl p-8 mb-8 space-y-6">
        <div className="text-center">
          <span className="text-6xl font-light text-white tracking-widest">{minutes}</span>
          <span className="text-xl text-gray-500 ml-2">min</span>
        </div>
        
        <input 
          type="range" 
          min="1" 
          max="60" 
          value={minutes} 
          onChange={(e) => setMinutes(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />

        <div className="grid grid-cols-2 gap-4">
          {[5, 10, 25, 45].map(val => (
            <button 
              key={val}
              onClick={() => setMinutes(val)}
              className={`py-3 rounded-xl border transition-all ${minutes === val ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
            >
              {val}m
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={() => onStart(minutes * 60)}
        className="w-full max-w-sm bg-white text-black font-bold py-5 rounded-2xl text-xl hover:bg-gray-200 transition-colors shadow-2xl shadow-blue-900/20"
      >
        ENTER FOCUS MODE
      </button>

      <p className="mt-8 text-xs text-gray-600 text-center uppercase tracking-widest leading-relaxed">
        Locked mode requires full screen.<br/>Emergency calls remain accessible.
      </p>
    </div>
  );
};

const FocusView: React.FC<{ 
  seconds: number, 
  quote: string, 
  onEmergency: () => void 
}> = ({ seconds, quote, onEmergency }) => {
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs < 10 ? '0' : ''}${rs}`;
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-between p-12 z-50">
      <div className="pulse fixed inset-0 flex items-center justify-center -z-10">
        <div className="w-[80vw] h-[80vw] bg-blue-600/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full text-center mt-20">
        <p className="text-blue-500 font-medium tracking-[0.3em] mb-6 uppercase">Deep Work Session</p>
        <div className="text-8xl font-thin tracking-tighter text-white timer-glow">
          {formatTime(seconds)}
        </div>
      </div>

      <div className="max-w-xs text-center">
        <i className="fa-solid fa-quote-left text-blue-900 text-3xl mb-4 block"></i>
        <p className="text-xl text-gray-300 font-light italic leading-relaxed">
          {quote || "Generating focus catalyst..."}
        </p>
      </div>

      <div className="w-full flex flex-col items-center gap-6">
        <a 
          href="tel:112"
          className="flex items-center gap-3 text-gray-500 hover:text-white transition-colors"
        >
          <i className="fa-solid fa-phone text-sm"></i>
          <span className="text-xs tracking-widest font-bold">EMERGENCY CALL</span>
        </a>
        
        <button 
          onDoubleClick={onEmergency}
          className="text-[10px] text-gray-800 uppercase tracking-widest hover:text-red-900 transition-colors"
        >
          Double click to force exit
        </button>
      </div>
    </div>
  );
};

const ViolationView: React.FC<{ onReset: () => void }> = ({ onReset }) => (
  <div className="fixed inset-0 bg-red-950 flex flex-col items-center justify-center p-10 text-center z-[100]">
    <i className="fa-solid fa-triangle-exclamation text-7xl text-red-500 mb-8"></i>
    <h2 className="text-4xl font-bold mb-4">FOCUS BROKEN</h2>
    <p className="text-red-200 text-lg mb-10 max-w-xs">
      The integrity of your session was compromised by leaving the application.
    </p>
    <button 
      onClick={onReset}
      className="bg-white text-black font-bold px-10 py-4 rounded-full"
    >
      RETRY SESSION
    </button>
  </div>
);

const CompletionView: React.FC<{ onDone: () => void }> = ({ onDone }) => (
  <div className="fixed inset-0 bg-green-950 flex flex-col items-center justify-center p-10 text-center z-[100]">
    <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-green-500/50">
        <i className="fa-solid fa-check text-4xl text-black"></i>
    </div>
    <h2 className="text-4xl font-bold mb-4">SESSION COMPLETE</h2>
    <p className="text-green-200 text-lg mb-10 max-w-xs">
      You mastered your focus. Reward yourself with a short break.
    </p>
    <button 
      onClick={onDone}
      className="bg-white text-black font-bold px-10 py-4 rounded-full"
    >
      RETURN HOME
    </button>
  </div>
);

// --- Main App Component ---

export default function App() {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [quote, setQuote] = useState<string>("");
  // Use number type for timer reference in browser environment to avoid NodeJS namespace issues
  const timerRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Request Wake Lock to keep screen on
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch (err) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  const startFocus = async (duration: number) => {
    // Attempt fullscreen
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen rejected", e);
    }

    const q = await getMotivationalQuote(`${duration / 60} minute session`);
    setQuote(q);
    setTimeLeft(duration);
    setState(AppState.FOCUSING);
    await requestWakeLock();
  };

  const handleViolation = useCallback(() => {
    if (state === AppState.FOCUSING) {
      setState(AppState.VIOLATION);
      if (timerRef.current) clearInterval(timerRef.current);
      releaseWakeLock();
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    }
  }, [state]);

  // Monitor visibility change
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleViolation();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [handleViolation]);

  // Timer logic
  useEffect(() => {
    if (state === AppState.FOCUSING && timeLeft > 0) {
      // Use window.setInterval explicitly for browser return type
      timerRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            setState(AppState.COMPLETED);
            releaseWakeLock();
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, timeLeft]);

  const reset = () => {
    setState(AppState.IDLE);
    setTimeLeft(0);
    setQuote("");
  };

  return (
    <div className="min-h-screen bg-black font-sans text-white selection:bg-blue-500/30 overflow-hidden">
      {state === AppState.IDLE && <SetupView onStart={startFocus} />}
      
      {state === AppState.FOCUSING && (
        <FocusView 
          seconds={timeLeft} 
          quote={quote} 
          onEmergency={handleViolation} 
        />
      )}

      {state === AppState.VIOLATION && <ViolationView onReset={reset} />}

      {state === AppState.COMPLETED && <CompletionView onDone={reset} />}

      {/* Aesthetic decorative elements */}
      <div className="fixed top-0 left-0 w-full h-1 bg-blue-600/20 z-10">
        <div 
          className="h-full bg-blue-500 transition-all duration-1000 ease-linear shadow-[0_0_10px_#3b82f6]"
          style={{ width: state === AppState.FOCUSING ? `${(timeLeft / (timeLeft + (60*5))) * 100}%` : '0%' }}
        ></div>
      </div>
    </div>
  );
}
