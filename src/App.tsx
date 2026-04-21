/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  UserRound, 
  Eraser, 
  Copy, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  Info,
  Layers,
  Moon,
  Sun,
  Activity,
  Sparkles,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, signInWithGoogle, logout, saveUserProfile, getUserProfile, UserProfile } from './lib/firebase.ts';
import { detectAI, humanizeText, DetectionResult, HumanizeResult, Tone } from './lib/gemini.ts';
import { serverTimestamp } from 'firebase/firestore';

// --- Animation Variants ---
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6, 
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
  }
};

// --- Header Component ---
const Header = ({ darkMode, toggleDarkMode, user }: { darkMode: boolean, toggleDarkMode: () => void, user: any }) => (
  <motion.header 
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-50 transition-colors"
  >
    <div className="flex items-center gap-3">
      <motion.div 
        whileHover={{ rotate: 10, scale: 1.05 }}
        className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-100 dark:shadow-none"
      >
        V
      </motion.div>
      <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
        Veritas AI <span className="text-slate-400 dark:text-slate-500 font-normal">| Text Intelligence</span>
      </h1>
    </div>
    <div className="flex items-center gap-6">
      {user && (
        <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-slate-200 dark:border-slate-800">
          <img 
            src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
            alt="User" 
            className="w-8 h-8 rounded-full ring-2 ring-indigo-100 dark:ring-indigo-900/30"
            referrerPolicy="no-referrer"
          />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase leading-none">{user.displayName}</span>
            <button onClick={logout} className="text-[10px] text-slate-400 hover:text-red-500 uppercase font-black text-left">Logout</button>
          </div>
        </div>
      )}
      <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> System Active
      </div>
      <motion.button 
        whileTap={{ scale: 0.9 }}
        onClick={toggleDarkMode}
        className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </motion.button>
    </div>
  </motion.header>
);

// --- Login Component ---
const LoginScreen = () => (
  <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center px-6">
    <motion.div 
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-2xl mb-8"
    >
      V
    </motion.div>
    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Access Text Intelligence</h2>
    <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed font-medium">Identify AI patterns and humanize your content with our neural optimization engine. Free access for all verified users.</p>
    
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={signInWithGoogle}
      className="w-full flex items-center justify-center gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-xl transition-all group"
    >
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
      <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest text-xs">Continue with Google</span>
    </motion.button>
    
    <div className="mt-12 text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-4">
      <div className="h-[1px] w-8 bg-slate-200 dark:bg-slate-800"></div>
      Secure OAuth 2.0
      <div className="h-[1px] w-8 bg-slate-200 dark:bg-slate-800"></div>
    </div>
  </div>
);

// --- Constants ---
const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo (Brazzaville)", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau", "Palestine State", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States of America", "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
];

