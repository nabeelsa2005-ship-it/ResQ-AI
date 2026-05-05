import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import "./LanguageSelect.css";

const LANGUAGES = [
  { code: "English", name: "English", flag: "🇬🇧", native: "English" },
  { code: "Hindi", name: "Hindi", flag: "🇮🇳", native: "हिन्दी" },
  { code: "Spanish", name: "Spanish", flag: "🇪🇸", native: "Español" },
  { code: "French", name: "French", flag: "🇫🇷", native: "Français" },
  { code: "German", name: "German", flag: "🇩🇪", native: "Deutsch" },
  { code: "Chinese", name: "Chinese", flag: "🇨🇳", native: "中文" },
  { code: "Japanese", name: "Japanese", flag: "🇯🇵", native: "日本語" },
  { code: "Arabic", name: "Arabic", flag: "🇸🇦", native: "العربية" },
  { code: "Portuguese", name: "Portuguese", flag: "🇧🇷", native: "Português" },
  { code: "Russian", name: "Russian", flag: "🇷🇺", native: "Русский" },
  { code: "Bengali", name: "Bengali", flag: "🇧🇩", native: "বাংলা" },
  { code: "Marathi", name: "Marathi", flag: "🇮🇳", native: "मराठी" },
];

const LanguageSelect = () => {
  const { selectedLanguage, saveLanguage, user } = useAppContext();
  const [selected, setSelected] = useState(selectedLanguage || "English");
  const navigate = useNavigate();

  const handleSave = () => {
    saveLanguage(selected);
    navigate("/");
  };

  return (
    <div className="lang-bg">
      <div className="lang-container">
        <div className="lang-header">
          <h1 className="lang-title">Choose Your Language</h1>
          <p className="lang-subtitle">
            Hi {user?.name}! Select the language for emergency guidance.
          </p>
        </div>

        <div className="lang-grid">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              className={`lang-card ${selected === lang.code ? "selected" : ""}`}
              onClick={() => setSelected(lang.code)}
            >
              <span className="lang-flag">{lang.flag}</span>
              <span className="lang-native">{lang.native}</span>
              <span className="lang-name">{lang.name}</span>
              {selected === lang.code && (
                <span className="lang-check">✓</span>
              )}
            </button>
          ))}
        </div>

        <button className="lang-save-btn" onClick={handleSave}>
          Continue with {selected} →
        </button>
      </div>
    </div>
  );
};

export default LanguageSelect;