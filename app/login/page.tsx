"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion"; // Impor motion dari Framer Motion

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); // State untuk loading
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Mulai loading
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert("Email atau Password Salah!");
    } else {
      router.push("/dashboard");
      router.refresh(); // Refresh halaman untuk memuat session baru
    }
    setLoading(false); // Selesai loading
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 to-indigo-950 flex flex-col items-center justify-center p-8 antialiased text-white overflow-hidden">
      
      {/* Dekorasi Cahaya / Blob (Lebih Tenang) */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>

      <motion.div 
        className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-10 shadow-2xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <Link href="/">
            <Image
              src="/vero-logo.svg" 
              alt="VeroApp Logo"
              width={100}
              height={40}
              className="mx-auto mb-4"
            />
          </Link>
          <h2 className="text-3xl font-bold mb-2 tracking-tight">Masuk ke VeroApp</h2>
          <p className="text-slate-300 text-sm font-medium">Selamat datang kembali!</p>
        </motion.div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <motion.div variants={itemVariants}>
            <input 
              type="email" 
              placeholder="Email Kampus" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full p-4 rounded-xl bg-white/10 border border-white/20 placeholder-slate-400 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-200" 
              required 
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              className="w-full p-4 rounded-xl bg-white/10 border border-white/20 placeholder-slate-400 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-200" 
              required 
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <button 
              type="submit" 
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
              disabled={loading} // Non-aktifkan tombol saat loading
            >
              {loading ? "Memproses..." : "Masuk Akun"}
            </button>
          </motion.div>
        </form>
        
        <motion.div variants={itemVariants} className="mt-8 text-center text-sm text-slate-400">
          Belum punya akun? <Link href="/register" className="font-bold text-indigo-400 hover:underline">Daftar Sekarang</Link>
        </motion.div>
      </motion.div>

      <footer className="absolute bottom-8 text-slate-500 text-sm z-10">
        © {new Date().getFullYear()} VeroApp.
      </footer>
    </div>
  );
}