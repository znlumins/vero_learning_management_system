"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import LoadingScreen from "@/components/LoadingScreen";
import GlobalSearch from "@/components/GlobalSearch";
import NotificationBell from "@/components/NotificationBell";
import { 
  GraduationCap, Zap, Clock, Megaphone, 
  ChevronRight, ArrowUpRight, Plus, Trash2, Edit 
} from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  tag: string;
  tag_color: string;
  created_at: string;
  user_id: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // State Modal CRUD (Hanya untuk Admin)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", tag: "Akademik", tag_color: "blue" });

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      await fetchAnnouncements();
      setLoading(false);
    };
    init();
  }, [router]);

  const fetchAnnouncements = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setAnnouncements(data || []);
  };

  // LOGIK PERAN (ROLE)
  const isAdmin = user?.user_metadata?.role === "ADMIN";
  const roleDisplay = user?.user_metadata?.role || "Mahasiswa";

  const handleOpenCreate = () => {
    if (!isAdmin) return;
    setEditingId(null);
    setForm({ title: "", tag: "Akademik", tag_color: "blue" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: Announcement) => {
    setEditingId(item.id);
    setForm({ title: item.title, tag: item.tag, tag_color: item.tag_color });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const { error } = await supabase.from('announcements').update(form).eq('id', editingId);
      if (!error) toast.success("Pengumuman diperbarui");
    } else {
      const { error } = await supabase.from('announcements').insert([{ ...form, user_id: user.id }]);
      if (!error) toast.success("Pengumuman resmi diposting");
    }
    setIsModalOpen(false);
    fetchAnnouncements();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus pengumuman resmi ini?")) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (!error) {
      toast.success("Pengumuman dihapus");
      fetchAnnouncements();
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex min-h-screen bg-white text-slate-900 antialiased overflow-hidden font-sans">
      <Sidebar role={roleDisplay} userName={user.user_metadata.full_name} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-slate-100 px-10 flex items-center justify-between shrink-0">
          <GlobalSearch />
          <NotificationBell />
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-12">
          
          {/* WELCOME BANNER */}
          <section className="relative overflow-hidden rounded-4xl bg-slate-900 p-12 text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[120px] opacity-30"></div>
            <div className="relative z-10">
              <h1 className="text-5xl font-black tracking-tight mb-3 italic uppercase">Halo, {user.user_metadata.full_name.split(' ')[0]}! 👋</h1>
              <p className="text-slate-400 max-w-md font-medium text-lg leading-snug">
                {isAdmin ? "Anda masuk sebagai Administrator. Kelola pengumuman kampus di sini." : "Selamat datang di portal akademik terpadu."}
              </p>
              {!isAdmin && (
                <div className="mt-10 flex gap-4">
                  <button onClick={() => router.push('/dashboard/studio')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center gap-2 shadow-xl">
                    <Zap size={18} fill="currentColor" /> Masuk Studio
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* 3. PAPAN PENGUMUMAN (HANYA ADMIN YANG BISA CRUD) */}
          <section className="bg-slate-50/50 rounded-4xl p-10 border border-slate-100">
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg"><Megaphone size={22} /></div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Berita & Pengumuman</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Dikelola oleh Tim Admin Pusat</p>
                </div>
              </div>
              
              {/* TOMBOL TAMBAH HANYA UNTUK ADMIN */}
              {isAdmin && (
                <button onClick={handleOpenCreate} className="bg-slate-900 hover:bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-md">
                  <Plus size={16} /> Tambah Berita
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4">
              {announcements.map((news) => (
                <div key={news.id} className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-indigo-600 transition-all flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest mb-2 inline-block ${
                        news.tag_color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                        news.tag_color === 'yellow' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'
                      }`}>
                        {news.tag}
                      </span>
                      <h4 className="text-slate-800 font-bold group-hover:text-indigo-600 transition-colors text-lg tracking-tight leading-tight">{news.title}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* TOMBOL EDIT/HAPUS HANYA UNTUK ADMIN */}
                    {isAdmin && (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                         <button onClick={() => handleOpenEdit(news)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit size={16}/></button>
                         <button onClick={() => handleDelete(news.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                      </div>
                    )}
                    <ArrowUpRight size={22} className="text-slate-200 group-hover:text-slate-900 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <RightSidebar userId={user.id} />

      {/* MODAL KHUSUS ADMIN */}
      {isModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-100 p-4">
          <div className="bg-white p-10 rounded-4xl w-full max-w-md shadow-2xl border-4 border-white">
             <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic mb-6">Kelola Pengumuman</h2>
             <form onSubmit={handleSubmit} className="space-y-4">
                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 font-bold" placeholder="Tulis pengumuman resmi..." value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                <div className="grid grid-cols-2 gap-4">
                  <select className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={form.tag} onChange={e => setForm({...form, tag: e.target.value})}>
                    <option>Akademik</option><option>Update</option><option>Penting</option>
                  </select>
                  <select className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" value={form.tag_color} onChange={e => setForm({...form, tag_color: e.target.value})}>
                    <option value="blue">Biru</option><option value="yellow">Kuning</option><option value="red">Merah</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-8">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-400 font-black text-xs uppercase rounded-2xl">Batal</button>
                  <button type="submit" className="px-8 py-3 bg-indigo-600 text-white font-black text-xs uppercase rounded-2xl shadow-xl">Publikasikan</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}