// --- Profile Form Component ---
const ProfileCompletion = ({ onComplete, userId, email, displayName }: { onComplete: () => void, userId: string, email: string, displayName: string }) => {
  const [fullName, setFullName] = useState(displayName);
  const [country, setCountry] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const filteredCountries = COUNTRIES.filter(c => c.toLowerCase().includes(country.toLowerCase()));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !country || !agreed) return;
    setLoading(true);
    await saveUserProfile(userId, {
      uid: userId,
      email,
      displayName: fullName,
      address: "Not Provided", // Keeping schema consistent
      country,
      profileCompleted: true,
      createdAt: serverTimestamp()
    });
    onComplete();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-md mx-auto text-center px-6">
       <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
         <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
       </div>
       <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Complete Your Profile</h2>
       <p className="text-slate-500 dark:text-slate-400 mb-8 text-[10px] font-black uppercase tracking-[0.2em]">Required to verify identity and access services</p>
       
       <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 pl-1 tracking-widest">Full Name</label>
            <input 
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Enter your full name..."
              className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 dark:text-slate-200 shadow-sm"
            />
          </div>
          <div className="space-y-1.5 text-left text-xs relative">
            <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-600 pl-1 tracking-widest">Country</label>
            <input 
              required
              value={country}
              onChange={e => {
                setCountry(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
              placeholder="Search or select country..."
              className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 dark:text-slate-200 shadow-sm"
            />
            <AnimatePresence>
              {isDropdownOpen && filteredCountries.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-10 w-full max-h-48 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl mt-1 py-1"
                >
                  {filteredCountries.map(c => (
                    <li
                      key={c}
                      onClick={() => {
                        setCountry(c);
                        setIsDropdownOpen(false);
                      }}
                      className="px-4 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer text-sm font-medium transition-colors"
                    >
                      {c}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          <div className="bg-slate-100 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-left shadow-sm">
            <label className="flex gap-3 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 leading-normal uppercase tracking-tight">
                I agree to the Terms & Conditions. We guarantee the privacy and security of your data. Your information will never be misused.
              </span>
            </label>
          </div>

          <motion.button
            whileHover={agreed ? { scale: 1.02 } : {}}
            whileTap={agreed ? { scale: 0.98 } : {}}
            disabled={loading || !agreed}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all disabled:opacity-30"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : "Verify Identity & Continue"}
          </motion.button>
       </form>
    </div>
  );
};


// --- Footer Component ---
const Footnotes = () => (
  <footer className="h-12 lg:h-10 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 flex flex-col lg:flex-row items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-tight font-bold shrink-0 gap-2 py-2 lg:py-0 transition-colors">
    <div>© 2024 Veritas Intelligence Systems</div>
    <div className="flex gap-4 lg:gap-6">
      <span>API Status: 12ms</span>
      <span className="hidden sm:inline">Cloud Core: AWS-USE-1</span>
      <span>Security: AES-256</span>
    </div>
  </footer>
);

export default function App() {
  const [user, userLoading] = useAuthState(auth);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [humanizedResult, setHumanizedResult] = useState<HumanizeResult | null>(null);
  const [tone, setTone] = useState<Tone>('Professional');
  const [darkMode, setDarkMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync dark mode
  React.useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Fetch Profile if Logged in
  React.useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const p = await getUserProfile(user.uid);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setProfileLoading(false);
    };
    fetchProfile();
  }, [user]);

  const wordCount = useMemo(() => text.trim() ? text.trim().split(/\s+/).length : 0, [text]);
  const charCount = text.length;

  const handleClear = () => {
    setText('');
    setDetectionResult(null);
    setHumanizedResult(null);
    setError(null);
  };

  const handleDetect = async () => {
    if (!text.trim()) {
      setError('Please enter some text to analyze.');
      return;
    }
    setError(null);
    setIsProcessing(true);
    setDetectionResult(null);
    setHumanizedResult(null);
    try {
      const result = await detectAI(text);
      setDetectionResult(result);
    } catch (err) {
      setError('Detection failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleHumanize = async () => {
    if (!text.trim()) {
      setError('Please enter some text to humanize.');
      return;
    }
    setError(null);
    setIsProcessing(true);
    setDetectionResult(null);
    setHumanizedResult(null);
    try {
      const result = await humanizeText(text, tone);
      setHumanizedResult(result);
    } catch (err) {
      setError('Humanization failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const downloadText = (content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'veritas-output.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (userLoading || profileLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <RefreshCw className="w-8 h-8 text-indigo-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 font-sans overflow-hidden">
      <Header darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} user={user} />

      {!user ? (
        <LoginScreen />
      ) : !profile?.profileCompleted ? (
        <ProfileCompletion 
          userId={user.uid} 
          email={user.email!} 
          displayName={user.displayName || "Subscriber"} 
          onComplete={async () => {
            const p = await getUserProfile(user.uid);
            setProfile(p);
          }} 
        />
      ) : (
        <motion.main 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="flex-1 p-4 lg:p-6 flex flex-col lg:flex-row gap-6 overflow-hidden"
        >
          
          {/* Source Input Section (Left) */}
          <motion.section variants={itemVariants} className="flex-1 flex flex-col gap-4 min-w-0 h-full">
            <div className="flex items-center justify-between shrink-0 px-1">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-indigo-100 dark:bg-indigo-900/30">
                  <Zap className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Source Input</h2>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-300 dark:text-slate-600">
                {wordCount} Words / {charCount} Characters
              </span>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm relative overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 group">
              <textarea
                id="main-input-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your text here to analyze or humanize..."
                className="w-full flex-1 p-8 text-slate-700 dark:text-slate-200 leading-relaxed resize-none focus:outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 text-base lg:text-lg bg-transparent"
              />
              
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  id="clear-all-button"
                  onClick={handleClear}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-tighter text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                >
                  Clear All
                </motion.button>
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    id="detect-ai-button"
                    onClick={handleDetect}
                    disabled={isProcessing}
                    className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wide rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Detect AI
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2, shadow: "0 10px 20px -10px rgba(79, 70, 229, 0.5)" }}
                    whileTap={{ scale: 0.98 }}
                    id="humanize-text-button"
                    onClick={handleHumanize}
                    disabled={isProcessing}
                    className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-xs uppercase tracking-wide rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 dark:shadow-none disabled:opacity-50 flex items-center gap-2"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Humanize
                  </motion.button>
                </div>
              </div>
              
              {/* Subtle visual accent */}
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, scale: 0.95 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  exit={{ opacity: 0, height: 0, scale: 0.95 }}
                  className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-2xl flex items-center gap-2 border border-red-100 dark:border-red-900/30 overflow-hidden shadow-sm"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-tight">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Analysis & Result Section (Right) */}
          <motion.section variants={itemVariants} className="w-full lg:w-[420px] flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between shrink-0 px-1">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Analysis & Result</h2>
              <div className="flex gap-1.5 p-1 bg-slate-200/50 dark:bg-slate-800/50 rounded-full">
                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                <motion.div 
                  animate={{ scale: isProcessing ? [1, 1.3, 1] : 1 }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className={`w-2 h-2 rounded-full ${isProcessing ? 'bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]' : 'bg-indigo-500'}`}
                ></motion.div>
              </div>
            </div>

            {/* AI Score Card */}
            <motion.div 
              layout
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-5 shrink-0 transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="text-center flex-1 border-r border-slate-100 dark:border-slate-800 pr-4">
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={detectionResult?.score ?? 'none'}
                    className={`text-4xl font-black tabular-nums transition-colors ${
                      !detectionResult ? 'text-slate-200 dark:text-slate-800' :
                      detectionResult.score > 70 ? 'text-amber-500' : 
                      detectionResult.score > 30 ? 'text-amber-400' : 'text-emerald-500'
                    }`}
                  >
                    {detectionResult ? `${Math.round(detectionResult.score)}%` : '--'}
                  </motion.div>
                  <div className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 mt-1 tracking-tighter">AI Probability</div>
                </div>
                <div className="flex-[1.5] pl-6 h-full flex flex-col justify-center">
                  <motion.div 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={detectionResult?.label ?? 'pending'}
                    className={`inline-block px-2 py-1 rounded text-[10px] font-black uppercase mb-1.5 w-fit shadow-sm ${
                      !detectionResult ? 'bg-slate-50 text-slate-300 dark:bg-slate-800 dark:text-slate-700' :
                      detectionResult.score > 70 ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-100' :
                      detectionResult.score > 30 ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-50' :
                      'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-100'
                    }`}
                  >
                    {detectionResult ? detectionResult.label : 'Pending Scan'}
                  </motion.div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-tight">
                    {detectionResult?.score 
                      ? detectionResult.score > 50 
                        ? "High structural uniformity typically found in AI outputs."
                        : "Linguistic entropy suggests strong human authorship."
                      : "Analysis will reveal probabilistic patterns and structural entropy."}
                  </p>
                </div>
              </div>
              
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: detectionResult ? `${detectionResult.score}%` : 0 }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full shadow-inner ${
                    !detectionResult ? 'bg-slate-200' :
                    detectionResult.score > 70 ? 'bg-amber-500' : 
                    detectionResult.score > 30 ? 'bg-amber-400' : 'bg-emerald-500'
                  }`}
                />
              </div>
            </motion.div>

            {/* Main Result Card (Output or Sentence Analysis) */}
            <motion.div 
              layout
              className="bg-slate-900 rounded-3xl p-6 flex-1 flex flex-col shadow-2xl min-h-0 overflow-hidden border border-slate-800/50"
            >
              <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex bg-slate-800/80 p-1 rounded-xl backdrop-blur-sm">
                  {(['Casual', 'Professional', 'Simple English'] as Tone[]).map((t) => (
                    <motion.button
                      key={t}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setTone(t)}
                      className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-lg transition-all ${
                        tone === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.split(' ')[0]}
                    </motion.button>
                  ))}
                </div>
                
                <div className="flex gap-1.5">
                  <motion.button 
                    whileHover={{ scale: 1.1, color: '#fff' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      const c = humanizedResult?.text || text;
                      if(c) copyToClipboard(c);
                    }}
                    className="p-2 text-slate-500 hover:text-slate-200 transition-colors bg-slate-800/50 rounded-lg"
                  >
                    <Copy className="w-4 h-4" />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.1, color: '#fff' }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      const c = humanizedResult?.text || text;
                      if(c) downloadText(c);
                    }}
                    className="p-2 text-slate-500 hover:text-slate-200 transition-colors bg-slate-800/50 rounded-lg"
                  >
                    <Download className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              <div className="flex-1 relative overflow-y-auto custom-scrollbar pr-1">
                <AnimatePresence mode="wait">
                  {isProcessing ? (
                    <motion.div 
                      key="loading" 
                      initial={{ opacity: 0, scale: 0.9 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={{ opacity: 0, scale: 1.1 }}
                      className="absolute inset-0 flex flex-col items-center justify-center text-center p-8"
                    >
                      <motion.div 
                        animate={{ 
                          rotate: 360,
                          scale: [1, 1.1, 1]
                        }}
                        transition={{ 
                          rotate: { repeat: Infinity, duration: 4, ease: 'linear' },
                          scale: { repeat: Infinity, duration: 2 }
                        }}
                        className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full mb-4 flex items-center justify-center"
                      >
                         <Activity className="w-5 h-5 text-indigo-500" />
                      </motion.div>
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] animate-pulse">Linguistic Optimization</p>
                    </motion.div>
                  ) : humanizedResult ? (
                    <motion.div 
                      key="human" 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="text-slate-200 text-base leading-relaxed italic font-medium whitespace-pre-wrap selection:bg-indigo-500/30"
                    >
                      "{humanizedResult.text}"
                    </motion.div>
                  ) : detectionResult ? (
                    <motion.div 
                      key="det" 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="text-slate-400 text-xs leading-relaxed space-y-1"
                    >
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-[0.2em] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Pattern Analysis
                      </div>
                      {detectionResult.analysis.map((item, idx) => (
                        <motion.span 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          key={idx} 
                          className={`inline-block px-1 py-0.5 rounded transition-colors duration-300 ${item.isAI ? 'text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20' : 'text-slate-400 opacity-80'}`}
                        >
                          {item.sentence}{' '}
                        </motion.span>
                      ))}
                    </motion.div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 opacity-20">
                      <Layers className="w-12 h-12 text-slate-600 mb-4" />
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">Neural Output Area</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-800/50 pt-4 shrink-0">
                <div className="text-[9px] text-slate-500 font-mono tracking-tighter uppercase flex items-center gap-2">
                   <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                   v1.4.2_OPTIMIZED
                </div>
                <motion.button 
                  whileHover={{ x: -2 }}
                  onClick={() => {
                    const c = humanizedResult?.text || text;
                    if(c) copyToClipboard(c);
                  }}
                  className="text-indigo-400 text-[10px] font-black tracking-widest hover:text-indigo-300 uppercase transition-colors"
                >
                  Copy Text
                </motion.button>
              </div>
            </motion.div>
          </motion.section>
        </motion.main>
      )}

      <Footnotes />
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        ::selection {
          background-color: rgba(79, 70, 229, 0.4);
          color: white;
        }
      `}</style>
    </div>
  );
}
