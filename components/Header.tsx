
import React from 'react';
import { Sparkles, Globe } from 'lucide-react';
import { Language } from '../types';

interface HeaderProps {
  language?: Language;
  setLanguage?: (lang: Language) => void;
}

const Header: React.FC<HeaderProps> = ({ language = 'ko', setLanguage }) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Vibe Builder</span>
        </div>
        <div className="ml-auto flex items-center gap-4">
          {setLanguage && (
            <button 
              onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 hover:bg-slate-800 transition-colors text-xs font-medium text-slate-300"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{language === 'ko' ? '한국어' : 'English'}</span>
            </button>
          )}
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500 hidden sm:block">No-Code AI Solution</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
