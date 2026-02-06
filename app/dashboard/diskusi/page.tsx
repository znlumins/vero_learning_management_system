"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  Send, MessageSquare, Video, Search, 
  Users, User, Plus, X, Hash, Check, UserPlus 
} from "lucide-react"; 
import { format } from "date-fns";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function DiskusiPage() {
  const [user, setUser] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]); 
  const [groupsList, setGroupsList] = useState<any[]>([]); 
  const [selectedTarget, setSelectedTarget] = useState<{type: 'umum' | 'dm' | 'group', data: any}>({type: 'umum', data: null});
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  // State Modal & Pilihan Anggota
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]); // Menyimpan ID anggota grup baru
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    // 1. Ambil Pesan
    let query = supabase.from('messages').select('*');
    if (selectedTarget.type === 'dm') {
      query = query.or(`and(user_id.eq.${user.id},receiver_id.eq.${selectedTarget.data.id}),and(user_id.eq.${selectedTarget.data.id},receiver_id.eq.${user.id})`);
    } else if (selectedTarget.type === 'group') {
      query = query.eq('group_id', selectedTarget.data.id);
    } else {
      query = query.is('receiver_id', null).is('group_id', null);
    }
    const { data: msgData } = await query.order('created_at', { ascending: true });
    setMessages(msgData || []);

    // 2. Ambil Daftar User (untuk DM & Tambah Anggota)
    const { data: profiles } = await supabase.from('profiles').select('*').neq('id', user.id);
    setUsersList(profiles || []);

    // 3. Ambil Daftar Grup di mana SAYA adalah anggotanya
    const { data: myGroups } = await supabase.from('group_members').select('group_id').eq('user_id', user.id);
    if (myGroups && myGroups.length > 0) {
      const gIds = myGroups.map(mg => mg.group_id);
      const { data: groups } = await supabase.from('groups').select('*').in('id', gIds).order('created_at', { ascending: false });
      setGroupsList(groups || []);
    } else {
      setGroupsList([]);
    }

  }, [user, selectedTarget]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
    };
    init();
    const channel = supabase.channel('chat-main').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
      fetchData();
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData, router]);

  useEffect(() => { fetchData(); }, [selectedTarget, fetchData]);

  useEffect(() => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [messages]);

  // Handler Pilih/Hapus Anggota di Modal
  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  // Handler Buat Grup & Masukkan Anggota
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    // 1. Buat Grup
    const { data: group, error: groupError } = await supabase.from('groups').insert([
      { name: newGroupName.trim(), creator_id: user.id }
    ]).select().single();

    if (groupError) return toast.error("Gagal membuat grup");

    // 2. Tambahkan Anggota (Termasuk diri sendiri)
    const membersToInsert = [...selectedUserIds, user.id].map(uid => ({
      group_id: group.id,
      user_id: uid
    }));

    const { error: memberError } = await supabase.from('group_members').insert(membersToInsert);

    if (memberError) {
      toast.error("Grup dibuat, tapi gagal memasukkan anggota");
    } else {
      toast.success(`Grup ${newGroupName} siap digunakan!`);
      setIsModalOpen(false);
      setNewGroupName("");
      setSelectedUserIds([]);
      setSelectedTarget({type: 'group', data: group});
      fetchData();
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;
    const payload: any = { user_id: user.id, user_name: user.user_metadata.full_name, content: newMessage.trim() };
    if (selectedTarget.type === 'dm') payload.receiver_id = selectedTarget.data.id;
    if (selectedTarget.type === 'group') payload.group_id = selectedTarget.data.id;
    const { error } = await supabase.from('messages').insert(payload);
    if (!error) { setNewMessage(""); fetchData(); }
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-white text-slate-900 antialiased overflow-hidden font-sans">
      <Sidebar role={user.user_metadata.role} userName={user.user_metadata.full_name} />
      
      <main className="flex-1 flex flex-row h-screen overflow-hidden">
        {/* PANEL KIRI */}
        <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/50 shrink-0">
          <div className="p-6 border-b border-slate-100 bg-white flex justify-between items-center">
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-indigo-600">Diskusi</h2>
            <button onClick={() => setIsModalOpen(true)} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100">
              <UserPlus size={18} strokeWidth={3} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 mb-3">Grup Saya</p>
              <div className="space-y-1">
                <button onClick={() => setSelectedTarget({type: 'umum', data: null})} className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedTarget.type === 'umum' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-white text-slate-600'}`}>
                  <Hash size={18} /> <span className="text-sm font-bold uppercase">Grup Umum</span>
                </button>
                {groupsList.map((g) => (
                  <button key={g.id} onClick={() => setSelectedTarget({type: 'group', data: g})} className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedTarget.type === 'group' && selectedTarget.data?.id === g.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-white text-slate-600'}`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs bg-slate-200 text-slate-500">{g.name.charAt(0)}</div>
                    <span className="text-sm font-bold truncate uppercase">{g.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-3 mb-3">Kontak</p>
              <div className="space-y-1">
                {usersList.map((u) => (
                  <button key={u.id} onClick={() => setSelectedTarget({type: 'dm', data: u})} className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedTarget.type === 'dm' && selectedTarget.data?.id === u.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-white text-slate-600'}`}>
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 shrink-0 overflow-hidden text-xs">
                      {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                    </div>
                    <span className="text-sm font-bold truncate uppercase">{u.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PANEL KANAN */}
        <div className="flex-1 flex flex-col bg-white">
          <header className="h-20 border-b border-slate-100 px-8 flex items-center justify-between bg-white/80 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 flex items-center justify-center font-black rounded-2xl border border-indigo-100">
                {selectedTarget.type === 'dm' ? <User size={24}/> : <Users size={24}/>}
              </div>
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg leading-none">
                  {selectedTarget.type === 'umum' ? "Grup Umum" : selectedTarget.data?.name || selectedTarget.data?.name}
                </h3>
                <p className="text-[10px] font-black text-green-500 uppercase mt-2 tracking-widest italic">Saluran Terenkripsi</p>
              </div>
            </div>
            <button onClick={() => router.push(`/dashboard/diskusi/meeting?roomID=${selectedTarget.data?.id || 'GLOBAL'}`)} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg">
              <Video size={16} className="inline mr-2" /> Start Meeting
            </button>
          </header>

          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-8 bg-slate-50/50 space-y-6 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.user_id === user.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] p-5 rounded-3xl shadow-sm border ${msg.user_id === user.id ? 'bg-indigo-600 border-indigo-500 text-white rounded-br-none' : 'bg-white border-slate-100 text-slate-800 rounded-bl-none'}`}>
                  {msg.user_id !== user.id && <p className="text-[10px] font-black text-indigo-600 uppercase mb-2">{msg.user_name}</p>}
                  <p className="text-sm font-medium leading-relaxed">{msg.content}</p>
                  <p className={`text-[9px] mt-3 font-bold uppercase opacity-50 text-right`}>{format(new Date(msg.created_at), 'HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-white border-t border-slate-100">
            <div className="flex gap-4 bg-slate-100 p-2 rounded-2xl border-2 border-slate-200 focus-within:border-indigo-600 transition-all">
              <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Tulis pesan..." className="flex-1 bg-transparent outline-none px-4 text-sm font-bold text-slate-700" />
              <button onClick={handleSendMessage} className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 shadow-xl transition-all"><Send size={20} /></button>
            </div>
          </div>
        </div>
      </main>

      {/* MODAL BUAT GRUP & PILIH ANGGOTA */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 font-sans">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white p-10 rounded-[2.5rem] w-full max-w-lg shadow-2xl border-4 border-white flex flex-col max-h-[90vh]">
              <div className="flex justify-between items-center mb-8 shrink-0">
                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Konfigurasi Grup</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900"><X /></button>
              </div>
              <form onSubmit={handleCreateGroup} className="space-y-6 flex-1 flex flex-col overflow-hidden">
                <div className="shrink-0">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-1">Nama Grup</label>
                  <input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600 font-bold text-lg" placeholder="MISAL: KELOMPOK 1" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value.toUpperCase())} required />
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-1">Undang Anggota ({selectedUserIds.length})</label>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar border-t border-b border-slate-100 py-4">
                    {usersList.map((u) => (
                      <div 
                        key={u.id} 
                        onClick={() => toggleUserSelection(u.id)}
                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border-2 ${selectedUserIds.includes(u.id) ? 'bg-indigo-50 border-indigo-200' : 'hover:bg-slate-50 border-transparent'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-500">{u.name.charAt(0)}</div>
                          <p className="text-sm font-bold text-slate-800 uppercase">{u.name}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedUserIds.includes(u.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}>
                          {selectedUserIds.includes(u.id) && <Check size={14} className="text-white" strokeWidth={4} />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-2xl hover:bg-indigo-600 transition-all uppercase tracking-widest text-xs shrink-0 mt-4">
                  Selesaikan & Buat Grup
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}