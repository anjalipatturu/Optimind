import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "app_name": "Optimind",
      "tagline": "Self-Evolving Prompt Optimizer",
      "new_chat": "New Chat",
      "search_placeholder": "Search prompts & history...",
      "optimize_prompt": "Optimize Prompt",
      "sparkles_tooltip": "Optimize with Self-Evolving AI",
      "prompt_coach": "Prompt Coach",
      "use_optimized": "Use Optimized",
      "edit_then_use": "Edit & Use",
      "keep_original": "Keep Original",
      "score": "Prompt Score",
      "streak": "Streak",
      "prompts_today": "Prompts today",
      "today": "Today",
      "yesterday": "Yesterday",
      "previous_7_days": "Previous 7 Days",
      "older": "Older",
      "voice_listening": "Listening...",
      "voice_tap_stop": "Tap to send voice prompt",
      "evolution_dashboard": "Evolution Dashboard",
      "prompt_library": "Prompt Library",
      "memory": "Prompt Memory",
      "media_gallery": "Media Gallery",
      "settings": "Settings",
      "logout": "Log Out"
    }
  },
  es: {
    translation: {
      "app_name": "Optimind",
      "tagline": "Optimizador de Prompts Auto-Evolutivo",
      "new_chat": "Nuevo Chat",
      "search_placeholder": "Buscar prompts e historial...",
      "optimize_prompt": "Optimizar Prompt",
      "sparkles_tooltip": "Optimizar con IA Auto-Evolutiva",
      "prompt_coach": "Entrenador de Prompts",
      "use_optimized": "Usar Optimizado",
      "edit_then_use": "Editar y Usar",
      "keep_original": "Mantener Original",
      "score": "Puntaje del Prompt",
      "streak": "Racha",
      "prompts_today": "Prompts hoy",
      "today": "Hoy",
      "yesterday": "Ayer",
      "previous_7_days": "Últimos 7 días",
      "older": "Anteriores",
      "voice_listening": "Escuchando...",
      "voice_tap_stop": "Toca para enviar audio",
      "evolution_dashboard": "Panel de Evolución",
      "prompt_library": "Biblioteca de Prompts",
      "memory": "Memoria del Prompt",
      "media_gallery": "Galería Multimedia",
      "settings": "Configuración",
      "logout": "Cerrar Sesión"
    }
  },
  fr: {
    translation: {
      "app_name": "Optimind",
      "tagline": "Optimiseur de Prompts Auto-Évolutif",
      "new_chat": "Nouvelle Discussion",
      "search_placeholder": "Rechercher des prompts...",
      "optimize_prompt": "Optimiser le Prompt",
      "sparkles_tooltip": "Optimiser avec l'IA Évolutive",
      "prompt_coach": "Coach de Prompt",
      "use_optimized": "Utiliser Optimisé",
      "edit_then_use": "Modifier et Utiliser",
      "keep_original": "Garder l'Original",
      "score": "Score du Prompt",
      "streak": "Série",
      "prompts_today": "Prompts aujourd'hui",
      "today": "Aujourd'hui",
      "yesterday": "Hier",
      "previous_7_days": "7 derniers jours",
      "older": "Plus anciens",
      "voice_listening": "Écoute en cours...",
      "voice_tap_stop": "Appuyez pour envoyer",
      "evolution_dashboard": "Tableau d'Évolution",
      "prompt_library": "Bibliothèque de Prompts",
      "memory": "Mémoire",
      "media_gallery": "Galerie Médias",
      "settings": "Paramètres",
      "logout": "Déconnexion"
    }
  },
  hi: {
    translation: {
      "app_name": "Optimind",
      "tagline": "सेल्फ-इवॉल्विंग प्रॉम्प्ट ऑप्टिमाइज़र",
      "new_chat": "नया चैट",
      "search_placeholder": "प्रॉम्प्ट और इतिहास खोजें...",
      "optimize_prompt": "प्रॉम्प्ट सुधारें",
      "sparkles_tooltip": "AI द्वारा प्रॉम्प्ट सुधारें",
      "prompt_coach": "प्रॉम्प्ट कोच",
      "use_optimized": "सुधरा हुआ उपयोग करें",
      "edit_then_use": "संपादित करें और उपयोग करें",
      "keep_original": "मूल रखें",
      "score": "प्रॉम्प्ट स्कोर",
      "streak": "लगातार दिन (स्ट्रीक)",
      "prompts_today": "आज के प्रॉम्प्ट्स",
      "today": "आज",
      "yesterday": "कल",
      "previous_7_days": "पिछले 7 दिन",
      "older": "पुराने",
      "voice_listening": "सुन रहा है...",
      "voice_tap_stop": "बोलना समाप्त करने के लिए टैप करें",
      "evolution_dashboard": "इवोल्यूशन डैशबोर्ड",
      "prompt_library": "प्रॉम्प्ट लाइब्रेरी",
      "memory": "मेमोरी",
      "media_gallery": "मीडिया गैलरी",
      "settings": "सेटिंग्स",
      "logout": "लॉग आउट"
    }
  },
  te: {
    translation: {
      "app_name": "Optimind",
      "tagline": "స్వయం-అభివృద్ధి చెందే ప్రాంప్ట్ ఆప్టిమైజర్",
      "new_chat": "కొత్త చాట్",
      "search_placeholder": "ప్రాంప్ట్‌లను శోధించండి...",
      "optimize_prompt": "ప్రాంప్ట్‌ను మెరుగుపరచండి",
      "sparkles_tooltip": "AIతో మెరుగుపరచండి",
      "prompt_coach": "ప్రాంప్ట్ కోచ్",
      "use_optimized": "మెరుగుపరచినది వాడండి",
      "edit_then_use": "సవరించి వాడండి",
      "keep_original": "అసలుదే ఉంచండి",
      "score": "ప్రాంప్ట్ స్కోర్",
      "streak": "స్ట్రీక్",
      "prompts_today": "ఈరోజు ప్రాంప్ట్‌లు",
      "today": "ఈరోజు",
      "yesterday": "నిన్న",
      "previous_7_days": "గత 7 రోజులు",
      "older": "పాతవి",
      "voice_listening": "వింటోంది...",
      "voice_tap_stop": "ఆపడానికి నొక్కండి",
      "evolution_dashboard": "ఎవల్యూషన్ డాష్‌బోర్డ్",
      "prompt_library": "ప్రాంప్ట్ లైబ్రరీ",
      "memory": "మెమరీ",
      "media_gallery": "మీడియా గ్యాలరీ",
      "settings": "సెట్టింగ్‌లు",
      "logout": "లాగ్ అవుట్"
    }
  },
  ta: {
    translation: {
      "app_name": "Optimind",
      "tagline": "சுய-பரிணாம பிராம்ப்ட் உகப்பாக்கி",
      "new_chat": "புதிய அரட்டை",
      "search_placeholder": "தேடவும்...",
      "optimize_prompt": "பிராம்ப்டை மேம்படுத்துங்கள்",
      "sparkles_tooltip": "AI மூலம் மேம்படுத்துங்கள்",
      "prompt_coach": "பிராம்ப்ட் பயிற்சியாளர்",
      "use_optimized": "மேம்படுத்தப்பட்டதை பயன்படுத்தவும்",
      "edit_then_use": "திருத்தி பயன்படுத்தவும்",
      "keep_original": "அசல் வைக்கவும்",
      "score": "பிராம்ப்ட் மதிப்பெண்",
      "streak": "தொடர் நாட்கள்",
      "prompts_today": "இன்றைய பிராம்ப்ட்கள்",
      "today": "இன்று",
      "yesterday": "நேற்று",
      "previous_7_days": "கடந்த 7 நாட்கள்",
      "older": "பழையவை",
      "voice_listening": "கேட்கிறது...",
      "voice_tap_stop": "முடிக்க தட்டவும்",
      "evolution_dashboard": "பரிணாம டேஷ்போர்டு",
      "prompt_library": "பிராம்ப்ட் நூலகம்",
      "memory": "நினைவகம்",
      "media_gallery": "ஊடக தொகுப்பு",
      "settings": "அமைப்புகள்",
      "logout": "வெளியேறு"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;

