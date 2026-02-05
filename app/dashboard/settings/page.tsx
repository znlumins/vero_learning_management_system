"use client";
import { useEffect, useState, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import RightSidebar from "@/components/RightSidebar";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  ChevronRight, User, Shield, Bell, KeyRound, 
  Camera, Loader2, Trash2 
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import { toast } from "sonner";
import Image from "next/image";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State untuk Upload Foto
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // State untuk Ubah Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/login"); 
      else {
        setUser(user);
        setAvatarUrl(user.user_metadata?.avatar_url || null);
      }
      setLoading(false);
    };
    getUser();
  }, [router]);

  // --- FUNGSI UPLOAD FOTO ---
  const handleUploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload ke Supabase Storage (Bucket: avatars)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Ambil Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update User Metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      toast.success("Foto profil berhasil diperbarui!");
    } catch (error: any) {
      toast.error("Gagal upload: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  // --- FUNGSI UBAH PASSWORD ---
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) return toast.error("Password tidak cocok");
    
    setPasswordChangeLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) toast.error(error.message);
    else {
      toast.success("Password berhasil diubah!");
      setNewPassword("");
      setConfirmNewPassword("");
    }
    setPasswordChangeLoading(false);
  };

  if (loading) return <LoadingScreen />;
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-white text-slate-900 antialiased overflow-hidden font-sans">
      <Sidebar role={user.user_metadata.role} userName={user.user_metadata.full_name} />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-slate-100 px-10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <span className="text-indigo-600">Dashboard</span>
            <ChevronRight size={14} />
            <span className="text-slate-900">Pengaturan</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-10">
          <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight">Pengaturan Akun</h1>

          <div className="flex flex-col md:flex-row gap-8">
            {/* Tab Navigation */}
            <nav className="flex-none w-full md:w-64 space-y-2">
              <button onClick={() => setActiveTab("profile")} className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl font-bold transition-all ${activeTab === "profile" ? "bg-slate-900 text-white shadow-xl" : "text-slate-500 hover:bg-slate-50"}`}>
                <User size={18} /> Profil
              </button>
              <button onClick={() => setActiveTab("security")} className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl font-bold transition-all ${activeTab === "security" ? "bg-slate-900 text-white shadow-xl" : "text-slate-500 hover:bg-slate-50"}`}>
                <Shield size={18} /> Keamanan
              </button>
            </nav>

            {/* Tab Content */}
            <div className="flex-1 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-10 shadow-inner">
              
              {activeTab === "profile" && (
                <div className="space-y-10">
                  <h2 className="text-xl font-black uppercase italic text-indigo-600 border-b border-indigo-100 pb-4">Foto Profil</h2>
                  
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    {/* Preview Foto */}
                    <div className="relative group">
                      <div className="w-40 h-40 rounded-full border-4 border-white shadow-2xl overflow-hidden bg-slate-200 flex items-center justify-center">
                        {avatarUrl ? (
                          <Image src={avatarUrl} fill alt="Avatar" className="object-cover" />
                        ) : (
                          <User size={64} className="text-slate-400" />
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="animate-spin text-white" />
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-1 right-1 bg-indigo-600 text-white p-3 rounded-full shadow-xl hover:scale-110 transition-transform border-4 border-white"
                      >
                        <Camera size={20} />
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleUploadPhoto} accept="image/*" className="hidden" />
                    </div>

                    <div className="space-y-4 flex-1">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nama Lengkap</label>
                        <p className="text-xl font-bold text-slate-900">{user.user_metadata.full_name}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email</label>
                        <p className="text-xl font-bold text-slate-900">{user.email}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Peran</label>
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg text-xs font-black uppercase tracking-tighter italic">{user.user_metadata.role}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "security" && (
                <div className="max-w-md space-y-8">
                  <h2 className="text-xl font-black uppercase italic text-indigo-600 border-b border-indigo-100 pb-4">Ubah Password</h2>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Baru</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold" 
                        placeholder="••••••••" 
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Konfirmasi Password</label>
                      <input 
                        type="password" 
                        value={confirmNewPassword}
                        onChange={e => setConfirmNewPassword(e.target.value)}
                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold" 
                        placeholder="••••••••" 
                        required 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={passwordChangeLoading}
                      className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-indigo-600 transition-all uppercase tracking-widest text-xs"
                    >
                      {passwordChangeLoading ? "Sedang Memproses..." : "Update Password"}
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>

      <RightSidebar userId={user.id} />
    </div>
  );
}