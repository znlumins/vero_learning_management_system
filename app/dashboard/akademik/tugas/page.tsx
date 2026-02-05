"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import LoadingScreen from "@/components/LoadingScreen";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  ChevronRight, FileText, Edit, Trash2, Plus, 
  Calendar, UploadCloud, User2, Clock 
} from "lucide-react";
import { format, isPast, parseISO, isToday, isTomorrow } from "date-fns";
import { id } from "date-fns/locale";

interface TaskData {
  id: string;
  user_id: string; // ID Dosen pembuat tugas
  title: string;
  subject: string; // Mata Kuliah
  deadline: string;
  creator_name?: string; // Opsional: nama dosen (perlu join table idealnya, tapi kita simpan simpel dulu)
}

export default function TugasPage() {
  const [user, setUser] = useState<any>(null);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // State Modal (Khusus Dosen)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    deadline: "",
  });

  // --- FETCH DATA ---
  const fetchTasks = async () => {
    // Ambil SEMUA tugas (karena Mahasiswa perlu melihat tugas dari semua Dosen)
    // Di aplikasi real, ini harusnya difilter berdasarkan kelas yang diikuti mahasiswa
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('deadline', { ascending: true });
    
    if (error) console.error("Error fetching tasks:", error);
    else setTasks(data || []);
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      
      setUser(user);
      await fetchTasks();
      setLoading(false);
    };
    initData();
  }, [router]);

  // --- CRUD HANDLERS (HANYA DOSEN) ---
  const handleOpenCreate = () => {
    if (user?.user_metadata?.role !== "DOSEN") return;
    setEditingTask(null);
    setForm({ title: "", subject: "", deadline: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: TaskData) => {
    if (user?.user_metadata?.role !== "DOSEN" || task.user_id !== user.id) {
      alert("Anda tidak memiliki akses untuk mengedit tugas ini.");
      return;
    }
    setEditingTask(task);
    const formattedDeadline = task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : "";
    setForm({
      title: task.title,
      subject: task.subject,
      deadline: formattedDeadline,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.user_metadata.role !== "DOSEN") return;

    const isoDeadline = new Date(form.deadline).toISOString();

    if (editingTask) {
      // UPDATE
      const { error } = await supabase
        .from('tasks')
        .update({ ...form, deadline: isoDeadline })
        .eq('id', editingTask.id)
        .eq('user_id', user.id); // Hanya pembuat yang bisa edit
      
      if (!error) {
        setIsModalOpen(false);
        fetchTasks();
      } else alert("Gagal update: " + error.message);
    } else {
      // CREATE
      const { error } = await supabase
        .from('tasks')
        .insert([{ 
          ...form, 
          deadline: isoDeadline, 
          user_id: user.id,
          // progress: 0 // Progress tidak relevan untuk master tugas dosen
        }]);
      
      if (!error) {
        setIsModalOpen(false);
        fetchTasks();
      } else alert("Gagal buat tugas: " + error.message);
    }
  };

  const handleDelete = async (id: string, creatorId: string) => {
    if (user?.user_metadata?.role !== "DOSEN" || creatorId !== user.id) return;
    
    if (!confirm("Yakin ingin menghapus tugas ini? Ini akan menghapus tugas untuk semua mahasiswa.")) return;
    
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
      
    if (!error) fetchTasks();
    else alert("Gagal hapus: " + error.message);
  };

  // --- HANDLER MAHASISWA ---
  const handleSubmitTask = (taskTitle: string) => {
    // Di sini nanti logika upload file ke Supabase Storage
    // Untuk sekarang simulasi saja
    alert(`Membuka form pengumpulan untuk tugas: ${taskTitle}`);
  };

  if (loading) return <LoadingScreen />;
  if (!user) return null;

  const isDosen = user.user_metadata?.role === "DOSEN";

  return (
    <div className="flex min-h-screen bg-white text-slate-900 antialiased overflow-hidden">
      <Sidebar role={user.user_metadata.role} userName={user.user_metadata.full_name} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-100 px-10 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <span className="text-indigo-600">Akademik</span>
            <ChevronRight size={14} />
            <span className="text-slate-900">Tugas & Project</span>
          </div>
          
          {/* Tombol Buat Tugas (HANYA DOSEN) */}
          {isDosen && (
            <button 
              onClick={handleOpenCreate} 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm flex items-center gap-2 shadow-md transition-all"
            >
              <Plus size={16} /> Buat Tugas Baru
            </button>
          )}
        </header>
        
        {/* Konten Utama */}
        <div className="flex-1 overflow-y-auto p-10 space-y-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Daftar Tugas Kuliah</h1>
            <p className="text-slate-500 font-medium mt-2 max-w-xl">
              {isDosen 
                ? "Kelola tugas yang Anda berikan kepada mahasiswa." 
                : "Lihat daftar tugas dari dosen dan kumpulkan tepat waktu."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {tasks.length === 0 ? (
              <div className="p-12 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400">
                <FileText size={48} className="mx-auto mb-4 text-slate-300" strokeWidth={1.5} />
                <p className="font-bold text-lg">Belum ada tugas yang diberikan.</p>
                {isDosen && (
                  <button onClick={handleOpenCreate} className="mt-4 text-indigo-600 font-bold hover:underline">
                    + Buat Tugas Pertama
                  </button>
                )}
              </div>
            ) : (
              tasks.map((task) => {
                const deadlineDate = parseISO(task.deadline);
                const isOverdue = isPast(deadlineDate);
                const isUrgent = isToday(deadlineDate) || isTomorrow(deadlineDate);

                return (
                  <div 
                    key={task.id} 
                    className={`group bg-white p-6 rounded-3xl border shadow-sm transition-all hover:shadow-lg flex flex-col md:flex-row gap-6 relative overflow-hidden ${
                      isOverdue ? "border-red-100 bg-red-50/20" : "border-slate-200"
                    }`}
                  >
                    {/* Status Strip */}
                    <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                      isOverdue ? "bg-red-500" : isUrgent ? "bg-amber-500" : "bg-indigo-500"
                    }`}></div>

                    <div className="flex-1 pl-2">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider ${
                            isOverdue ? "bg-red-100 text-red-700" : 
                            isUrgent ? "bg-amber-100 text-amber-700" : "bg-indigo-50 text-indigo-700"
                          }`}>
                            {isOverdue ? "Terlambat" : isUrgent ? "Segera" : "Aktif"}
                          </span>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{task.subject}</span>
                        </div>
                        
                        {/* Tombol Aksi KHUSUS DOSEN PEMBUAT */}
                        {isDosen && task.user_id === user.id && (
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleOpenEdit(task)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 transition-colors"><Edit size={16}/></button>
                            <button onClick={() => handleDelete(task.id, task.user_id)} className="p-2 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                          </div>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 mb-2">{task.title}</h3>

                      <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
                        <div className={`flex items-center gap-2 ${isOverdue ? "text-red-600 font-bold" : ""}`}>
                          {isOverdue ? <Clock size={16} /> : <Calendar size={16} />}
                          {format(deadlineDate, 'dd MMMM yyyy, HH:mm', { locale: id })}
                        </div>
                        {/* Jika mau menampilkan nama dosen pembuat, bisa ditambahkan di sini */}
                        {/* <div className="flex items-center gap-2"><User2 size={16} /> Dosen Pengampu</div> */}
                      </div>
                    </div>

                    {/* ACTION AREA */}
                    <div className="w-full md:w-auto flex flex-col justify-center items-end border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 mt-4 md:mt-0">
                      {isDosen ? (
                        <div className="text-center">
                          <p className="text-3xl font-black text-slate-900">0</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dikumpulkan</p>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleSubmitTask(task.title)}
                          className="w-full md:w-auto px-6 py-3 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                        >
                          <UploadCloud size={18} />
                          Kumpulkan
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      <RightSidebar userId={user.id} />

      {/* --- MODAL FORM (HANYA MUNCUL UNTUK DOSEN) --- */}
      {isModalOpen && isDosen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight">
              {editingTask ? "Edit Detail Tugas" : "Buat Tugas Baru"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Judul Tugas</label>
                <input 
                  placeholder="Contoh: Makalah AI" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-900" 
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Mata Kuliah</label>
                <input 
                  placeholder="Contoh: Kecerdasan Buatan" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                  value={form.subject} 
                  onChange={e => setForm({...form, subject: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tenggat Waktu (Deadline)</label>
                <input 
                  type="datetime-local" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" 
                  value={form.deadline} 
                  onChange={e => setForm({...form, deadline: e.target.value})} 
                  required 
                />
              </div>
              
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">Simpan Tugas</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}