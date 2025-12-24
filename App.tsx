
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Play, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Copy,
  Maximize2,
  X,
  Layers,
  Settings2,
  Box,
  Monitor
} from 'lucide-react';
import { GeneratedImage, GenerationStatus, AspectRatio } from './types';
import { GeminiImageService } from './services/geminiService';
import { parsePrompts } from './components/PromptParser';

const App: React.FC = () => {
  const [rawPrompts, setRawPrompts] = useState<string>('1: Cybernetic dragon forged in lava\n2: Minimalist obsidian tower reaching the clouds\n3: Abstract digital glitch portrait of a cyborg');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isKeySelected, setIsKeySelected] = useState<boolean>(false);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>("1:1");
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (typeof window !== 'undefined' && (window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setIsKeySelected(hasKey);
      } else {
        setIsKeySelected(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setIsKeySelected(true);
    }
  };

  const handleGenerate = async () => {
    const parsed = parsePrompts(rawPrompts);
    if (parsed.length === 0) return;

    setStatus(GenerationStatus.GENERATING);
    setProgress({ current: 0, total: parsed.length });

    const newBatch: GeneratedImage[] = parsed.map((p) => ({
      id: Math.random().toString(36).substring(7),
      prompt: p,
      url: '',
      status: 'pending',
      timestamp: Date.now(),
      aspectRatio: selectedRatio
    }));

    setImages(prev => [...newBatch, ...prev]);

    const service = GeminiImageService.getInstance();

    for (let i = 0; i < newBatch.length; i++) {
      const target = newBatch[i];
      setImages(prev => prev.map(img => img.id === target.id ? { ...img, status: 'processing' } : img));

      try {
        const url = await service.generateImage(target.prompt, selectedRatio);
        setImages(prev => prev.map(img => img.id === target.id ? { ...img, status: 'completed', url } : img));
      } catch (error: any) {
        if (error.message === 'API_KEY_INVALID') {
          setIsKeySelected(false);
          setStatus(GenerationStatus.IDLE);
          break;
        }
        setImages(prev => prev.map(img => img.id === target.id ? { ...img, status: 'error', error: error.message } : img));
      }
      setProgress(prev => ({ ...prev, current: i + 1 }));
    }
    setStatus(GenerationStatus.COMPLETED);
  };

  const downloadImage = (img: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = img.url;
    link.download = `v_bulk_${img.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isKeySelected) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center p-6">
        <div className="bg-[#18181b] p-10 rounded-3xl border border-white/5 shadow-2xl max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Settings2 className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Vault Locked</h1>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
            Attach your industrial API key to unlock the Visionary Bulk generation engine.
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-500/10"
          >
            Authenticate Key
          </button>
        </div>
      </div>
    );
  }

  const ratios: { label: string; value: AspectRatio }[] = [
    { label: 'Square', value: '1:1' },
    { label: 'Standard', value: '4:3' },
    { label: 'Cinematic', value: '16:9' },
    { label: 'Portrait', value: '9:16' },
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-xl border-b border-white/5 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white text-sm tracking-tight">VISIONARY<span className="text-blue-500 opacity-50 ml-1">BULK</span></span>
        </div>

        <div className="flex items-center gap-4">
          {status === GenerationStatus.GENERATING && (
            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
              <Loader2 className="w-3 h-3 text-blue-400 animate-spin" />
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{progress.current}/{progress.total}</span>
            </div>
          )}
          <button onClick={() => setImages([])} className="p-2 text-zinc-600 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Compact Sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#121214] rounded-2xl p-5 border border-white/5 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                <Box className="w-3 h-3 text-blue-500" /> Queue Manager
              </h2>
            </div>

            <textarea
              className="w-full h-72 bg-[#18181b] border border-white/5 rounded-xl p-4 text-sm focus:ring-1 focus:ring-blue-500/50 outline-none transition-all custom-scrollbar font-medium text-zinc-100 placeholder:text-zinc-700 leading-relaxed"
              placeholder="1: Prompt here..."
              value={rawPrompts}
              onChange={(e) => setRawPrompts(e.target.value)}
            />

            <div className="mt-5 space-y-4">
              <div>
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-2">Aspect Format</span>
                <div className="grid grid-cols-2 gap-2">
                  {ratios.map(r => (
                    <button
                      key={r.value}
                      onClick={() => setSelectedRatio(r.value)}
                      className={`py-2 px-3 rounded-lg text-[10px] font-bold border transition-all ${
                        selectedRatio === r.value 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/10' 
                        : 'bg-[#18181b] border-white/5 text-zinc-500 hover:border-white/10'
                      }`}
                    >
                      {r.label} ({r.value})
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={status === GenerationStatus.GENERATING || !rawPrompts.trim()}
                className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-20 disabled:grayscale"
              >
                {status === GenerationStatus.GENERATING ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                Initialize Batch
              </button>
            </div>
          </div>
        </aside>

        {/* Dense Gallery Feed */}
        <section className="lg:col-span-8">
          <div className="flex items-center gap-2 mb-6">
            <Monitor className="w-4 h-4 text-zinc-600" />
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-widest">Neural Stream</h2>
            <div className="h-[1px] flex-grow bg-white/5 ml-2"></div>
          </div>

          {images.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-[2rem] bg-[#121214]/30">
              <ImageIcon className="w-12 h-12 text-zinc-800 mb-4" />
              <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">Awaiting prompt sequence</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {images.map((img) => (
                <article key={img.id} className="group bg-[#121214] rounded-2xl border border-white/5 overflow-hidden flex flex-col transition-all hover:border-white/10">
                  <div className={`relative bg-[#09090b] overflow-hidden cursor-zoom-in aspect-square`}>
                    {img.status === 'processing' && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#09090b]/80 backdrop-blur-md">
                        <div className="w-10 h-1 bg-white/5 rounded-full overflow-hidden relative">
                           <div className="absolute inset-0 bg-blue-500 w-1/3 animate-shimmer"></div>
                        </div>
                        <span className="mt-4 text-[9px] font-black text-blue-500 uppercase tracking-widest">Rendering...</span>
                      </div>
                    )}
                    
                    {img.status === 'error' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-red-500">
                        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-[9px] font-black uppercase tracking-widest">System Breach</span>
                      </div>
                    )}

                    {img.url && (
                      <>
                        <img 
                          src={img.url} 
                          alt={img.prompt} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          onClick={() => setPreviewImage(img)}
                        />
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); downloadImage(img); }}
                            className="p-2.5 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-zinc-800 text-white shadow-2xl"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setPreviewImage(img)}
                            className="p-2.5 bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl hover:bg-zinc-800 text-white shadow-2xl"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[8px] font-black text-white/50 border border-white/5 uppercase tracking-tighter">
                          {img.aspectRatio}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-grow">
                    <p className="text-xs font-medium text-zinc-400 leading-relaxed line-clamp-2 min-h-[2.5rem] mb-3">
                      {img.prompt}
                    </p>
                    <div className="mt-auto flex items-center justify-between opacity-40 group-hover:opacity-100 transition-opacity border-t border-white/5 pt-3">
                      <span className="text-[9px] font-bold uppercase tabular-nums tracking-widest">#{img.id.slice(0, 4)}</span>
                      <div className="flex gap-2">
                        <button onClick={() => navigator.clipboard.writeText(img.prompt)} className="hover:text-blue-500">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {img.status === 'completed' && <CheckCircle className="w-3.5 h-3.5 text-green-500" />}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Full Screen Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 md:p-10 animate-in fade-in duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <button className="absolute top-6 right-6 p-4 text-white/40 hover:text-white transition-colors">
            <X className="w-8 h-8" />
          </button>
          
          <div className="relative max-w-6xl w-full max-h-full flex flex-col items-center justify-center gap-6" onClick={e => e.stopPropagation()}>
            <div className="relative group bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src={previewImage.url} 
                className="max-h-[75vh] object-contain shadow-2xl"
                alt="Preview"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex items-end">
                <p className="text-sm font-medium text-white/90 leading-relaxed max-w-2xl">{previewImage.prompt}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => downloadImage(previewImage)}
                className="bg-white text-zinc-950 px-8 py-3.5 rounded-2xl font-bold flex items-center gap-3 active:scale-95 transition-all text-sm uppercase tracking-widest shadow-xl shadow-white/10"
              >
                <Download className="w-5 h-5" /> Save Image
              </button>
              <button 
                onClick={() => setPreviewImage(null)}
                className="bg-zinc-800 text-white px-8 py-3.5 rounded-2xl font-bold active:scale-95 transition-all text-sm uppercase tracking-widest border border-white/5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-20 py-10 text-center opacity-20 hover:opacity-100 transition-opacity">
        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Proprietary Generation Pipeline v2.5</span>
      </footer>
    </div>
  );
};

export default App;
