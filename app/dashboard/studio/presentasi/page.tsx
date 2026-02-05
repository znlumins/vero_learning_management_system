"use client";
import { useEffect, useState, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion"; 
import { 
  Hand, Play, Pause, ChevronLeft, ChevronRight, 
  Upload, Type, Video, VideoOff, Move, MonitorPlay
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function PresentasiPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // --- STATE PRESENTASI ---
  const [isDetecting, setIsDetecting] = useState(false);
  const [isCameraVisible, setIsCameraVisible] = useState(true);
  const [presentationText, setPresentationText] = useState("Teks terjemahan gesture akan muncul di sini secara real-time.");
  
  // --- STATE SLIDE ---
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slides, setSlides] = useState<any[]>([{ type: 'text', content: 'Silahkan klik tombol Upload di pojok kanan atas' }]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE KUSTOMISASI (Besar/Kecil) ---
  const [textSize, setTextSize] = useState(30); 
  const [cameraScale, setCameraScale] = useState(1); 

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/login"); else setUser(user);
    };
    getUser();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newSlides = Array.from(files).map((file) => ({
        type: 'image',
        src: URL.createObjectURL(file),
        alt: file.name
      }));
      setSlides(newSlides);
      setCurrentSlideIndex(0);
    }
  };

  if (!user) return <div className="min-h-screen bg-white" />;
  const currentSlide = slides[currentSlideIndex];

  return (
    <div className="flex min-h-screen bg-white text-slate-900 antialiased overflow-hidden select-none font-sans">
      {/* SIDEBAR KIRI (TETAP PUTIH) */}
      <Sidebar role={user.user_metadata.role} userName={user.user_metadata.full_name} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50">
        
        {/* HEADER KONTROL (TEMA PUTIH BERSIH) */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-0 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex flex-col border-l-4 border-indigo-600 pl-3">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1 italic">Studio Presentasi</span>
                <span className="text-xs font-bold text-slate-400">{format(new Date(), "dd MMMM yyyy", { locale: id })}</span>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Control Font Size */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Type size={14} className="text-indigo-600" />
              <input type="range" min="20" max="80" value={textSize} onChange={(e) => setTextSize(parseInt(e.target.value))} className="w-16 accent-indigo-600 cursor-pointer" />
              <span className="text-[9px] font-bold text-slate-400 w-4">{textSize}</span>
            </div>

            {/* Control Camera Scale */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Video size={14} className="text-indigo-600" />
              <input type="range" min="0.5" max="1.5" step="0.1" value={cameraScale} onChange={(e) => setCameraScale(parseFloat(e.target.value))} className="w-16 accent-indigo-600 cursor-pointer" />
            </div>

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Upload Slide"><Upload size={20} /></button>
              <button onClick={() => setIsCameraVisible(!isCameraVisible)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                {isCameraVisible ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button onClick={() => setIsDetecting(!isDetecting)} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isDetecting ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-slate-900 text-white shadow-lg shadow-slate-200 hover:bg-indigo-600'}`}>
                {isDetecting ? "Stop" : "Mulai"}
              </button>
            </div>
          </div>
        </header>

        {/* --- AREA SLIDE (STAGE) --- */}
        <div className="flex-1 relative flex items-center justify-center p-10 bg-slate-50">
          
          {/* FRAME SLIDE (Agar rapi seperti di bingkai) */}
          <div className="relative w-full h-full bg-white rounded-3xl border-2 border-slate-200 shadow-2xl overflow-hidden flex items-center justify-center">
            {currentSlide?.type === 'image' ? (
                <Image src={currentSlide.src} alt="Slide" fill className="object-contain p-4" priority />
            ) : (
              <div className="flex flex-col items-center gap-4 text-slate-300">
                <MonitorPlay size={64} strokeWidth={1.5} />
                <p className="font-bold uppercase tracking-widest text-sm">Siap untuk presentasi</p>
              </div>
            )}

            {/* --- FLOATING ELEMENT 1: KAMERA (DRAGGABLE) --- */}
            <AnimatePresence>
              {isCameraVisible && (
                <motion.div 
                  drag
                  dragMomentum={false}
                  style={{ scale: cameraScale }}
                  className="absolute top-10 right-10 z-40 w-64 aspect-video bg-white rounded-2xl border-4 border-indigo-600 shadow-2xl overflow-hidden cursor-move origin-top-right group"
                >
                  <iframe
                    src={isDetecting ? "https://vero.daffaahmadalattas.web.id/" : "about:blank"}
                    className="w-full h-full border-none pointer-events-none"
                    allow="camera; microphone"
                  ></iframe>
                  {!isDetecting && (
                    <div className="absolute inset-0 bg-slate-100 flex items-center justify-center"><Hand className="text-slate-300" size={32} /></div>
                  )}
                  {/* Indikator Drag */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Move size={10} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- FLOATING ELEMENT 2: TEKS TERJEMAHAN (DRAGGABLE) --- */}
            <motion.div 
              drag
              dragMomentum={false}
              className="absolute bottom-10 z-40 bg-white border-4 border-slate-900 p-6 rounded-[32px] shadow-2xl cursor-move min-w-[320px] max-w-[80%] group"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Geser Teks</div>
              <p 
                style={{ fontSize: `${textSize}px` }} 
                className="font-black text-slate-900 text-center leading-tight tracking-tight uppercase italic"
              >
                {presentationText}
              </p>
            </motion.div>
          </div>

          {/* --- NAVIGASI SLIDE (FLOATING BOTTOM) --- */}
          {slides.length > 1 && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-50 bg-white border-2 border-slate-200 px-6 py-2 rounded-2xl flex items-center gap-10 text-slate-900 shadow-xl">
              <button onClick={() => setCurrentSlideIndex(prev => (prev - 1 + slides.length) % slides.length)} className="hover:text-indigo-600 transition-all transform hover:scale-125"><ChevronLeft size={28} strokeWidth={3}/></button>
              <span className="font-mono font-black text-xs tracking-widest bg-slate-100 px-3 py-1 rounded-lg">{currentSlideIndex + 1} / {slides.length}</span>
              <button onClick={() => setCurrentSlideIndex(prev => (prev + 1) % slides.length)} className="hover:text-indigo-600 transition-all transform hover:scale-125"><ChevronRight size={28} strokeWidth={3}/></button>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}