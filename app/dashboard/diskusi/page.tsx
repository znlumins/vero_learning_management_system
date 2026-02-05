"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Send, MessageSquare, Video } from "lucide-react";
import { format } from "date-fns";

interface MessageData {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
  type?: "text" | "call_signal";
}

export default function DiskusiPage() {
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch Pesan (Filter hanya teks)
  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });
    
    // Jangan tampilkan sinyal call di chat list
    const chatMessages = data?.filter((m: any) => m.type !== "call_signal") || [];
    if (!error) setMessages(chatMessages);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      fetchMessages();
    };
    getUser();

    // Realtime Chat Subscription
    const channel = supabase.channel('room-1')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as MessageData;
        if (newMsg.type !== "call_signal") {
           setMessages((prev) => [...prev, newMsg]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router, fetchMessages]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !user) return;
    const { error } = await supabase.from('messages').insert({
      user_id: user.id,
      user_name: user.user_metadata.full_name,
      content: newMessage.trim(),
      type: "text"
    });
    if (!error) setNewMessage("");
  };

  const goToMeeting = () => {
    // Pindah ke halaman meeting
    router.push('/dashboard/diskusi/meeting');
  };

  if (!user) return <div className="min-h-screen bg-white" />;

  return (
    <div className="flex min-h-screen bg-white text-slate-900 antialiased overflow-hidden">
      <Sidebar role={user.user_metadata.role} userName={user.user_metadata.full_name} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* HEADER */}
        <header className="h-20 border-b border-slate-100 px-10 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-3">
            <MessageSquare size={24} className="text-indigo-600" />
            Diskusi Umum <span className="text-slate-400 text-sm font-medium">(Grup Default)</span>
          </h1>

          {/* TOMBOL PINDAH HALAMAN */}
          <button 
            onClick={goToMeeting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md transition-all"
          >
            <Video size={18} /> Masuk Video Call
          </button>
        </header>

        {/* AREA CHAT */}
        <div ref={chatContainerRef} className="flex-1 overflow-y-auto bg-slate-50 p-8 space-y-4 custom-scrollbar">
          {messages.map((msg, index) => {
            const isMyMessage = msg.user_id === user.id;
            return (
              <div key={index} className={`flex items-start gap-3 ${isMyMessage ? 'justify-end' : ''}`}>
                {!isMyMessage && (
                  <div className="w-9 h-9 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                    {msg.user_name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className={`p-4 rounded-3xl max-w-[70%] shadow-sm text-sm ${
                  isMyMessage ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }`}>
                  {!isMyMessage && <p className="text-xs font-bold text-indigo-600 mb-1">{msg.user_name}</p>}
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-2 text-right ${isMyMessage ? 'text-white/60' : 'text-slate-400'}`}>
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* INPUT */}
        <div className="flex-none p-6 border-t border-slate-100 bg-white">
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ketik pesan diskusi..."
              className="flex-1 bg-transparent outline-none p-3 text-sm font-medium"
            />
            <button onClick={handleSendMessage} className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl shadow-md transition-colors">
              <Send size={20} />
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}