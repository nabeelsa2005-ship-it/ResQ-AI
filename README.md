# ResQ AI — Emergency First-Response

> AI-powered emergency first-response in your language. **Works offline.** One-tap SOS to your loved ones.

## The problem we solve

In India, the average ambulance response time in cities is 25–30 minutes. In rural areas it can exceed an hour. For cardiac arrest, **every minute without help reduces survival by ~10%**. The first 4–6 minutes are decided by whoever is standing next to the patient — usually a panicked family member with no training.

ResQ AI puts a first-aid expert in everyone's pocket — and crucially, **works when the network doesn't**.

## What's in it

| Feature | Why it matters |
|---|---|
| 🆘 **Hold-to-SOS** | One 2-second hold sends your live GPS + emergency type to pre-saved contacts via WhatsApp/SMS |
| 📴 **Offline first-aid** | 5 critical guides (heart attack, choking, severe bleeding, burns, unconscious) bundled into the app — render with **zero network** |
| 🤖 **AI guidance** | When online: Groq-powered LLM with **vision** — point your camera at an injury, get triage |
| 🌐 **12+ Indian languages** | Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Gujarati, Punjabi, Malayalam, Urdu, Odia + English. AI replies in same language. |
| 🥁 **CPR metronome** | Built-in 100 bpm beat (audio + haptic) during cardiac/unconscious flows — push to the rhythm |
| 📞 **Quick-call tiles** | 112 / 102 / 101 / 100 — one tap dials |
| 📍 **Nearby services** | Hospitals, police, fire, ambulance with map deep-links |
| 📱 **Installable PWA** | Add to home screen — feels native |

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ React 19 PWA (CRA)                                           │
│  ├─ Routing: react-router v7                                 │
│  ├─ State:   AppContext + localStorage                       │
│  └─ Service Worker: cache-first app shell + triage data      │
└──────────────────────────────────────────────────────────────┘
                │
                ├── Online ────► Groq API (Llama 3.1 chat / 3.2 vision)
                │
                └── Offline ───► Bundled triage trees (src/data/triageTrees.js)
                                 + IndexedDB / localStorage for contacts & state
```

## Quickstart (web)

```bash
npm install
cp .env.example .env.local      # paste your Groq key
npm start                       # dev server on :3000
```

For the offline / installable PWA experience, build and serve the production bundle:

```bash
npm run build
npx serve -s build              # service worker only registers in production
```

Then open in Chrome → DevTools → Application → Service Workers (verify "activated") → toggle "Offline" → reload → app still works.

## Mobile app (Android via Capacitor)

ResQ AI ships as both a PWA and a real Android app. The Android wrapper reuses 100% of the React UI and adds native APIs (high-accuracy GPS, haptics, system share sheet, splash screen, status-bar tinting).

### Prerequisites
- **Android Studio** (download free from developer.android.com/studio) — required to compile the APK and run the emulator
- **JDK 17+** (Android Studio bundles this)
- **An Android device or emulator**

### Build & open the Android project
```bash
npm run android:sync          # builds web bundle and syncs to android/
npm run android:open          # opens the project in Android Studio
```

In Android Studio: hit **Run ▶** to deploy to a connected device or emulator.

To produce a shareable APK without Android Studio's UI:
```bash
cd android
./gradlew assembleDebug       # APK at: android/app/build/outputs/apk/debug/app-debug.apk
```

### Native features active inside the wrapper
| Feature | Web fallback | Native (Capacitor) |
|---|---|---|
| **SOS hold-to-trigger haptics** | `navigator.vibrate` | Capacitor Haptics — ImpactStyle.Light + NotificationType.Success |
| **Live location capture** | `navigator.geolocation` (lower accuracy) | Capacitor Geolocation — high-accuracy GPS with explicit permission flow |
| **Share live-location SOS** | Web Share API → wa.me deep link | Native system share sheet (WhatsApp, SMS, Email, Signal, etc.) |
| **Status bar / splash** | n/a | Branded splash + dark-on-white status bar |
| **Offline first-aid** | Service Worker | Bundled directly in app assets (no SW needed) |
| **Permissions** | Browser prompt | AndroidManifest.xml — INTERNET, ACCESS_FINE/COARSE_LOCATION, VIBRATE, CAMERA, RECORD_AUDIO |

### Bundle id & app name
Configured in [capacitor.config.json](capacitor.config.json):
- App ID: `ai.resq.app`
- App Name: `ResQ AI`

### iOS
Building iOS requires macOS + Xcode. Add the platform with:
```bash
npm install @capacitor/ios
npx cap add ios
npx cap open ios
```

## Demo script (90 seconds)

1. **"The network fails when you need it most."** Toggle airplane mode in DevTools → tap **Choking** tile → step-by-step guide loads instantly.
2. **"In your language."** Switch primary language to Tamil → reload triage screen → guide is now in Tamil.
3. **"One tap if you can't speak."** Add a teammate's WhatsApp number as emergency contact → hold the SOS button → teammate's phone buzzes with the live Google Maps link.
4. **"And we still have AI when you have signal."** Re-enable wifi → open Guidance → snap a photo of (a fake) burn → AI grades severity and gives steps.

## Project structure

```
src/
├── App.js                       Routes + auth guard
├── index.js                     Service worker registration
├── context/AppContext.js        Auth, language, contacts state
├── components/
│   ├── SOSButton.js             Hold-to-SOS + contacts CRUD
│   ├── AIGuide.js               In-app AI chat
│   └── LangPickerModal.js       Multi-language selector
├── pages/
│   ├── Login.js                 Email + Google auth + language onboarding
│   ├── Home.js                  Hub: SOS, categories, offline guides, quick calls
│   ├── Triage.js                Offline first-aid step renderer + CPR metronome
│   ├── Guidance.js              Online AI chat (Groq Llama)
│   └── Nearby.js                Categorized nearby services
├── data/
│   ├── emergencyData.js         Existing taxonomy (online flow)
│   └── triageTrees.js           Offline first-aid (bilingual EN/HI)
└── utils/detectEmergency.js     Keyword-based fallback matcher
public/
├── manifest.json                PWA install metadata
└── service-worker.js            Cache-first app shell, network-bypass for API
```

## Hackathon credentials checklist

- [x] Real-world life-saving feature (SOS + offline triage)
- [x] AI integration (Groq + vision)
- [x] Multilingual (12+ languages)
- [x] PWA / installable
- [x] Offline-first
- [x] Accessibility: keyboard-navigable, large tap targets, high-contrast critical CTAs
- [x] No secrets in source — `.env.local` ignored
- [x] Mobile-first responsive layout

## Roadmap (post-hackathon, in priority order)

1. **Serverless API proxy** — move Groq key off the client (Vercel/Cloudflare Worker)
2. **Real Firebase Auth** — replace the demo localStorage auth (deps already installed)
3. **Real Google Places** for Nearby — replace static Delhi list
4. **Continuous voice mode** — "Hey ResQ, my dad fell" without tapping
5. **Family/caregiver dashboard** — SOS notifications across family
6. **Crowdsourced incident map** — Firestore-backed real-time hazard layer
7. **Push notifications** — drill reminders, area alerts
8. **More triage trees** — snake bite, drowning, electric shock, stroke FAST, seizures

## Disclaimer

This app is a **first-response aid**, not a substitute for professional medical care. Always call emergency services. Steps are based on standard first-aid guidance (American Heart Association / Red Cross style) but may not apply to every situation.

## License

Hackathon prototype — no license declared yet.
