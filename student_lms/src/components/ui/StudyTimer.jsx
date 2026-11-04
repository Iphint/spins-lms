import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Play, Pause, RotateCcw, X } from 'lucide-react';

export default function StudyTimer() {
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && time > 0) {
      intervalRef.current = setInterval(() => setTime(t => t - 1), 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, time]);

  const mins = Math.floor(time / 60);
  const secs = time % 60;
  const reset = () => { setTime(25 * 60); setIsRunning(false); };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 left-4 sm:left-6 w-64 rounded-2xl shadow-2xl z-50 p-5"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Timer className="w-4 h-4 text-indigo-500" /> Study Timer
              </h3>
              <button onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" style={{ color: 'var(--text-tertiary)' }} />
              </button>
            </div>
            <div className="text-center mb-4">
              <p className="text-4xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>
                {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Pomodoro Timer</p>
            </div>
            <div className="flex gap-2 justify-center">
              <button onClick={() => setIsRunning(!isRunning)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1 ${isRunning ? 'bg-amber-500 text-white' : 'bg-indigo-500 text-white'}`}>
                {isRunning ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start</>}
              </button>
              <button onClick={reset}
                className="px-3 py-2 rounded-xl text-sm transition hover:bg-gray-100 dark:hover:bg-gray-800"
                style={{ color: 'var(--text-secondary)' }}>
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 justify-center mt-3">
              {[15, 25, 45].map(m => (
                <button key={m} onClick={() => { setTime(m * 60); setIsRunning(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${time === m * 60 && !isRunning ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : ''}`}
                  style={time !== m * 60 || isRunning ? { color: 'var(--text-tertiary)' } : {}}>
                  {m}m
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-4 sm:left-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg flex items-center justify-center z-50 hover:shadow-xl transition-shadow"
      >
        <Timer className="w-6 h-6" />
      </motion.button>
    </>
  );
}
