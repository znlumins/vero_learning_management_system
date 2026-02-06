"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { 
  ChevronRight, Hand, MessageSquareText, 
  Layout, Zap, ShieldCheck, Globe, CheckCircle2
} from "lucide-react";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  },
};

// Data Nama Pengembang dari Gambar
const teamMembers = [
  { name: "Daffa Ahmad Al Attas", major: "TEKNOLOGI INFORMASI" },
  { name: "Maqrodza Najwa Putri Fadilah", major: "KEUANGAN DAN PERBANKAN" },
  { name: "Naurah Wasyilah", major: "KEUANGAN DAN PERBANKAN" },
  { name: "Branang Aura Madani", major: "ADMINISTRASI BISNIS" },
];

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-700">
      
      {/* --- NAVBAR --- */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-white/80 backdrop-blur-md py-4 border-b border-slate-100 shadow-sm" : "bg-transparent py-6"}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image src="/vero-logo.svg" alt="Vero Logo" width={100} height={40} className="w-auto h-8" />
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <a href="#tentang" className="hover:text-indigo-600 transition-colors">Tentang</a>
            <a href="#fitur" className="hover:text-indigo-600 transition-colors">Fitur</a>
            <a href="#teknologi" className="hover:text-indigo-600 transition-colors">Teknologi</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs font-black uppercase tracking-widest text-slate-900 hover:text-indigo-600 transition-colors">Masuk</Link>
            <Link href="/register" className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-200">Daftar</Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden bg-slate-50">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-100/50 rounded-full filter blur-[120px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-50 rounded-full filter blur-[100px] -z-10"></div>

        <motion.div 
          className="max-w-5xl mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 mb-8 shadow-sm">
            <Zap size={14} className="text-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Next-Gen Accessibility Platform</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-[0.9] uppercase italic text-slate-900">
            Mendobrak <span className="text-indigo-600">Batasan</span> Komunikasi.
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            Platform akademik terintegrasi yang mengubah <span className="text-slate-900 font-bold underline decoration-indigo-500 underline-offset-4">gesture tangan</span> dan suara menjadi jembatan komunikasi inklusif.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="group px-10 py-5 bg-slate-900 text-white font-black rounded-2xl shadow-2xl hover:bg-indigo-600 transition-all uppercase italic tracking-widest flex items-center gap-3">
              Mulai Sekarang <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* --- SECTION: TENTANG VERO --- */}
      <section id="tentang" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative aspect-video md:aspect-square rounded-[40px] overflow-hidden border-8 border-slate-50 shadow-2xl"
          >
            <Image 
              src="https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?q=80&w=2069&auto=format&fit=crop" 
              alt="Accessibility Tech" 
              fill 
              className="object-cover grayscale hover:grayscale-0 transition-all duration-1000"
            />
          </motion.div>

          <div>
            <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-4">Vero Definition</h2>
            <h3 className="text-4xl font-black mb-6 uppercase italic tracking-tight text-slate-900">Apa itu <span className="text-indigo-600">Vero?</span></h3>
            <p className="text-slate-500 leading-relaxed mb-8 text-lg">
              <span className="font-bold text-slate-900">Vero</span> (Visual, Expression, Recognition, and Openness) adalah ekosistem digital akademik yang dirancang untuk mendukung inklusivitas total. Kami menggunakan AI untuk memastikan teman tuli dan tunawicara dapat berkolaborasi setara dalam ruang kelas digital.
            </p>
            
            <div className="space-y-4">
              {[
                "Terjemahan Bahasa Isyarat Real-time",
                "Kolaborasi Whiteboard Multi-user",
                "Transkripsi Suara Otomatis (STT)",
                "Integrasi Akademik Terpadu"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="text-indigo-500" size={18} /> {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION: FITUR UNGGULAN --- */}
      <section id="fitur" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-black uppercase italic mb-4 text-slate-900">Fitur <span className="text-indigo-600">Studio</span> Kami</h2>
            <div className="w-20 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-10 bg-white rounded-[40px] border border-slate-200 hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Hand size={32} />
              </div>
              <h4 className="text-xl font-black mb-4 uppercase italic text-slate-900">AI Hand Gesture</h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Teknologi Computer Vision yang mengenali gerakan tangan SIBI dan BISINDO untuk dikonversi menjadi subtitle instan.
              </p>
            </div>

            <div className="group p-10 bg-white rounded-[40px] border border-slate-200 hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <MessageSquareText size={32} />
              </div>
              <h4 className="text-xl font-black mb-4 uppercase italic text-slate-900">STT & TTS</h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Ubah suara menjadi teks (STT) dan teks menjadi suara (TTS) secara otomatis untuk komunikasi dua arah yang mulus.
              </p>
            </div>

            <div className="group p-10 bg-white rounded-[40px] border border-slate-200 hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Layout size={32} />
              </div>
              <h4 className="text-xl font-black mb-4 uppercase italic text-slate-900">Collaborative Studio</h4>
              <p className="text-slate-500 text-sm leading-relaxed">
                Mode presentasi slide dan whiteboard interaktif yang tersinkronisasi antar semua peserta meeting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-20 px-6 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          {/* Top Footer: Logo & Team */}
          <div className="grid md:grid-cols-3 gap-12 items-start mb-16">
            
            {/* Logo Section */}
            <div className="flex flex-col items-center md:items-start">
              <Image src="/vero-logo.svg" alt="Vero Logo" width={100} height={40} className="mb-4 grayscale opacity-70" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center md:text-left">
                © 2026 VERO ECOSYSTEM.<br/>ACCESSIBILITY FOR ALL.
              </p>
            </div>

            {/* Team Members Section (Dari Gambar) */}
            <div className="flex flex-col items-center gap-6">
              <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2">Our Creative Team</h5>
              <div className="grid grid-cols-1 gap-6 text-center">
                {teamMembers.map((member, index) => (
                  <div key={index} className="group">
                    <p className="text-sm font-black text-slate-900 uppercase italic tracking-tight group-hover:text-indigo-600 transition-colors">
                      {member.name}
                    </p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      {member.major}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col items-center md:items-end gap-4">
               <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-2">Quick Links</h5>
               <div className="flex flex-col items-center md:items-end gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  <Link href="/login" className="hover:text-indigo-600 transition-colors">Masuk</Link>
                  <Link href="/register" className="hover:text-indigo-600 transition-colors">Daftar Akun</Link>
                  <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
                  <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
               </div>
            </div>

          </div>

          <div className="pt-8 border-t border-slate-50 text-center">
            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.5em]">
              Designed with passion for inclusivity
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}