
import React, { createContext, useState, useContext, useEffect } from 'react';
import translations from './translations'; // Correctly import the default export
import { User } from '@/api/entities';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en'); // Default to English
  
  useEffect(() => {
    const loadInitialLanguage = async () => {
      let initialLang = 'en'; // Fallback language
      try {
        // 1. Try localStorage
        const savedLanguage = localStorage.getItem('preferredLanguage');
        if (savedLanguage && translations[savedLanguage]) {
          initialLang = savedLanguage;
        } else {
          // 2. Try user preference from backend (if logged in)
          try {
            const userData = await User.me();
            if (userData && userData.preferred_language) {
              const languageMap = {
                'English': 'en', 'Bosnian': 'bs', 'Turkish': 'tr', 'German': 'de'
              };
              const langCode = languageMap[userData.preferred_language];
              if (langCode && translations[langCode]) {
                initialLang = langCode;
                localStorage.setItem('preferredLanguage', langCode); // Sync localStorage
              }
            }
          } catch (userError) {
            // User not logged in or error fetching user, proceed to browser lang
            console.warn("Could not fetch user preferences for language:", userError.message);
          }

          // 3. If still on 'en' (or initialLang) and localStorage was not set, try browser language
          if (initialLang === 'en' && !savedLanguage) {
            const browserLang = navigator.language.split('-')[0];
            if (translations[browserLang]) {
              initialLang = browserLang;
            }
          }
        }
      } catch (e) {
        console.error("Error loading initial language:", e);
      }
      console.log("Setting initial language to:", initialLang);
      setLanguage(initialLang);
    };

    loadInitialLanguage();
  }, []);

  const changeLanguage = async (newLanguage) => {
    if (translations[newLanguage]) {
      console.log("Changing language to:", newLanguage);
      setLanguage(newLanguage);
      localStorage.setItem('preferredLanguage', newLanguage);
      
      try {
        const userData = await User.me(); // Check if user is logged in
        if (userData) {
          const languageMapReverse = {
            'en': 'English', 'bs': 'Bosnian', 'tr': 'Turkish', 'de': 'German'
          };
          const fullLanguageName = languageMapReverse[newLanguage] || 'English';
          await User.updateMyUserData({ preferred_language: fullLanguageName });
        }
      } catch (error) {
        // User not logged in or error updating backend, localStorage is already set
        console.warn("Could not update user language preference on backend:", error.message);
      }
    } else {
      console.warn(`Language ${newLanguage} not found in translations.`);
    }
  };

  const t = (key, variables = {}) => {
    if (!translations) {
      console.error("Translations object is not loaded!");
      return key;
    }

    const keys = key.split('.');
    let currentLangTranslations = translations[language];

    // Fallback to English if the current language isn't found or its translations are missing
    if (!currentLangTranslations) {
      console.warn(`Translations for language '${language}' not found. Falling back to 'en'.`);
      currentLangTranslations = translations['en'];
    }
    
    let result = currentLangTranslations;
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        // Key not found in current language, try English as a fallback
        let fallbackResult = translations['en'];
        for (const fk of keys) {
          if (fallbackResult && typeof fallbackResult === 'object' && fk in fallbackResult) {
            fallbackResult = fallbackResult[fk];
          } else {
            return key; // Return the key itself if not found anywhere
          }
        }
        result = fallbackResult;
        break; // Found in fallback, break the loop
      }
    }
    
    if (typeof result === 'string') {
      // Replace placeholders like {{variable}}
      return result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
        return variables.hasOwnProperty(varName) ? variables[varName] : match;
      });
    }
    
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
