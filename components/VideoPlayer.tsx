"use client";
import { useEffect, useRef } from "react";
import { Loader2, User } from "lucide-react"; // Tambah icon User untuk placeholder

export default function VideoPlayer({ stream, isMuted = false }: { stream: MediaStream | null; isMuted?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;

    if (videoElement && stream) {
      videoElement.srcObject = stream;
      
      // Paksa play video dan tangani error autoplay policy
      videoElement.play().catch(error => {
        if (error.name !== 'AbortError') {
          console.error("Error playing video:", error);
        }
      });
    }
  }, [stream]);

  return (
    // CONTAINER: Tema Putih (bg-white), Border Abu (border-slate-200), Shadow Halus
    <div className="relative w-full h-full bg-slate-50 rounded-2xl overflow-hidden shadow-sm border border-slate-200 aspect-video flex items-center justify-center">
      
      {!stream ? (
        // STATE LOADING / KOSONG: Teks Gelap & Spinner Indigo
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm mb-2">
            <User size={24} className="text-slate-300" />
          </div>
          <div className="flex items-center gap-2 text-indigo-600">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Menghubungkan...</span>
          </div>
        </div>
      ) : (
        // VIDEO ELEMENT
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted} // Mute diri sendiri agar tidak feedback
          className="w-full h-full object-cover transform scale-x-[-1] bg-slate-100" // Background cadangan jika video loading
        />
      )}
    </div>
  );
}