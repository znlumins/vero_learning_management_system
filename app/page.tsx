"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  Mic, 
  FileText, 
  Eye, 
  ArrowRight, 
  Menu, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail,
  Zap
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo Only */}
          <Link href="/" className="transition-transform hover:scale-105 active:scale-95">
            <Image 
              src="/vero-logo.svg" 
              alt="VeroApp Logo" 
              width={130} 
              height={40} 
              priority
              className="w-auto h-10 object-contain" 
            />
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
            <Link href="#features" className="hover:text-indigo-600 transition-colors">Fitur</Link>
            <Link href="#about" className="hover:text-indigo-600 transition-colors">Aksesibilitas</Link>
            <div className="h-4 w-px bg-slate-200 mx-2" />
            <Link href="/login" className="hover:text-indigo-600 transition-colors">Masuk</Link>
            <Link 
              href="/register" 
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:transform active:scale-95"
            >
              Coba Gratis
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden">
            <button className="p-2 text-slate-600">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-52 lg:pb-40 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] -z-20"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-50 rounded-full blur-[120px] opacity-60" />
          <div className="absolute bottom-[10%] right-[-5%] w-[500px] h-[500px] bg-blue-50 rounded-full blur-[100px] opacity-60" />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="text-center lg:text-left">
            {/* AI Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 text-sm font-bold text-indigo-700 bg-indigo-50 rounded-full border border-indigo-100">
              <Zap className="w-4 h-4 fill-indigo-600 animate-pulse" />
              AI-Powered Accessibility LMS
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1] mb-8 tracking-tighter">
              Kuliah Inklusif, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-500">
                Tanpa Hambatan.
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
              VeroApp mengintegrasikan asisten cerdas untuk membantu mahasiswa dengan berbagai kebutuhan aksesibilitas dalam mengelola materi dan tugas secara otomatis.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link 
                href="/register" 
                className="group px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-xl hover:bg-black hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
              >
                Mulai Sekarang
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Hero Visual: Clean UI Illustration */}
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-[3rem] blur-2xl opacity-50 transition duration-1000"></div>
            
            <div className="relative bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-2xl overflow-hidden min-h-[400px] flex items-center justify-center">
               <div className="text-center">
                  <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-200 mx-auto mb-6">
                    <Zap className="w-12 h-12 text-white fill-white" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Vero Assistant</h3>
                  <p className="text-slate-500 font-medium">Ready to make learning accessible.</p>
               </div>
            </div>

            {/* Accessibility Floating Badge */}
            <div className="absolute -bottom-6 -right-6 lg:-right-10 bg-white p-5 rounded-3xl shadow-2xl border border-slate-100 flex items-center gap-4 animate-bounce">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <Eye className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Standard</p>
                <p className="text-base font-bold text-slate-900 leading-none">WCAG 2.1 Ready</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-28 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Didesain untuk semua orang.</h2>
            <p className="text-lg text-slate-600 font-medium leading-relaxed">Pendidikan harus bisa diakses oleh siapa saja, di mana saja.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                title: "Voice Navigation", 
                desc: "Jelajahi seluruh sistem hanya dengan perintah suara menggunakan asisten pintar.", 
                icon: <Mic className="w-8 h-8" />, 
                color: "bg-orange-50 text-orange-600" 
              },
              { 
                title: "Smart Transcription", 
                desc: "Ubah rekaman materi menjadi teks transkrip secara real-time dengan akurasi AI.", 
                icon: <FileText className="w-8 h-8" />, 
                color: "bg-blue-50 text-blue-600" 
              },
              { 
                title: "Simplified UI Mode", 
                desc: "Mode kontras tinggi dan font khusus untuk kenyamanan membaca optimal.", 
                icon: <Eye className="w-8 h-8" />, 
                color: "bg-emerald-50 text-emerald-600" 
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-10 rounded-[2.5rem] border border-slate-200/50 shadow-sm hover:shadow-xl transition-all duration-300 group">
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-slate-900">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-slate-100 pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1">
              <Image src="/vero-logo.svg" alt="Logo" width={120} height={40} className="mb-8 h-8 w-auto" />
              <p className="text-slate-500 font-medium leading-relaxed">
                Platform LMS Inklusif pertama yang memberdayakan setiap mahasiswa dengan kecerdasan buatan.
              </p>
            </div>
            <div>
              <h4 className="text-slate-900 font-bold mb-6">Navigasi</h4>
              <ul className="text-slate-500 space-y-4 font-semibold text-sm">
                <li><Link href="#features" className="hover:text-indigo-600">Fitur Utama</Link></li>
                <li><Link href="#" className="hover:text-indigo-600">Pusat Aksesibilitas</Link></li>
                <li><Link href="#" className="hover:text-indigo-600">Dokumentasi API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-900 font-bold mb-6">Kebijakan</h4>
              <ul className="text-slate-500 space-y-4 font-semibold text-sm">
                <li><Link href="#" className="hover:text-indigo-600">Privasi Data</Link></li>
                <li><Link href="#" className="hover:text-indigo-600">Kepatuhan WCAG</Link></li>
                <li><Link href="#" className="hover:text-indigo-600">Syarat & Ketentuan</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-slate-900 font-bold mb-6">Hubungi Kami</h4>
              <p className="text-slate-500 text-sm font-semibold mb-6 flex items-center gap-2">
                <Mail className="w-4 h-4" /> support@veroapp.edu
              </p>
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer text-slate-400">
                  <Twitter className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer text-slate-400">
                  <Instagram className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer text-slate-400">
                  <Linkedin className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-sm font-bold">
              © {new Date().getFullYear()} VeroApp. Built for Everyone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}