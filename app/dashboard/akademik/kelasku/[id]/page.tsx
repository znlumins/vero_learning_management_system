"use client";
import { useEffect, useState, use } from "react";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import LoadingScreen from "@/components/LoadingScreen";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Sekarang aman setelah instal di langkah 1
import { 
  ChevronRight, ArrowLeft, Send, FileText, 
  Download, Users, MessageSquare, Plus, Link as LinkIcon,
  Video, Clock, MoreHorizontal, Trash2
} from "lucide-react";
import { format, parseISO, isWithinInterval } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// --- INTERFACES ---
interface ClassDetail {
  id: string;
  class_name: string;
  class_code: string;
  lecturer_name: string;
  room_location: string;
  schedule_time: string;
}

interface ClassPost {
  id: string;
  user_name: string;
  content: string;
  file_url?: string;
  file_type: string;
  created_at: string;
}

interface ClassSchedule {
  id: string;
  subject_name: string;
  start_time: string;
  end_time: string;
  room_id: string;
  is_online: boolean;
}

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const classId = resolvedParams.id;

  const [user, setUser] = useState<any>(null);
  const [classInfo, setClassInfo] = useState<ClassDetail | null>(null);
  const [posts, setPosts] = useState<ClassPost[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stream"); 
  
  const router = useRouter();

  const [newPostContent, setNewPostContent] = useState("");
  const [newPostLink, setNewPostLink] = useState("");
  const [isJadwalModalOpen, setIsJadwalModalOpen] = useState(false);
  const [jadwalForm, setJadwalForm] = useState({
    subject_name: "",
    start_time: "",
    end_time: "",
    is_online: true
  });

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      const { data: classData, error: classError } = await supabase
        .from('classes').select('*').eq('id', classId).single();
      
      if (classError) {
        toast.error("Kelas tidak ditemukan");
        router.push("/dashboard/akademik/kelasku");
        return;
      }
      setClassInfo(classData);

      await Promise.all([fetchPosts(), fetchSchedules()]);
      setLoading(false);
    };
    initData();
  }, [classId, router]);

  const fetchPosts = async () => {
    const { data } = await supabase.from('class_posts').select('*').eq('class_id', classId).order('created_at', { ascending: false });
    setPosts(data || []);
  };

  const fetchSchedules = async () => {
    const { data } = await supabase.from('schedules').select('*').eq('class_id', classId).order('start_time', { ascending: true });
    setSchedules(data || []);
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent) return;

    const { error } = await supabase.from('class_posts').insert({
      class_id: classId,
      user_id: user.id,
      user_name: user.user_metadata.full_name,
      content: newPostContent,
      file_url: newPostLink || null,
      file_type: newPostLink ? "LINK" : "TEXT",
    });

    if (error) toast.error(error.message);
    else {
      toast.success("Berhasil memposting pengumuman");
      setNewPostContent("");
      setNewPostLink("");
      fetchPosts();
    }
  };

  const handleCreateJadwal = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('schedules').insert({
      class_id: classId,
      creator_id: user.id,
      subject_name: jadwalForm.subject_name,
      start_time: new Date(jadwalForm.start_time).toISOString(),
      end_time: new Date(jadwalForm.end_time).toISOString(),
      is_online: jadwalForm.is_online,
      room_id: classInfo?.class_code,
      location: jadwalForm.is_online ? "Online Meeting" : "Ruang Kelas"
    });

    if (error) toast.error(error.message);
    else {
      toast.success("Jadwal pertemuan berhasil dibuat");
      setIsJadwalModalOpen(false);
      fetchSchedules();
    }
  };

  if (loading) return <LoadingScreen />;
  if (!user || !classInfo) return null;

  const isDosen = user.user_metadata.role === "DOSEN";

  return (
    <div className="flex min-h-screen bg-white text-slate-900 antialiased overflow-hidden">
      <Sidebar role={user.user_metadata.role} userName={user.user_metadata.full_name} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-slate-100 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><ArrowLeft size={20}/></button>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <span className="text-indigo-600">Kelasku</span>
              <ChevronRight size={14} />
              <span className="text-slate-900 truncate max-w-50">{classInfo.class_name}</span>
            </div>
          </div>
          
          <nav className="flex bg-slate-100 p-1 rounded-xl">
            {["stream", "materials", "schedules", "people"].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-black uppercase tracking-tight rounded-lg transition-all ${activeTab === tab ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {tab === 'stream' ? 'Forum' : tab === 'materials' ? 'Materi' : tab === 'schedules' ? 'Jadwal' : 'Anggota'}
              </button>
            ))}
          </nav>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-10">
          <div className="relative h-56 bg-slate-900 rounded-4xl p-12 flex flex-col justify-end text-white shadow-2xl overflow-hidden">
             <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-20 -translate-y-1/2 translate-x-1/4"></div>
             <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.4em] mb-4">Class Overview</p>
             <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none mb-2">{classInfo.class_name}</h1>
             <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{classInfo.class_code} • {classInfo.room_location} • {classInfo.schedule_time}</p>
          </div>

          <div className="max-w-4xl mx-auto pb-20">
            {activeTab === "stream" && (
              <div className="space-y-8">
                {isDosen && (
                  <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                    <form onSubmit={handlePostSubmit}>
                      <textarea 
                        placeholder="Umumkan sesuatu ke kelas Anda..." 
                        className="w-full p-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 resize-none h-28 font-medium"
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                      />
                      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100">
                        <div className="flex-1 flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                          <LinkIcon size={16} className="text-slate-400"/>
                          <input type="text" placeholder="Link materi (Opsional)" className="bg-transparent text-xs w-full outline-none" value={newPostLink} onChange={(e) => setNewPostLink(e.target.value)} />
                        </div>
                        <button type="submit" className="px-8 py-2 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Kirim</button>
                      </div>
                    </form>
                  </div>
                )}
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div key={post.id} className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm group">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner">{post.user_name.charAt(0)}</div>
                        <div>
                          <p className="font-black text-slate-900 uppercase text-sm tracking-tight">{post.user_name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{format(parseISO(post.created_at), 'dd MMM yyyy, HH:mm', { locale: idLocale })}</p>
                        </div>
                      </div>
                      <p className="text-slate-700 leading-relaxed font-medium mb-6">{post.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "schedules" && (
              <div className="space-y-6">
                {isDosen && (
                  <button onClick={() => setIsJadwalModalOpen(true)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl flex items-center justify-center gap-3 text-slate-400 font-bold hover:bg-slate-50 hover:border-indigo-600 hover:text-indigo-600 transition-all">
                    <Plus size={20}/> Buat Jadwal Pertemuan Baru
                  </button>
                )}
                <div className="grid grid-cols-1 gap-4">
                  {schedules.map((j) => {
                    const start = parseISO(j.start_time);
                    const end = parseISO(j.end_time);
                    const isLive = isWithinInterval(new Date(), { start, end });
                    return (
                      <div key={j.id} className={`p-8 rounded-4xl border-2 transition-all ${isLive ? 'border-indigo-600 bg-indigo-50/30' : 'bg-white border-slate-100 shadow-sm'}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl ${isLive ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}><Video size={24}/></div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${isLive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{isLive ? 'Live' : 'Terjadwal'}</span>
                                <p className="text-xs font-bold text-slate-400">{format(start, "eeee, dd MMMM", { locale: idLocale })}</p>
                              </div>
                              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{j.subject_name}</h3>
                            </div>
                          </div>
                          {isLive && (
                            <button onClick={() => router.push(`/dashboard/diskusi/meeting?roomID=${j.room_id}`)} className="px-8 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-600 shadow-xl transition-all">Join Meeting</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <RightSidebar userId={user.id} />

      {isJadwalModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-100 p-4">
          <div className="bg-white p-10 rounded-4xl w-full max-w-md shadow-2xl border-4 border-white animate-in zoom-in duration-300">
             <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic mb-6">Buat Jadwal Baru</h2>
             <form onSubmit={handleCreateJadwal} className="space-y-4">
                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-bold" value={jadwalForm.subject_name} onChange={e => setJadwalForm({...jadwalForm, subject_name: e.target.value})} required placeholder="Judul Pertemuan" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="datetime-local" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-bold" value={jadwalForm.start_time} onChange={e => setJadwalForm({...jadwalForm, start_time: e.target.value})} required />
                  <input type="datetime-local" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-xs font-bold" value={jadwalForm.end_time} onChange={e => setJadwalForm({...jadwalForm, end_time: e.target.value})} required />
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button type="button" onClick={() => setIsJadwalModalOpen(false)} className="px-6 py-3 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50">Batal</button>
                  <button type="submit" className="px-8 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-200">Simpan Jadwal</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}