import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { TopControls } from './TopControls';

export function Header() {
  const navigate = useNavigate();

  return (
    <>
      <TopControls />
      <motion.div
        className="fixed top-4 left-4 z-50 cursor-pointer flex items-center gap-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate('/')}
      >
        <img 
          src="/logo.svg" 
          alt="NeuroLearn Logo" 
          className="w-10 h-10"
        />
        <span className="hidden sm:inline gradient-cosmic-text text-lg font-bold font-display">
          NeuroLearn
        </span>
      </motion.div>
    </>
  );
}
