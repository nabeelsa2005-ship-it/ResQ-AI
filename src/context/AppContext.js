import React, { createContext, useContext, useState, useEffect } from "react";

const Ctx = createContext();

// Primary language translations for UI
export const UI_TRANSLATIONS = {
  English: {
    hello: "Hello",
    emergency: "Emergency Response",
    aiGuide: "AI-powered guide in critical moments",
    selectEmergency: "SELECT EMERGENCY TYPE",
    describeEmergency: 'Describe emergency e.g. "Heart attack"',
    getHelp: "🆘 GET HELP NOW",
    listening: "Listening...",
    nearby: "📍 Find Nearby Hospitals, Police & Fire Stations",
    quickCall: "QUICK CALL",
    logout: "Logout",
    voiceError: "Voice not supported. Please type.",
    voiceFailed: "Voice failed. Please type.",
    typeError: "Please describe your emergency.",
    medical: "Medical",
    fire: "Fire",
    accident: "Accident",
    crime: "Crime",
    disaster: "Disaster",
    home: "Home",
    guideBtn: "🤖 AI Guide",
  },
  Hindi: {
    hello: "नमस्ते",
    emergency: "आपातकालीन सहायता",
    aiGuide: "AI संचालित मार्गदर्शक - महत्वपूर्ण क्षणों में",
    selectEmergency: "आपातकाल प्रकार चुनें",
    describeEmergency: 'आपातकाल बताएं जैसे "दिल का दौरा"',
    getHelp: "🆘 अभी मदद लें",
    listening: "सुन रहा है...",
    nearby: "📍 पास के अस्पताल, पुलिस और फायर स्टेशन खोजें",
    quickCall: "त्वरित कॉल",
    logout: "लॉगआउट",
    voiceError: "वॉयस समर्थित नहीं है। कृपया टाइप करें।",
    voiceFailed: "वॉयस विफल। कृपया टाइप करें।",
    typeError: "कृपया अपना आपातकाल बताएं।",
    medical: "चिकित्सा",
    fire: "आग",
    accident: "दुर्घटना",
    crime: "अपराध",
    disaster: "आपदा",
    home: "घर",
    guideBtn: "🤖 AI गाइड",
  },
  Spanish: {
    hello: "Hola",
    emergency: "Respuesta de Emergencia",
    aiGuide: "Guía impulsada por IA en momentos críticos",
    selectEmergency: "SELECCIONE TIPO DE EMERGENCIA",
    describeEmergency: 'Describe emergencia ej. "Ataque al corazón"',
    getHelp: "🆘 OBTENER AYUDA AHORA",
    listening: "Escuchando...",
    nearby: "📍 Hospitales, Policía y Bomberos Cercanos",
    quickCall: "LLAMADA RÁPIDA",
    logout: "Cerrar sesión",
    voiceError: "Voz no soportada. Por favor escriba.",
    voiceFailed: "Voz fallida. Por favor escriba.",
    typeError: "Por favor describa su emergencia.",
    medical: "Médico",
    fire: "Fuego",
    accident: "Accidente",
    crime: "Crimen",
    disaster: "Desastre",
    home: "Hogar",
    guideBtn: "🤖 Guía IA",
  },
  French: {
    hello: "Bonjour",
    emergency: "Réponse d'Urgence",
    aiGuide: "Guide alimenté par IA dans les moments critiques",
    selectEmergency: "SÉLECTIONNER LE TYPE D'URGENCE",
    describeEmergency: 'Décrivez urgence ex. "Crise cardiaque"',
    getHelp: "🆘 OBTENIR DE L'AIDE",
    listening: "Écoute...",
    nearby: "📍 Hôpitaux, Police et Pompiers Proches",
    quickCall: "APPEL RAPIDE",
    logout: "Déconnexion",
    voiceError: "Voix non supportée. Veuillez écrire.",
    voiceFailed: "Voix échouée. Veuillez écrire.",
    typeError: "Veuillez décrire votre urgence.",
    medical: "Médical",
    fire: "Incendie",
    accident: "Accident",
    crime: "Crime",
    disaster: "Catastrophe",
    home: "Maison",
    guideBtn: "🤖 Guide IA",
  },
  German: {
    hello: "Hallo",
    emergency: "Notfallreaktion",
    aiGuide: "KI-gestützter Leitfaden in kritischen Momenten",
    selectEmergency: "NOTFALLTYP AUSWÄHLEN",
    describeEmergency: 'Beschreiben Sie den Notfall z.B. "Herzinfarkt"',
    getHelp: "🆘 JETZT HILFE HOLEN",
    listening: "Hört zu...",
    nearby: "📍 Nahegelegene Krankenhäuser, Polizei & Feuerwehr",
    quickCall: "SCHNELLRUF",
    logout: "Abmelden",
    voiceError: "Sprache nicht unterstützt. Bitte tippen.",
    voiceFailed: "Sprache fehlgeschlagen. Bitte tippen.",
    typeError: "Bitte beschreiben Sie Ihren Notfall.",
    medical: "Medizinisch",
    fire: "Feuer",
    accident: "Unfall",
    crime: "Verbrechen",
    disaster: "Katastrophe",
    home: "Haus",
    guideBtn: "🤖 KI-Leitfaden",
  },
  Marathi: {
    hello: "नमस्कार",
    emergency: "आणीबाणी प्रतिसाद",
    aiGuide: "AI मार्गदर्शक - महत्त्वाच्या क्षणी",
    selectEmergency: "आणीबाणीचा प्रकार निवडा",
    describeEmergency: 'आणीबाणी सांगा उदा. "हृदयविकार"',
    getHelp: "🆘 आता मदत घ्या",
    listening: "ऐकत आहे...",
    nearby: "📍 जवळचे रुग्णालय, पोलिस आणि अग्निशमन",
    quickCall: "त्वरित कॉल",
    logout: "बाहेर पडा",
    voiceError: "व्हॉइस समर्थित नाही. कृपया टाईप करा.",
    voiceFailed: "व्हॉइस अयशस्वी. कृपया टाईप करा.",
    typeError: "कृपया आपली आणीबाणी सांगा.",
    medical: "वैद्यकीय",
    fire: "आग",
    accident: "अपघात",
    crime: "गुन्हा",
    disaster: "आपत्ती",
    home: "घर",
    guideBtn: "🤖 AI मार्गदर्शक",
  },
  Bengali: {
    hello: "হ্যালো",
    emergency: "জরুরী প্রতিক্রিয়া",
    aiGuide: "AI চালিত গাইড - সংকটময় মুহূর্তে",
    selectEmergency: "জরুরী ধরন নির্বাচন করুন",
    describeEmergency: 'জরুরী অবস্থা বর্ণনা করুন যেমন "হার্ট অ্যাটাক"',
    getHelp: "🆘 এখনই সাহায্য পান",
    listening: "শুনছি...",
    nearby: "📍 কাছের হাসপাতাল, পুলিশ ও দমকল খুঁজুন",
    quickCall: "দ্রুত কল",
    logout: "লগআউট",
    voiceError: "ভয়েস সমর্থিত নয়। টাইপ করুন।",
    voiceFailed: "ভয়েস ব্যর্থ। টাইপ করুন।",
    typeError: "আপনার জরুরী অবস্থা বর্ণনা করুন।",
    medical: "চিকিৎসা",
    fire: "আগুন",
    accident: "দুর্ঘটনা",
    crime: "অপরাধ",
    disaster: "দুর্যোগ",
    home: "বাড়ি",
    guideBtn: "🤖 AI গাইড",
  },
  Tamil: {
    hello: "வணக்கம்",
    emergency: "அவசர நிலை மறுமொழி",
    aiGuide: "AI மூலம் வழிகாட்டல் - முக்கியமான தருணங்களில்",
    selectEmergency: "அவசர நிலை வகையை தேர்ந்தெடுக்கவும்",
    describeEmergency: 'அவசர நிலையை விவரிக்கவும் எ.கா. "இதய அடைப்பு"',
    getHelp: "🆘 இப்போது உதவி பெறுங்கள்",
    listening: "கேட்கிறேன்...",
    nearby: "📍 அருகிலுள்ள மருத்துவமனை, காவல்நிலையம் மற்றும் தீயணைப்பு",
    quickCall: "விரைவு அழைப்பு",
    logout: "வெளியேறு",
    voiceError: "குரல் ஆதரிக்கப்படவில்லை. தயவுசெய்து தட்டச்சு செய்யுங்கள்.",
    voiceFailed: "குரல் தோல்வியடைந்தது. தயவுசெய்து தட்டச்சு செய்யுங்கள்.",
    typeError: "உங்கள் அவசர நிலையை விவரிக்கவும்.",
    medical: "மருத்துவம்",
    fire: "தீ",
    accident: "விபத்து",
    crime: "குற்றம்",
    disaster: "பேரிடர்",
    home: "வீடு",
    guideBtn: "🤖 AI வழிகாட்டி",
  },
  Telugu: {
    hello: "నమస్కారం",
    emergency: "అత్యవసర స్పందన",
    aiGuide: "AI ఆధారిత మార్గదర్శకం - క్లిష్ట సమయాల్లో",
    selectEmergency: "అత్యవసర రకం ఎంచుకోండి",
    describeEmergency: 'అత్యవసర పరిస్థితిని వివరించండి ఉదా. "గుండెపోటు"',
    getHelp: "🆘 ఇప్పుడే సహాయం పొందండి",
    listening: "వింటున్నాను...",
    nearby: "📍 దగ్గరలోని ఆసుపత్రి, పోలీస్ & అగ్నిమాపక స్టేషన్",
    quickCall: "త్వరిత కాల్",
    logout: "లాగ్ అవుట్",
    voiceError: "వాయిస్ మద్దతు లేదు. దయచేసి టైప్ చేయండి.",
    voiceFailed: "వాయిస్ విఫలమైంది. దయచేసి టైప్ చేయండి.",
    typeError: "దయచేసి మీ అత్యవసర పరిస్థితిని వివరించండి.",
    medical: "వైద్య",
    fire: "అగ్ని",
    accident: "ప్రమాదం",
    crime: "నేరం",
    disaster: "విపత్తు",
    home: "ఇల్లు",
    guideBtn: "🤖 AI మార్గదర్శకం",
  },
  Chinese: {
    hello: "你好",
    emergency: "紧急响应",
    aiGuide: "AI驱动的关键时刻指南",
    selectEmergency: "选择紧急类型",
    describeEmergency: '描述紧急情况如"心脏病发作"',
    getHelp: "🆘 立即获得帮助",
    listening: "正在听...",
    nearby: "📍 寻找附近医院、警察和消防站",
    quickCall: "快速拨号",
    logout: "退出登录",
    voiceError: "不支持语音。请输入。",
    voiceFailed: "语音失败。请输入。",
    typeError: "请描述您的紧急情况。",
    medical: "医疗",
    fire: "火灾",
    accident: "事故",
    crime: "犯罪",
    disaster: "灾难",
    home: "家庭",
    guideBtn: "🤖 AI向导",
  },
  Arabic: {
    hello: "مرحبا",
    emergency: "الاستجابة للطوارئ",
    aiGuide: "دليل مدعوم بالذكاء الاصطناعي في اللحظات الحرجة",
    selectEmergency: "اختر نوع الطوارئ",
    describeEmergency: 'صف حالة الطوارئ مثل "نوبة قلبية"',
    getHelp: "🆘 احصل على المساعدة الآن",
    listening: "يستمع...",
    nearby: "📍 البحث عن المستشفيات والشرطة وإطفاء الحرائق القريبة",
    quickCall: "مكالمة سريعة",
    logout: "تسجيل خروج",
    voiceError: "الصوت غير مدعوم. الرجاء الكتابة.",
    voiceFailed: "فشل الصوت. الرجاء الكتابة.",
    typeError: "الرجاء وصف حالة الطوارئ الخاصة بك.",
    medical: "طبي",
    fire: "حريق",
    accident: "حادث",
    crime: "جريمة",
    disaster: "كارثة",
    home: "منزل",
    guideBtn: "🤖 دليل الذكاء الاصطناعي",
  },
  Portuguese: {
    hello: "Olá",
    emergency: "Resposta de Emergência",
    aiGuide: "Guia movido por IA em momentos críticos",
    selectEmergency: "SELECIONE O TIPO DE EMERGÊNCIA",
    describeEmergency: 'Descreva emergência ex. "Ataque cardíaco"',
    getHelp: "🆘 OBTER AJUDA AGORA",
    listening: "Ouvindo...",
    nearby: "📍 Hospitais, Polícia e Bombeiros Próximos",
    quickCall: "CHAMADA RÁPIDA",
    logout: "Sair",
    voiceError: "Voz não suportada. Por favor escreva.",
    voiceFailed: "Voz falhou. Por favor escreva.",
    typeError: "Por favor descreva sua emergência.",
    medical: "Médico",
    fire: "Fogo",
    accident: "Acidente",
    crime: "Crime",
    disaster: "Desastre",
    home: "Casa",
    guideBtn: "🤖 Guia IA",
  },
};

