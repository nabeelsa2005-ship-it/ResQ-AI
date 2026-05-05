const emergencyData = {
  medical: {
    id: "medical",
    title: "Medical Emergency",
    icon: "❤️",
    color: "#FF4444",
    emergencyNumber: "102",
    numberLabel: "Ambulance",
    subcategories: {
      heart_attack: {
        title: "Heart Attack",
        keywords: ["heart attack", "chest pain", "chest pressure", 
                   "heart pain", "cardiac"],
        steps: [
          {
            id: 1,
            title: "Call Ambulance Immediately",
            description: "Call 102 right now. Tell them the exact location.",
            duration: 30,
            critical: true,
          },
          {
            id: 2,
            title: "Make Person Comfortable",
            description:
              "Help them sit or lie down. Loosen tight clothing around neck and chest.",
            duration: 60,
            critical: false,
          },
          {
            id: 3,
            title: "Do NOT Give Water or Food",
            description:
              "Do not give anything to eat or drink. Keep them calm and still.",
            duration: 30,
            critical: true,
          },
          {
            id: 4,
            title: "Start CPR If Unconscious",
            description:
              "If they stop breathing, start CPR. Push hard and fast on center of chest - 30 times, then 2 breaths.",
            duration: 120,
            critical: true,
          },
          {
            id: 5,
            title: "Stay With Them",
            description:
              "Keep talking to them. Keep them calm. Wait for ambulance.",
            duration: 60,
            critical: false,
          },
        ],
      },
      choking: {
        title: "Choking",
        keywords: ["choking", "cannot breathe", "food stuck", 
                   "throat stuck", "not breathing"],
        steps: [
          {
            id: 1,
            title: "Ask If They Are Choking",
            description:
              'Ask "Are you choking?" If they cannot speak or breathe, act immediately.',
            duration: 10,
            critical: true,
          },
          {
            id: 2,
            title: "Give 5 Back Blows",
            description:
              "Lean them forward. Give 5 firm blows between shoulder blades with heel of your hand.",
            duration: 30,
            critical: true,
          },
          {
            id: 3,
            title: "Give 5 Abdominal Thrusts",
            description:
              "Stand behind them. Make a fist above belly button. Pull sharply inward and upward 5 times.",
            duration: 30,
            critical: true,
          },
          {
            id: 4,
            title: "Repeat Until Clear",
            description:
              "Keep alternating 5 back blows and 5 abdominal thrusts until object comes out.",
            duration: 60,
            critical: true,
          },
          {
            id: 5,
            title: "Call 102 If Not Resolved",
            description:
              "If choking continues, call 102 immediately. Do not leave them alone.",
            duration: 30,
            critical: true,
          },
        ],
      },
      unconscious: {
        title: "Person Unconscious",
        keywords: ["unconscious", "fainted", "not responding", 
                   "collapsed", "passed out", "faint"],
        steps: [
          {
            id: 1,
            title: "Check Response",
            description:
              "Tap their shoulders firmly and shout their name. Check if they respond.",
            duration: 10,
            critical: true,
          },
          {
            id: 2,
            title: "Call 102 Immediately",
            description: "Call ambulance right now. Do not wait.",
            duration: 30,
            critical: true,
          },
          {
            id: 3,
            title: "Check Breathing",
            description:
              "Tilt head back gently, lift chin. Look, listen, feel for breathing for 10 seconds.",
            duration: 30,
            critical: true,
          },
          {
            id: 4,
            title: "Start CPR If Not Breathing",
            description:
              "Place heel of hand on center of chest. Press down hard 30 times. Give 2 rescue breaths. Repeat.",
            duration: 120,
            critical: true,
          },
          {
            id: 5,
            title: "Recovery Position",
            description:
              "If breathing, roll them on their side. This prevents choking if they vomit.",
            duration: 30,
            critical: false,
          },
        ],
      },
      bleeding: {
        title: "Heavy Bleeding",
        keywords: ["bleeding", "blood", "cut", "wound", 
                   "injury", "deep cut"],
        steps: [
          {
            id: 1,
            title: "Apply Direct Pressure",
            description:
              "Press firmly on wound with clean cloth or bandage. Do not remove cloth even if soaked.",
            duration: 60,
            critical: true,
          },
          {
            id: 2,
            title: "Elevate The Area",
            description:
              "If arm or leg is bleeding, raise it above heart level while keeping pressure.",
            duration: 30,
            critical: false,
          },
          {
            id: 3,
            title: "Call 102",
            description:
              "For heavy bleeding, call ambulance immediately. Keep pressure on wound.",
            duration: 30,
            critical: true,
          },
          {
            id: 4,
            title: "Keep Person Still and Calm",
            description:
              "Make them lie down. Keep them warm with a blanket. Talk to them calmly.",
            duration: 60,
            critical: false,
          },
          {
            id: 5,
            title: "Do NOT Remove Object",
            description:
              "If object is stuck in wound, do NOT remove it. Apply pressure around it.",
            duration: 30,
            critical: true,
          },
        ],
      },
    },
  },

  fire: {
    id: "fire",
    title: "Fire Emergency",
    icon: "🔥",
    color: "#FF6B00",
    emergencyNumber: "101",
    numberLabel: "Fire Brigade",
    subcategories: {
      house_fire: {
        title: "House Fire",
        keywords: ["fire", "house fire", "room fire", "burning", 
                   "smoke", "flames"],
        steps: [
          {
            id: 1,
            title: "Alert Everyone - GET OUT NOW",
            description:
              'Shout "FIRE!" loudly. Wake everyone up. Get out immediately.',
            duration: 30,
            critical: true,
          },
          {
            id: 2,
            title: "Call 101",
            description:
              "Once outside, call Fire Brigade 101. Give exact address.",
            duration: 30,
            critical: true,
          },
          {
            id: 3,
            title: "Stay Low - Crawl",
            description:
              "Smoke rises. Stay low and crawl if there is smoke. Cover nose with cloth.",
            duration: 60,
            critical: true,
          },
          {
            id: 4,
            title: "Check Doors Before Opening",
            description:
              "Touch door with back of hand. If hot, DO NOT open - find another way out.",
            duration: 20,
            critical: true,
          },
          {
            id: 5,
            title: "NEVER Use Elevator",
            description:
              "Always use stairs. Meet at a safe spot outside. Do not go back inside.",
            duration: 30,
            critical: true,
          },
        ],
      },
      gas_leak: {
        title: "Gas Leak",
        keywords: ["gas leak", "smell gas", "gas smell", 
                   "lpg leak", "cylinder leak"],
        steps: [
          {
            id: 1,
            title: "Do NOT Switch Any Lights",
            description:
              "Do not touch any switches, lights or electrical items. Spark can cause explosion.",
            duration: 10,
            critical: true,
          },
          {
            id: 2,
            title: "Turn Off Gas Supply",
            description:
              "Turn off the gas cylinder valve immediately if safe to do so.",
            duration: 20,
            critical: true,
          },
          {
            id: 3,
            title: "Open All Windows and Doors",
            description:
              "Let fresh air in. Do this quickly and get out.",
            duration: 30,
            critical: true,
          },
          {
            id: 4,
            title: "Evacuate Everyone",
            description:
              "Get everyone out of the building immediately. Go to open area.",
            duration: 30,
            critical: true,
          },
          {
            id: 5,
            title: "Call 101 from Outside",
            description:
              "Once outside, call 101. Do not re-enter until cleared by professionals.",
            duration: 30,
            critical: true,
          },
        ],
      },
    },
  },

  accident: {
    id: "accident",
    title: "Road Accident",
    icon: "🚗",
    color: "#FF8C00",
    emergencyNumber: "108",
    numberLabel: "Emergency",
    subcategories: {
      road_accident: {
        title: "Road Accident",
        keywords: ["accident", "road accident", "car crash", 
                   "bike accident", "collision", "crash"],
        steps: [
          {
            id: 1,
            title: "Ensure Your Safety First",
            description:
              "Move to safe area. Turn on hazard lights. Keep distance from traffic.",
            duration: 30,
            critical: true,
          },
          {
            id: 2,
            title: "Call 108 Immediately",
            description:
              "Call emergency services. Give location, number of people injured.",
            duration: 30,
            critical: true,
          },
          {
            id: 3,
            title: "Do NOT Move Injured Person",
            description:
              "Unless there is fire risk, do not move injured person. They may have spine injury.",
            duration: 30,
            critical: true,
          },
          {
            id: 4,
            title: "Stop Bleeding",
            description:
              "Apply pressure to wounds with clean cloth. Keep pressure firm and continuous.",
            duration: 60,
            critical: true,
          },
          {
            id: 5,
            title: "Keep Person Conscious",
            description:
              "Talk to them. Keep them warm. Do not give water. Wait for ambulance.",
            duration: 60,
            critical: false,
          },
        ],
      },
      drowning: {
        title: "Drowning",
        keywords: ["drowning", "drowned", "underwater", 
                   "swimming accident", "fell in water"],
        steps: [
          {
            id: 1,
            title: "Call For Help Immediately",
            description:
              "Shout for help. Call 102. Do not jump in water unless trained.",
            duration: 15,
            critical: true,
          },
          {
            id: 2,
            title: "Throw Something to Grab",
            description:
              "Throw rope, towel, or any floating object. Pull them to safety.",
            duration: 30,
            critical: true,
          },
          {
            id: 3,
            title: "Get Them Out of Water",
            description:
              "Once safe, lay them on their back on flat surface.",
            duration: 30,
            critical: true,
          },
          {
            id: 4,
            title: "Check Breathing",
            description:
              "Tilt head back. Check if breathing. If not, start CPR immediately.",
            duration: 20,
            critical: true,
          },
          {
            id: 5,
            title: "Start CPR If Needed",
            description:
              "30 chest compressions followed by 2 rescue breaths. Continue until help arrives.",
            duration: 120,
            critical: true,
          },
        ],
      },
    },
  },

  crime: {
    id: "crime",
    title: "Crime / Safety",
    icon: "🚨",
    color: "#7B2FBE",
    emergencyNumber: "100",
    numberLabel: "Police",
    subcategories: {
      robbery: {
        title: "Robbery / Theft",
        keywords: ["robbery", "theft", "stolen", "burglar", 
                   "thief", "stealing", "broke in", "intruder"],
        steps: [
          {
            id: 1,
            title: "Your Safety First",
            description:
              "Do not confront the thief. Your life is more valuable than possessions.",
            duration: 10,
            critical: true,
          },
          {
            id: 2,
            title: "Get to Safe Location",
            description:
              "Leave the area quietly if possible. Go to neighbor or public place.",
            duration: 30,
            critical: true,
          },
          {
            id: 3,
            title: "Call Police - 100",
            description:
              "Call 100. Tell them your location and what is happening.",
            duration: 30,
            critical: true,
          },
          {
            id: 4,
            title: "Do Not Touch Anything",
            description:
              "Do not touch anything the burglar may have touched. Preserve evidence.",
            duration: 20,
            critical: false,
          },
          {
            id: 5,
            title: "Note Description",
            description:
              "Try to remember clothing, height, direction they went. Tell police.",
            duration: 30,
            critical: false,
          },
        ],
      },
      physical_attack: {
        title: "Physical Attack",
        keywords: ["attack", "assault", "hitting", "beating", 
                   "fighting", "violence", "attacked"],
        steps: [
          {
            id: 1,
            title: "Get Away Immediately",
            description:
              "Run to safety. Get away from attacker as fast as possible.",
            duration: 10,
            critical: true,
          },
          {
            id: 2,
            title: "Shout For Help",
            description:
              'Shout "HELP!" loudly. Draw attention of people around you.',
            duration: 15,
            critical: true,
          },
          {
            id: 3,
            title: "Call 100",
            description:
              "Call police immediately. Give your location.",
            duration: 30,
            critical: true,
          },
          {
            id: 4,
            title: "Go to Public Place",
            description:
              "Enter any shop, restaurant or crowded place. Stay with people.",
            duration: 20,
            critical: true,
          },
          {
            id: 5,
            title: "Seek Medical Help",
            description:
              "If injured, call 102 for ambulance. Document injuries for police report.",
            duration: 30,
            critical: false,
          },
        ],
      },
    },
  },

  disaster: {
    id: "disaster",
    title: "Natural Disaster",
    icon: "🌊",
    color: "#0066CC",
    emergencyNumber: "112",
    numberLabel: "National Emergency",
    subcategories: {
      earthquake: {
        title: "Earthquake",
        keywords: ["earthquake", "tremor", "ground shaking", 
                   "quake", "building shaking"],
        steps: [
          {
            id: 1,
            title: "DROP - Get on Hands and Knees",
            description:
              "Drop down immediately. Get on hands and knees. This protects you from falling.",
            duration: 10,
            critical: true,
          },
          {
            id: 2,
            title: "COVER - Protect Your Head",
            description:
              "Get under sturdy table. Cover head and neck with arms. Stay away from windows.",
            duration: 30,
            critical: true,
          },
          {
            id: 3,
            title: "HOLD ON - Stay Until Shaking Stops",
            description:
              "Hold on and stay in position until all shaking stops completely.",
            duration: 60,
            critical: true,
          },
          {
            id: 4,
            title: "Do NOT Run Outside During Shaking",
            description:
              "Most injuries happen when people run outside. Stay inside until shaking stops.",
            duration: 30,
            critical: true,
          },
          {
            id: 5,
            title: "After Shaking - Check and Evacuate",
            description:
              "Check for injuries and gas leaks. Leave building carefully. Call 112.",
            duration: 60,
            critical: true,
          },
        ],
      },
      flood: {
        title: "Flood",
        keywords: ["flood", "flooding", "water rising", 
                   "water level", "heavy rain", "flash flood"],
        steps: [
          {
            id: 1,
            title: "Move to Higher Ground Immediately",
            description:
              "Go to upper floors or high ground. Do not wait.",
            duration: 30,
            critical: true,
          },
          {
            id: 2,
            title: "Call 112",
            description:
              "Call national emergency number. Give your exact location.",
            duration: 30,
            critical: true,
          },
          {
            id: 3,
            title: "Do NOT Walk in Flood Water",
            description:
              "6 inches of moving water can knock you down. Stay out of flood water.",
            duration: 20,
            critical: true,
          },
          {
            id: 4,
            title: "Turn Off Electricity",
            description:
              "Turn off main power switch if safe to do so. Water and electricity are deadly.",
            duration: 20,
            critical: true,
          },
          {
            id: 5,
            title: "Signal For Rescue",
            description:
              "Wave bright cloth from window. Use torch at night. Stay visible.",
            duration: 60,
            critical: false,
          },
        ],
      },
    },
  },

  home: {
    id: "home",
    title: "Home Emergency",
    icon: "⚡",
    color: "#FFB800",
    emergencyNumber: "112",
    numberLabel: "Emergency",
    subcategories: {
      electric_shock: {
        title: "Electric Shock",
        keywords: ["electric shock", "electrocution", "current", 
                   "electric", "shock", "electrocuted"],
        steps: [
          {
            id: 1,
            title: "Do NOT Touch The Person",
            description:
              "Do not touch them with bare hands. You will get shocked too.",
            duration: 10,
            critical: true,
          },
          {
            id: 2,
            title: "Switch Off Power",
            description:
              "Turn off main power switch immediately. Unplug from source if safe.",
            duration: 20,
            critical: true,
          },
          {
            id: 3,
            title: "Call 102 Immediately",
            description: "Call ambulance. Electric shock can cause internal injuries.",
            duration: 30,
            critical: true,
          },
          {
            id: 4,
            title: "Separate Using Non-Conductor",
            description:
              "If power cannot be switched off, use wooden stick or dry cloth to separate person from source.",
            duration: 30,
            critical: true,
          },
          {
            id: 5,
            title: "Check Breathing and Give CPR",
            description:
              "Check if breathing. If not breathing, start CPR immediately.",
            duration: 120,
            critical: true,
          },
        ],
      },
      burns: {
        title: "Severe Burns",
        keywords: ["burn", "burned", "scalded", "hot water burn", 
                   "fire burn", "chemical burn"],
        steps: [
          {
            id: 1,
            title: "Cool The Burn With Cold Water",
            description:
              "Run cool (not ice cold) water over burn for 10-20 minutes. Start immediately.",
            duration: 120,
            critical: true,
          },
          {
            id: 2,
            title: "Remove Clothing and Jewelry",
            description:
              "Remove clothes near burn area. Remove jewelry. Do this gently.",
            duration: 30,
            critical: false,
          },
          {
            id: 3,
            title: "Do NOT Use Ice, Butter or Toothpaste",
            description:
              "These cause more damage. Only use cool running water.",
            duration: 20,
            critical: true,
          },
          {
            id: 4,
            title: "Cover With Clean Cloth",
            description:
              "Cover burn loosely with clean bandage or cloth. Do not wrap tightly.",
            duration: 30,
            critical: false,
          },
          {
            id: 5,
            title: "Call 102 For Serious Burns",
            description:
              "For large burns, face burns, or chemical burns - call ambulance immediately.",
            duration: 30,
            critical: true,
          },
        ],
      },
    },
  },
};

export default emergencyData;