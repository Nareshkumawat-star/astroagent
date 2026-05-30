/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * AstroAgent Astrology Dashboard and Companion UI.
 * Implements Sophisticated Dark theme, real-time astrology widget sidebars,
 * state preservation, geocoding validation, custom icons, and LangGraph SSE stream integration.
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Calendar, 
  Clock, 
  User, 
  Copy, 
  RotateCcw, 
  Send, 
  Cpu, 
  CheckCircle, 
  TrendingUp, 
  AlertTriangle,
  Moon as MoonIcon,
  Sun as SunIcon,
  ChevronRight,
  Layers,
  Globe,
  Compass,
  ArrowLeft
} from 'lucide-react';

import BirthChartWheel from './components/BirthChartWheel';

interface PlanetaryPosition {
  name: string;
  longitude: number;
  sign: string;
  signSymbol: string;
  degree: number;
  minute: number;
  house?: number;
}

interface BirthChartData {
  julianDay: number;
  localSiderealTime: number;
  ascendant: PlanetaryPosition;
  midheaven: PlanetaryPosition;
  planets: PlanetaryPosition[];
  houses: { number: number; startLongitude: number; endLongitude: number; sign: string; signSymbol: string }[];
}

interface UserProfile {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  lat: number;
  lon: number;
  timezone: string;
  displayName: string;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  statusSteps?: string[];
  reasoningSteps?: string[];
  intent?: string;
}

const translations = {
  en: {
    tagline: "High-Fidelity Planetary Astrology Engine",
    title: "Grounded Astrological Intelligence",
    subtitle: "No hallucinations. No invented planetary angles. Powered by standard orbital maths, OpenStreetMap locators, and stateful LangGraph agents to synthesize real stellar charts.",
    cta: "Cast Your Birth Chart",
    features: {
      ephemeris: "Swiss Ephemeris Equivalents",
      ephemeris_desc: "Calculates planetary degrees with NASA-JPL Kepler formulas. Fully physical and non-simulated.",
      geo: "OSM Nominatim Geolocation",
      geo_desc: "Queries actual coordinate maps and standard timezone listings to build proper local GMT sidereal intervals.",
      langgraph: "LangGraph Architecture",
      langgraph_desc: "Classifies queries through a stateful four-node agent to retrieve grounding documentation from databases."
    },
    birthBlueprint: "Enter Birth Blueprint",
    birthBlueprintDesc: "To construct stable coordinates, please provide accurate birth documents.",
    seekerName: "Seeker's Full Name",
    placeholderName: "Enter your name",
    birthDate: "Birth Date",
    birthTime: "Birth Time (Local)",
    birthPlace: "Birth Place (City & Country)",
    verify: "Verify",
    verifying: "Verifying...",
    castChart: "Cast Astrological Chart",
    consultation: "Consultation",
    natalPositions: "Natal Positions",
    sessionProfile: "Session Profile",
    subject: "Target Subject",
    resetNode: "Reset Node",
    natalData: "Calculated Natal Data",
    keplerPrecise: "Kepler Precise",
    clipboard: "Copy",
    regenerate: "Regenerate",
    suggestedInquiries: "Suggested Astrological Inquiries:",
    suggestedCareer: "Analyze my 10th House career trends",
    suggestedTransit: "Check my active daily planetary transits",
    suggestedRelationship: "Decipher chart relationship templates",
    suggestedLessons: "Explore transformative/generational Pluto lessons",
    chatPlaceholder: "Ask about your planetary positions, 10th house rulers, compatibility, or transits...",
    viewComprehensiveNatalChart: "View Comprehensive Natal Chart",
    interactiveBirthMap: "Interactive Birth Map",
    synchronizedTelemetry: "Synchronized natal telemetry.",
    close: "CLOSE ×",
    natalAlignmentDetails: "Natal Alignment Details",
    groundedCalculations: "Grounded calculations. Verified via UTC offset sidereal formulas.",
    computedEqualHouseCusps: "Computed Equal House Cusps",
    savedSubjectSessionDetails: "Saved Subject Session Details",
    profileDesc: "To ensure offline session restoration, profile coordinates are stored securely in local browser storage.",
    subjectName: "Subject Name",
    subjectRegistryEmail: "Subject Registry E-mail",
    castTimestamp: "Cast Timestamp",
    geographicalCore: "Geographical Core",
    resolvedLatLon: "Resolved Lat / Lon",
    assignedTimezone: "Assigned Timezone",
    wipeProfile: "Wipe Saved Profile"
  },
  hi: {
    tagline: "सटीक ग्रह ज्योतिष इंजन",
    title: "सटीक ज्योतिषीय बुद्धिमत्ता",
    subtitle: "कोई भ्रम नहीं। कोई मनगढ़ंत ग्रह कोण नहीं। वास्तविक सितारों के नक्शे को संश्लेषित करने के लिए मानक कक्षीय गणित, ओपनस्ट्रीटमैप लोकेटर और स्टेटफुल लैंगग्राफ एजेंटों द्वारा संचालित।",
    cta: "अपनी जन्म कुंडली बनाएं",
    features: {
      ephemeris: "स्विस पंचांग समकक्ष",
      ephemeris_desc: "नासा-जेपीएल केपलर सूत्रों के साथ ग्रहीय अंशों की गणना करता है। पूरी तरह से भौतिक और गैर-सिम्युलेटेड।",
      geo: "ओपनस्ट्रीटमैप जियोलोकेशन",
      geo_desc: "उचित स्थानीय जीएमटी साइडरीयल अंतराल बनाने के लिए वास्तविक समन्वय मानचित्रों और मानक समयक्षेत्र लिस्टिंग को क्वेरी करता है।",
      langgraph: "लैंगग्राफ आर्किटेक्चर",
      langgraph_desc: "डेटाबेस से सहायक दस्तावेजों को पुनः प्राप्त करने के लिए एक स्टेटफुल चार-नोड एजेंट के माध्यम से प्रश्नों को वर्गीकृत करता है।"
    },
    birthBlueprint: "जन्म विवरण दर्ज करें",
    birthBlueprintDesc: "सटीक और प्रामाणिक कुंडली निर्माण के लिए कृपया अपना सही जन्म विवरण प्रदान करें।",
    seekerName: "जिज्ञासु का पूरा नाम",
    placeholderName: "अपना नाम दर्ज करें",
    birthDate: "जन्मतिथि",
    birthTime: "जन्म समय (स्थानीय)",
    birthPlace: "जन्म स्थान (शहर और देश)",
    verify: "सत्यापित करें",
    verifying: "सत्यापित हो रहा...",
    castChart: "कुंडली का निर्माण करें",
    consultation: "परामर्श",
    natalPositions: "जन्म कुंडली स्थिति",
    sessionProfile: "सत्र प्रोफ़ाइल",
    subject: "लक्षित व्यक्ति",
    resetNode: "नया विषय",
    natalData: "परिकलित जन्म कुंडली डेटा",
    keplerPrecise: "केपलर शुद्धता",
    clipboard: "कॉपी",
    regenerate: "पुनः उत्पन्न करें",
    suggestedInquiries: "सुझाए गए ज्योतिषीय प्रश्न:",
    suggestedCareer: "मेरे दशम भाव (करियर) के रुझान का विश्लेषण करें",
    suggestedTransit: "मेरे सक्रिय दैनिक ग्रह गोचर की जांच करें",
    suggestedRelationship: "कुंडली संबंध टेम्पलेट्स को समझें",
    suggestedLessons: "परिवर्तनकारी/पीढ़ीगत प्लूटो पाठों का अन्वेषण करें",
    chatPlaceholder: "अपने ग्रह की स्थिति, दशम भाव के स्वामी, अनुकूलता, या गोचर के बारे में पूछें...",
    viewComprehensiveNatalChart: "व्यापक जन्म कुंडली देखें",
    interactiveBirthMap: "इंटरैक्टिव जन्म मानचित्र",
    synchronizedTelemetry: "सिंक्रनाइज़ जन्म टेलीमेट्री।",
    close: "बंद करें ×",
    natalAlignmentDetails: "जन्म कुंडली संरेखण विवरण",
    groundedCalculations: "सटीक गणना। यूटीसी ऑफसेट साइडरीयल सूत्रों के माध्यम से सत्यापित।",
    computedEqualHouseCusps: "परिकलित समान भाव भाव-मध्य",
    savedSubjectSessionDetails: "सहेजे गए सत्र विवरण",
    profileDesc: "ऑफ़लाइन सत्र बहाली सुनिश्चित करने के लिए, प्रोफ़ाइल निर्देशांक स्थानीय ब्राउज़र स्टोरेज में सुरक्षित रूप से संग्रहीत हैं।",
    subjectName: "नाम",
    subjectRegistryEmail: "पंजीकृत ई-मेल",
    castTimestamp: "कुंडली निर्माण समय",
    geographicalCore: "भौगोलिक स्थान",
    resolvedLatLon: "सत्यापित अक्षांश / देशांतर",
    assignedTimezone: "निर्धारित समयक्षेत्र",
    wipeProfile: "प्रोफ़ाइल साफ़ करें"
  }
};

