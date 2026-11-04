import { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../context/AuthContext';

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(typeof window !== 'undefined' && window.innerWidth < 1024);
  const { teacher } = useAuth();
  const subject = teacher?.subject || '';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} subject={subject} />
      <motion.div
        initial={false}
        animate={{ marginLeft: typeof window !== 'undefined' && window.innerWidth >= 1024 ? (collapsed ? 72 : 260) : 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex flex-col min-h-screen"
      >
        <Navbar onToggleSidebar={() => setCollapsed(!collapsed)} subject={subject} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
