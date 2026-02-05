"use client";
import { useRef, useState, useEffect } from "react";
import { ReactSketchCanvas, ReactSketchCanvasRef } from "react-sketch-canvas";
import { 
  Pencil, 
  Eraser, 
  Undo2, 
  Redo2, 
  Trash2, 
  Download,
  ChevronRight
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function WhiteboardPage() {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  const [isEraseMode, setIsEraseMode] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#4f46e5");
  const [strokeWidth, setStrokeWidth] = useState(5);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/login"); else setUser(user);
    };
    getUser();
  }, [router]);

  // --- PERBAIKAN UTAMA DI SINI ---
  // Gunakan useEffect untuk memberi perintah ke canvas saat mode berubah
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.eraseMode(isEraseMode);
    }
  }, [isEraseMode]); // Efek ini akan berjalan setiap kali isEraseMode berubah

  if (!user) return <div className="min-h-screen bg-white" />;

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden antialiased text-slate-900">
      <Sidebar role={user.user_metadata.role} userName={user.user_metadata.full_name} />

      <main className="flex-1 flex flex-col p-8 gap-6 overflow-hidden">
        <header className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-[0.3em] mb-1">
              <span>Studio</span> <ChevronRight size={10} /> <span>Whiteboard</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Ruang Kolaborasi</h1>
          </div>
          
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
            <button onClick={() => canvasRef.current?.undo()} className="p-2.5 hover:bg-slate-50 text-slate-600 rounded-xl transition-all" title="Undo"><Undo2 size={20} /></button>
            <button onClick={() => canvasRef.current?.redo()} className="p-2.5 hover:bg-slate-50 text-slate-600 rounded-xl transition-all" title="Redo"><Redo2 size={20} /></button>
            <div className="w-px h-6 bg-slate-100 mx-1" />
            <button onClick={() => canvasRef.current?.clearCanvas()} className="p-2.5 hover:bg-red-50 text-red-500 rounded-xl transition-all" title="Clear All"><Trash2 size={20} /></button>
            <button 
              onClick={async () => {
                const image = await canvasRef.current?.exportImage("png");
                if (image) {
                  const link = document.createElement("a");
                  link.href = image;
                  link.download = "whiteboard-export.png";
                  link.click();
                }
              }} 
              className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-lg"
            >
              <Download size={18} /> Simpan
            </button>
          </div>
        </header>

        <div className="flex-1 flex gap-6 min-h-0">
          <div className="w-20 bg-white border border-slate-200 rounded-3xl shadow-xl p-4 flex flex-col items-center gap-6">
            <div className="flex flex-col gap-2">
               <button 
                onClick={() => setIsEraseMode(false)}
                className={`p-3 rounded-2xl transition-all border-2 ${!isEraseMode ? "bg-indigo-600 text-white border-indigo-600 shadow-lg" : "bg-slate-50 text-slate-400 border-transparent"}`}
               ><Pencil size={22} strokeWidth={2.5} /></button>
               <button 
                onClick={() => setIsEraseMode(true)}
                className={`p-3 rounded-2xl transition-all border-2 ${isEraseMode ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-slate-50 text-slate-400 border-transparent"}`}
               ><Eraser size={22} strokeWidth={2.5} /></button>
            </div>
            <div className="w-full h-px bg-slate-100" />
            <div className="flex flex-col gap-3">
              {["#4f46e5", "#ef4444", "#22c55e", "#f59e0b", "#0f172a"].map((color) => (
                <button key={color} onClick={() => { setStrokeColor(color); setIsEraseMode(false); }}
                  className={`w-8 h-8 rounded-full border-4 transition-transform hover:scale-110 ${strokeColor === color && !isEraseMode ? "border-slate-300 scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>

          <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-inner overflow-hidden relative group">
            <ReactSketchCanvas
              ref={canvasRef}
              strokeColor={strokeColor}
              strokeWidth={strokeWidth}
              eraserWidth={strokeWidth}
              canvasColor="#ffffff"
              // HILANGKAN PROPS `eraseMode` DARI SINI
              className="w-full h-full cursor-crosshair"
            />
            
            <div className="absolute bottom-6 left-6 pointer-events-none">
              <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-xl opacity-50 group-hover:opacity-100 transition-opacity">
                <div className={`w-2 h-2 rounded-full animate-pulse ${isEraseMode ? "bg-red-500" : "bg-green-500"}`} />
                {isEraseMode ? "Eraser Mode" : "Pen Mode"}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}