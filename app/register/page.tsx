"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Register() {
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "MAHASISWA" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (form.password.length < 6) {
      alert("Password minimal 6 karakter!");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name, role: form.role } },
    });

    if (error) {
      alert(error.message);
    } else {
      await supabase.from('profiles').insert([{ id: data.user?.id, name: form.name, role: form.role }]);
      alert("Registrasi Berhasil! Silahkan Login.");
      router.push("/login");
    }
    setLoading(false);
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
        className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-10 shadow-2xl" // Rounded lebih halus
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
              className="mx-auto mb-4" // Tanpa drop-shadow agresif
            />
          </Link>
          <h2 className="text-3xl font-bold mb-2 tracking-tight">Daftar Akun VeroApp</h2> {/* Tanpa drop-shadow & italic */}
          <p className="text-slate-300 text-sm font-medium">Buat akun Anda untuk memulai.</p>
        </motion.div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
            <button 
              type="button" 
              onClick={() => setForm({...form, role: "MAHASISWA"})} 
              className={`flex-1 py-3 px-4 font-bold rounded-xl transition-all duration-200 ring-2 ${form.role === "MAHASISWA" ? "bg-indigo-600 text-white ring-indigo-600 shadow-md" : "bg-transparent text-slate-300 ring-slate-700 hover:ring-indigo-500 hover:text-white"}`} // Lebih elegan
            >
              MAHASISWA
            </button>
            <button 
              type="button" 
              onClick={() => setForm({...form, role: "DOSEN"})} 
              className={`flex-1 py-3 px-4 font-bold rounded-xl transition-all duration-200 ring-2 ${form.role === "DOSEN" ? "bg-indigo-600 text-white ring-indigo-600 shadow-md" : "bg-transparent text-slate-300 ring-slate-700 hover:ring-indigo-500 hover:text-white"}`} // Lebih elegan
            >
              DOSEN
            </button>
          </motion.div>

          <motion.div variants={itemVariants}>
            <input 
              type="text" 
              placeholder="Nama Lengkap" 
              value={form.name} 
              onChange={(e) => setForm({...form, name: e.target.value})} 
              className="w-full p-4 rounded-xl bg-white/10 border border-white/20 placeholder-slate-400 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-200" 
              required 
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <input 
              type="email" 
              placeholder="Email Kampus" 
              value={form.email} 
              onChange={(e) => setForm({...form, email: e.target.value})} 
              className="w-full p-4 rounded-xl bg-white/10 border border-white/20 placeholder-slate-400 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-200" 
              required 
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <input 
              type="password" 
              placeholder="Password (minimal 6 karakter)" 
              value={form.password} 
              onChange={(e) => setForm({...form, password: e.target.value})} 
              className="w-full p-4 rounded-xl bg-white/10 border border-white/20 placeholder-slate-400 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-200" 
              required 
              minLength={6}
            />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <button 
              type="submit" 
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200" // Lebih kalem
              disabled={loading}
            >
              {loading ? "Memproses..." : "Daftar Akun"}
            </button>
          </motion.div>
        </form>
        
        <motion.div variants={itemVariants} className="mt-8 text-center text-sm text-slate-400">
          Sudah punya akun? <Link href="/login" className="font-bold text-indigo-400 hover:underline">Masuk di sini</Link>
        </motion.div>
      </motion.div>

      <footer className="absolute bottom-8 text-slate-500 text-sm z-10">
        © {new Date().getFullYear()} VeroApp.
      </footer>
    </div>
  );
}