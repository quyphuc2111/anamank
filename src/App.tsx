import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { PartyPopper, RefreshCw, Wind, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface Candle {
  id: number;
  isLit: boolean;
  left: number;
  top: number;
  color: string;
}

const CANDLE_COLORS = ['#FF595E', '#FFCA3A', '#8AC926', '#1982C4', '#6A4C93'];

export default function App() {
  const [age, setAge] = useState(24);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isCelebration, setIsCelebration] = useState(false);
  const [message, setMessage] = useState('Chúc Mừng Sinh Nhật Em An Ám Ảnk 2k12!');
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastBlowTimeRef = useRef<number>(0);

  useEffect(() => {
    generateCandles(age);
  }, [age]);

  // Watch candles for celebration
  useEffect(() => {
    if (candles.length > 0 && candles.every(c => !c.isLit) && !isCelebration) {
      triggerCelebration();
    }
  }, [candles, isCelebration]);

  // Cleanup audio context
  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const enableMic = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      sourceRef.current = source;
      setIsMicEnabled(true);

      detectBlow();
    } catch (err) {
      console.error("Mic error:", err);
      setMicError("Không thể truy cập micro. Vui lòng cấp quyền trong trình duyệt.");
      setIsMicEnabled(false);
    }
  };

  const disableMic = () => {
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    setIsMicEnabled(false);
  };

  const detectBlow = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;

    // Threshold for blowing
    if (average > 40) { // Lowered slightly to make it easier
      const now = Date.now();
      if (now - lastBlowTimeRef.current > 100) { // Blow out one candle every 100ms
        setCandles(prev => {
          const litCandles = prev.filter(c => c.isLit);
          if (litCandles.length > 0) {
            const randomIdx = Math.floor(Math.random() * litCandles.length);
            const candleToBlow = litCandles[randomIdx];
            return prev.map(c => c.id === candleToBlow.id ? { ...c, isLit: false } : c);
          }
          return prev;
        });
        lastBlowTimeRef.current = now;
      }
    }

    requestRef.current = requestAnimationFrame(detectBlow);
  };

  const generateCandles = (count: number) => {
    const newCandles: Candle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const rx = 120;
      const ry = 40;
      const randomOffset = (Math.random() - 0.5) * 20;
      const left = Math.cos(angle) * rx + randomOffset;
      const top = Math.sin(angle) * ry + randomOffset;
      
      newCandles.push({
        id: i,
        isLit: true,
        left,
        top,
        color: CANDLE_COLORS[i % CANDLE_COLORS.length],
      });
    }
    setCandles(newCandles);
    setIsCelebration(false);
  };

  const blowOutCandle = (id: number) => {
    setCandles(prev => prev.map(c => c.id === id ? { ...c, isLit: false } : c));
  };

  const blowAllCandles = () => {
    setCandles(prev => prev.map(c => ({ ...c, isLit: false })));
  };

  const triggerCelebration = () => {
    setIsCelebration(true);
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: CANDLE_COLORS
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: CANDLE_COLORS
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  const reset = () => {
    generateCandles(age);
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRefs.current.forEach(v => {
      if (v) v.muted = newMuted;
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center overflow-hidden font-sans text-slate-100 selection:bg-pink-500/30 relative">
      
      {/* Background Videos - 4 corners with animations */}
      <div className="absolute inset-0 z-0 grid grid-cols-2 grid-rows-2 gap-1 p-1">
        {/* Top Left - has audio */}
        <motion.div
          initial={{ opacity: 0, x: -100, y: -100 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 1, delay: 0.1, type: 'spring', stiffness: 60 }}
          className="relative overflow-hidden rounded-2xl border border-pink-500/20"
        >
          <video ref={el => { videoRefs.current[0] = el; }} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-50">
            <source src="/an_meme.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 to-transparent"></div>
        </motion.div>

        {/* Top Right */}
        <motion.div
          initial={{ opacity: 0, x: 100, y: -100 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 1, delay: 0.3, type: 'spring', stiffness: 60 }}
          className="relative overflow-hidden rounded-2xl border border-amber-500/20"
        >
          <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-50 scale-x-[-1]">
            <source src="/an_meme.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-bl from-amber-500/20 to-transparent"></div>
        </motion.div>

        {/* Bottom Left */}
        <motion.div
          initial={{ opacity: 0, x: -100, y: 100 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 1, delay: 0.5, type: 'spring', stiffness: 60 }}
          className="relative overflow-hidden rounded-2xl border border-purple-500/20"
        >
          <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-50 scale-y-[-1]">
            <source src="/an_meme.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent"></div>
        </motion.div>

        {/* Bottom Right */}
        <motion.div
          initial={{ opacity: 0, x: 100, y: 100 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 1, delay: 0.7, type: 'spring', stiffness: 60 }}
          className="relative overflow-hidden rounded-2xl border border-emerald-500/20"
        >
          <video autoPlay loop muted playsInline className="w-full h-full object-cover opacity-50 scale-[-1]">
            <source src="/an_meme.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-500/20 to-transparent"></div>
        </motion.div>
      </div>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-slate-900/40 z-[1]"></div>

      {/* Floating animated particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-2 h-2 rounded-full z-[2] pointer-events-none"
          style={{
            background: CANDLE_COLORS[i % CANDLE_COLORS.length],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div className="absolute top-8 left-0 right-0 flex flex-col items-center gap-4 z-20">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-amber-300 text-center px-4"
          style={{ textShadow: '0 4px 24px rgba(236, 72, 153, 0.3)' }}
        >
          {message}
        </motion.h1>
        
        <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 bg-slate-800/50 backdrop-blur-md p-2 rounded-3xl border border-slate-700/50 shadow-xl max-w-[95vw]">
          <div className="flex items-center gap-2 px-2 md:px-4">
            <span className="text-sm font-medium text-slate-300">Tuổi:</span>
            <input 
              type="number" 
              min="1" 
              max="100" 
              value={age}
              onChange={(e) => setAge(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
              className="w-16 bg-slate-700 text-white rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div className="hidden md:block w-px h-6 bg-slate-700"></div>
          
          {isMicEnabled ? (
            <button
              onClick={disableMic}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-full transition-colors text-sm font-medium hover:bg-emerald-500/30"
            >
              <Mic size={16} className="animate-pulse" />
              <span className="hidden sm:inline">Đang nghe...</span>
            </button>
          ) : (
            <button
              onClick={enableMic}
              className="flex items-center gap-2 px-3 md:px-4 py-2 hover:bg-slate-700 rounded-full transition-colors text-sm font-medium text-emerald-300 hover:text-emerald-200"
            >
              <MicOff size={16} />
              <span className="hidden sm:inline">Bật Mic thổi nến</span>
            </button>
          )}

          <button 
            onClick={blowAllCandles}
            className="flex items-center gap-2 px-3 md:px-4 py-2 hover:bg-slate-700 rounded-full transition-colors text-sm font-medium text-pink-300 hover:text-pink-200"
          >
            <Wind size={16} />
            <span className="hidden sm:inline">Thổi Nến</span>
          </button>
          <button
            onClick={toggleMute}
            className="flex items-center gap-2 px-3 md:px-4 py-2 hover:bg-slate-700 rounded-full transition-colors text-sm font-medium text-cyan-300 hover:text-cyan-200"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            <span className="hidden sm:inline">{isMuted ? 'Bật tiếng' : 'Tắt tiếng'}</span>
          </button>
          <button 
            onClick={reset}
            className="flex items-center gap-2 px-3 md:px-4 py-2 hover:bg-slate-700 rounded-full transition-colors text-sm font-medium text-amber-300 hover:text-amber-200"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">Thắp Lại</span>
          </button>
        </div>
        
        {micError && (
          <div className="text-red-400 text-sm mt-2 bg-red-400/10 px-4 py-2 rounded-full border border-red-400/20">
            {micError}
          </div>
        )}
      </div>

      {/* Cake Container */}
      <div className="relative mt-32 z-10">
        {/* Glow behind cake */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-pink-500/20 rounded-full blur-[100px] pointer-events-none"></div>

        {/* The Cake */}
        <div className="relative w-[320px] h-[200px] md:w-[400px] md:h-[240px] perspective-[1000px]">
          
          {/* Cake Top (Frosting) */}
          <div className="absolute top-0 left-0 w-full h-[120px] md:h-[140px] bg-pink-100 rounded-[50%] border-4 border-pink-200 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.05)] z-10 flex items-center justify-center">
            
            {/* Candles Layer */}
            <div className="relative w-full h-full">
              <AnimatePresence>
                {candles.map((candle) => (
                  <motion.div
                    key={candle.id}
                    initial={{ opacity: 0, scale: 0, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200, delay: candle.id * 0.05 }}
                    className="absolute w-4 h-16 md:w-5 md:h-20 -ml-2 -mt-16 md:-ml-2.5 md:-mt-20 cursor-pointer group"
                    style={{ 
                      left: `calc(50% + ${candle.left}px)`, 
                      top: `calc(50% + ${candle.top}px)`,
                      zIndex: Math.round(candle.top + 100) // Sort by Y position for proper overlapping
                    }}
                    onClick={() => blowOutCandle(candle.id)}
                  >
                    {/* Candle Body */}
                    <div 
                      className="absolute bottom-0 w-full h-full rounded-t-md shadow-sm overflow-hidden"
                      style={{ backgroundColor: candle.color }}
                    >
                      {/* Stripes */}
                      <div className="w-full h-full opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, white 5px, white 10px)' }}></div>
                    </div>
                    
                    {/* Wick */}
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-slate-800"></div>

                    {/* Flame */}
                    {candle.isLit && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-4 h-8 flex justify-center flame">
                        <div className="absolute bottom-0 w-3 h-6 bg-amber-400 rounded-[50%_50%_50%_50%/60%_60%_40%_40%] shadow-[0_0_15px_rgba(251,191,36,0.8)]"></div>
                        <div className="absolute bottom-1 w-1.5 h-3 bg-white rounded-full"></div>
                        {/* Glow */}
                        <div className="absolute bottom-0 w-8 h-8 bg-amber-500/30 rounded-full blur-md"></div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Cake Body */}
          <div className="absolute top-[60px] md:top-[70px] left-0 w-full h-[120px] md:h-[140px] bg-pink-300 rounded-b-[50%] border-x-4 border-b-4 border-pink-400 shadow-[inset_-20px_0_40px_rgba(0,0,0,0.1)] overflow-hidden">
            {/* Drips */}
            <div className="absolute top-0 left-0 w-full flex justify-around">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="w-8 h-12 bg-pink-100 rounded-b-full shadow-sm" style={{ height: `${Math.random() * 30 + 20}px`, transform: `translateY(-5px)` }}></div>
              ))}
            </div>
            
            {/* Middle Layer */}
            <div className="absolute top-1/2 left-0 w-full h-4 bg-pink-400/50"></div>
          </div>

          {/* Plate */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[120%] h-[80px] bg-slate-200 rounded-[50%] border-b-8 border-slate-300 shadow-2xl -z-10"></div>
        </div>
      </div>

      {/* Celebration Overlay */}
      <AnimatePresence>
        {isCelebration && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute z-50 pointer-events-none flex flex-col items-center"
          >
            <div className="bg-slate-900/90 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-pink-500/30 shadow-[0_0_50px_rgba(0,0,0,0.6)] flex flex-col items-center gap-4">
              <PartyPopper size={64} className="text-pink-400 drop-shadow-[0_0_15px_rgba(236,72,153,0.5)]" />
              <h2 className="text-3xl md:text-4xl font-bold text-white text-center drop-shadow-lg">Chúc Mừng Sinh Nhật</h2>
              <h2 className="text-3xl md:text-4xl font-bold text-white text-center drop-shadow-lg">Em An Ám Ảnk 2k12!</h2>
              <p className="text-pink-100 text-lg text-center font-medium">Tuổi mới thật nhiều niềm vui và hạnh phúc nhé!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <div className="absolute bottom-8 text-slate-400 text-sm text-center px-4 z-10">
        Nhấn vào nến, thổi vào micro, hoặc nhấn nút "Thổi Nến" để tắt nến.
      </div>

    </div>
  );
}
