/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, ChangeEvent, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Upload, 
  Image as ImageIcon, 
  Settings, 
  BrainCircuit, 
  Sparkles, 
  LayoutGrid,
  History,
  Info,
  ChevronRight,
  Download,
  Trash2,
  Maximize2
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";

// Initialization of Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Mode = 'generate' | 'uploads';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

interface UploadedFile {
  id: string;
  url: string;
  name: string;
  type: string;
  timestamp: number;
}

export default function App() {
  const [mode, setMode] = useState<Mode>('generate');
  const [generations, setGenerations] = useState<GeneratedImage[]>([]);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1"
          }
        }
      });

      const candidates = response.candidates;
      if (candidates && candidates.length > 0 && candidates[0].content.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData) {
            const base64Data = part.inlineData.data;
            const newImage: GeneratedImage = {
              id: Math.random().toString(36).substr(2, 9),
              url: `data:image/png;base64,${base64Data}`,
              prompt: prompt,
              timestamp: Date.now()
            };
            setGenerations(prev => [newImage, ...prev]);
          }
        }
      }
      setPrompt("");
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefinePrompt = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Refine this image generation prompt to be more descriptive and artistic. 
        Only return the refined prompt text without any explanations or quotes.
        Prompt: ${prompt}`,
      });
      if (response.text) {
        setPrompt(response.text.trim());
      }
    } catch (error) {
      console.error("Refinement failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newUpload: UploadedFile = {
          id: Math.random().toString(36).substr(2, 9),
          url: event.target?.result as string,
          name: file.name,
          type: file.type,
          timestamp: Date.now()
        };
        setUploads(prev => [newUpload, ...prev]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="flex flex-col h-screen bg-bg text-text-main font-sans selection:bg-accent/30 overflow-hidden">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-8 border-b border-border bg-bg/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-2 font-extrabold text-xl tracking-tighter">
          <span className="text-accent">Visionary</span>AI
        </div>
        <nav className="flex gap-8">
          <button 
            onClick={() => setMode('generate')}
            className={`text-sm font-medium transition-colors ${mode === 'generate' ? 'text-text-main' : 'text-text-dim hover:text-text-main'}`}
          >
            Generate
          </button>
          <button 
            onClick={() => setMode('uploads')}
            className={`text-sm font-medium transition-colors ${mode === 'uploads' ? 'text-text-main' : 'text-text-dim hover:text-text-main'}`}
          >
            Vault
          </button>
        </nav>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-purple-500 border border-white/10" />
      </header>

      {/* Main Container */}
      <main className="flex-1 grid grid-cols-[360px_1fr] overflow-hidden">
        {/* Sidebar */}
        <aside className="bg-bg border-r border-border p-6 flex flex-col gap-8 overflow-y-auto">
          {mode === 'generate' ? (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase tracking-widest font-bold text-text-dim">Descriptive Prompt</label>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="An astronaut riding a neon horse on Mars, cinematic style, ultra detailed..."
                  className="bg-card-bg border border-border rounded-lg p-3 text-sm h-32 resize-none focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all placeholder:text-text-dim/50"
                />
                <button 
                  onClick={handleRefinePrompt}
                  disabled={isGenerating || !prompt.trim()}
                  className="flex items-center justify-center gap-2 text-[10px] uppercase font-bold text-accent hover:text-accent-hover transition-colors mt-1"
                >
                  <BrainCircuit className="w-3 h-3" />
                  Refine with AI
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[10px] uppercase tracking-widest font-bold text-text-dim">AI Model</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="option-pill active">Gemini 2.5</div>
                  <div className="option-pill opacity-50 cursor-not-allowed">Flux.1 Dev</div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-[10px] uppercase tracking-widest font-bold text-text-dim">Aspect Ratio</label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="option-pill active">1:1 Square</div>
                  <div className="option-pill">16:9 Cinema</div>
                  <div className="option-pill">4:5 Portrait</div>
                  <div className="option-pill">3:2 Classic</div>
                </div>
              </div>

              <div className="mt-auto pt-6 flex flex-col gap-4">
                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-xs text-text-dim">
                    <span>Inference Steps</span>
                    <span className="text-text-main">30</span>
                  </div>
                  <div className="flex justify-between text-xs text-text-dim">
                    <span>Guidance Scale</span>
                    <span className="text-text-main">7.5</span>
                  </div>
                </div>
                <button 
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Image
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                <h3 className="font-bold text-lg tracking-tight">Vault Controls</h3>
                <label className="cursor-pointer bg-card-bg border border-border p-6 rounded-xl flex flex-col items-center justify-center gap-2 text-center hover:bg-white/5 transition-all group">
                  <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">Upload new files</span>
                  <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
              <div className="mt-auto border-t border-border pt-4">
                <p className="text-[10px] text-text-dim leading-relaxed">
                  Your assets are stored locally in the session. Upload images to use them for AI editing or organization.
                </p>
              </div>
            </>
          )}
        </aside>

        {/* Content Area */}
        <section className="bg-[#0f1218] flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-12 flex flex-col items-center justify-center gap-12">
            <AnimatePresence mode="wait">
              {mode === 'generate' ? (
                <motion.div 
                  key="gen-view"
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full max-w-2xl flex flex-col items-center gap-8"
                >
                  <div className="w-[520px] h-[520px] bg-card-bg rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center relative overflow-hidden">
                    {generations.length > 0 ? (
                      <img 
                        src={generations[0].url} 
                        alt="Latest Generation" 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-text-dim flex flex-col items-center gap-4">
                        <div className="text-5xl opacity-30">✦</div>
                        <p className="text-sm">Your creation will appear here</p>
                      </div>
                    )}
                    
                    {isGenerating && (
                      <div className="absolute inset-0 bg-bg/80 flex items-center justify-center backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4 text-accent">
                          <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                          <span className="text-xs font-bold uppercase tracking-widest animate-pulse">Visionizing...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* History Strip */}
                  <div className="flex gap-3 justify-center w-full">
                    {[0, 1, 2, 3, 4].map(idx => {
                      const gen = generations[idx];
                      return (
                        <div 
                          key={idx} 
                          className={`w-20 h-20 rounded-lg bg-card-bg border overflow-hidden transition-all ${gen ? 'border-border' : 'border-border/30 opacity-30'}`}
                        >
                          {gen && <img src={gen.url} className="w-full h-full object-cover" alt="History item" />}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="vault-view"
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="w-full h-full p-8"
                >
                  {uploads.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-text-dim gap-4 opacity-50">
                      <LayoutGrid className="w-16 h-16" />
                      <p>No assets in your vault yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {uploads.map(file => (
                        <div key={file.id} className="group relative aspect-[4/5] bg-card-bg rounded-lg border border-border overflow-hidden">
                          {file.type.startsWith('image/') ? (
                            <img src={file.url} className="w-full h-full object-cover" alt={file.name} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] uppercase font-bold opacity-30">
                              {file.type.split('/')[1] || 'FILE'}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-bg/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             <button 
                               onClick={() => downloadImage(file.url, file.name)}
                               className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md"
                             >
                               <Download className="w-4 h-4" />
                             </button>
                             <button 
                               onClick={() => setUploads(prev => prev.filter(f => f.id !== file.id))}
                               className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-full backdrop-blur-md text-red-400"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Status Bar */}
          <footer className="h-8 border-t border-border bg-bg flex items-center justify-between px-6 text-[11px] text-text-dim">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Visionary Pipeline Online · Latency: 142ms
            </div>
            <div>
              Credits: 120 / 500 · v2.4.0-sleek
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}


function NavItem({ active, onClick, icon, label, className = "" }: { active?: boolean, onClick?: () => void, icon: ReactNode, label: string, className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden ${active ? "bg-white/10 text-white" : "text-white/40 hover:text-white hover:bg-white/5"} ${className}`}
    >
      <div className="relative z-10">{icon}</div>
      <span className="relative z-10 hidden md:block font-medium text-sm">{label}</span>
      {active && (
        <motion.div 
          layoutId="active-pill" 
          className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent border-l-2 border-orange-500" 
        />
      )}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

