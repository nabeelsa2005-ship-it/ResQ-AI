import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const GUIDE_STEPS = {
  English: [
    {
      icon: "🚨",
      title: "Welcome to Emergency Response AI!",
      desc: "I'm ResQ AI — your 24/7 emergency guide. I'll help you stay calm and take the right steps in any crisis.",
      tip: "Tip: Always call 112 for immediate emergency help!",
    },
    {
      icon: "🌐",
      title: "Multilingual Support",
      desc: "You've selected your preferred language(s). I can understand and respond in your language — even in the chat!",
      tip: "You can type in Hindi, English, or any selected language in the chat.",
    },
    {
      icon: "🆘",
      title: "How to Get Help",
      desc: "Type or speak your emergency. I'll give you step-by-step first-aid instructions instantly.",
      tip: "Press the 🎤 mic button to speak your emergency!",
    },
    {
      icon: "📍",
      title: "Find Nearby Services",
      desc: "Use 'Find Nearby' to locate hospitals, police stations, and fire departments near you.",
      tip: "Allow location access for accurate nearby services.",
    },
    {
      icon: "📞",
      title: "Quick Emergency Calls",
      desc: "One-tap call buttons for 112 (All), 102 (Ambulance), 101 (Fire), 100 (Police) are always visible.",
      tip: "Save these numbers: 112, 102, 101, 100",
    },
    {
      icon: "✅",
      title: "You're Ready!",
      desc: "You're all set! Remember — in any emergency, stay calm, follow the steps, and call for help.",
      tip: "This guide is available anytime from the home screen.",
    },
  ],
  Hindi: [
    {
      icon: "🚨",
      title: "आपातकालीन AI में आपका स्वागत है!",
      desc: "मैं ResQ AI हूँ — आपका 24/7 आपातकालीन मार्गदर्शक। किसी भी संकट में मैं आपको शांत रहने और सही कदम उठाने में मदद करूँगा।",
      tip: "टिप: तुरंत मदद के लिए हमेशा 112 पर कॉल करें!",
    },
    {
      icon: "🌐",
      title: "बहुभाषी समर्थन",
      desc: "आपने अपनी पसंदीदा भाषा चुनी है। मैं आपकी भाषा में समझ और जवाब दे सकता हूँ — चैट में भी!",
      tip: "चैट में हिंदी, अंग्रेजी या कोई भी चुनी भाषा में लिखें।",
    },
    {
      icon: "🆘",
      title: "मदद कैसे पाएं",
      desc: "अपना आपातकाल टाइप करें या बोलें। मैं तुरंत चरण-दर-चरण प्राथमिक चिकित्सा निर्देश दूँगा।",
      tip: "🎤 माइक बटन दबाकर अपना आपातकाल बोलें!",
    },
    {
      icon: "📍",
      title: "पास की सेवाएं खोजें",
      desc: "'पास खोजें' का उपयोग करके अपने नजदीकी अस्पताल, पुलिस स्टेशन और दमकल केंद्र खोजें।",
      tip: "सटीक जानकारी के लिए लोकेशन एक्सेस दें।",
    },
    {
      icon: "📞",
      title: "त्वरित आपातकालीन कॉल",
      desc: "112 (सभी), 102 (एम्बुलेंस), 101 (अग्नि), 100 (पुलिस) के लिए वन-टैप कॉल बटन हमेशा दिखते हैं।",
      tip: "ये नंबर याद रखें: 112, 102, 101, 100",
    },
    {
      icon: "✅",
      title: "आप तैयार हैं!",
      desc: "सब सेट है! याद रखें — किसी भी आपातकाल में शांत रहें, कदम फॉलो करें और मदद के लिए कॉल करें।",
      tip: "यह गाइड होम स्क्रीन से कभी भी उपलब्ध है।",
    },
  ],
  Spanish: [
    {
      icon: "🚨",
      title: "¡Bienvenido a Emergency Response AI!",
      desc: "Soy ResQ AI — tu guía de emergencias 24/7. Te ayudaré a mantener la calma y tomar las medidas correctas.",
      tip: "Consejo: ¡Llama siempre al 112 para ayuda de emergencia inmediata!",
    },
    {
      icon: "🌐",
      title: "Soporte Multilingüe",
      desc: "Has seleccionado tu(s) idioma(s) preferido(s). Puedo entender y responder en tu idioma — ¡incluso en el chat!",
      tip: "Puedes escribir en español, inglés o cualquier idioma seleccionado en el chat.",
    },
    {
      icon: "🆘",
      title: "Cómo Obtener Ayuda",
      desc: "Escribe o habla tu emergencia. Te daré instrucciones de primeros auxilios paso a paso al instante.",
      tip: "¡Presiona el botón 🎤 del micrófono para hablar tu emergencia!",
    },
    {
      icon: "📍",
      title: "Encontrar Servicios Cercanos",
      desc: "Usa 'Buscar Cercanos' para localizar hospitales, comisarías y bomberos cerca de ti.",
      tip: "Permite el acceso a la ubicación para servicios cercanos precisos.",
    },
    {
      icon: "📞",
      title: "Llamadas de Emergencia Rápidas",
      desc: "Botones de llamada con un toque para 112, 102, 101, 100 siempre visibles.",
      tip: "Guarda estos números: 112, 102, 101, 100",
    },
    {
      icon: "✅",
      title: "¡Estás Listo!",
      desc: "¡Todo configurado! Recuerda — en cualquier emergencia, mantén la calma y llama por ayuda.",
      tip: "Esta guía está disponible en cualquier momento desde la pantalla de inicio.",
    },
  ],
  French: [
    {
      icon: "🚨",
      title: "Bienvenue sur Emergency Response AI!",
      desc: "Je suis ResQ AI — votre guide d'urgence 24/7. Je vous aiderai à garder votre calme et à prendre les bonnes mesures.",
      tip: "Conseil: Appelez toujours le 112 pour une aide d'urgence immédiate!",
    },
    {
      icon: "🌐",
      title: "Support Multilingue",
      desc: "Vous avez sélectionné votre/vos langue(s) préférée(s). Je peux comprendre et répondre dans votre langue — même dans le chat!",
      tip: "Vous pouvez écrire en français, en anglais ou dans toute langue sélectionnée.",
    },
    {
      icon: "🆘",
      title: "Comment Obtenir de l'Aide",
      desc: "Tapez ou dites votre urgence. Je vous donnerai des instructions de premiers secours étape par étape instantanément.",
      tip: "Appuyez sur le bouton 🎤 du microphone pour parler de votre urgence!",
    },
    {
      icon: "📍",
      title: "Trouver des Services Proches",
      desc: "Utilisez 'Trouver à Proximité' pour localiser les hôpitaux, commissariats et pompiers proches de vous.",
      tip: "Autorisez l'accès à la localisation pour des services précis.",
    },
    {
      icon: "📞",
      title: "Appels d'Urgence Rapides",
      desc: "Boutons d'appel en un toucher pour 112, 102, 101, 100 toujours visibles.",
      tip: "Enregistrez ces numéros: 112, 102, 101, 100",
    },
    {
      icon: "✅",
      title: "Vous Êtes Prêt!",
      desc: "Tout est configuré! Rappellez-vous — dans toute urgence, restez calme et appelez à l'aide.",
      tip: "Ce guide est disponible à tout moment depuis l'écran d'accueil.",
    },
  ],
};