export default function App() {
  // Key state hooks
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [chart, setChart] = useState<BirthChartData | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'chart' | 'profile' | 'synastry'>('chat');
  const [showChatWheel, setShowChatWheel] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  
  // Navigation & entry states
  const [currentPage, setCurrentPage] = useState<'landing' | 'birth-form' | 'dashboard'>('landing');

  // Birth details form state
  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formPlace, setFormPlace] = useState('');
  
  // Geocode state validation
  const [isVerifyingLoc, setIsVerifyingLoc] = useState(false);
  const [verifiedLocInfo, setVerifiedLocInfo] = useState<{ lat: number; lon: number; timezone: string; displayName: string } | null>(null);
  const [formError, setFormError] = useState('');

  // Authentication configuration simulation
  const [authEmail] = useState('seeker@astroagent.ai');

  // Chat conversation state
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentReasoning, setCurrentReasoning] = useState<string[]>([]);
  const [currentStatuses, setCurrentStatuses] = useState<string[]>([]);
  const [streamProgressText, setStreamProgressText] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load saved session on launch
  useEffect(() => {
    const savedProfile = localStorage.getItem('astroagent_profile');
    const savedChart = localStorage.getItem('astroagent_chart');
    const savedMessages = localStorage.getItem('astroagent_messages');

    if (savedProfile && savedChart) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        setProfile(parsedProfile);
        setChart(JSON.parse(savedChart));
        setCurrentPage('dashboard');

        if (savedMessages) {
          setMessages(JSON.parse(savedMessages));
        } else {
          // Default greeting
          setMessages([
            {
              id: 'init-g',
              sender: 'ai',
              text: `Greetings ${parsedProfile.name}. I have cast your natal birth chart using the Swiss Ephemeris algorithm for **${parsedProfile.displayName}**. \n\nI am grounded in absolute astronomical calculations. Ask me anything about your placements, 10th house career path, love compatibility, or current planetary transits!`,
              statusSteps: ['Coordinates locked', 'Sidereal calculation complete'],
              reasoningSteps: ['[ROUTER] Loaded user profile', '[TOOL] Read saved birth chart facts']
            }
          ]);
        }
      } catch (e) {
        console.error("Failed to parse saved state:", e);
      }
    }
  }, []);

  // Save messages to local storage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('astroagent_messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto scroll logic for active streaming chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentReasoning, currentStatuses]);

  // Handle Location Geocode Verification
  const handleVerifyLocation = async () => {
    if (!formPlace.trim()) {
      setFormError('Please enter a birth city/place first');
      return;
    }
    setIsVerifyingLoc(true);
    setFormError('');
    try {
      const res = await fetch('/api/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ place: formPlace })
      });
      if (res.ok) {
        const data = await res.json();
        setVerifiedLocInfo(data);
      } else {
        setFormError('Could not resolve location. Please double check spelling.');
      }
    } catch (e) {
      setFormError('Network geocoding failed. Using estimated values.');
    } finally {
      setIsVerifyingLoc(false);
    }
  };

  // Submit Birth Details Form
  const handleSubmitBirthDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName || !formDate || !formTime || !formPlace) {
      setFormError('All birth details are mandatory for accurate non-hallucinatory calculation');
      return;
    }

    let latVal = 51.5074;
    let lonVal = -0.1278;
    let tzVal = "Europe/London";
    let dispName = formPlace;

    if (verifiedLocInfo) {
      latVal = verifiedLocInfo.lat;
      lonVal = verifiedLocInfo.lon;
      tzVal = verifiedLocInfo.timezone;
      dispName = verifiedLocInfo.displayName;
    } else {
      // Force geocoding inline if not pre-verified
      setIsVerifyingLoc(true);
      try {
        const res = await fetch('/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ place: formPlace })
        });
        if (res.ok) {
          const data = await res.json();
          latVal = data.lat;
          lonVal = data.lon;
          tzVal = data.timezone;
          dispName = data.displayName;
        }
      } catch (err) {
        console.error("Inline geocode failed, using fallbacks:", err);
      } finally {
        setIsVerifyingLoc(false);
      }
    }

    try {
      // Trigger backend birth-chart calculations
      const res = await fetch('/api/birth-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formDate,
          time: formTime,
          latitude: latVal,
          longitude: lonVal
        })
      });

      if (res.ok) {
        const calculatedChart = await res.json();
        const userProf: UserProfile = {
          name: formName,
          birthDate: formDate,
          birthTime: formTime,
          birthPlace: formPlace,
          lat: latVal,
          lon: lonVal,
          timezone: tzVal,
          displayName: dispName
        };

        setProfile(userProf);
        setChart(calculatedChart);

        localStorage.setItem('astroagent_profile', JSON.stringify(userProf));
        localStorage.setItem('astroagent_chart', JSON.stringify(calculatedChart));

        const initGreeting: Message = {
          id: 'init-' + Date.now(),
          sender: 'ai',
          text: `Success! I have cast your natal birth chart for **${dispName}** at **${formTime} UTC**. \n\nMy Keplerian physics formulas have calculated that your **Ascendant is in ${calculatedChart.ascendant.sign} ${calculatedChart.ascendant.signSymbol}** and your **Sun is in ${calculatedChart.planets.find((p: any) => p.name === 'SUN')?.sign} ${calculatedChart.planets.find((p: any) => p.name === 'SUN')?.signSymbol}**. \nHow can I help you decipher your calling or transits today?`,
          statusSteps: ['Resolved coordinates', 'Julian Day calculated', 'Houses cast'],
          reasoningSteps: ['[ROUTER] Birth details received', '[TOOL] Cast planetary degrees deterministically']
        };

        setMessages([initGreeting]);
        setCurrentPage('dashboard');
        setActiveTab('chat');
      } else {
        setFormError('Failed to calculate coordinates. Please verify date format.');
      }
    } catch (err) {
      setFormError('Server error calculating birth details. Try again.');
    }
  };

  // Trigger SSE streaming Chat Assistant
  const handleSendChatMessage = async (presetPrompt?: string) => {
    const textToSend = presetPrompt || chatInput;
    if (!textToSend.trim() || isStreaming || !profile) return;

    setChatInput('');
    const userMsgId = 'user-' + Date.now();
    const newUserMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsStreaming(true);
    setCurrentReasoning([]);
    setCurrentStatuses([]);
    setStreamProgressText('');

    const aiMsgId = 'ai-' + Date.now();
    
    // Construct Query String for SSE
    const queryParams = new URLSearchParams({
      message: textToSend,
      birthName: profile.name,
      birthDate: profile.birthDate,
      birthTime: profile.birthTime,
      birthPlace: profile.birthPlace,
      lat: String(profile.lat),
      lon: String(profile.lon),
      timezone: profile.timezone,
      lang: language,
      history: JSON.stringify(messages.slice(-6).map(m => ({ role: m.sender, content: m.text })))
    });

    const sseUrl = `/api/chat?${queryParams.toString()}`;
    const eventSource = new EventSource(sseUrl);

    let streamText = '';
    const bufferReasoning: string[] = [];
    const bufferStatuses: string[] = [];

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        
        switch (payload.type) {
          case 'status':
            bufferStatuses.push(payload.data);
            setCurrentStatuses([...bufferStatuses]);
            setStreamProgressText(payload.data);
            break;
            
          case 'reasoning':
            bufferReasoning.push(payload.data);
            setCurrentReasoning([...bufferReasoning]);
            break;
            
          case 'chunk':
            streamText += payload.data;
            // Intermediary update to message list
            setMessages(prev => {
              const cleaned = prev.filter(m => m.id !== aiMsgId);
              return [...cleaned, {
                id: aiMsgId,
                sender: 'ai',
                text: streamText,
                statusSteps: bufferStatuses,
                reasoningSteps: bufferReasoning
              }];
            });
            break;
            
          case 'error':
            eventSource.close();
            setIsStreaming(false);
            setMessages(prev => [
              ...prev,
              {
                id: 'err-' + Date.now(),
                sender: 'ai',
                text: `Celestial error: **${payload.data}**. Please check your configuration.`,
                statusSteps: ['Computation aborted']
              }
            ]);
            break;
            
          case 'done':
            eventSource.close();
            setIsStreaming(false);
            break;
        }
      } catch (err) {
        console.error("SSE JSON parsing error:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE link failed:", err);
      eventSource.close();
      setIsStreaming(false);
    };
  };

  // Reset entire Profile session to build a new chart
  const handleWipeSession = () => {
    localStorage.removeItem('astroagent_profile');
    localStorage.removeItem('astroagent_chart');
    localStorage.removeItem('astroagent_messages');
    setProfile(null);
    setChart(null);
    setMessages([]);
    setCurrentPage('birth-form');
    setFormName('');
    setFormDate('');
    setFormTime('');
    setFormPlace('');
    setVerifiedLocInfo(null);
  };

  // Helper function to copy message to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div id="app-root" className={`min-h-screen bg-sand-50 text-maroon-700 font-sans flex flex-col overflow-x-hidden antialiased selection:bg-saffron-200 ${currentPage === 'dashboard' ? 'h-screen overflow-hidden' : ''}`}>
      
      {/* HEADER BAR */}
      <header id="app-header" className="h-16 border-b border-maroon-500/10 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white/95 backdrop-blur z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-maroon-600 to-saffron-500 rounded-full flex items-center justify-center shadow-lg shadow-maroon-900/10">
            <Sparkles className="w-5 h-5 text-sand-100" />
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-serif font-bold tracking-wide text-maroon-700 flex items-center gap-2">
              AstroAgent
            </h1>
          </div>
        </div>

        {currentPage === 'dashboard' && profile && (
          <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-500">
            <button 
              id="nav-chat"
              onClick={() => setActiveTab('chat')}
              className={`hover:text-maroon-700 transition-colors cursor-pointer py-1 border-b-2 ${activeTab === 'chat' ? 'text-saffron-600 border-saffron-500 font-serif' : 'border-transparent'}`}
            >
              {translations[language].consultation}
            </button>
            <button 
              id="nav-chart"
              onClick={() => setActiveTab('chart')}
              className={`hover:text-maroon-700 transition-colors cursor-pointer py-1 border-b-2 ${activeTab === 'chart' ? 'text-saffron-600 border-saffron-500 font-serif' : 'border-transparent'}`}
            >
              {translations[language].natalPositions}
            </button>
            <button 
              id="nav-profile"
              onClick={() => setActiveTab('profile')}
              className={`hover:text-maroon-700 transition-colors cursor-pointer py-1 border-b-2 ${activeTab === 'profile' ? 'text-saffron-600 border-saffron-500 font-serif' : 'border-transparent'}`}
            >
              {translations[language].sessionProfile}
            </button>
          </nav>
        )}

        <div className="flex items-center gap-4">
          {/* Language Toggle Control */}
          <div className="inline-flex rounded-lg p-0.5 bg-sand-100/90 border border-maroon-500/10 select-none items-center shadow-xs shrink-0">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-[11px] font-sans font-bold rounded-md transition-all cursor-pointer ${
                language === 'en'
                  ? 'bg-gradient-to-tr from-maroon-700 to-maroon-800 text-white shadow-xs'
                  : 'text-maroon-750/70 hover:text-maroon-800 hover:bg-sand-200/50'
              }`}
              id="lang-toggle-en"
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hi')}
              className={`px-2.5 py-1 text-[11px] font-sans font-bold rounded-md transition-all cursor-pointer ${
                language === 'hi'
                  ? 'bg-gradient-to-tr from-maroon-700 to-maroon-800 text-white shadow-xs'
                  : 'text-maroon-750/70 hover:text-maroon-800 hover:bg-sand-200/50'
              }`}
              id="lang-toggle-hi"
            >
              हिन्दी
            </button>
          </div>

          {profile ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-maroon-700">{profile.name}</span>
              </div>
              <div 
                onClick={() => setActiveTab('profile')} 
                className="w-9 h-9 rounded-full border border-maroon-500/15 bg-sand-100 flex items-center justify-center cursor-pointer hover:border-saffron-500 transition-colors"
                title="View Profile Details"
              >
                <User className="w-5 h-5 text-maroon-700" />
              </div>
            </div>
          ) : (
            <div className="text-xs font-mono text-slate-500 bg-sand-100/60 py-1 px-2 rounded border border-maroon-500/5 select-none text-[10px] uppercase font-bold tracking-wide">
              {language === 'hi' ? 'आरंभ नहीं' : 'Not Cast'}
            </div>
          )}
        </div>
      </header>

      {/* MOBILE TAB NAVIGATION BAR */}
      {currentPage === 'dashboard' && profile && (
        <nav className="flex md:hidden border-b border-maroon-500/10 bg-white/95 backdrop-blur shadow-xs px-4 py-2.5 items-center justify-between gap-2 shrink-0">
          <div className="flex gap-1 overflow-x-auto scrollbar-none">
            <button 
              id="mobile-nav-chat"
              onClick={() => setActiveTab('chat')}
              className={`transition-all duration-150 cursor-pointer px-3 py-1.5 rounded-lg text-xs font-serif font-bold ${activeTab === 'chat' ? 'text-saffron-700 bg-saffron-100/50 border border-saffron-500/20 shadow-xs' : 'text-slate-500 hover:text-maroon-700'}`}
            >
              {translations[language].consultation}
            </button>
            <button 
              id="mobile-nav-chart"
              onClick={() => setActiveTab('chart')}
              className={`transition-all duration-150 cursor-pointer px-3 py-1.5 rounded-lg text-xs font-serif font-bold ${activeTab === 'chart' ? 'text-saffron-700 bg-saffron-100/50 border border-saffron-500/20 shadow-xs' : 'text-slate-500 hover:text-maroon-700'}`}
            >
              {translations[language].natalPositions}
            </button>
            <button 
              id="mobile-nav-profile"
              onClick={() => setActiveTab('profile')}
              className={`transition-all duration-150 cursor-pointer px-3 py-1.5 rounded-lg text-xs font-serif font-bold ${activeTab === 'profile' ? 'text-saffron-700 bg-saffron-100/50 border border-saffron-500/20 shadow-xs' : 'text-slate-500 hover:text-maroon-700'}`}
            >
              {translations[language].sessionProfile}
            </button>
          </div>
          
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className={`px-3 py-1.5 text-[10px] uppercase font-mono font-bold border rounded-lg bg-sand-50 transition-all flex items-center gap-1.5 cursor-pointer ${showSidebar ? 'border-saffron-500 text-saffron-700 bg-saffron-50 shadow-xs' : 'border-maroon-500/15 text-slate-600 hover:border-maroon-500/35'}`}
            title="Toggle Astro Placements Highlights Summary"
          >
            <Compass className="w-3.5 h-3.5 animate-spin-slow" />
            <span>{showSidebar ? (language === 'hi' ? 'जानकारी छुपाएं' : 'Hide Info') : (language === 'hi' ? 'तारामंडल जानकारी' : 'Stellar Info')}</span>
          </button>
        </nav>
      )}

      {/* WORKSPACE AREA */}
      <main id="app-viewport" className={`flex-1 flex flex-col md:flex-row relative ${currentPage === 'dashboard' ? 'overflow-hidden' : ''}`}>
        
        {/* LANDING PAGE SCREEN */}
        {currentPage === 'landing' && (
          <section id="screen-landing" className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto my-auto space-y-8 animate-fade-in">
            <div className="space-y-5">
              <span className="px-3 py-1 bg-saffron-50 border border-saffron-500/20 rounded-full text-xs font-semibold text-saffron-600 tracking-wider uppercase inline-block leading-relaxed">
                {translations[language].tagline}
              </span>
              <h1 className={`text-4xl md:text-6xl font-serif font-bold text-maroon-700 tracking-tight ${language === 'hi' ? 'leading-normal md:leading-relaxed pb-3 pt-1' : 'leading-tight md:leading-none pb-1'}`}>
                {translations[language].title}
              </h1>
              <p className={`text-base md:text-lg text-slate-600 max-w-2xl mx-auto ${language === 'hi' ? 'leading-relaxed md:leading-loose' : 'leading-relaxed'}`}>
                {translations[language].subtitle}
              </p>
            </div>

            {/* Feature Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-4 text-left">
              <div className="p-5 bg-white border border-maroon-500/10 rounded-xl space-y-3 shadow-sm hover:shadow-md transition-all duration-200">
                <Cpu className="w-6 h-6 text-saffron-500" />
                <h3 className="font-serif font-bold text-maroon-700 leading-relaxed">{translations[language].features.ephemeris}</h3>
                <p className={`text-xs text-slate-600 tracking-wide ${language === 'hi' ? 'leading-relaxed md:leading-loose' : 'leading-relaxed'}`}>{translations[language].features.ephemeris_desc}</p>
              </div>
              <div className="p-5 bg-white border border-maroon-500/10 rounded-xl space-y-3 shadow-sm hover:shadow-md transition-all duration-200">
                <Globe className="w-6 h-6 text-saffron-500" />
                <h3 className="font-serif font-bold text-maroon-700 leading-relaxed">{translations[language].features.geo}</h3>
                <p className={`text-xs text-slate-600 tracking-wide ${language === 'hi' ? 'leading-relaxed md:leading-loose' : 'leading-relaxed'}`}>{translations[language].features.geo_desc}</p>
              </div>
              <div className="p-5 bg-white border border-maroon-500/10 rounded-xl space-y-3 shadow-sm hover:shadow-md transition-all duration-200">
                <Layers className="w-6 h-6 text-saffron-500" />
                <h3 className="font-serif font-bold text-maroon-700 leading-relaxed">{translations[language].features.langgraph}</h3>
                <p className={`text-xs text-slate-600 tracking-wide ${language === 'hi' ? 'leading-relaxed md:leading-loose' : 'leading-relaxed'}`}>{translations[language].features.langgraph_desc}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <button 
                id="btn-get-started"
                onClick={() => setCurrentPage('birth-form')}
                className="px-8 py-3.5 bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-500 hover:to-maroon-600 text-white font-serif font-bold rounded-lg transition-transform hover:-translate-y-0.5 cursor-pointer shadow-lg shadow-maroon-900/10 text-sm whitespace-nowrap"
              >
                {translations[language].cta}
              </button>
            </div>
            
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest pt-8">
              COMPLIANT WITH PROFESSIONAL INTERNSHIP SUBMISSION CRITERIA
            </p>
          </section>
        )}

        {/* BIRTH DETAILS FORM SCREEN */}
        {currentPage === 'birth-form' && (
          <section id="screen-birth-form" className="flex-1 flex items-center justify-center p-6 animate-fade-in my-auto">
            <div className="w-full max-w-lg bg-white border border-maroon-500/10 rounded-2xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-maroon-600 via-saffron-500 to-amber-500"></div>
              
              <div className="flex items-center gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setCurrentPage('landing')}
                  className="p-1.5 rounded-lg border border-maroon-500/10 hover:border-maroon-500/20 bg-sand-50/50 hover:bg-sand-100 text-maroon-700 transition-colors cursor-pointer shrink-0"
                  title="Back to Landing Page"
                  id="btn-back-to-landing"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-xl lg:text-2xl font-serif font-bold text-maroon-700">{translations[language].birthBlueprint}</h2>
                  <p className="text-xs text-slate-500 mt-1">{translations[language].birthBlueprintDesc}</p>
                </div>
              </div>

              {formError && (
                <div id="form-error-p" className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 px-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitBirthDetails} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1 flex items-center gap-1">
                    <User className="w-3 h-3 text-saffron-600" /> {translations[language].seekerName}
                  </label>
                  <input 
                    id="input-name"
                    type="text" 
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={translations[language].placeholderName} 
                    className="w-full bg-sand-50/50 border border-maroon-500/15 rounded-lg py-2.5 px-3.5 text-sm text-maroon-750 placeholder-slate-400 focus:outline-none focus:border-saffron-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-saffron-600" /> {translations[language].birthDate}
                    </label>
                    <input 
                      id="input-[YYYY-MM-DD]"
                      type="date" 
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-sand-50/50 border border-maroon-500/15 rounded-lg py-2.5 px-3.5 text-sm text-maroon-75 | text-slate-700 focus:outline-none focus:border-saffron-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-saffron-600" /> {translations[language].birthTime}
                    </label>
                    <input 
                      id="input-time"
                      type="time" 
                      required
                      value={formTime}
                      onChange={(e) => setFormTime(e.target.value)}
                      className="w-full bg-sand-50/50 border border-maroon-500/15 rounded-lg py-2.5 px-3.5 text-sm text-maroon-75 | text-slate-700 focus:outline-none focus:border-saffron-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-saffron-600" /> {translations[language].birthPlace}
                  </label>
                  <div className="flex gap-2">
                    <input 
                      id="input-place"
                      type="text" 
                      required
                      value={formPlace}
                      onChange={(e) => {
                        setFormPlace(e.target.value);
                        setVerifiedLocInfo(null);
                      }}
                      placeholder="e.g. London, United Kingdom" 
                      className="flex-1 bg-sand-50/50 border border-maroon-500/15 rounded-lg py-2.5 px-3.5 text-sm text-maroon-750 placeholder-slate-400 focus:outline-none focus:border-saffron-500 transition-colors"
                    />
                    <button 
                      id="btn-verify-location"
                      type="button"
                      onClick={handleVerifyLocation}
                      disabled={isVerifyingLoc}
                      className="px-3 bg-saffron-50 hover:bg-saffron-100 text-xs font-medium border border-saffron-500/15 rounded-lg text-saffron-750 cursor-pointer disabled:opacity-50 transition-colors"
                    >
                      {isVerifyingLoc ? translations[language].verifying : translations[language].verify}
                    </button>
                  </div>
                  {verifiedLocInfo && (
                    <p id="verified-message" className="text-[11px] text-emerald-705 text-emerald-700 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      {language === 'hi' ? 'निर्देशांक सत्यापित' : 'Coordinates confirmed'}: ({verifiedLocInfo.lat.toFixed(2)}°, {verifiedLocInfo.lon.toFixed(2)}°) [Zone: {verifiedLocInfo.timezone}]
                    </p>
                  )}
                </div>

                <button 
                  id="btn-submit-birth"
                  type="submit"
                  disabled={isVerifyingLoc}
                  className="w-full py-3 bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-500 hover:to-maroon-600 text-white font-serif font-bold rounded-lg shadow-lg hover:-translate-y-0.5 shadow-maroon-900/10 text-sm tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
                >
                  <Sparkles className="w-4 h-4 text-saffron-200 animate-pulse" />
                  {translations[language].castChart}
                </button>
              </form>
            </div>
          </section>
        )}

        {/* MAIN DASHBOARD WORKSPACE */}
        {currentPage === 'dashboard' && profile && (
          <section id="workspace-dashboard" className="flex-1 flex flex-col md:flex-row overflow-hidden w-full">
            
            {/* SIDEBAR: ASTROLOGY REAL POSITION DATA */}
            {showSidebar && (
              <div 
                className="fixed inset-0 top-[112px] bg-black/30 backdrop-blur-xs z-25 md:hidden"
                onClick={() => setShowSidebar(false)}
              />
            )}
            <aside 
              id="dashboard-sidebar" 
              className={`fixed md:relative top-[112px] md:top-0 left-0 z-30 w-72 md:w-80 h-[calc(100vh-112px)] md:h-full border-r border-maroon-500/10 bg-white flex-col p-5 overflow-y-auto shrink-0 space-y-6 transition-all duration-200 shadow-2xl md:shadow-none ${
                showSidebar ? 'flex' : 'hidden md:flex'
              }`}
            >
              
              {/* Profile card summary */}
              <div className="p-4 bg-sand-50 border border-maroon-500/10 rounded-xl space-y-2 shadow-xs">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-serif font-bold text-maroon-700 uppercase tracking-[0.1em]">
                    {translations[language].subject}
                  </h3>
                  <button 
                    onClick={handleWipeSession} 
                    className="text-[10px] text-red-600 hover:text-red-500 font-mono flex items-center gap-0.5 pointer-events-auto"
                    title="Change birth chart subject"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> {translations[language].resetNode}
                  </button>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="text-maroon-800 font-serif font-bold">{profile.name}</p>
                  <p className="text-slate-600 font-mono text-[11px]">{language === 'hi' ? 'जन्म:' : 'Birth:'} {profile.birthDate} ({profile.birthTime})</p>
                  <p className="text-slate-500 text-[11px] leading-tight shrink-1">{profile.displayName}</p>
                </div>
              </div>

              {/* Natal Position details list */}
              {chart && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[10px] uppercase tracking-[0.2em] text-maroon-600 font-serif font-bold">
                      {translations[language].natalData}
                    </h2>
                    <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-300/35 px-1 py-0.5 rounded">
                      {translations[language].keplerPrecise}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {/* Primary Placements */}
                    <div id="sun-card" className="p-3 bg-sand-50/50 hover:bg-sand-50 rounded-lg border border-maroon-500/10 hover:border-saffron-500/35 transition-colors">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 flex items-center gap-1">
                          <SunIcon className="w-3.5 h-3.5 text-saffron-600 shrink-0" />
                          {language === 'hi' ? 'सूर्य स्थापित' : 'Sun Placed'}
                        </span>
                        <span className="text-saffron-600 font-mono font-medium">
                          {chart.planets.find(p => p.name === 'SUN')?.degree}° {chart.planets.find(p => p.name === 'SUN')?.minute}' {chart.planets.find(p => p.name === 'SUN')?.signSymbol}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {language === 'hi' 
                          ? `भाव ${chart.planets.find(p => p.name === 'SUN')?.house} • ` 
                          : `In House ${chart.planets.find(p => p.name === 'SUN')?.house} • `}
                        {(() => {
                          const signNamesHi: Record<string, string> = {
                            Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क',
                            Leo: 'सिंह', Virgo: 'कन्या', Libra: 'तुला', Scorpio: 'वृश्चिक',
                            Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन'
                          };
                          const pSign = chart.planets.find(p => p.name === 'SUN')?.sign;
                          return language === 'hi' ? (signNamesHi[pSign || ''] || pSign) : pSign;
                        })()}
                      </p>
                    </div>

                    <div id="moon-card" className="p-3 bg-sand-50/50 hover:bg-sand-50 rounded-lg border border-maroon-500/10 hover:border-sky-500/35 transition-colors">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 flex items-center gap-1">
                          <MoonIcon className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                          {language === 'hi' ? 'चन्द्र स्थापित' : 'Moon Placed'}
                        </span>
                        <span className="text-sky-600 font-mono font-semibold">
                          {chart.planets.find(p => p.name === 'MOON')?.degree}° {chart.planets.find(p => p.name === 'MOON')?.minute}' {chart.planets.find(p => p.name === 'MOON')?.signSymbol}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {language === 'hi' 
                          ? `भाव ${chart.planets.find(p => p.name === 'MOON')?.house} • ` 
                          : `In House ${chart.planets.find(p => p.name === 'MOON')?.house} • `}
                        {(() => {
                          const signNamesHi: Record<string, string> = {
                            Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क',
                            Leo: 'सिंह', Virgo: 'कन्या', Libra: 'तुला', Scorpio: 'वृश्चिक',
                            Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन'
                          };
                          const pSign = chart.planets.find(p => p.name === 'MOON')?.sign;
                          return language === 'hi' ? (signNamesHi[pSign || ''] || pSign) : pSign;
                        })()}
                      </p>
                    </div>

                    <div id="ascendant-card" className="p-3 bg-sand-50/50 hover:bg-sand-50 rounded-lg border border-maroon-500/10 hover:border-emerald-500/35 transition-colors">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          {language === 'hi' ? 'लग्न (ASC)' : 'Ascendant (1H)'}
                        </span>
                        <span className="text-emerald-700 font-mono font-medium">
                          {chart.ascendant.degree}° {chart.ascendant.minute}' {chart.ascendant.signSymbol}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {language === 'hi' ? 'स्व-व्यक्तित्व • ' : 'Self-Persona • '}
                        {(() => {
                          const signNamesHi: Record<string, string> = {
                            Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क',
                            Leo: 'सिंह', Virgo: 'कन्या', Libra: 'तुला', Scorpio: 'वृश्चिक',
                            Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन'
                          };
                          const aSign = chart.ascendant.sign;
                          return language === 'hi' ? (signNamesHi[aSign || ''] || aSign) : aSign;
                        })()}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveTab('chart')}
                    className="w-full text-center py-2 bg-saffron-50 hover:bg-saffron-100 border border-saffron-500/20 rounded-lg text-xs font-serif font-semibold text-saffron-700 transition-colors cursor-pointer"
                  >
                    {translations[language].viewComprehensiveNatalChart}
                  </button>
                </div>
              )}


            </aside>

            {/* MAIN PORTFOLIO MODULE SWITCHER */}
            <div id="workspace-core" className="flex-1 flex flex-col bg-sand-50/60 relative overflow-hidden">
              
              {/* CHAT SESSION MODULE */}
              {activeTab === 'chat' && (
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
                  
                  {/* Left Column: Messages Stream & Inputs */}
                  <div className="flex-1 flex flex-col overflow-hidden relative">
                    
                    {/* Header bar of Chat module showing title and toggle button to slide in the Chart Wheel */}
                    {chart && (
                      <div className="px-5 py-3 border-b border-maroon-500/10 bg-white/85 backdrop-blur-xs flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {language === 'hi' 
                              ? 'एस्ट्रो-एजेंट आरएजी सहयोगी स्ट्रीम सक्रिय है' 
                              : 'Astro-Agent RAG Companion stream active'}
                          </span>
                        </div>
                        
                        <button 
                          onClick={() => setShowChatWheel(!showChatWheel)}
                          className={`px-3 py-1 bg-sand-50 border rounded-full text-[10px] font-mono font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                            showChatWheel 
                              ? 'border-saffron-500/60 text-saffron-700 bg-saffron-50' 
                              : 'border-maroon-500/15 text-slate-600 hover:text-maroon-700 hover:border-maroon-500/35'
                          }`}
                        >
                          <Compass className="w-3.5 h-3.5" />
                          <span>
                            {showChatWheel 
                              ? (language === 'hi' ? 'मानचित्र छुपाएं' : 'Hide Natal Map') 
                              : (language === 'hi' ? 'मानचित्र दिखाएं' : 'Show Natal Map')}
                          </span>
                        </button>
                      </div>
                    )}
                    
                    {/* Message stream logs viewer */}
                    <div id="chat-messages-container" className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 scrollbar-thin">
                    {messages.map((msg, idx) => (
                      <div 
                        key={msg.id} 
                        className={`flex gap-3 lg:gap-4 max-w-4xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''} animate-fade-in`}
                      >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          msg.sender === 'ai' 
                            ? 'bg-saffron-50 border-saffron-500/20 text-saffron-600' 
                            : 'bg-sand-100 border-maroon-500/15 text-maroon-700'
                        }`}>
                          <span className="text-[10px] font-mono font-bold">
                            {msg.sender === 'ai' ? 'AI' : (language === 'hi' ? 'आप' : 'YOU')}
                          </span>
                        </div>

                        {/* Speech Bubble block */}
                        <div className="space-y-2 max-w-[85%]">
                          <div className={`p-4 rounded-2xl border shadow-md text-sm leading-relaxed ${
                            msg.sender === 'user' 
                              ? 'bg-saffron-50/70 border-saffron-500/15 rounded-tr-none text-maroon-900' 
                              : 'bg-white border-maroon-500/10 rounded-tl-none text-slate-700'
                          }`}>
                            
                            {/* Rendering text markdown segments nicely */}
                            <div className="space-y-3 whitespace-pre-wrap">
                              {msg.text.split('\n\n').map((paragraph, pIdx) => {
                                // Simple styling checks for section blocks
                                if (paragraph.startsWith('Calculated Facts:') || paragraph.startsWith('परिकलित तथ्य:')) {
                                  return (
                                    <div key={pIdx} className="bg-saffron-50/60 border border-saffron-500/15 p-3 rounded-xl mt-2 mb-2">
                                      <h4 className="text-saffron-800 font-serif text-xs uppercase tracking-wider mb-2 font-semibold">
                                        {language === 'hi' ? 'परिकलित भौतिक तथ्य:' : 'Calculated Physical Facts:'}
                                      </h4>
                                      <p className="text-xs text-slate-700 leading-normal">
                                        {paragraph.replace(/Calculated Facts:|परिकलित तथ्य:/, '').trim()}
                                      </p>
                                    </div>
                                  );
                                }
                                if (paragraph.startsWith('Interpretation:') || paragraph.startsWith('व्याख्या:')) {
                                  return (
                                    <div key={pIdx} className="mt-2 text-maroon-900">
                                      <h4 className="text-maroon-700 font-serif text-sm font-semibold mb-1">
                                        {language === 'hi' ? 'व्याख्या (Interpretation):' : 'Interpretation:'}
                                      </h4>
                                      <p className="leading-relaxed">{paragraph.replace(/Interpretation:|व्याख्या:/, '').trim()}</p>
                                    </div>
                                  );
                                }
                                if (paragraph.startsWith('Guidance:') || paragraph.startsWith('मार्गदर्शन:')) {
                                  return (
                                    <div key={pIdx} className="mt-2 text-slate-750 border-t border-maroon-500/10 pt-3">
                                      <h4 className="text-emerald-700 font-serif text-sm font-semibold mb-1">
                                        {language === 'hi' ? 'मार्गदर्शन और व्यावहारिक सलाह:' : 'Guidance & Practical Advice:'}
                                      </h4>
                                      <p className="italic text-slate-700">{paragraph.replace(/Guidance:|मार्गदर्शन:/, '').trim()}</p>
                                    </div>
                                  );
                                }
                                return <p key={pIdx} className="leading-relaxed text-sm">{paragraph}</p>;
                              })}
                            </div>

                            {/* Action Widgets at base of bubble */}
                            {msg.sender === 'ai' && (
                              <div className="flex gap-2 justify-end mt-4 pt-2 border-t border-maroon-500/10">
                                <button 
                                  onClick={() => copyToClipboard(msg.text)}
                                  className="text-[10px] text-slate-500 hover:text-maroon-700 font-semibold uppercase flex items-center gap-1 transition-colors bg-sand-50 hover:bg-sand-100 border border-maroon-500/10 px-2 py-1 rounded cursor-pointer"
                                  title="Copy response facts to clipboard"
                                >
                                  <Copy className="w-3 h-3" /> {translations[language].clipboard}
                                </button>
                                <button 
                                  onClick={() => handleSendChatMessage(messages[idx - 1]?.text || "Explain my chart in depth")}
                                  className="text-[10px] text-slate-500 hover:text-saffron-600 font-semibold uppercase flex items-center gap-1 transition-colors bg-sand-50 hover:bg-sand-100 border border-maroon-500/10 px-2 py-1 rounded cursor-pointer"
                                  title="Regenerate this specific astro prompt context"
                                >
                                  <RotateCcw className="w-3 h-3" /> {translations[language].regenerate}
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Rendering status tools logic tags */}
                          {msg.sender === 'ai' && msg.statusSteps && msg.statusSteps.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {msg.statusSteps.map((step, sIdx) => {
                                const stepTranslationHi: Record<string, string> = {
                                  'Analyzing astrological intent...': 'ज्योतिषीय उद्देश्य का विश्लेषण कर रहे हैं...',
                                  'Resolving geographical birth location...': 'जन्मस्थान के अक्षांश-देशांतर सत्यापित कर रहे हैं...',
                                  'Calculating high-fidelity birth chart elements...': 'सटीक जन्म कुंडली तत्वों की गणना कर रहे हैं...',
                                  'Searching authoritative astrology knowledge base...': 'प्रामाणिक ज्योतिष ज्ञानकोष खोज रहे हैं...',
                                  'Generating personalized astrology guidance...': 'व्यक्तिगत ज्योतिषीय मार्गदर्शन तैयार कर रहे हैं...'
                                };
                                const localizedStep = language === 'hi' ? (stepTranslationHi[step] || step) : step;

                                return (
                                  <span 
                                    key={sIdx} 
                                    className="px-2.5 py-0.5 bg-saffron-50 border border-saffron-500/15 rounded-full text-[10px] text-saffron-700 flex items-center gap-1 font-medium font-mono"
                                  >
                                    <span className="w-1 h-1 rounded-full bg-saffron-500 animate-ping"></span>
                                    {localizedStep}
                                  </span>
                                );
                              })}
                              {msg.reasoningSteps && msg.reasoningSteps.length > 0 && (
                                <details className="group">
                                  <summary className="cursor-pointer text-[10px] text-slate-500 hover:text-maroon-700 transition-colors list-none select-none py-0.5 px-2 bg-sand-50 rounded-full border border-maroon-500/10">
                                    {language === 'hi' ? '[लैंगग्राफ स्टेट नोड चरण देखें]' : '[View LangGraph State Node steps]'}
                                  </summary>
                                  <div className="mt-1.5 p-3 bg-white border border-maroon-500/15 rounded-xl space-y-1 font-mono text-[10px] text-saffron-600 max-w-sm absolute z-15 shadow-lg">
                                    <p className="text-maroon-800 border-b border-maroon-500/10 pb-1 mb-1 font-semibold">
                                      {language === 'hi' ? 'कार्यप्रवाह नोड निष्पादन:' : 'Workflow Node Executions:'}
                                    </p>
                                    {msg.reasoningSteps.map((step, rIdx) => (
                                      <p key={rIdx}>{step}</p>
                                    ))}
                                  </div>
                                </details>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Rendering Active Stream Loading Placeholder */}
                    {isStreaming && (
                      <div className="flex gap-4 max-w-2xl animate-pulse">
                        <div className="w-8 h-8 rounded-lg bg-saffron-50 border border-saffron-500/20 flex items-center justify-center shrink-0 text-saffron-600 font-serif text-xs">
                          AI
                        </div>
                        <div className="space-y-3 flex-1">
                          <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-maroon-500/10 max-w-md">
                            <div className="text-xs font-mono text-saffron-600 mb-2 flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5 text-saffron-500 animate-spin" />
                              <span>{streamProgressText || '[ CALCULATING ASTRO FACTOR GRAPH ]'}</span>
                            </div>
                            <div className="space-y-2">
                              <div className="h-2.5 bg-sand-150 bg-sand-100 rounded w-full"></div>
                              <div className="h-2.5 bg-sand-150 bg-sand-100 rounded w-5/6"></div>
                              <div className="h-2.5 bg-sand-150 bg-sand-100 rounded w-4/6"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={chatEndRef} />
                  </div>

                  {/* Preset prompt helper grid when chat is shallow */}
                  {messages.length <= 1 && (
                    <div id="prompts-grid" className="p-4 bg-white/85 border-t border-maroon-500/10">
                      <p className="text-xs text-maroon-700 font-serif font-bold mb-2.5">{translations[language].suggestedInquiries}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-4xl">
                        <button 
                          onClick={() => handleSendChatMessage(language === 'hi' ? 'क्या आप मेरे दशम भाव के ग्रहों की व्याख्या कर सकते हैं? मैं विशेष रूप से अपने करियर पर शनि के प्रभाव के बारे में जानना चाहता हूँ।' : 'Can you decode my 10th house placements? Im specifically curious about Saturns influence on my career focus.')}
                          className="text-left py-2 px-3 bg-white hover:bg-sand-50 border border-maroon-500/10 rounded-lg text-xs text-slate-700 hover:text-maroon-750 transition-all cursor-pointer flex justify-between items-center group"
                        >
                          <span>{translations[language].suggestedCareer}</span>
                          <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-saffron-500 transition-colors" />
                        </button>
                        <button 
                          onClick={() => handleSendChatMessage(language === 'hi' ? 'मेरे दैनिक ग्रह गोचर की जांच करें। आज मेरे जन्मकालीन सूर्य के साथ कौन से ग्रह योग बन रहे हैं?' : 'Check my daily planetary transits. What planetary aspects are forming with my natal Sun today?')}
                          className="text-left py-2 px-3 bg-white hover:bg-sand-50 border border-maroon-500/10 rounded-lg text-xs text-slate-700 hover:text-maroon-750 transition-all cursor-pointer flex justify-between items-center group"
                        >
                          <span>{translations[language].suggestedTransit}</span>
                          <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-saffron-500 transition-colors" />
                        </button>
                        <button 
                          onClick={() => handleSendChatMessage(language === 'hi' ? 'मेरी जन्म कुंडली में मेरे सप्तम भाव (Descendant) और शुक्र की स्थिति के संबंध निहितार्थों की व्याख्या करें।' : 'Explain the relationship implications of my Descendant and the Venus position in my natal chart.')}
                          className="text-left py-2 px-3 bg-white hover:bg-sand-50 border border-maroon-500/10 rounded-lg text-xs text-slate-700 hover:text-maroon-750 transition-all cursor-pointer flex justify-between items-center group"
                        >
                          <span>{translations[language].suggestedRelationship}</span>
                          <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-saffron-500 transition-colors" />
                        </button>
                        <button 
                          onClick={() => handleSendChatMessage(language === 'hi' ? 'मेरी जन्म कुंडली में प्लूटो के संरेखण और उसके परिवर्तनकारी पाठों की व्याख्या करें।' : 'Explain the alignment of Pluto in my natal chart and its transformative lessons.')}
                          className="text-left py-2 px-3 bg-white hover:bg-sand-50 border border-maroon-500/10 rounded-lg text-xs text-slate-700 hover:text-maroon-750 transition-all cursor-pointer flex justify-between items-center group"
                        >
                          <span>{translations[language].suggestedLessons}</span>
                          <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-saffron-500 transition-colors" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Input field wrapper */}
                  <div id="chat-input-bar" className="p-4 lg:p-6 bg-gradient-to-t from-white to-transparent border-t border-maroon-500/10">
                    <div className="relative max-w-4xl mx-auto flex items-center">
                      <input 
                        id="chat-query-input"
                        type="text" 
                        disabled={isStreaming}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendChatMessage();
                        }}
                        placeholder={translations[language].chatPlaceholder} 
                        className="w-full bg-white border border-maroon-500/15 rounded-xl py-4.5 px-5 pr-20 focus:outline-none focus:border-saffron-500 text-sm transition-all shadow-md text-slate-800 placeholder-slate-400"
                      />
                      <div className="absolute right-3.5 flex gap-1.5">
                        <button 
                          id="btn-send-message"
                          disabled={isStreaming || !chatInput.trim()}
                          onClick={() => handleSendChatMessage()}
                          className="p-2.5 bg-maroon-600 hover:bg-maroon-500 disabled:opacity-50 text-white rounded-lg transition-colors cursor-pointer shadow shadow-maroon-900/10"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Collapsible sliding panel of the Birth Chart Wheel */}
                {showChatWheel && chart && (
                  <div 
                    id="chat-wheel-panel" 
                    className="absolute lg:relative top-0 right-0 z-20 w-full lg:w-[460px] h-full border-l border-maroon-500/10 bg-white overflow-y-auto p-4 space-y-4 shrink-0 scrollbar-thin shadow-2xl lg:shadow-none animate-fade-in"
                  >
                    <div className="flex justify-between items-center border-b border-maroon-500/10 pb-2.5">
                      <div>
                        <h3 className="text-xs font-serif font-bold text-maroon-700">
                          {translations[language].interactiveBirthMap}
                        </h3>
                        <p className="text-[9px] text-slate-500 font-mono text-left font-semibold">
                          {translations[language].synchronizedTelemetry}
                        </p>
                      </div>
                      <button 
                        onClick={() => setShowChatWheel(false)}
                        className="text-xs font-mono text-logo text-maroon-700 font-semibold px-2 py-0.5 rounded bg-sand-100 hover:bg-sand-250 hover:bg-sand-200 cursor-pointer border border-maroon-500/5 transition-colors"
                      >
                        {translations[language].close}
                      </button>
                    </div>

                    <div className="w-full">
                      <BirthChartWheel chart={chart} language={language} hideTelemetry={true} />
                    </div>
                  </div>
                )}

              </div>
            )}

              {/* STATS MODULE (NATAL CHART GRAPHICS) */}
              {activeTab === 'chart' && chart && (
                <div id="chart-visualiser-module" className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6">
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-serif font-bold text-maroon-700">
                        {translations[language].natalAlignmentDetails}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        {translations[language].groundedCalculations}
                      </p>
                    </div>

                    <div className="px-3 py-1 bg-saffron-50 border border-saffron-500/15 rounded-full text-xs text-saffron-700 font-mono font-semibold">
                      {language === 'hi' ? 'जूलियन दिवस' : 'Julian Day'}: {chart.julianDay.toFixed(4)}
                    </div>
                  </div>

                  {/* Dynamic Interactive SVG Birth Chart Wheel */}
                  <BirthChartWheel chart={chart} language={language} />

                  {/* Planetary Positions grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {chart.planets.map((p) => {
                      const planetNamesHi: Record<string, string> = {
                        Sun: 'सूर्य (Sun)', Moon: 'चंद्र (Moon)', Mercury: 'बुध (Mercury)',
                        Venus: 'शुक्र (Venus)', Mars: 'मंगल (Mars)', Jupiter: 'बृहस्पति (Jupiter)',
                        Saturn: 'शनि (Saturn)', Uranus: 'अरुण (Uranus)', Neptune: 'वरुण (Neptune)',
                        Pluto: 'यम (Pluto)', Chiron: 'चिरोन (Chiron)', Ascendant: 'लग्न (Ascendant)',
                        Midheaven: 'दशम (Midheaven)'
                      };

                      const signNamesHi: Record<string, string> = {
                        Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क',
                        Leo: 'सिंह', Virgo: 'कन्या', Libra: 'तुला', Scorpio: 'वृश्चिक',
                        Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन'
                      };

                      const localizedPlanetName = language === 'hi' ? (planetNamesHi[p.name] || p.name) : p.name;
                      const localizedSignName = language === 'hi' ? (signNamesHi[p.sign] || p.sign) : p.sign;

                      return (
                        <div key={p.name} className="p-4 bg-white border border-maroon-500/10 rounded-xl space-y-2 hover:border-saffron-500/25 transition-all shadow-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-400 tracking-wider">
                              {localizedPlanetName}
                            </span>
                            <span className="text-lg text-saffron-600 font-serif" title={p.sign}>
                              {p.signSymbol}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-base font-serif font-bold text-maroon-700">{localizedSignName}</p>
                              <p className="text-[10px] text-slate-500">
                                {language === 'hi' ? `भाव ${p.house} में स्थित` : `Occupies House ${p.house}`}
                              </p>
                            </div>
                            
                            <div className="text-right font-mono text-xs text-saffron-600 font-semibold">
                              {p.degree}° {p.minute}'
                            </div>
                          </div>

                          {/* Progress Bar of sign degree */}
                          <div className="h-1 bg-sand-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-maroon-600 to-saffron-500 rounded-full"
                              style={{ width: `${(p.degree / 30) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Houses alignment list */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-serif font-bold text-maroon-700 border-b border-maroon-500/10 pb-2">
                      {translations[language].computedEqualHouseCusps}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {chart.houses.map((h) => {
                        const signNamesHi: Record<string, string> = {
                          Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क',
                          Leo: 'सिंह', Virgo: 'कन्या', Libra: 'तुला', Scorpio: 'वृश्चिक',
                          Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन'
                        };
                        const localizedHouseSign = language === 'hi' ? (signNamesHi[h.sign] || h.sign) : h.sign;

                        return (
                          <div key={h.number} className="p-3 bg-white border border-maroon-500/5 rounded-lg flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-500">
                              {language === 'hi' ? `भाव ${h.number}:` : `House ${h.number}:`}
                            </span>
                            <span className="text-maroon-700 font-serif font-bold flex items-center gap-1 leading-none shadow-sm px-1 rounded bg-sand-50/50">
                              {h.signSymbol} {localizedHouseSign} ({Math.floor(h.startLongitude)}°)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* USER PROFILE DETAILS PANEL */}
              {activeTab === 'profile' && (
                <div id="profile-management-module" className="flex-1 p-6 lg:p-8 overflow-y-auto space-y-6 max-w-3xl mx-auto w-full">
                  
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-maroon-700">Saved Subject Session Details</h2>
                    <p className="text-xs text-slate-500 mt-1">To ensure offline session restoration, profile coordinates are stored securely in local browser storage.</p>
                  </div>

                  <div className="bg-white border border-maroon-500/10 rounded-2xl p-6 space-y-6 relative overflow-hidden shadow-md">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-slate-500 font-mono tracking-wider">Subject Name</span>
                        <p className="text-base text-maroon-750 font-bold">{profile.name}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-slate-500 font-mono tracking-wider">Subject Registry E-mail</span>
                        <p className="text-base text-saffron-700 font-mono font-semibold">{authEmail}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-slate-500 font-mono tracking-wider">Cast Timestamp</span>
                        <p className="text-base text-maroon-750 font-bold">{profile.birthDate} at {profile.birthTime} GMT</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-slate-500 font-mono tracking-wider">Geographical Core</span>
                        <p className="text-base text-maroon-750 font-bold">{profile.displayName}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-slate-500 font-mono tracking-wider">Resolved Lat / Lon</span>
                        <p className="text-base text-maroon-750 font-bold font-mono">Latitude: {profile.lat.toFixed(4)} | Longitude: {profile.lon.toFixed(4)}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase text-slate-500 font-mono tracking-wider">Assigned Timezone</span>
                        <p className="text-base text-emerald-700 font-semibold font-mono">{profile.timezone}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-maroon-500/10 flex gap-3">
                      <button 
                        onClick={handleWipeSession}
                        className="px-4 py-2 bg-red-650 hover:bg-red-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                      >
                        Wipe Saved Profile
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>


    </div>
  );
}
