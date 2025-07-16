import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
];

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState('en');

  // Optionally persist language in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('app_language');
    if (stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) {
      setLanguage(stored);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}; 