// Default to English if language not in guide map
const getGuideSteps = (lang) => GUIDE_STEPS[lang] || GUIDE_STEPS["English"];

export default function AIGuide({ onClose }) {
  const { primaryLang, user, t } = useAppContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const steps = getGuideSteps(primaryLang);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  const goNext = () => {
    setAnimating(true);
    setTimeout(() => {
      if (isLast) {
        onClose();
      } else {
        setStep((s) => s + 1);
        setAnimating(false);
      }
    }, 250);
  };

  const goPrev = () => {
    if (step === 0) return;
    setAnimating(true);
    setTimeout(() => {
      setStep((s) => s - 1);
      setAnimating(false);
    }, 250);
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        {/* Close */}
        <button style={closeBtn} onClick={onClose}>×</button>

        {/* Progress */}
        <div style={progressBar}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                ...progressDot,
                background: i <= step ? "#667eea" : "#e2e8f0",
                width: i === step ? "24px" : "8px",
              }}
            />
          ))}
        </div>

        {/* Step Counter */}
        <p style={stepCounter}>
          {primaryLang === "Hindi"
            ? `चरण ${step + 1} / ${steps.length}`
            : primaryLang === "Spanish"
            ? `Paso ${step + 1} / ${steps.length}`
            : primaryLang === "French"
            ? `Étape ${step + 1} / ${steps.length}`
            : `Step ${step + 1} / ${steps.length}`}
        </p>

        {/* Content */}
        <div style={{ ...contentBox, opacity: animating ? 0 : 1, transition: "opacity 0.25s" }}>
          <div style={iconCircle}>{current.icon}</div>
          <h2 style={title}>{current.title}</h2>
          <p style={desc}>{current.desc}</p>
          <div style={tipBox}>
            <span style={tipIcon}>💡</span>
            <span style={tipText}>{current.tip}</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={btnRow}>
          {step > 0 && (
            <button style={prevBtn} onClick={goPrev}>
              ← {primaryLang === "Hindi" ? "पिछला" : primaryLang === "Spanish" ? "Anterior" : primaryLang === "French" ? "Précédent" : "Back"}
            </button>
          )}
          <button style={{ ...nextBtn, marginLeft: step === 0 ? "auto" : "0" }} onClick={goNext}>
            {isLast
              ? primaryLang === "Hindi"
                ? "शुरू करें 🚀"
                : primaryLang === "Spanish"
                ? "¡Comenzar! 🚀"
                : primaryLang === "French"
                ? "Commencer 🚀"
                : "Let's Start 🚀"
              : primaryLang === "Hindi"
              ? "अगला →"
              : primaryLang === "Spanish"
              ? "Siguiente →"
              : primaryLang === "French"
              ? "Suivant →"
              : "Next →"}
          </button>
        </div>

        {/* Skip */}
        {!isLast && (
          <button style={skipBtn} onClick={onClose}>
            {primaryLang === "Hindi" ? "छोड़ें" : primaryLang === "Spanish" ? "Omitir" : primaryLang === "French" ? "Passer" : "Skip Guide"}
          </button>
        )}
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.75)",
  backdropFilter: "blur(8px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  padding: "20px",
};

