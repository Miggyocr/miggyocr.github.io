import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, X, ChevronRight, Check } from 'lucide-react';

// Helper to format time for input type="time"
const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
};

// Helper to check if current time is within sleep range
const checkIsSleepTime = (current: Date, start: string, end: string) => {
  const currentMinutes = current.getHours() * 60 + current.getMinutes();
  
  const [startH, startM] = start.split(':').map(Number);
  const startMinutes = startH * 60 + startM;
  
  const [endH, endM] = end.split(':').map(Number);
  const endMinutes = endH * 60 + endM;

  if (startMinutes > endMinutes) {
    // Overnight schedule (e.g. 20:00 to 06:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  } else {
    // Same day schedule (e.g. 13:00 to 15:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
};

export default function App() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sleepStart, setSleepStart] = useState('00:00');
  const [sleepEnd, setSleepEnd] = useState('05:00');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const [overrideMode, setOverrideMode] = useState<'auto' | 'awake' | 'asleep'>('auto');
  const [timerDuration, setTimerDuration] = useState(0); // 0 = infinite
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [isCustomInputVisible, setIsCustomInputVisible] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle tap for hidden settings
  const handleHiddenTap = () => {
    setTapCount(prev => prev + 1);
    
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
    }

    tapTimeoutRef.current = setTimeout(() => {
      setTapCount(0);
    }, 1000); // Reset if not tapped 3 times within 1 second window logic (simplified)

    if (tapCount + 1 >= 3) {
      setShowSettings(true);
      setTapCount(0);
    }
  };

  const calculatedIsSleepTime = checkIsSleepTime(currentTime, sleepStart, sleepEnd);
  const isSleepTime = overrideMode === 'auto' ? calculatedIsSleepTime : overrideMode === 'asleep';

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Stop audio if sleep time starts
  useEffect(() => {
    if (isSleepTime && isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isSleepTime, isPlaying]);

  // Handle audio timer
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isPlaying && timerDuration > 0) {
      timeoutId = setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
      }, timerDuration);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isPlaying, timerDuration]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative bg-black text-white overflow-hidden select-none">
      {/* Hidden Settings Trigger Area */}
      <div 
        className="absolute top-0 right-0 w-24 h-24 z-50"
        onClick={handleHiddenTap}
      />

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center w-full max-w-md px-6 space-y-12">
        
        {/* Pocket Creature SVG */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          {isSleepTime ? (
            // SLEEP STATE
            <div className="relative">
              {/* Zzz Animations */}
              <div className="absolute -top-8 right-4 text-[#F5CBA7]/60 font-sans text-2xl font-bold animate-float-zzz">Zzz</div>
              <div className="absolute -top-12 right-0 text-[#F5CBA7]/40 font-sans text-xl font-bold animate-float-zzz delay-1000">Zzz</div>
              <div className="absolute -top-16 right-8 text-[#F5CBA7]/20 font-sans text-lg font-bold animate-float-zzz delay-2000">Zzz</div>
              
              <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                <g className="animate-breathe-subtle origin-[100px_120px]">
                  {/* Feet - Relaxed/Splayed */}
                  <ellipse cx="60" cy="150" rx="22" ry="12" fill="#D9A683" transform="rotate(-15 60 150)" />
                  <ellipse cx="140" cy="150" rx="22" ry="12" fill="#D9A683" transform="rotate(15 140 150)" />

                  {/* Hands - Relaxed at sides */}
                  <ellipse cx="25" cy="115" rx="12" ry="15" fill="#E6B89C" transform="rotate(-45 25 115)" />
                  <ellipse cx="175" cy="115" rx="12" ry="15" fill="#E6B89C" transform="rotate(45 175 115)" />

                  {/* Body - Flattened */}
                  <ellipse cx="100" cy="110" rx="85" ry="55" fill="#F5CBA7" />
                  
                  {/* Belly - Flattened */}
                  <ellipse cx="100" cy="135" rx="35" ry="20" fill="#E6B89C" />
                  <circle cx="100" cy="138" r="2.5" fill="#B08060" />

                  {/* Closed Eyes - Sleeping curves */}
                  <path d="M 60 90 Q 70 95 80 90" stroke="#1A1A1A" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M 120 90 Q 130 95 140 90" stroke="#1A1A1A" strokeWidth="3" fill="none" strokeLinecap="round" />

                  {/* Mouth - Small sleeping line */}
                  <path d="M 95 110 Q 100 113 105 110" stroke="#1A1A1A" strokeWidth="3" fill="none" strokeLinecap="round" />
                </g>
              </svg>
            </div>
          ) : (
            // AWAKE STATE
            <div className="relative animate-bounce-slow">
              <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                {/* Feet - Planted */}
                <ellipse cx="70" cy="165" rx="22" ry="12" fill="#D9A683" />
                <ellipse cx="130" cy="165" rx="22" ry="12" fill="#D9A683" />

                {/* Swaying Body & Face Group */}
                <g className={`${isPlaying ? 'animate-dance' : 'animate-sway'} origin-[100px_165px]`}>
                  {/* Hands - Side Nubs with Limb Animation */}
                  <g className={`${isPlaying ? 'animate-wave-left' : 'animate-limb'} origin-[35px_110px]`}>
                    <ellipse cx="35" cy="110" rx="12" ry="15" fill="#E6B89C" transform="rotate(-10 35 110)" />
                  </g>
                  <g className={`${isPlaying ? 'animate-wave-right' : 'animate-limb'} origin-[165px_110px]`} style={isPlaying ? {} : { animationDelay: '-1.5s' }}>
                    <ellipse cx="165" cy="110" rx="12" ry="15" fill="#E6B89C" transform="rotate(10 165 110)" />
                  </g>

                  {/* Body Group for Breathing */}
                  <g className="animate-breathe-subtle origin-[100px_120px]">
                    <circle cx="100" cy="110" r="65" fill="#F5CBA7" />
                    <circle cx="100" cy="145" r="25" fill="#E6B89C" />
                    <circle cx="100" cy="150" r="2.5" fill="#B08060" />
                  </g>

                  {/* Dark Circles (Only when manually overridden to awake) */}
                  {overrideMode === 'awake' && (
                    <g opacity="0.4">
                      <ellipse cx="70" cy="98" rx="18" ry="10" fill="#8B4513" />
                      <ellipse cx="130" cy="98" rx="18" ry="10" fill="#8B4513" />
                    </g>
                  )}

                  {isPlaying ? (
                    /* Happy Eyes (Upside down Us) */
                    <g>
                      <path d="M 55 90 Q 70 70 85 90" stroke="#1A1A1A" strokeWidth="4" fill="none" strokeLinecap="round" />
                      <path d="M 115 90 Q 130 70 145 90" stroke="#1A1A1A" strokeWidth="4" fill="none" strokeLinecap="round" />
                    </g>
                  ) : (
                    /* Normal Open Eyes */
                    <>
                      {/* Left Eye Group */}
                      <g className="animate-blink origin-[70px_85px]">
                        <circle cx="70" cy="85" r="16" fill="#FFFFFF" />
                        <g className="animate-eye-move">
                          <circle cx="70" cy="85" r="9" fill="#1A1A1A" />
                          <circle cx="67" cy="82" r="3" fill="#FFFFFF" />
                        </g>
                      </g>

                      {/* Right Eye Group */}
                      <g className="animate-blink origin-[130px_85px]">
                        <circle cx="130" cy="85" r="16" fill="#FFFFFF" />
                        <g className="animate-eye-move">
                          <circle cx="130" cy="85" r="9" fill="#1A1A1A" />
                          <circle cx="127" cy="82" r="3" fill="#FFFFFF" />
                        </g>
                      </g>
                    </>
                  )}

                  {/* Smile */}
                  <path d="M 85 105 Q 100 115 115 105" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" fill="transparent" />
                </g>
              </svg>
            </div>
          )}
        </div>

        {/* Status Text (Minimalist) */}
        <div className="text-center space-y-2">
          <h1 className={`text-2xl font-light tracking-widest uppercase ${isSleepTime ? 'text-red-900/50' : 'text-yellow-100/80'}`}>
            {isSleepTime ? 'Sleep Time' : 'Nursing Allowed'}
          </h1>
          {overrideMode !== 'auto' && (
            <div className="inline-flex items-center space-x-1.5 bg-zinc-800/50 px-2 py-0.5 rounded-full border border-zinc-700/50">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider">Manual Override</span>
            </div>
          )}
          <p className="text-xs font-mono text-white/20">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        {/* Audio Player & Timer - Only visible when awake */}
        {!isSleepTime && (
          <div className="flex flex-col items-center space-y-6">
            <button 
              onClick={toggleAudio}
              className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 ring-1 ring-white/20"
              aria-label={isPlaying ? "Pause Lullaby" : "Play Lullaby"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-yellow-100" fill="currentColor" />
              ) : (
                <Play className="w-6 h-6 text-yellow-100 ml-1" fill="currentColor" />
              )}
            </button>

            {/* Timer Controls */}
            <div className="flex items-center space-x-1 bg-white/5 p-1 rounded-xl backdrop-blur-sm border border-white/5">
              {!isCustomInputVisible ? (
                <>
                  {[
                    { label: '30s', value: 30000 },
                    { label: '1m', value: 60000 },
                    { label: '5m', value: 300000 },
                  ].map((option) => (
                    <button
                      key={option.label}
                      onClick={() => setTimerDuration(option.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        timerDuration === option.value 
                          ? 'bg-white/20 text-white shadow-sm' 
                          : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setIsCustomInputVisible(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      ![0, 30000, 60000, 300000].includes(timerDuration)
                        ? 'bg-white/20 text-white shadow-sm' 
                        : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                    }`}
                  >
                    {![0, 30000, 60000, 300000].includes(timerDuration) ? `${Math.floor(timerDuration / 60000)}m` : '+'}
                  </button>

                  {timerDuration > 0 && (
                    <button
                      onClick={() => setTimerDuration(0)}
                      className="px-2 py-1.5 rounded-lg bg-red-900/80 text-white hover:bg-red-800 transition-colors"
                      aria-label="Clear Timer"
                    >
                      <X size={14} />
                    </button>
                  )}
                </>
              ) : (
                <div className="flex items-center space-x-2 px-1 py-0.5">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-16 bg-white/10 rounded px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-white/30"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = parseInt(e.currentTarget.value);
                        if (!isNaN(val) && val > 0) {
                          setTimerDuration(val * 60000);
                          setIsCustomInputVisible(false);
                        }
                      }
                    }}
                  />
                  <button 
                    onClick={() => setIsCustomInputVisible(false)}
                    className="p-1 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden Audio Element */}
      <audio 
        ref={audioRef} 
        loop={timerDuration > 0}
        onEnded={() => {
          if (timerDuration === 0) {
            setIsPlaying(false);
          }
        }}
        src="https://raw.githubusercontent.com/Miguelocr/MiggyR/main/froggy_ena.mp3" 
      />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <h2 className="text-lg font-medium text-zinc-200">Sleep Schedule</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-zinc-500 uppercase tracking-wider font-bold">Start Sleep</label>
                <input 
                  type="time" 
                  value={sleepStart}
                  onChange={(e) => setSleepStart(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 font-mono text-lg"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm text-zinc-500 uppercase tracking-wider font-bold">End Sleep</label>
                <input 
                  type="time" 
                  value={sleepEnd}
                  onChange={(e) => setSleepEnd(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 font-mono text-lg"
                />
              </div>

              <div className="space-y-3 pt-2 border-t border-zinc-800/50">
                <label className="text-sm text-zinc-500 uppercase tracking-wider font-bold block">Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setOverrideMode('auto')}
                    className={`py-2 px-1 rounded-lg text-sm font-mono transition-all ${
                      overrideMode === 'auto'
                        ? 'bg-zinc-200 text-zinc-900 font-bold'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    Auto
                  </button>
                  <button
                    onClick={() => setOverrideMode('awake')}
                    className={`py-2 px-1 rounded-lg text-sm font-mono transition-all ${
                      overrideMode === 'awake'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    Awake
                  </button>
                  <button
                    onClick={() => setOverrideMode('asleep')}
                    className={`py-2 px-1 rounded-lg text-sm font-mono transition-all ${
                      overrideMode === 'asleep'
                        ? 'bg-red-900/80 text-white font-bold'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    Sleep
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 text-center">
              <p className="text-xs text-zinc-600">
                Tap top-right corner 3x to open this menu.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[60] flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-sm space-y-8 shadow-2xl relative overflow-hidden">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                style={{ width: `${((onboardingStep + 1) / 5) * 100}%` }}
              />
            </div>

            <div className="space-y-4 pt-2">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mb-6">
                {onboardingStep === 0 && <span className="text-2xl">👋</span>}
                {onboardingStep === 1 && <span className="text-2xl">🌙</span>}
                {onboardingStep === 2 && <span className="text-2xl">🎵</span>}
                {onboardingStep === 3 && <span className="text-2xl">⚙️</span>}
                {onboardingStep === 4 && <span className="text-2xl">⏰</span>}
              </div>

              <h2 className="text-2xl font-bold text-white">
                {onboardingStep === 0 && "Welcome"}
                {onboardingStep === 1 && "Day & Night"}
                {onboardingStep === 2 && "Soothing Sounds"}
                {onboardingStep === 3 && "Hidden Settings"}
                {onboardingStep === 4 && "Set Schedule"}
              </h2>

              <div className="text-zinc-400 leading-relaxed">
                {onboardingStep === 0 && "Meet your new sleep companion. This gentle creature helps your little one know when it's time to sleep and when it's okay to wake up."}
                {onboardingStep === 1 && "During the day, the creature is awake and happy. At night, it sleeps peacefully, signaling that it's time for rest."}
                {onboardingStep === 2 && "Tap the play button during the day to play a soothing lullaby. The button disappears at night to encourage sleep."}
                {onboardingStep === 3 && "Need to adjust the schedule? Tap the top-right corner 3 times to access the secret settings menu."}
                {onboardingStep === 4 && (
                  <div className="space-y-4">
                    <p>Let's set up your child's sleep schedule now.</p>
                    <div className="space-y-2">
                      <label className="text-sm text-zinc-500 uppercase tracking-wider font-bold">Start Sleep</label>
                      <input 
                        type="time" 
                        value={sleepStart}
                        onChange={(e) => setSleepStart(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 font-mono text-lg"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm text-zinc-500 uppercase tracking-wider font-bold">End Sleep</label>
                      <input 
                        type="time" 
                        value={sleepEnd}
                        onChange={(e) => setSleepEnd(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 font-mono text-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => {
                  if (onboardingStep < 4) {
                    setOnboardingStep(prev => prev + 1);
                  } else {
                    localStorage.setItem('hasSeenOnboarding', 'true');
                    setShowOnboarding(false);
                  }
                }}
                className="flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors active:scale-95"
              >
                <span>{onboardingStep === 4 ? "Get Started" : "Next"}</span>
                {onboardingStep === 4 ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