export const getT = (lang) =>
  UI_TRANSLATIONS[lang] || UI_TRANSLATIONS["English"];

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [selectedLanguages, setSelectedLanguages] = useState(["English"]);
  const [showGuide, setShowGuide] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState([]);

  useEffect(() => {
    try {
      const u = localStorage.getItem("er_user");
      const l = localStorage.getItem("er_langs");
      const c = localStorage.getItem("er_contacts");
      if (u) setUser(JSON.parse(u));
      if (l) setSelectedLanguages(JSON.parse(l));
      if (c) setEmergencyContacts(JSON.parse(c));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveEmergencyContacts = (contacts) => {
    setEmergencyContacts(contacts);
    localStorage.setItem("er_contacts", JSON.stringify(contacts));
  };

  const login = (name, email) => {
    const u = { name, email };
    setUser(u);
    localStorage.setItem("er_user", JSON.stringify(u));
    // Check if first time user
    const wasUser = localStorage.getItem("er_was_user");
    if (!wasUser) {
      setIsNewUser(true);
      localStorage.setItem("er_was_user", "true");
    }
  };

  const saveLanguages = (langs) => {
    setSelectedLanguages(langs);
    localStorage.setItem("er_langs", JSON.stringify(langs));
  };

  const logout = () => {
    setUser(null);
    setSelectedLanguages(["English"]);
    setShowGuide(false);
    setIsNewUser(false);
    setEmergencyContacts([]);
    localStorage.removeItem("er_user");
    localStorage.removeItem("er_langs");
    localStorage.removeItem("er_contacts");
  };

  const primaryLang = selectedLanguages[0] || "English";
  const t = getT(primaryLang);

  return (
    <Ctx.Provider
      value={{
        user,
        login,
        logout,
        selectedLanguages,
        saveLanguages,
        showGuide,
        setShowGuide,
        isNewUser,
        setIsNewUser,
        primaryLang,
        t,
        emergencyContacts,
        saveEmergencyContacts,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useAppContext = () => useContext(Ctx);