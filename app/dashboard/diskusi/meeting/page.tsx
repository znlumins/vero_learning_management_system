"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Mic, Camera, ChevronLeft, Hand, MessageSquareText, Volume2, VolumeX, 
  Pencil, Eraser, Trash2, MonitorPlay, ChevronRight
} from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer";
import { toast } from "sonner";
import Script from 'next/script';
import LoadingScreen from "@/components/LoadingScreen";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";

// --- IMPORT LOGIKA CLIENT-SIDE ---
import { 
  calculateDistances, 
  prepareBisindoFeatures, 
  getBestPrediction 
} from "@/app/utils/handLogic";

// @ts-ignore
import { score as predictBisindoModel } from "@/app/utils/modelbisindo";
// @ts-ignore
import { score as predictSibiModel } from "@/app/utils/modelsibi"; 

declare global {
  interface Window {
    Hands: any;
    drawConnectors: any;
    drawLandmarks: any;
    myHandsInstance: any; 
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const SpeechRecognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
const HAND_CONNECTIONS: [number, number][] = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];

interface PeerData { stream: MediaStream; conn: any; subtitle: string; }

function MeetingContent() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomID = searchParams.get("roomID") || "GENERAL-MEETING";

  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<{ [key: string]: PeerData }>({});
  const peerInstance = useRef<any>(null);
  const [isJoining, setIsJoining] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);

  const [isGestureActive, setIsGestureActive] = useState(false);
  const [isSttActive, setIsSttActive] = useState(false);
  const [isTtsActive, setIsTtsActive] = useState(true);
  const [mySubtitle, setMySubtitle] = useState("");
  const [modelType, setModelType] = useState<"bisindo" | "sibi">("bisindo");
  
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isEraseMode, setIsEraseMode] = useState(false);
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const isIncomingDrawing = useRef(false);

  const [isPresenting, setIsPresenting] = useState(false);
  const [remotePresentation, setRemotePresentation] = useState<any>(null);
  const [mySlides, setMySlides] = useState<string[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const lastPredictionTime = useRef<number>(0); 
  const drawCanvasRef = useRef<HTMLCanvasElement>(null); 
  const gestureEnabledRef = useRef(false); 
  const modelTypeRef = useRef(modelType); 
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    modelTypeRef.current = modelType;
  }, [modelType]);

  const broadcastData = (data: any) => {
    Object.values(peers).forEach((p) => { if (p.conn && p.conn.open) p.conn.send(data); });
  };

  const handleIncomingData = (peerId: string, data: any) => {
    if (data.subtitle !== undefined) {
        setPeers(prev => ({ ...prev, [peerId]: { ...prev[peerId], subtitle: data.subtitle } }));
        if (data.subtitle && isTtsActive) handleSpeak(data.subtitle);
    }
    if (data.type === "whiteboard") {
        if (data.action === "draw") {
            isIncomingDrawing.current = true;
            canvasRef.current?.loadPaths(data.paths);
            if (!isWhiteboardOpen) setIsWhiteboardOpen(true);
            setTimeout(() => { isIncomingDrawing.current = false; }, 100);
        } else if (data.action === "clear") canvasRef.current?.clearCanvas();
    }
    if (data.type === "presentation") {
        if (data.action === "start") {
            setRemotePresentation({ peerId, image: data.image, index: data.index });
            setIsWhiteboardOpen(false);
        } else if (data.action === "stop") setRemotePresentation(null);
    }
  };

  const clearLocalAndRemoteCanvas = () => {
    if (canvasRef.current) {
        canvasRef.current.clearCanvas();
        broadcastData({ type: "whiteboard", action: "clear" });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const readers = Array.from(files).map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      });
      Promise.all(readers).then(images => {
        setMySlides(images);
        setCurrentSlideIndex(0);
        toast.success(`${images.length} Slide dimuat.`);
      });
    }
  };

  const togglePresentation = () => {
    if (isPresenting) {
        setIsPresenting(false);
        broadcastData({ type: "presentation", action: "stop" });
    } else {
        if (mySlides.length === 0) return fileInputRef.current?.click();
        setIsPresenting(true);
        setRemotePresentation(null);
        broadcastData({ type: "presentation", action: "start", image: mySlides[currentSlideIndex], index: currentSlideIndex });
    }
  };

  const changeSlide = (dir: number) => {
    const newIdx = (currentSlideIndex + dir + mySlides.length) % mySlides.length;
    setCurrentSlideIndex(newIdx);
    broadcastData({ type: "presentation", action: "start", image: mySlides[newIdx], index: newIdx });
  };

  const handleSpeak = (text: string) => {
    if (!isTtsActive || !text) return;
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = 'id-ID';
    window.speechSynthesis.speak(ut);
  };

  const updateMySubtitle = (text: string) => {
    setMySubtitle(text);
    broadcastData({ subtitle: text });
    setTimeout(() => { setMySubtitle(""); broadcastData({ subtitle: "" }); }, 3000);
  };

  const startMeeting = async (uid: string) => {
    try {
      const { default: Peer } = await import("peerjs"); 
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMyStream(stream);
      const peer = new Peer(undefined as any, { config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] } });
      peerInstance.current = peer;
      peer.on("open", () => setIsJoining(false));
      peer.on("call", (call) => {
        call.answer(stream);
        call.on("stream", (s) => setPeers(prev => ({ ...prev, [call.peer]: { stream: s, conn: prev[call.peer]?.conn || null, subtitle: '' } })));
        const conn = peer.connect(call.peer);
        conn.on("open", () => {
            conn.on("data", (d) => handleIncomingData(call.peer, d));
            setPeers(prev => ({ ...prev, [call.peer]: { ...prev[call.peer], conn } }));
        });
      });
      peer.on("connection", (conn) => conn.on("open", () => conn.on("data", (d) => handleIncomingData(conn.peer, d))));
    } catch (e) { router.push("/dashboard/diskusi"); }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push("/login");
      setUser(user);
      startMeeting(user.id);
    };
    init();
    if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true; rec.interimResults = true; rec.lang = 'id-ID';
        rec.onresult = (e: any) => {
            let t = ''; for (let i = e.resultIndex; i < e.results.length; ++i) t += e.results[i][0].transcript;
            if (t) updateMySubtitle(t);
        };
        recognitionRef.current = rec;
    }
  }, []);

  const onGestureResults = (results: any) => {
    if (!drawCanvasRef.current) return;
    const ctx = drawCanvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.save(); 
    ctx.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        for (const lm of results.multiHandLandmarks) {
            window.drawConnectors(ctx, lm, HAND_CONNECTIONS, { color: "#4f46e5", lineWidth: 5 });
            window.drawLandmarks(ctx, lm, { color: "#ffffff", lineWidth: 2, radius: 4 });
        }
        const now = Date.now();
        if (now - lastPredictionTime.current > 500) {
            lastPredictionTime.current = now;
            try {
                let label = "";
                const currentModel = modelTypeRef.current;
                const landmarks = results.multiHandLandmarks;
                if (currentModel === "sibi") {
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
                if (label && label !== "...") updateMySubtitle(label.toUpperCase());
            } catch (err) { console.error("AI Error:", err); }
        }
    }
    ctx.restore();
  };

  const toggleGesture = async () => {
    if (isGestureActive) { gestureEnabledRef.current = false; setIsGestureActive(false); }
    else {
        setIsGestureActive(true); gestureEnabledRef.current = true;
        if (!window.myHandsInstance) {
            window.myHandsInstance = new window.Hands({ locateFile: (f: any) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
            window.myHandsInstance.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });
            window.myHandsInstance.onResults(onGestureResults);
        }
        const vid = document.createElement('video'); vid.srcObject = myStream; vid.autoplay = true; vid.muted = true;
        await vid.play();
        const loop = async () => {
            if (!gestureEnabledRef.current) return;
            if (window.myHandsInstance && vid.readyState >= 2) await window.myHandsInstance.send({ image: vid });
            requestAnimationFrame(loop);
        };
        loop();
    }
  };

  const leaveMeeting = () => { 
      if (myStream) myStream.getTracks().forEach(t => t.stop());
      window.location.href = "/dashboard/diskusi"; 
  };

  if (isJoining || !user) return <LoadingScreen />;

  const activePresImage = isPresenting ? mySlides[currentSlideIndex] : remotePresentation?.image;

  return (
    <div className="flex flex-col h-screen bg-slate-950 font-sans text-white overflow-hidden">
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" strategy="afterInteractive" />
      <header className="h-14 px-6 bg-slate-900 border-b border-white/10 flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
          <button onClick={leaveMeeting} className="p-2 hover:bg-white/10 rounded-full"><ChevronLeft size={20} /></button>
          <h1 className="font-black text-xs uppercase italic tracking-tighter">Vero<span className="text-indigo-500">Meeting</span></h1>
        </div>
        <div className="flex items-center gap-3">
            <div className="flex bg-slate-800 p-1 rounded-xl border border-white/5">
                {['bisindo', 'sibi'].map((m) => (
                    <button key={m} onClick={() => setModelType(m as any)} className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${modelType === m ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>{m}</button>
                ))}
            </div>
            <button onClick={() => { setIsWhiteboardOpen(!isWhiteboardOpen); setIsPresenting(false); }} className={`p-2 rounded-xl border transition-all ${isWhiteboardOpen ? 'bg-white text-black' : 'border-white/10 text-white hover:bg-white/5'}`}><Pencil size={16} /></button>
            <button onClick={togglePresentation} className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all border ${isPresenting ? 'bg-green-500 border-green-500 text-white' : 'border-white/10 text-white hover:bg-white/5'}`}><MonitorPlay size={16} /> {isPresenting ? "Stop" : "Presentasi"}</button>
            <input type="file" ref={fileInputRef} hidden multiple onChange={handleFileUpload} accept="image/*" />
        </div>
      </header>
      <div className="flex-1 flex overflow-hidden p-4 gap-4 relative">
        <div className={`flex-1 transition-all duration-700 flex flex-col ${activePresImage || isWhiteboardOpen ? 'bg-white rounded-[40px] shadow-2xl overflow-hidden text-slate-900' : ''}`}>
           {activePresImage ? (
               <div className="relative flex-1 flex flex-col bg-slate-50">
                  <div className="flex-1 relative p-8">
                     <img src={activePresImage} className="w-full h-full object-contain shadow-xl" alt="Slide" />
                     {(mySubtitle || peers[remotePresentation?.peerId]?.subtitle) && (
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-3 rounded-3xl text-2xl font-black italic shadow-2xl border-4 border-indigo-500 z-50">{mySubtitle || peers[remotePresentation?.peerId]?.subtitle}</div>
                     )}
                  </div>
                  {isPresenting && (
                    <div className="h-16 border-t flex items-center justify-center gap-10 bg-white">
                        <button onClick={() => changeSlide(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-900"><ChevronLeft /></button>
                        <span className="text-xs font-black uppercase text-slate-900">{currentSlideIndex + 1} / {mySlides.length}</span>
                        <button onClick={() => changeSlide(1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-900"><ChevronRight /></button>
                    </div>
                  )}
               </div>
           ) : isWhiteboardOpen ? (
               <div className="flex-1 flex flex-col">
                  <div className="h-12 border-b px-6 flex items-center justify-between bg-slate-50">
                     <div className="flex gap-2">
                        <button onClick={() => setIsEraseMode(false)} className={`p-1.5 rounded ${!isEraseMode ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}><Pencil size={14}/></button>
                        <button onClick={() => setIsEraseMode(true)} className={`p-1.5 rounded ${isEraseMode ? 'bg-slate-900 text-white' : 'text-slate-400'}`}><Eraser size={14}/></button>
                     </div>
                     <button onClick={clearLocalAndRemoteCanvas} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                  </div>
                  <ReactSketchCanvas ref={canvasRef} strokeColor="#4f46e5" strokeWidth={4} onStroke={() => { if(!isIncomingDrawing.current) canvasRef.current?.exportPaths().then(p => broadcastData({ type: 'whiteboard', action: 'draw', paths: p })); }} />
               </div>
           ) : (
               <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-white/5">
                     {myStream && <VideoPlayer stream={myStream} isMuted={true} />}
                     {isGestureActive && <canvas ref={drawCanvasRef} className="absolute inset-0 w-full h-full object-cover scale-x-[-1] z-10" width={640} height={480} />}
                     {mySubtitle && <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded-xl text-lg font-bold z-20 border border-white/10">{mySubtitle}</div>}
                  </div>
                  {Object.entries(peers).map(([id, p]) => (
                    <div key={id} className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-white/5">
                        <VideoPlayer stream={p.stream} />
                        {p.subtitle && <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-indigo-600/90 px-4 py-2 rounded-xl text-lg font-bold">{p.subtitle}</div>}
                    </div>
                  ))}
               </div>
           )}
        </div>
      </div>
      <div className="h-20 bg-slate-950 border-t border-white/5 flex items-center justify-center gap-4 md:gap-8 shrink-0 z-50">
        <div className="flex gap-2">
            <button onClick={() => {if(myStream) myStream.getAudioTracks()[0].enabled = !isMicOn; setIsMicOn(!isMicOn);}} className={`p-4 rounded-3xl ${isMicOn ? 'bg-slate-800' : 'bg-red-500'}`}><Mic size={20}/></button>
            <button onClick={() => {if(myStream) myStream.getVideoTracks()[0].enabled = !isCamOn; setIsCamOn(!isCamOn);}} className={`p-4 rounded-3xl ${isCamOn ? 'bg-slate-800' : 'bg-red-500'}`}><Camera size={20}/></button>
        </div>
        <div className="w-px h-10 bg-white/10" />
        <div className="flex gap-2">
            <button onClick={toggleGesture} className={`p-4 rounded-3xl border ${isGestureActive ? 'bg-green-600 border-green-400' : 'bg-slate-800 border-transparent'}`}><Hand size={20}/></button>
            <button onClick={() => { if(!isSttActive) recognitionRef.current?.start(); else recognitionRef.current?.stop(); setIsSttActive(!isSttActive); }} className={`p-4 rounded-3xl border ${isSttActive ? 'bg-red-500 border-red-400' : 'bg-slate-800 border-transparent'}`}><MessageSquareText size={20}/></button>
            <button onClick={() => setIsTtsActive(!isTtsActive)} className={`p-4 rounded-3xl border ${isTtsActive ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-800 border-transparent'}`}>{isTtsActive ? <Volume2 size={20}/> : <VolumeX size={20}/>}</button>
        </div>
        <button onClick={leaveMeeting} className="px-10 py-4 bg-red-600 hover:bg-red-700 text-white rounded-3xl font-black text-xs uppercase tracking-widest transition-all">Keluar</button>
      </div>
    </div>
  );
}

export default function MeetingPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <MeetingContent />
    </Suspense>
  );
}