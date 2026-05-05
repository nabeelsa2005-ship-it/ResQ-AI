// Offline first-aid decision trees.
// Steps follow standard first-aid guidance (American Heart Assn / Red Cross style).
// Bilingual: English + Hindi. Other languages fall back to English at runtime.
// IMPORTANT: This is first-aid guidance only — always call emergency services.

export const TRIAGE_TREES = {
  "heart-attack": {
    id: "heart-attack",
    title: { English: "Heart Attack / Chest Pain", Hindi: "दिल का दौरा / सीने में दर्द" },
    icon: "❤️",
    color: "#ef4444",
    category: "medical",
    severity: "critical",
    callNumber: "102",
    callLabel: { English: "Ambulance", Hindi: "एम्बुलेंस" },
    redFlags: {
      English: [
        "Crushing chest pain or pressure lasting > 2 minutes",
        "Pain spreading to arm, jaw, neck, back",
        "Cold sweat, nausea, shortness of breath",
      ],
      Hindi: [
        "सीने में 2 मिनट से अधिक दबाव या दर्द",
        "हाथ, जबड़े, गर्दन या पीठ में दर्द फैलना",
        "ठंडा पसीना, मतली, सांस लेने में तकलीफ",
      ],
    },
    steps: {
      English: [
        { type: "call", text: "Call 102 NOW. Tell them: 'suspected heart attack'.", critical: true },
        { type: "do", text: "Sit them down, half-upright with knees bent (W-position). Loosen tight clothing." },
        { type: "do", text: "If they are conscious AND have no aspirin allergy, have them chew (don't swallow whole) one adult aspirin (300 mg)." },
        { type: "warn", text: "Do NOT give food, water, or any other medicine." },
        { type: "do", text: "Note the EXACT time symptoms started — paramedics will ask." },
        { type: "check", text: "If they become unresponsive AND stop breathing normally — start CPR: 100–120 chest compressions per minute." },
        { type: "do", text: "Stay on the line with the dispatcher. Unlock the door for paramedics." },
      ],
      Hindi: [
        { type: "call", text: "तुरंत 102 पर कॉल करें। बताएं: 'दिल का दौरा हो सकता है'।", critical: true },
        { type: "do", text: "उन्हें आधा-सीधा बिठाएं, घुटने मोड़ें (W-स्थिति)। तंग कपड़े ढीले करें।" },
        { type: "do", text: "यदि वे होश में हैं और एस्पिरिन से एलर्जी नहीं है, तो एक एस्पिरिन (300 mg) चबाने को दें (निगलें नहीं)।" },
        { type: "warn", text: "खाना, पानी या अन्य दवा न दें।" },
        { type: "do", text: "लक्षण कब शुरू हुए — सटीक समय नोट करें।" },
        { type: "check", text: "यदि वे बेहोश हो जाएं और सांस न ले रहे हों — CPR शुरू करें: प्रति मिनट 100–120 छाती संपीड़न।" },
        { type: "do", text: "डिस्पैचर से बात करते रहें। पैरामेडिक्स के लिए दरवाज़ा खोलें।" },
      ],
    },
    cprAssist: true,
  },

  "choking": {
    id: "choking",
    title: { English: "Choking (Adult)", Hindi: "गला घुटना (वयस्क)" },
    icon: "😰",
    color: "#f97316",
    category: "medical",
    severity: "critical",
    callNumber: "102",
    callLabel: { English: "Ambulance", Hindi: "एम्बुलेंस" },
    redFlags: {
      English: [
        "Cannot speak, cough, or breathe",
        "Hands clutching the throat",
        "Lips turning blue",
      ],
      Hindi: [
        "बोल, खांस या सांस नहीं ले पा रहे",
        "हाथों से गला पकड़ रहे हैं",
        "होंठ नीले पड़ रहे हैं",
      ],
    },
    steps: {
      English: [
        { type: "check", text: "Ask: 'Are you choking?' If they can cough or speak — encourage them to keep coughing. Do NOT intervene." },
        { type: "call", text: "If they cannot speak or breathe — shout for help and have someone call 102.", critical: true },
        { type: "do", text: "Stand behind them. Lean them forward. Give 5 firm BACK BLOWS between the shoulder blades with the heel of your hand." },
        { type: "do", text: "If still choking — give 5 ABDOMINAL THRUSTS (Heimlich): hands above navel, pull sharply inward and upward." },
        { type: "do", text: "Alternate 5 back blows + 5 abdominal thrusts until the object comes out." },
        { type: "check", text: "If they become unresponsive — lower them to the floor, call 102 if not already, and start CPR." },
        { type: "warn", text: "For pregnant women or obese persons: do CHEST thrusts (centre of chest) instead of abdominal thrusts." },
      ],
      Hindi: [
        { type: "check", text: "पूछें: 'क्या आपका गला घुट रहा है?' यदि वे खांस या बोल सकते हैं — खांसते रहने दें। हस्तक्षेप न करें।" },
        { type: "call", text: "यदि वे बोल या सांस नहीं ले पा रहे — मदद के लिए चिल्लाएं और किसी से 102 पर कॉल करवाएं।", critical: true },
        { type: "do", text: "उनके पीछे खड़े हों। आगे झुकाएं। हाथ के निचले हिस्से से कंधों के बीच 5 ज़ोरदार थप्पड़ मारें।" },
        { type: "do", text: "अभी भी गला घुट रहा है तो — 5 पेट के झटके (हीमलिक): हाथ नाभि के ऊपर, अंदर और ऊपर की ओर ज़ोर से खींचें।" },
        { type: "do", text: "5 पीठ थप्पड़ + 5 पेट झटके बारी-बारी से दें जब तक वस्तु बाहर न आ जाए।" },
        { type: "check", text: "यदि वे बेहोश हो जाएं — फर्श पर लिटाएं, 102 कॉल करें (यदि नहीं किया) और CPR शुरू करें।" },
        { type: "warn", text: "गर्भवती या मोटे व्यक्ति के लिए: पेट के बजाय छाती के बीच में झटके दें।" },
      ],
    },
  },

  "severe-bleeding": {
    id: "severe-bleeding",
    title: { English: "Severe Bleeding", Hindi: "अधिक खून बहना" },
    icon: "🩸",
    color: "#dc2626",
    category: "medical",
    severity: "critical",
    callNumber: "102",
    callLabel: { English: "Ambulance", Hindi: "एम्बुलेंस" },
    redFlags: {
      English: [
        "Blood spurting or pooling",
        "Soaked through cloth in seconds",
        "Person becoming pale, weak, or confused",
      ],
      Hindi: [
        "खून छिटक रहा है या जमा हो रहा है",
        "कपड़ा कुछ ही सेकंड में भीग गया",
        "व्यक्ति पीला, कमज़ोर या भ्रमित",
      ],
    },
    steps: {
      English: [
        { type: "call", text: "Call 102 immediately.", critical: true },
        { type: "do", text: "Wear gloves if available. Otherwise put a plastic bag over your hand." },
        { type: "do", text: "Press FIRMLY on the wound with a clean cloth or your hand. Do NOT lift to check — just keep pressing." },
        { type: "do", text: "If blood soaks through, ADD more cloth on top — never remove the first layer." },
        { type: "do", text: "Raise the injured limb above heart level if possible (and if no broken bone is suspected)." },
        { type: "warn", text: "If bleeding from a limb won't stop with pressure: apply a TOURNIQUET 5–8 cm above the wound, NOT on a joint. Note the time." },
        { type: "do", text: "Lay them down, cover with a blanket to prevent shock. Do NOT give food or water." },
      ],
      Hindi: [
        { type: "call", text: "तुरंत 102 पर कॉल करें।", critical: true },
        { type: "do", text: "दस्ताने पहनें यदि उपलब्ध हों। नहीं तो हाथ पर प्लास्टिक की थैली डालें।" },
        { type: "do", text: "साफ कपड़े या हाथ से घाव पर मज़बूती से दबाएं। चेक करने के लिए न उठाएं — बस दबाते रहें।" },
        { type: "do", text: "खून रिस जाए तो ऊपर से और कपड़ा डालें — पहली परत न हटाएं।" },
        { type: "do", text: "घायल अंग को दिल के स्तर से ऊपर उठाएं (यदि हड्डी टूटी न हो)।" },
        { type: "warn", text: "हाथ-पैर का खून न रुके तो: घाव से 5–8 सेमी ऊपर TOURNIQUET लगाएं, जोड़ पर नहीं। समय नोट करें।" },
        { type: "do", text: "उन्हें लिटाएं, शॉक से बचाने के लिए कंबल ओढ़ाएं। खाना-पानी न दें।" },
      ],
    },
  },

  "burns": {
    id: "burns",
    title: { English: "Burns (Fire / Hot liquid)", Hindi: "जलन (आग / गर्म तरल)" },
    icon: "🔥",
    color: "#f97316",
    category: "fire",
    severity: "serious",
    callNumber: "101",
    callLabel: { English: "Fire / Ambulance", Hindi: "अग्निशमन / एम्बुलेंस" },
    redFlags: {
      English: [
        "Burn larger than the palm of the victim's hand",
        "Burn on face, hands, feet, joints, or genitals",
        "Burn looks white, charred, or leathery (3rd-degree)",
        "Burn caused by chemicals or electricity",
      ],
      Hindi: [
        "पीड़ित की हथेली से बड़ा जला हुआ हिस्सा",
        "चेहरे, हाथ, पैर, जोड़ या जननांग पर जला हुआ",
        "जला सफेद, काला या चमड़े जैसा दिखे (तीसरी डिग्री)",
        "रासायनिक या बिजली से जला"
      ],
    },
    steps: {
      English: [
        { type: "do", text: "Move them away from the source of heat. STOP, DROP, ROLL if clothes are on fire." },
        { type: "do", text: "Run COOL (not ice-cold) running water over the burn for AT LEAST 20 minutes. This is the single most important step." },
        { type: "warn", text: "Do NOT apply ice, butter, oil, toothpaste, or home remedies — they trap heat and worsen the burn." },
        { type: "do", text: "Remove jewellery and loose clothing near the burn BEFORE swelling starts. Do NOT pull off anything stuck to the skin." },
        { type: "do", text: "Cover the burn loosely with cling film or a clean, non-fluffy cloth. Do not wrap tightly." },
        { type: "call", text: "Call 101 / 102 if the burn is on face/hands/feet/joints/genitals, larger than a palm, or looks white/charred.", critical: true },
        { type: "do", text: "For chemical burns: brush off any dry chemical FIRST, then flush with water for 30+ minutes." },
      ],
      Hindi: [
        { type: "do", text: "उन्हें गर्मी के स्रोत से दूर करें। कपड़ों में आग हो तो: रुकें, गिरें, लुढ़कें।" },
        { type: "do", text: "जले पर ठंडा (बर्फीला नहीं) बहता पानी कम से कम 20 मिनट तक डालें। यही सबसे ज़रूरी कदम है।" },
        { type: "warn", text: "बर्फ, मक्खन, तेल, टूथपेस्ट या घरेलू उपाय न लगाएं — वे गर्मी रोककर जलन बढ़ाते हैं।" },
        { type: "do", text: "सूजन से पहले गहने और ढीले कपड़े हटाएं। त्वचा से चिपकी चीज़ न खींचें।" },
        { type: "do", text: "जले को क्लिंग फिल्म या साफ, बिना रोयें वाले कपड़े से ढीला ढकें। कस कर न बांधें।" },
        { type: "call", text: "चेहरे/हाथ/पैर/जोड़/जननांग पर, हथेली से बड़ा, या सफेद/काला हो तो 101 / 102 कॉल करें।", critical: true },
        { type: "do", text: "रासायनिक जलन: पहले सूखा रसायन झाड़ें, फिर 30+ मिनट पानी से धोएं।" },
      ],
    },
  },

  "unconscious": {
    id: "unconscious",
    title: { English: "Unconscious / Not Breathing", Hindi: "बेहोश / सांस नहीं" },
    icon: "💤",
    color: "#7c3aed",
    category: "medical",
    severity: "critical",
    callNumber: "102",
    callLabel: { English: "Ambulance", Hindi: "एम्बुलेंस" },
    redFlags: {
      English: [
        "Not responding to shouting or shaking",
        "Not breathing or only gasping",
        "Lips/face turning blue",
      ],
      Hindi: [
        "चिल्लाने या हिलाने पर कोई जवाब नहीं",
        "सांस नहीं ले रहे या केवल हांफ रहे",
        "होंठ/चेहरा नीला पड़ रहा",
      ],
    },
    steps: {
      English: [
        { type: "check", text: "Tap their shoulder firmly and shout 'Are you OK?'. Look for movement or response." },
        { type: "call", text: "If no response — SHOUT for help, call 102 NOW. Put phone on speaker.", critical: true },
        { type: "check", text: "Tilt head back, lift chin. Watch chest for 10 seconds: rising? Listen for breathing." },
        { type: "do", text: "BREATHING normally → roll them onto their SIDE (recovery position). Stay with them." },
        { type: "do", text: "NOT breathing or only gasping → start CPR immediately. Hands centre of chest, push hard 5–6 cm deep, 100–120 per minute." },
        { type: "do", text: "Keep going without stopping until paramedics arrive or they start breathing. Switch with someone every 2 minutes if you can." },
        { type: "warn", text: "Do NOT give water, food, or move them unless they're in danger (fire, traffic)." },
      ],
      Hindi: [
        { type: "check", text: "कंधे पर थपकी दें और चिल्लाएं 'क्या आप ठीक हैं?'। हलचल या जवाब देखें।" },
        { type: "call", text: "जवाब नहीं — मदद के लिए चिल्लाएं, अभी 102 कॉल करें। फोन स्पीकर पर रखें।", critical: true },
        { type: "check", text: "सिर पीछे झुकाएं, ठोड़ी उठाएं। 10 सेकंड छाती देखें: उठ रही? सांस सुनें।" },
        { type: "do", text: "सांस सामान्य → उन्हें करवट पर लिटाएं (रिकवरी पोज़ीशन)। साथ रहें।" },
        { type: "do", text: "सांस नहीं या केवल हांफना → तुरंत CPR शुरू करें। हाथ छाती के बीच, 5–6 सेमी गहरा, प्रति मिनट 100–120।" },
        { type: "do", text: "पैरामेडिक्स आने या सांस वापस आने तक बिना रुके जारी रखें। हो सके तो हर 2 मिनट में किसी और से बदलें।" },
        { type: "warn", text: "पानी, खाना न दें, हिलाएं नहीं — सिवाय आग/ट्रैफिक जैसे खतरे के।" },
      ],
    },
    cprAssist: true,
  },
};

export const TRIAGE_BY_CATEGORY = {
  medical: ["heart-attack", "choking", "severe-bleeding", "unconscious"],
  fire: ["burns"],
  accident: ["severe-bleeding", "unconscious"],
  crime: ["severe-bleeding", "unconscious"],
  disaster: ["severe-bleeding", "unconscious"],
  home: ["burns", "severe-bleeding"],
};

export const getTriageTree = (id) => TRIAGE_TREES[id] || null;

export const getTriageContent = (tree, lang) => {
  if (!tree) return null;
  const fallback = "English";
  return {
    title: tree.title[lang] || tree.title[fallback],
    callLabel: tree.callLabel[lang] || tree.callLabel[fallback],
    redFlags: tree.redFlags[lang] || tree.redFlags[fallback],
    steps: tree.steps[lang] || tree.steps[fallback],
  };
};
