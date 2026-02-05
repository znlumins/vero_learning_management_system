"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion"; // Tambahkan Variants
import { toast } from "sonner";

// Definisikan varian di luar komponen agar rapi dan hemat memori
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      toast.error("Email atau Password Salah!");
    } else {
      toast.success("Berhasil masuk!");
      router.push("/dashboard");
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-linear-to-br from-gray-900 to-indigo-950 flex flex-col items-center justify-center p-8 antialiased text-white overflow-hidden">
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
            <Image src="/vero-logo.svg" alt="VeroApp Logo" width={100} height={40} className="mx-auto mb-4" />
          </Link>
          <h2 className="text-3xl font-bold mb-2 tracking-tight uppercase italic">Masuk Akun</h2>
          <p className="text-slate-400 text-sm font-medium">Selamat datang kembali di VeroApp</p>
        </motion.div>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <motion.div variants={itemVariants}>
            <input 
              type="email" 
              placeholder="Email Kampus" 
              className="w-full p-4 rounded-xl bg-white/10 border border-white/20 placeholder-slate-400 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full p-4 rounded-xl bg-white/10 border border-white/20 placeholder-slate-400 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" 
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <button 
              type="submit" 
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Memproses..." : "MASUK SEKARANG"}
            </button>
          </motion.div>
        </form>
        
        <motion.div variants={itemVariants} className="mt-8 text-center text-sm text-slate-400 font-bold">
          BELUM PUNYA AKUN? <Link href="/register" className="text-indigo-400 hover:underline">DAFTAR DISINI</Link>
        </motion.div>
      </motion.div>
    </div>
  );
}