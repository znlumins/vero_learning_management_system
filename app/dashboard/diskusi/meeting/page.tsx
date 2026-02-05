"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { PhoneOff, Mic, MicOff, Camera, CameraOff, Users } from "lucide-react";
import VideoPlayer from "@/components/VideoPlayer"; // Pastikan path ini benar
import type Peer from "peerjs";

export default function MeetingPage() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // State WebRTC
  const [myPeerId, setMyPeerId] = useState<string>("");
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<{ [key: string]: MediaStream }>({});
  const peerInstance = useRef<Peer | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);

  useEffect(() => {
    // 1. Cek User
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      // Mulai meeting setelah user didapat
      startMeeting(user.id, user.user_metadata.full_name);
    };
    initUser();

    // Cleanup saat keluar halaman
    return () => {
      leaveMeeting();
    };
  }, []);

  // --- LOGIC WEBRTC ---
  const startMeeting = async (userId: string, userName: string) => {
    try {
      const { default: Peer } = await import("peerjs");
      
      // Ambil Stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMyStream(stream);

      // Inisialisasi Peer
      const peer = new Peer();
      peerInstance.current = peer;

      peer.on("open", (id) => {
        setMyPeerId(id);
        // Beritahu orang lain di Supabase bahwa saya masuk
        broadcastSignal(userId, userName, id);
        // Dengarkan sinyal orang lain
        listenForSignals(id, stream);
      });

      // Jawab panggilan masuk
      peer.on("call", (call) => {
        call.answer(stream);
        call.on("stream", (remoteStream) => {
          setPeers((prev) => ({ ...prev, [call.peer]: remoteStream }));
        });
      });

    } catch (err) {
      console.error("Gagal akses media:", err);
      alert("Gagal mengakses kamera/mikrofon.");
      router.push("/dashboard/diskusi"); // Balik ke chat jika gagal
    }
  };

  const listenForSignals = (myCurrentPeerId: string, currentStream: MediaStream) => {
    const channel = supabase.channel('room-1')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new;
        
        // Jika ada sinyal call dari orang lain
        if (newMsg.type === "call_signal" && newMsg.peer_id && newMsg.peer_id !== myCurrentPeerId) {
           console.log("Menelepon user baru:", newMsg.user_name);
           connectToNewUser(newMsg.peer_id, currentStream);
        }
      })
      .subscribe();
  };

  const connectToNewUser = (remotePeerId: string, stream: MediaStream) => {
    if (!peerInstance.current) return;
    const call = peerInstance.current.call(remotePeerId, stream);
    call?.on("stream", (remoteStream) => {
      setPeers((prev) => ({ ...prev, [remotePeerId]: remoteStream }));
    });
  };

  const broadcastSignal = async (uid: string, uname: string, peerId: string) => {
    await supabase.from('messages').insert({
      user_id: uid,
      user_name: uname,
      content: "Joined Video Meeting",
      type: "call_signal",
      peer_id: peerId
    });
  };

  const leaveMeeting = () => {
    // Matikan track
    if (myStream) {
        myStream.getTracks().forEach(track => track.stop());
    }
    peerInstance.current?.destroy();
    setPeers({});
    setMyStream(null);
    // Kembali ke halaman chat
    router.push("/dashboard/diskusi");
  };

  const toggleMic = () => {
    if (myStream) {
      myStream.getAudioTracks()[0].enabled = !isMicOn;
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCam = () => {
    if (myStream) {
      myStream.getVideoTracks()[0].enabled = !isCamOn;
      setIsCamOn(!isCamOn);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header Meeting */}
      <header className="h-16 px-6 bg-slate-800 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3 text-white">
          <Users size={20} className="text-indigo-400" />
          <h1 className="font-bold text-lg">Meeting Room</h1>
        </div>
        <div className="text-slate-400 text-xs font-mono">
          ID: {myPeerId ? myPeerId.substring(0, 8) + "..." : "Connecting..."}
        </div>
      </header>

      {/* Area Video Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr h-full">
          
          {/* Video Saya */}
          {myStream && (
            <div className="relative group rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-2xl">
              <VideoPlayer stream={myStream} isMuted={true} />
              <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-md">
                Anda {isMicOn ? "" : "(Muted)"}
              </div>
            </div>
          )}

          {/* Video Peserta Lain */}
          {Object.entries(peers).map(([peerId, stream]) => (
            <div key={peerId} className="relative rounded-2xl overflow-hidden border-2 border-slate-700">
              <VideoPlayer stream={stream} />
              <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded-lg text-xs font-bold backdrop-blur-sm">
                Peserta
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Controls */}
      <div className="h-24 bg-slate-800 flex items-center justify-center gap-6 shadow-lg pb-4">
        <button 
          onClick={toggleMic} 
          className={`p-4 rounded-full transition-all shadow-lg ${isMicOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 text-white'}`}
          title={isMicOn ? "Mute" : "Unmute"}
        >
          {isMicOn ? <Mic size={24}/> : <MicOff size={24}/>}
        </button>
        
        <button 
          onClick={toggleCam} 
          className={`p-4 rounded-full transition-all shadow-lg ${isCamOn ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-red-500 text-white'}`}
          title={isCamOn ? "Turn Off Camera" : "Turn On Camera"}
        >
          {isCamOn ? <Camera size={24}/> : <CameraOff size={24}/>}
        </button>
        
        <button 
          onClick={leaveMeeting} 
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/20 px-8 flex items-center gap-2 font-bold"
        >
          <PhoneOff size={24} /> Keluar
        </button>
      </div>
    </div>
  );
}