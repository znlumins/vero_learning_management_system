"use client";
import { useEffect, useState, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import LoadingScreen from "@/components/LoadingScreen";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ChevronRight, Camera, CameraOff, RefreshCw, Layers, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Script from "next/script";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// --- IMPORT LOGIKA CLIENT-SIDE ---
import { 
  calculateDistances, 
  prepareBisindoFeatures, 
  getBestPrediction 
} from "../../../utils/handLogic";

// @ts-ignore
import { score as predictBisindoModel } from "../../../utils/modelbisindo";
// @ts-ignore
import { score as predictSibiModel } from "../../../utils/modelsibi"; 

declare global {
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
  }
}

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15],
  [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]
];

export default function TranslateGesturePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const router = useRouter();

  const [isDetecting, setIsDetecting] = useState(false);
  const [prediction, setPrediction] = useState("STANDBY");
  const [modelType, setModelType] = useState<"bisindo" | "sibi">("bisindo");
  
  const modelTypeRef = useRef(modelType);
  const lastPredictionTime = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<any>(null);
  const handsRef = useRef<any>(null);

  useEffect(() => {
    modelTypeRef.current = modelType;
    setPrediction("STANDBY");
  }, [modelType]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      setLoading(false);
    };
    init();
    return () => stopCamera();
  }, [router]);

  useEffect(() => {
    const checkLib = setInterval(() => {
      if (window.Hands && window.Camera && window.drawConnectors) {
        setIsLibraryLoaded(true);
        clearInterval(checkLib);
      }
    }, 1000);
    return () => clearInterval(checkLib);
  }, []);

  const onResults = (results: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    const canvasCtx = canvasRef.current.getContext("2d");
    if (!canvasCtx) return;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

    const landmarks = results.multiHandLandmarks;

    if (landmarks && landmarks.length > 0) {
      for (const handLandmarks of landmarks) {
        window.drawConnectors(canvasCtx, handLandmarks, HAND_CONNECTIONS, { color: "#4f46e5", lineWidth: 5 });
        window.drawLandmarks(canvasCtx, handLandmarks, { color: "#ffffff", lineWidth: 2, radius: 4 });
      }

      const now = Date.now();
      if (now - lastPredictionTime.current > 150) {
        lastPredictionTime.current = now;

        try {
          let label = "";
          const type = modelTypeRef.current;

          if (type === "sibi") {
            const features = calculateDistances(landmarks[0]);
            // FIX: Tambahkan : any di sini
            const scores: any = predictSibiModel(features);
            label = getBestPrediction(scores, "sibi");
          } else {
            const features = prepareBisindoFeatures(landmarks);
            // FIX: Tambahkan : any di sini
            const scores: any = predictBisindoModel(features);
            label = getBestPrediction(scores, "bisindo");
          }

          if (label) setPrediction(label.toUpperCase());
        } catch (error) {
          console.error("Gagal Prediksi:", error);
        }
      }
    }
    canvasCtx.restore();
  };

  const startCamera = async () => {
    if (!isLibraryLoaded) return;
    setIsDetecting(true);
    toast.info(`AI ${modelType.toUpperCase()} Aktif`);

    const hands = new window.Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    if (videoRef.current) {
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (handsRef.current && videoRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 1280,
        height: 720,
      });
      cameraRef.current = camera;
      await camera.start();
    }
  };

  const stopCamera = () => {
    setIsDetecting(false);
    if (cameraRef.current) cameraRef.current.stop();
    if (handsRef.current) handsRef.current.close();
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setPrediction("STANDBY");
  };

  if (loading) return <LoadingScreen />;
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-white text-slate-900 antialiased overflow-hidden font-sans">
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" strategy="afterInteractive" />
      <Sidebar role={user.user_metadata.role} userName={user.user_metadata.full_name} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50">
        <header className="h-16 border-b border-slate-200 bg-white px-10 flex items-center justify-between shrink-0 z-10 shadow-sm">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none mb-1 italic">
              Studio <ChevronRight size={10} className="text-slate-300" /> Gesture Recognition
            </div>
            <p className="text-xs font-bold text-slate-400">{format(new Date(), "eeee, dd MMMM yyyy", { locale: id })}</p>
          </div>
          <button 
            disabled={!isLibraryLoaded}
            onClick={isDetecting ? stopCamera : startCamera}
            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md ${
              !isLibraryLoaded ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
              isDetecting ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-slate-900 text-white hover:bg-indigo-600'
            }`}
          >
            {!isLibraryLoaded ? <><Loader2 size={14} className="animate-spin inline mr-2" /> Loading AI...</> : 
             isDetecting ? <><CameraOff size={16} className="inline mr-2" /> Matikan AI</> : <><Camera size={16} className="inline mr-2" /> Aktifkan AI</>}
          </button>
        </header>
        <div className="flex-1 flex flex-col lg:flex-row relative">
          <div className="flex-1 flex items-center justify-center p-8 relative">
            <div className="relative w-full max-w-5xl aspect-video bg-white rounded-4xl border-4 border-white shadow-2xl overflow-hidden ring-1 ring-slate-200">
              <video ref={videoRef} className="hidden" playsInline muted />
              <canvas ref={canvasRef} className="w-full h-full object-cover transform scale-x-[-1] bg-slate-200" width={1280} height={720} />
              {!isDetecting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/60 backdrop-blur-md">
                   <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl mb-4 text-indigo-600 border border-slate-100"><RefreshCw size={32} /></div>
                   <p className="font-black text-slate-500 uppercase tracking-[0.2em] text-xs">AI Standby Mode</p>
                </div>
              )}
            </div>
          </div>
          <div className="w-full lg:w-100 border-l border-slate-200 flex flex-col bg-white shrink-0 shadow-2xl z-10">
            <div className="p-8 border-b border-slate-50">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 italic text-center">Standard Selection</p>
              <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                <button onClick={() => setModelType("bisindo")} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${modelType === 'bisindo' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>BISINDO</button>
                <button onClick={() => setModelType("sibi")} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${modelType === 'sibi' ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>SIBI</button>
              </div>
            </div>
            <div className="p-10 border-b border-slate-50 text-center bg-slate-50/30">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 italic">Live Prediction</p>
               <div className="bg-slate-900 p-10 rounded-4xl shadow-2xl shadow-indigo-200 border-b-8 border-indigo-600 transition-all">
                  <h2 className="text-6xl font-black text-white tracking-tighter italic wrap-break-word uppercase leading-none min-h-[1.2em]">{prediction}</h2>
               </div>
            </div>
            <div className="flex-1 p-10 flex flex-col justify-center items-center text-center space-y-8">
              <div className="p-8 bg-indigo-50 rounded-4xl border border-indigo-100 relative">
                <Layers className="absolute -top-3 -left-3 text-indigo-600 bg-white rounded-full p-1 shadow-sm" size={28} />
                <p className="text-xs font-bold text-indigo-800 leading-relaxed uppercase tracking-tight italic">Gunakan pencahayaan cukup untuk hasil terbaik pada mode {modelType.toUpperCase()}.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}