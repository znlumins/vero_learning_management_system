"use client";
import { useEffect, useState, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Mic, Volume2, ChevronRight } from "lucide-react";

// Deklarasi Global
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const SpeechRecognition =
  (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null;

export default function SpeechPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // State untuk Speech-to-Text (STT) - REALTIME
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("Tekan ikon mikrofon untuk memulai...");
  const recognitionRef = useRef<any>(null);

  // State untuk Text-to-Speech (TTS) - MANUAL
  const [textToSpeak, setTextToSpeak] = useState("Ohhh Hi, Selamat datang di VeroApp.");
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/login"); else setUser(user);
    };
    getUser();

    if (!SpeechRecognition) {
      setTranscript("Maaf, browser Anda tidak mendukung fitur ini.");
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'id-ID';
    // PERBAIKAN REALTIME: interimResults harus true
    recognition.interimResults = true; 

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptChunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptChunk + " ";
        } else {
          interimTranscript += transcriptChunk;
        }
      }
      
      // Tampilkan hasil sementara (realtime)
      setTranscript(finalTranscript + interimTranscript);
    };
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => {
      setIsListening(false);
      // Opsional: Reset teks setelah berhenti
      setTimeout(() => setTranscript("Tekan ikon mikrofon untuk memulai lagi..."), 2000);
    }
    recognition.onerror = (event: any) => console.error('Error:', event.error);
    recognitionRef.current = recognition;
  }, [router]);

  const handleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      // PERBAIKAN PEMISAHAN: Tidak lagi menyentuh state textToSpeak
      setTranscript("Mendengarkan...");
      recognitionRef.current?.start();
    }
  };
  
  const handleSpeak = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && textToSpeak) {
      if (speechSynthesis.speaking) speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'id-ID';
      utterance.rate = 0.9;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      speechSynthesis.speak(utterance);
    }
  };
  
  if (!user) return <div className="min-h-screen bg-white" />;

  return (
    <div className="flex min-h-screen bg-white text-slate-900 antialiased overflow-hidden">
      <Sidebar role={user.user_metadata.role} userName={user.user_metadata.full_name} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-20 border-b border-slate-100 px-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-[0.3em] mb-1">
              <span>Studio</span> <ChevronRight size={10} /> <span>Komunikasi Interaktif</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Speech-to-Text & Text-to-Speech</h1>
          </div>
        </header>
        
        <div className="flex-1 grid grid-rows-2">
          
          {/* Panel Atas: HANYA TAMPILAN SPEECH-TO-TEXT */}
          <div className="bg-slate-50 flex flex-col justify-center items-center p-10 relative border-b border-slate-200">
            <p className="text-4xl font-bold text-slate-800 text-center max-w-4xl leading-snug italic">
              {transcript}
            </p>
            <button 
              onClick={handleListen}
              className={`absolute bottom-10 right-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-slate-600 hover:bg-indigo-600 hover:text-white'
              }`}
            ><Mic size={32} /></button>
          </div>

          {/* Panel Bawah: HANYA INPUT MANUAL TEXT-TO-SPEECH */}
          <div className="bg-white flex flex-col justify-between p-10">
            <div className="w-full max-w-3xl mx-auto">
              <textarea
                value={textToSpeak}
                onChange={(e) => setTextToSpeak(e.target.value)}
                placeholder="Ketik kalimat di sini untuk diubah menjadi suara..."
                className="w-full h-32 p-6 text-2xl font-bold text-center bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-center gap-4">
              <div className="hidden md:flex gap-2 bg-slate-50 p-2 rounded-full border border-slate-100">
                <button onClick={() => setTextToSpeak("Tolong bantu saya")} className="px-5 py-2 text-sm font-semibold bg-white rounded-full border border-slate-200 hover:bg-slate-100">Tolong bantu saya</button>
                <button onClick={() => setTextToSpeak("Saya tidak bisa bicara")} className="px-5 py-2 text-sm font-semibold bg-white rounded-full border border-slate-200 hover:bg-slate-100">Saya tidak bisa bicara</button>
                <button onClick={() => setTextToSpeak("Saya tidak bisa bicara")} className="px-5 py-2 text-sm font-semibold bg-white rounded-full border border-slate-200 hover:bg-slate-100">Saya tidak bisa bicara</button>
                <button onClick={() => setTextToSpeak("Saya tidak bisa bicara")} className="px-5 py-2 text-sm font-semibold bg-white rounded-full border border-slate-200 hover:bg-slate-100">Saya tidak bisa bicara</button>
                <button onClick={() => setTextToSpeak("Saya tidak bisa bicara")} className="px-5 py-2 text-sm font-semibold bg-white rounded-full border border-slate-200 hover:bg-slate-100">Saya tidak bisa bicara</button>
                <button onClick={() => setTextToSpeak("Saya tidak bisa bicara")} className="px-5 py-2 text-sm font-semibold bg-white rounded-full border border-slate-200 hover:bg-slate-100">Saya tidak bisa bicara</button>
                <button onClick={() => setTextToSpeak("Saya tidak bisa bicara")} className="px-5 py-2 text-sm font-semibold bg-white rounded-full border border-slate-200 hover:bg-slate-100">Saya    </button>
              </div>
              <button 
                onClick={handleSpeak}
                className={`w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-200 hover:scale-110 transition-transform ${
                  isSpeaking ? "animate-pulse" : ""
                }`}
              ><Volume2 size={32} /></button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}