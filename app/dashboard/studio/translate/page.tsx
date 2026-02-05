"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar"; // Diasumsikan RightSidebar tetap ada
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Hand, ChevronRight } from "lucide-react"; // Icon Hand untuk Gesture

export default function TranslateGesturePage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/login"); else setUser(user);
    };
    getUser();
  }, [router]);

  if (!user) return <div className="min-h-screen bg-white" />;

  return (
    <div className="flex min-h-screen bg-white text-slate-900 antialiased overflow-hidden">
      {/* SIDEBAR KIRI TETAP ADA */}
      <Sidebar role={user.user_metadata.role} userName={user.user_metadata.full_name} />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER */}
        <header className="h-16 border-b border-slate-100 px-10 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <span className="text-indigo-600">Studio</span>
            <ChevronRight size={14} />
            <span className="text-red-500">Translate Gesture</span>
          </div>
        </header>

        {/* IFRAME CONTAINER */}
        <div className="flex-1 p-8 bg-slate-50 overflow-hidden">
          <div className="w-full h-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative">
            <iframe
              src="https://vero.daffaahmadalattas.web.id/" // URL Aplikasi Gesture Anda
              title="Translate Gesture Bahasa Isyarat"
              className="w-full h-full border-none"
              allow="camera; microphone" // Beri izin kamera/mikrofon jika aplikasi membutuhkan
            ></iframe>
            
            {/* Overlay sederhana jika ada loading atau perlu info */}
            <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl text-[10px] font-bold text-slate-600 uppercase">
              <Hand size={14} className="inline-block mr-1" /> Aplikasi Pihak Ketiga
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT SIDEBAR TETAP ADA */}
      <RightSidebar userId={user.id} />
    </div>
  );
}