
import React, { useState, useEffect, useRef } from 'react';
import { VerificationResult } from './types';
import { verifyContent } from './services/geminiService';
import VerdictBadge from './components/VerdictBadge';
import ScoreGauge from './components/ScoreGauge';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [history, setHistory] = useState<VerificationResult[]>([]);
  const [currentResult, setCurrentResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const loadingSteps = [
    "Analyzing input data...",
    "Searching web for evidence...",
    "Consulting official sources...",
    "Cross-referencing facts...",
    "Finalizing trust score..."
  ];

  useEffect(() => {
    let interval: any;
    if (isVerifying) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(s => (s + 1) % loadingSteps.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isVerifying]);

  useEffect(() => {
    const saved = localStorage.getItem('veritruth_history_v2');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("History load failed", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('veritruth_history_v2', JSON.stringify(history));
  }, [history]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError("Image too large. Please use an image under 4MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVerify = async () => {
    if (!inputText.trim() && !selectedImage) return;

    setIsVerifying(true);
    setError(null);
    setCurrentResult(null);

    try {
      const result = await verifyContent(inputText, selectedImage || undefined);
      setCurrentResult(result);
      setHistory(prev => [result, ...prev].filter((v, i, a) => a.findIndex(t => t.content === v.content) === i).slice(0, 15));
      
      // Auto-scroll to result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      setError("Verification failed. This might be due to a network error or API limit. Please try again in a moment.");
    } finally {
      setIsVerifying(false);
    }
  };

  const copyResult = () => {
    if (!currentResult) return;
    const shareText = `🔍 *Fact Check Result: VeriTruth*\n\n*Verdict:* ${currentResult.verdict}\n*Trust Score:* ${currentResult.score}/100\n\n*Explanation:* ${currentResult.explanation.substring(0, 200)}...\n\n✅ Verified via VeriTruth AI`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-slate-900 font-sans selection:bg-emerald-100">
      {/* Dynamic Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 py-3 sm:py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-lg shadow-emerald-200 transform group-hover:scale-110 transition-transform">
              <i className="fas fa-check-double text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 leading-tight">VeriTruth</h1>
              <p className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">Fake News Guard</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center space-x-4">
            <span className="text-xs font-medium text-slate-400">Stopping misinformation at the source.</span>
            <div className="h-4 w-[1px] bg-slate-200"></div>
            <a href="https://wa.me/" className="text-emerald-600 hover:text-emerald-700">
              <i className="fab fa-whatsapp text-xl"></i>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-10 text-center sm:text-left">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Verify Before You Forward.</h2>
          <p className="text-slate-500 max-w-lg">Paste a message or upload a screenshot of a rumor to get a real-time fact-check and trust score.</p>
        </div>

        {/* Action Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-12">
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-white overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="relative group">
                  <textarea
                    className="w-full h-40 p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all resize-none text-slate-700 placeholder:text-slate-400"
                    placeholder="Paste the 'Forwarded many times' message here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  {inputText && (
                    <button 
                      onClick={() => setInputText('')}
                      className="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors"
                    >
                      <i className="fas fa-times-circle text-lg"></i>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 mt-6">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="group flex items-center px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all border border-slate-200 text-sm font-semibold"
                    >
                      <i className="fas fa-camera mr-2 text-slate-400 group-hover:text-emerald-500"></i>
                      {selectedImage ? 'Image Attached' : 'Attach Screenshot'}
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    
                    {selectedImage && (
                      <div className="relative inline-block animate-in zoom-in duration-300">
                        <img src={selectedImage} alt="Preview" className="h-10 w-10 object-cover rounded-lg ring-2 ring-emerald-500/20" />
                        <button 
                          onClick={() => setSelectedImage(null)}
                          className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full w-5 h-5 flex items-center justify-center text-[8px] shadow-lg"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleVerify}
                    disabled={isVerifying || (!inputText.trim() && !selectedImage)}
                    className={`px-8 py-3 rounded-xl font-bold text-white shadow-xl shadow-emerald-200 transition-all flex items-center justify-center space-x-2 min-w-[180px] ${
                      isVerifying || (!inputText.trim() && !selectedImage)
                        ? 'bg-slate-200 shadow-none cursor-not-allowed text-slate-400'
                        : 'bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-95'
                    }`}
                  >
                    {isVerifying ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Scanning...</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-magnifying-glass"></i>
                        <span>Verify Claim</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {isVerifying && (
                <div className="bg-emerald-50 px-6 py-4 flex items-center space-x-3 border-t border-emerald-100">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                  <span className="text-emerald-700 text-sm font-medium animate-pulse">
                    {loadingSteps[loadingStep]}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl flex items-center space-x-3 animate-in slide-in-from-top-2">
            <i className="fas fa-circle-exclamation text-xl"></i>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {currentResult && (
          <div ref={resultRef} className="mt-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
              <div className="bg-slate-900 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <VerdictBadge verdict={currentResult.verdict} />
                  <span className="text-slate-400 text-xs font-medium">
                    <i className="far fa-calendar-alt mr-1.5"></i>
                    Checked on {new Date(currentResult.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={copyResult}
                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center"
                  >
                    <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                    {copied ? 'Copied!' : 'Copy to WhatsApp'}
                  </button>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8">
                    <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center">
                      Analysis Report
                      <span className="ml-3 h-1 w-12 bg-emerald-500 rounded-full"></span>
                    </h3>
                    
                    <div className="prose prose-slate max-w-none text-slate-600 space-y-4">
                      {currentResult.explanation.split('\n').map((line, i) => {
                        const trimmed = line.trim();
                        if (!trimmed) return null;
                        if (trimmed.startsWith('VERDICT:') || trimmed.startsWith('SCORE:')) return null;
                        
                        const isDetail = trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('DETAILS:');
                        return (
                          <p key={i} className={`${isDetail ? 'pl-4 border-l-2 border-slate-100 italic' : 'font-medium text-slate-700'}`}>
                            {trimmed.replace(/^DETAILS:\s*/i, '')}
                          </p>
                        );
                      })}
                    </div>

                    {currentResult.sources.length > 0 && (
                      <div className="mt-10">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                          Evidence Found in Search
                        </h4>
                        <div className="flex flex-col space-y-2">
                          {currentResult.sources.map((source, idx) => (
                            <a
                              key={idx}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center p-4 bg-slate-50 hover:bg-white rounded-2xl border border-transparent hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100 transition-all"
                            >
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 mr-4 group-hover:scale-110 transition-transform">
                                <i className="fas fa-link text-xs"></i>
                              </div>
                              <span className="flex-1 text-sm font-bold text-slate-700 truncate group-hover:text-emerald-700">
                                {source.title}
                              </span>
                              <i className="fas fa-external-link-alt text-slate-300 text-[10px] ml-4"></i>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-4">
                    <div className="sticky top-24 space-y-6">
                      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col items-center text-center shadow-inner">
                        <ScoreGauge score={currentResult.score} />
                        <h4 className="mt-4 text-sm font-bold text-slate-800 uppercase tracking-widest">
                          Trust Quotient
                        </h4>
                        <p className="mt-2 text-xs text-slate-400 font-medium px-4">
                          Based on algorithmic confidence and cross-referencing available news data.
                        </p>
                      </div>

                      <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-xl shadow-emerald-200">
                        <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-2">Pro Tip</p>
                        <p className="text-sm font-medium leading-relaxed">
                          "Forwarded many times" labels are a red flag. Always verify emotionally charged messages.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History / Recent Activity */}
        {history.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-slate-800">Community Activity</h2>
                <p className="text-xs text-slate-400 font-medium">Claims verified in your session</p>
              </div>
              <button 
                onClick={() => setHistory([])}
                className="text-xs font-bold text-slate-300 hover:text-rose-500 transition-colors flex items-center"
              >
                <i className="fas fa-trash-alt mr-2"></i>
                Wipe Local History
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {history.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => {
                    setCurrentResult(item);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group"
                >
                  <div className="flex items-center space-x-4 min-w-0 flex-1">
                    <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${
                      item.score > 70 ? 'bg-emerald-500' : 
                      item.score > 40 ? 'bg-amber-400' : 'bg-rose-500'
                    }`}></div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-700 truncate mb-1 pr-2">
                        {item.content || "Image Claim"}
                      </p>
                      <div className="flex items-center space-x-2">
                        <VerdictBadge verdict={item.verdict} />
                        <span className="text-[9px] font-black text-slate-300 uppercase">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-2">
                    <div className="text-lg font-black text-slate-800">{item.score}%</div>
                    <i className="fas fa-chevron-right text-slate-200 group-hover:text-emerald-500 transition-colors"></i>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-32 bg-slate-900 pt-20 pb-10 text-slate-400">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-emerald-500 p-2 rounded-lg text-white">
                  <i className="fas fa-check-double text-lg"></i>
                </div>
                <h3 className="text-white font-bold text-xl">VeriTruth</h3>
              </div>
              <p className="text-sm leading-relaxed mb-6">
                Our mission is to empower individuals with real-time fact-checking tools to combat the plague of misinformation in messaging apps.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"><i className="fab fa-twitter"></i></a>
                <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"><i className="fab fa-github"></i></a>
                <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all"><i className="fas fa-globe"></i></a>
              </div>
            </div>
            
            <div className="col-span-1">
              <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Technologies</h4>
              <ul className="text-sm space-y-3">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Gemini 3 Pro Engine</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Google Search Grounding</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">React 19 & Vite</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Tailwind CSS 3.4</a></li>
              </ul>
            </div>

            <div className="col-span-1">
              <h4 className="text-white font-bold mb-6 uppercase text-xs tracking-widest">Legal & Privacy</h4>
              <ul className="text-sm space-y-3">
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Responsible AI Use</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Data Transparency</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center">
            <p className="text-xs font-medium tracking-wide">
              &copy; {new Date().getFullYear()} VeriTruth AI Misinformation Lab. All claims are verified against publicly available data.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
