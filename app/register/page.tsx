"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { toast } from "sonner";

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

export default function Register() {
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "MAHASISWA" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Password minimal 6 karakter!");
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name, role: form.role } },
    });

    if (error) {
      toast.error(error.message);
    } else {
      await supabase.from('profiles').insert([{ id: data.user?.id, name: form.name, role: form.role }]);
      toast.success("Registrasi Berhasil!");
      router.push("/login");
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-linear-to-br from-gray-900 to-indigo-950 flex flex-col items-center justify-center p-8 text-white overflow-hidden">
      <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>
      
      <motion.div 
        className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-10 shadow-2xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="text-center mb-8">
          <Image src="/vero-logo.svg" alt="VeroApp" width={100} height={40} className="mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2 tracking-tight uppercase italic">Buat Akun</h2>
        </motion.div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div variants={itemVariants} className="flex gap-3">
            {["MAHASISWA", "DOSEN"].map((r) => (
              <button 
                key={r} type="button" 
                onClick={() => setForm({...form, role: r})} 
                className={`flex-1 py-3 px-4 font-bold rounded-xl transition-all border-2 ${form.role === r ? "bg-indigo-600 border-indigo-600" : "border-slate-700 text-slate-400"}`}
              >
                {r}
              </button>
            ))}
          </motion.div>

          <motion.div variants={itemVariants}>
            <input placeholder="Nama Lengkap" className="w-full p-4 rounded-xl bg-white/10 border border-white/20 outline-none focus:ring-2 focus:ring-indigo-500" onChange={(e) => setForm({...form, name: e.target.value})} required />
          </motion.div>
          <motion.div variants={itemVariants}>
            <input type="email" placeholder="Email" className="w-full p-4 rounded-xl bg-white/10 border border-white/20 outline-none focus:ring-2 focus:ring-indigo-500" onChange={(e) => setForm({...form, email: e.target.value})} required />
          </motion.div>
          <motion.div variants={itemVariants}>
            <input type="password" placeholder="Password" className="w-full p-4 rounded-xl bg-white/10 border border-white/20 outline-none focus:ring-2 focus:ring-indigo-500" onChange={(e) => setForm({...form, password: e.target.value})} required />
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <button type="submit" className="w-full bg-indigo-600 font-bold py-4 rounded-xl transition-all disabled:opacity-50" disabled={loading}>
              {loading ? "Mendaftar..." : "DAFTAR SEKARANG"}
            </button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}