"use client";
import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.3, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  },
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-linear-to-br from-gray-900 to-indigo-950 flex flex-col items-center justify-center p-8 text-white overflow-hidden">
      <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500 rounded-full filter blur-3xl opacity-20 animate-pulse"></div>

      <motion.div 
        className="relative z-10 text-center mb-16 max-w-4xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Image src="/vero-logo.svg" alt="VeroApp Logo" width={200} height={80} priority className="mx-auto mb-10" />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <h1 className="text-6xl md:text-7xl font-black mb-6 tracking-tighter uppercase italic">
            Selamat Datang di <span className="text-amber-400">VeroApp</span>
          </h1>
        </motion.div>

        <motion.div variants={itemVariants}>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto font-medium">
            Platform akademik terintegrasi dengan teknologi aksesibilitas inovatif.
          </p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="mt-16 flex flex-col sm:flex-row gap-5 justify-center">
          <Link href="/login" className="px-10 py-4 bg-indigo-600 text-white font-black rounded-xl shadow-xl hover:scale-105 transition-all uppercase italic tracking-widest">
            Masuk
          </Link>
          <Link href="/register" className="px-10 py-4 border-2 border-slate-700 text-slate-200 font-bold rounded-xl hover:bg-white/10 transition-all uppercase">
            Daftar
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}