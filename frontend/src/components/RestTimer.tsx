import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';

interface RestTimerProps {
  defaultSeconds?: number;
}

export function RestTimer({ defaultSeconds = 90 }: RestTimerProps) {
  const [seconds, setSeconds] = useState(defaultSeconds);
  const [isActive, setIsActive] = useState(false);
  const [customTime, setCustomTime] = useState(defaultSeconds);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            playSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, seconds]);

  const playSound = () => {
    // Simple beep sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSeconds(customTime);
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const quickSetTime = (secs: number) => {
    setCustomTime(secs);
    setSeconds(secs);
    setIsActive(false);
  };

  const progress = ((customTime - seconds) / customTime) * 100;

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-[var(--brand-primary)]" />
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Rest Timer</h3>
      </div>

      {/* Timer Display */}
      <div className="relative mb-4">
        <div className="text-center">
          <div className={`text-4xl font-bold mb-2 ${seconds <= 10 && seconds > 0 ? 'text-red-500 animate-pulse' : 'text-[var(--text-primary)]'}`}>
            {formatTime(seconds)}
          </div>
          {seconds === 0 && (
            <p className="text-sm text-green-500 font-bold animate-pulse">Rest Complete!</p>
          )}
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={toggleTimer}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-bold transition ${
            isActive
              ? 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
              : 'bg-[var(--brand-primary)] text-white hover:opacity-90'
          }`}
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start
            </>
          )}
        </button>
        <button
          onClick={resetTimer}
          className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-lg transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Set Buttons */}
      <div className="grid grid-cols-4 gap-2">
        {[60, 90, 120, 180].map((time) => (
          <button
            key={time}
            onClick={() => quickSetTime(time)}
            className={`px-2 py-1.5 text-xs font-bold rounded transition ${
              customTime === time
                ? 'bg-[var(--brand-primary)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            {time < 60 ? `${time}s` : `${time / 60}m`}
          </button>
        ))}
      </div>
    </div>
  );
}
