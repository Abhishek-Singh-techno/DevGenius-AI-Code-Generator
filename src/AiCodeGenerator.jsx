import React, { useState } from 'react';
import {
  Code,
  Cpu,
  Layout,
  Terminal,
  Copy,
  Check,
  Eye,
  Zap,
  Loader2,
  Monitor
} from 'lucide-react';

/**
 * AI Code Generator
 * Calls Netlify Serverless Function via /api/generate
 * (API key Netlify env variable GEMINI_API_KEY mein rahegi, frontend mein nahi)
 */
const GoogleGeminiService = {
  async generateCode(prompt, type) {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, type })
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(`Server Error: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(data.error || `Server Error: ${response.status}`);
    }

    let text = data.code || '';

    // Agar AI markdown backticks laga de to hata do
    text = text
      .replace(/^```html\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/```\s*$/, '');

    return text;
  }
};

// --- COMPONENTS ---

const Header = () => (
  <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Cpu className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            DevGenius AI
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-wider">CODE GENERATOR</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 text-sm text-slate-400 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
          <Zap className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span>Made by Abhishek Rajpoot</span>
        </div>
      </div>
    </div>
  </header>
);

const PreviewFrame = ({ code }) => {
  if (!code) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-800">
        <Monitor className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">No preview available</p>
        <p className="text-sm">Generate some code to see it live</p>
      </div>
    );
  }

  return (
    <iframe
      title="Preview"
      srcDoc={code}
      className="w-full h-full rounded-lg bg-white border border-slate-700 shadow-2xl"
      sandbox="allow-scripts"
    />
  );
};

const CodeBlock = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!code) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900/50 rounded-lg border-2 border-dashed border-slate-800">
        <Terminal className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">Waiting for input...</p>
        <p className="text-sm">Enter a prompt to generate code</p>
      </div>
    );
  }

  return (
    <div className="relative group h-full flex flex-col">
      <div className="absolute top-4 right-4 z-10">
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-medium transition-all border border-slate-700"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy Code'}
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-[#0d1117] p-4 rounded-lg border border-slate-800 font-mono text-sm text-slate-300 leading-relaxed custom-scrollbar">
        <pre className="whitespace-pre-wrap break-words">{code}</pre>
      </div>
    </div>
  );
};

// Tech stack options (Tailwind classes full string mein hain taaki build mein na hatein)
const techOptions = [
  {
    value: 'html-tailwind',
    label: 'HTML + Tailwind CSS',
    badge: 'Recommended',
    active: 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/50 text-white',
    ring: 'border-blue-500',
    dot: 'bg-blue-500'
  },
  {
    value: 'html-css',
    label: 'HTML + Standard CSS',
    active: 'bg-purple-600/10 border-purple-500/50 ring-1 ring-purple-500/50 text-white',
    ring: 'border-purple-500',
    dot: 'bg-purple-500'
  },
  {
    value: 'html-only',
    label: 'Pure HTML',
    active: 'bg-emerald-600/10 border-emerald-500/50 ring-1 ring-emerald-500/50 text-white',
    ring: 'border-emerald-500',
    dot: 'bg-emerald-500'
  }
];

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [techStack, setTechStack] = useState('html-tailwind');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setError('');
    setGeneratedCode('');
    setActiveTab('preview');

    try {
      const code = await GoogleGeminiService.generateCode(prompt, techStack);
      if (typeof code === 'string' && code.trim()) {
        setGeneratedCode(code);
      } else {
        setGeneratedCode('');
        setError('Received empty data from API.');
      }
    } catch (err) {
      console.error('Generate error:', err);
      setError(err.message || 'Failed to generate code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const predefinedPrompts = [
    'A landing page for a coffee shop with a hero image',
    'A login form with glassmorphism effect',
    'A pricing table with 3 cards',
    'A personal portfolio hero section'
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6">
        {/* LEFT COLUMN: Controls */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 h-full overflow-y-auto pb-8 scrollbar-hide">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Build faster with AI</h2>
            <p className="text-slate-400">
              Describe your UI, choose your stack, and let Gemini generate the code instantly.
            </p>
          </div>

          <form
            onSubmit={handleGenerate}
            className="flex flex-col gap-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl"
          >
            {/* TECH STACK */}
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Layout className="w-4 h-4 text-blue-400" />
                Select Tech Stack
              </p>

              <div className="grid grid-cols-1 gap-3">
                {techOptions.map((opt) => {
                  const selected = techStack === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`cursor-pointer p-3 rounded-lg border transition-all flex items-center gap-3 relative ${
                        selected
                          ? opt.active
                          : 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-slate-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="techStack"
                        value={opt.value}
                        checked={selected}
                        onChange={() => setTechStack(opt.value)}
                        className="hidden"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          selected ? opt.ring : 'border-slate-400'
                        }`}
                      >
                        {selected && <div className={`w-2 h-2 rounded-full ${opt.dot}`} />}
                      </div>
                      <span className="font-medium text-sm">{opt.label}</span>
                      {opt.badge && (
                        <span className="text-xs text-slate-500 ml-auto">{opt.badge}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* DESCRIBE INTERFACE */}
            <div className="space-y-3">
              <label
                htmlFor="prompt"
                className="text-sm font-semibold text-slate-300 flex items-center gap-2"
              >
                <Code className="w-4 h-4 text-emerald-400" />
                Describe Interface
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A modern dark themed navbar with a logo on the left, 5 links in the center, and a 'Get Started' button on the right."
                className="w-full h-40 bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none text-sm leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                isLoading || !prompt.trim()
                  ? 'bg-slate-800 cursor-not-allowed text-slate-500'
                  : 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 shadow-blue-900/20'
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  Generate UI
                </>
              )}
            </button>
          </form>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Quick Start Prompts
            </p>
            <div className="flex flex-wrap gap-2">
              {predefinedPrompts.map((p, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setPrompt(p)}
                  className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-blue-400 px-3 py-2 rounded-lg transition-colors text-left"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Display */}
        <div className="w-full lg:w-2/3 flex flex-col h-[600px] lg:h-full bg-slate-900/30 rounded-2xl border border-slate-800 overflow-hidden relative">
          {/* Tabs */}
          <div className="flex items-center border-b border-slate-800 bg-slate-900/80 px-4">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'preview'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Eye className="w-4 h-4" />
              Live Preview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'code'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              <Code className="w-4 h-4" />
              Source Code
            </button>

            {generatedCode && !isLoading && (
              <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Generated Successfully
              </div>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 overflow-hidden relative">
            {error && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-8">
                <div className="bg-red-900/20 border border-red-800 text-red-200 p-6 rounded-xl text-center max-w-md">
                  <p className="font-semibold mb-2">Generation Failed</p>
                  <p className="text-sm opacity-80">{error}</p>
                  <button
                    type="button"
                    onClick={() => setError('')}
                    className="mt-4 text-xs bg-red-900/40 hover:bg-red-900/60 px-4 py-2 rounded-lg transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'preview' ? (
              <PreviewFrame code={generatedCode} />
            ) : (
              <CodeBlock code={generatedCode} />
            )}
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f172a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}



