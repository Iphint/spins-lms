import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, BookOpen, FileText, HelpCircle, MessageSquare, Globe, Lightbulb, ChevronRight, Sparkles } from 'lucide-react';

const actions = [
  { icon: BookOpen, label: "Explain This Lesson", desc: "Get a detailed explanation" },
  { icon: FileText, label: "Summarize Material", desc: "Get a quick summary" },
  { icon: HelpCircle, label: "Generate Practice Questions", desc: "Practice with AI questions" },
  { icon: MessageSquare, label: "Ask AI", desc: "Ask anything about the lesson" },
  { icon: Globe, label: "Translate to English", desc: "Translate current material" },
  { icon: Lightbulb, label: "Show Easier Explanation", desc: "Simplified explanation" },
  { icon: ChevronRight, label: "Recommend Next Lesson", desc: "Get learning suggestions" },
];

export default function AITutor() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-4 sm:right-6 w-80 sm:w-96 rounded-2xl shadow-2xl z-50 overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
          >
            <div className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-bold">AI Tutor</h3>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-white/20 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-white/80 mt-1">How can I help you learn today?</p>
            </div>
            <div className="p-3 max-h-96 overflow-y-auto">
              <div className="space-y-1.5">
                {actions.map((action, i) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{action.label}</p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{action.desc}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-500/10 dark:to-purple-500/10">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Ask anything..."
                    className="flex-1 bg-transparent outline-none text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  />
                  <button className="p-2 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition">
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-4 sm:right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg flex items-center justify-center z-50 hover:shadow-xl transition-shadow"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </motion.button>
    </>
  );
}
