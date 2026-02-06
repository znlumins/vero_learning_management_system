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
import Script from 'next/script';
import { toast } from "sonner";

// --- DEKLARASI GLOBAL MEDIAPIPE ---
declare global {
  interface Window {
    Hands: any;
    drawConnectors: any;
    drawLandmarks: any;
    myHandsInstance: any; 
  }
}

const HAND_CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],
  [10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],
  [18,19],[19,20],[0,17]
];

export default function PresentasiPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // --- STATE PRESENTASI ---
  const [isDetecting, setIsDetecting] = useState(false);
  const [isCameraVisible, setIsCameraVisible] = useState(true);
  const [presentationText, setPresentationText] = useState("Teks terjemahan gesture akan muncul di sini.");
  
  // --- STATE SLIDE ---
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slides, setSlides] = useState<any[]>([{ type: 'text', content: 'Silahkan klik tombol Upload di pojok kanan atas' }]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE KUSTOMISASI ---
  const [textSize, setTextSize] = useState(40); 
  const [cameraScale, setCameraScale] = useState(1); 

  // --- STATE AI & MODEL (SIBI/BISINDO) ---
  const [modelType, setModelType] = useState<"bisindo" | "sibi">("bisindo");
  const modelTypeRef = useRef(modelType);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const isMediaPipeLoaded = useRef(false);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const gestureEnabledRef = useRef(false);
  const requestRef = useRef<number>();
  const lastPredictionTime = useRef<number>(0);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/login"); else setUser(user);
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setMyStream(stream);
      } catch (err) {
        toast.error("Gagal akses kamera.");
      }
    };
    init();

    return () => {
      gestureEnabledRef.current = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (window.myHandsInstance) window.myHandsInstance.close();
    };
  }, [router]);

  // Sync modelType state ke Ref agar terbaca di dalam loop AI
  useEffect(() => {
    modelTypeRef.current = modelType;
  }, [modelType]);

  useEffect(() => {
      const checkLib = setInterval(() => {
          if (window.Hands && window.drawConnectors) {
              isMediaPipeLoaded.current = true;
              clearInterval(checkLib);
          }
      }, 1000);
      return () => clearInterval(checkLib);
  }, []);

  // --- LOGIKA AI GESTURE ---
  const onGestureResults = async (results: any) => {
    if (!drawCanvasRef.current) return;
    const canvasCtx = drawCanvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);
    
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const landmarks of results.multiHandLandmarks) {
          window.drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: "#4f46e5", lineWidth: 4 });
          window.drawLandmarks(canvasCtx, landmarks, { color: "#ffffff", lineWidth: 1, radius: 3 });
        }

        const now = Date.now();
        if (now - lastPredictionTime.current > 600) {
            lastPredictionTime.current = now;
            try {
                const response = await fetch("http://127.0.0.1:5000/api/predict", {
                  method: "POST", 
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    landmarks_list: results.multiHandLandmarks,
                    handedness_list: results.multiHandedness,
                    model_type: modelTypeRef.current // MENGGUNAKAN MODEL YANG DIPILIH
                  }),
                });
                const data = await response.json();
                if (data.label && data.label !== "--") {
                    setPresentationText(data.label.toUpperCase());
                }
            } catch (err) {}
        }
    } else {
        // Jika tidak ada tangan, bisa dikosongkan jika mau
        // setPresentationText("");
    }
    canvasCtx.restore();
  };

  const toggleDetecting = async () => {
    if (!isMediaPipeLoaded.current) return toast.error("Library AI sedang dimuat...");
    
    if (isDetecting) {
        gestureEnabledRef.current = false;
        setIsDetecting(false);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    } else {
        if (!myStream) return toast.error("Kamera tidak tersedia");
        setIsDetecting(true);
        gestureEnabledRef.current = true;

        if (!window.myHandsInstance) {
            window.myHandsInstance = new window.Hands({ locateFile: (f: any) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
            window.myHandsInstance.setOptions({ maxNumHands: modelType === 'bisindo' ? 2 : 1, modelComplexity: 1, minDetectionConfidence: 0.5 });
            window.myHandsInstance.onResults(onGestureResults);
        }

        const videoElement = document.createElement('video');
        videoElement.srcObject = myStream;
        await videoElement.play();

        const detectFrame = async () => {
            if (!gestureEnabledRef.current) return;
            if (window.myHandsInstance && videoElement.readyState >= 2) {
                await window.myHandsInstance.send({ image: videoElement });
            }
            requestRef.current = requestAnimationFrame(detectFrame);
        };
        detectFrame();
    }
  };

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
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" strategy="afterInteractive" />

      <Sidebar role={user.user_metadata.role} userName={user.user_metadata.full_name} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-50">
        
        {/* HEADER KONTROL */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 shadow-sm shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex flex-col border-l-4 border-indigo-600 pl-3">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1 italic">Studio Presentasi</span>
                <span className="text-xs font-bold text-slate-400">{format(new Date(), "dd MMMM yyyy", { locale: id })}</span>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* PILIHAN MODEL (SIBI / BISINDO) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button 
                  onClick={() => { setModelType("bisindo"); toast.success("Mode: BISINDO"); }}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${modelType === 'bisindo' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                >
                  BISINDO
                </button>
                <button 
                  onClick={() => { setModelType("sibi"); toast.success("Mode: SIBI"); }}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${modelType === 'sibi' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                >
                  SIBI
                </button>
            </div>

            <div className="h-6 w-px bg-slate-200" />

            {/* Slider Font */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Type size={14} className="text-indigo-600" />
              <input type="range" min="20" max="100" value={textSize} onChange={(e) => setTextSize(parseInt(e.target.value))} className="w-16 accent-indigo-600 cursor-pointer" />
            </div>

            {/* Slider Camera */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <Video size={14} className="text-indigo-600" />
              <input type="range" min="0.5" max="2" step="0.1" value={cameraScale} onChange={(e) => setCameraScale(parseFloat(e.target.value))} className="w-16 accent-indigo-600 cursor-pointer" />
            </div>

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all" title="Upload Slide"><Upload size={20} /></button>
              <button onClick={() => setIsCameraVisible(!isCameraVisible)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                {isCameraVisible ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
              <button onClick={toggleDetecting} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isDetecting ? 'bg-red-500 text-white shadow-lg' : 'bg-slate-900 text-white shadow-lg hover:bg-indigo-600'}`}>
                {isDetecting ? "Stop AI" : "Mulai AI"}
              </button>
            </div>
          </div>
        </header>

        {/* --- AREA SLIDE --- */}
        <div className="flex-1 relative flex items-center justify-center p-10 bg-slate-50">
          <div className="relative w-full h-full bg-white rounded-3xl border-2 border-slate-200 shadow-2xl overflow-hidden flex items-center justify-center">
            {currentSlide?.type === 'image' ? (
                <Image src={currentSlide.src} alt="Slide" fill className="object-contain p-4" priority />
            ) : (
              <div className="flex flex-col items-center gap-4 text-slate-300">
                <MonitorPlay size={64} strokeWidth={1.5} />
                <p className="font-bold uppercase tracking-widest text-sm text-center px-10">{currentSlide?.content}</p>
              </div>
            )}

            {/* --- FLOATING CAMERA --- */}
            <AnimatePresence>
              {isCameraVisible && (
                <motion.div 
                  drag dragMomentum={false}
                  style={{ scale: cameraScale }}
                  className="absolute top-10 right-10 z-40 w-64 aspect-video bg-black rounded-2xl border-4 border-indigo-600 shadow-2xl overflow-hidden cursor-move origin-top-right group"
                >
                  {myStream && <video ref={(el) => { if(el) el.srcObject = myStream; }} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />}
                  {isDetecting && <canvas ref={drawCanvasRef} className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-10" width={640} height={480} />}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Move size={10} /></div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* --- FLOATING TRANSLATION TEXT --- */}
            <motion.div 
              drag dragMomentum={false}
              className="absolute bottom-10 z-40 bg-white border-4 border-slate-900 p-8 rounded-[40px] shadow-2xl cursor-move min-w-[400px] max-w-[85%] group"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">Geser Teks</div>
              <p style={{ fontSize: `${textSize}px` }} className="font-black text-slate-900 text-center leading-tight tracking-tighter uppercase italic">{presentationText}</p>
            </motion.div>
          </div>

          {/* --- NAVIGASI SLIDE --- */}
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