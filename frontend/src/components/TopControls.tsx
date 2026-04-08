import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
      aria-label="Toggle theme"
    >
      <motion.div
        key={theme}
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {theme === 'dark' ? <Sun className="w-5 h-5 text-cosmic-gold" /> : <Moon className="w-5 h-5 text-cosmic-purple" />}
      </motion.div>
    </motion.button>
  );
}

const langs = [
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'fr', flag: '🇫🇷', label: 'FR' },
  { code: 'ar', flag: '🇸🇦', label: 'AR' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  const switchLang = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('neurolearn-lang', code);
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr';
  };

  return (
    <div className="flex bg-secondary rounded-full p-1 gap-0.5">
      {langs.map(l => (
        <motion.button
          key={l.code}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => switchLang(l.code)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            i18n.language === l.code
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {l.flag} {l.label}
        </motion.button>
      ))}
    </div>
  );
}

export function TopControls() {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rtl:right-auto rtl:left-4">
      <LanguageSwitcher />
      <ThemeToggle />
    </div>
  );
}
