import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Plus, X, ClipboardCheck, FileText, PenLine, BookOpen } from 'lucide-react';

export default function FloatingButtons() {
  const [showAI, setShowAI] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const quickAddItems = [
    { icon: ClipboardCheck, label: 'Record Attendance', color: 'bg-emerald-500' },
    { icon: FileText, label: 'Create Worksheet', color: 'bg-amber-500' },
    { icon: PenLine, label: 'Write Journal', color: 'bg-indigo-500' },
    { icon: BookOpen, label: 'Add Meeting', color: 'bg-sky-500' },
  ];

  return (
    <>
      {/* AI Assistant Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {showAI && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="w-80 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
            >
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-indigo-500 to-purple-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <Bot className="w-5 h-5" />
                    <span className="font-semibold text-sm">AI Teaching Assistant</span>
                  </div>
                  <button onClick={() => setShowAI(false)} className="text-white/70 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 mb-3">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    Hello! 👋 I am your AI assistant. I can help with:
                  </p>
                  <ul className="text-xs text-zinc-500 mt-2 space-y-1">
                    <li>• Creating practice exercises</li>
                    <li>• Analyzing student performance</li>
                    <li>• Recommending teaching methods</li>
                    <li>• Generating lesson plans</li>
                  </ul>
                </div>
                <div className="flex gap-2">
                  <input
                    placeholder="Ask me anything..."
                    className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white outline-none"
                  />
                  <button className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors">
                    Send
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showQuickAdd && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col gap-2 mb-2"
            >
              {quickAddItems.map((item, i) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-zinc-900 shadow-lg border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors whitespace-nowrap"
                >
                  <div className={`w-6 h-6 rounded-full ${item.color} flex items-center justify-center`}>
                    <item.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  {item.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowQuickAdd(!showQuickAdd); setShowAI(false); }}
            className="w-12 h-12 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center hover:bg-emerald-700 transition-colors"
          >
            <motion.div animate={{ rotate: showQuickAdd ? 45 : 0 }}>
              <Plus className="w-5 h-5" />
            </motion.div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setShowAI(!showAI); setShowQuickAdd(false); }}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            <Bot className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </>
  );
}