const modal = {
  background: "#fff",
  borderRadius: "28px",
  padding: "28px 24px 24px",
  width: "100%",
  maxWidth: "380px",
  boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
  position: "relative",
  animation: "slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)",
};

const closeBtn = {
  position: "absolute",
  top: "16px",
  right: "16px",
  background: "#f1f5f9",
  border: "none",
  width: "32px",
  height: "32px",
  borderRadius: "50%",
  fontSize: "20px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#64748b",
  fontFamily: "inherit",
};

const progressBar = {
  display: "flex",
  gap: "6px",
  justifyContent: "center",
  marginBottom: "8px",
  alignItems: "center",
};

const progressDot = {
  height: "8px",
  borderRadius: "4px",
  transition: "all 0.3s ease",
};

const stepCounter = {
  textAlign: "center",
  fontSize: "12px",
  color: "#94a3b8",
  fontWeight: "600",
  marginBottom: "20px",
};

const contentBox = {
  textAlign: "center",
  marginBottom: "24px",
};

const iconCircle = {
  fontSize: "56px",
  display: "block",
  marginBottom: "16px",
  animation: "bounce 2s infinite",
};

const title = {
  fontSize: "20px",
  fontWeight: "800",
  color: "#0f172a",
  marginBottom: "10px",
  lineHeight: "1.3",
};

const desc = {
  fontSize: "14px",
  color: "#475569",
  lineHeight: "1.7",
  marginBottom: "16px",
};

const tipBox = {
  background: "linear-gradient(135deg, #f0f4ff, #e0e7ff)",
  border: "1px solid #c7d2fe",
  borderRadius: "14px",
  padding: "12px 14px",
  display: "flex",
  gap: "10px",
  alignItems: "flex-start",
  textAlign: "left",
};

const tipIcon = { fontSize: "18px", flexShrink: 0 };

const tipText = {
  fontSize: "13px",
  color: "#4338ca",
  fontWeight: "600",
  lineHeight: "1.5",
};

const btnRow = {
  display: "flex",
  gap: "10px",
  marginBottom: "12px",
};

const nextBtn = {
  flex: 1,
  background: "linear-gradient(135deg, #667eea, #764ba2)",
  color: "#fff",
  border: "none",
  padding: "14px",
  borderRadius: "14px",
  fontSize: "15px",
  fontWeight: "700",
  cursor: "pointer",
  fontFamily: "inherit",
  boxShadow: "0 4px 14px rgba(102,126,234,0.35)",
};

const prevBtn = {
  flex: 1,
  background: "#f1f5f9",
  color: "#64748b",
  border: "none",
  padding: "14px",
  borderRadius: "14px",
  fontSize: "15px",
  fontWeight: "600",
  cursor: "pointer",
  fontFamily: "inherit",
};

const skipBtn = {
  width: "100%",
  background: "none",
  border: "none",
  color: "#94a3b8",
  fontSize: "13px",
  cursor: "pointer",
  fontFamily: "inherit",
  textDecoration: "underline",
};
