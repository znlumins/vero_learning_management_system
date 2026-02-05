"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutGrid, Box, Users, MessagesSquare, Settings, LogOut, 
  ChevronLeft, ChevronRight, Languages, PenTool, Mic, Presentation, 
  Compass, MonitorPlay, FileText, Archive 
} from "lucide-react"; 
import { supabase } from "@/lib/supabase";

interface SidebarProps {
  role: string;
  userName: string;
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isAkademikOpen, setIsAkademikOpen] = useState(false);
  const isInitialMount = useRef(true);

  // Data Menu
  const studioSubMenu = [
    { name: "Translate Gesture", href: "/dashboard/studio/translate", icon: Languages, color: "text-red-500" },
    { name: "Whiteboard", href: "/dashboard/studio/whiteboard", icon: PenTool, color: "text-slate-700" },
    { name: "Speech to Text", href: "/dashboard/studio/speech", icon: Mic, color: "text-slate-700" },
    { name: "Presentasi", href: "/dashboard/studio/presentasi", icon: Presentation, color: "text-slate-700" },
  ];

  const mhsAkademikMenu = [
    { name: "Jelajahi", href: "/dashboard/akademik/jelajahi", icon: Compass, color: "text-red-500" },
    { name: "Kelasku", href: "/dashboard/akademik/kelasku", icon: MonitorPlay, color: "text-slate-700" },
    { name: "Tugas & Project", href: "/dashboard/akademik/tugas", icon: FileText, color: "text-slate-700" },
    { name: "Arsip Belajar", href: "/dashboard/akademik/arsip", icon: Archive, color: "text-slate-700" },
  ];

  const akademikSubMenu = role === "DOSEN" 
    ? mhsAkademikMenu.filter(m => m.name !== "Jelajahi") 
    : mhsAkademikMenu;

  // --- PERBAIKAN UTAMA 1: Logic auto-open dan close yang saling berhubungan ---
  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }

    const isActiveInStudio = studioSubMenu.some(item => pathname.startsWith(item.href));
    const isActiveInAkademik = akademikSubMenu.some(item => pathname.startsWith(item.href));

    if (!isCollapsed) { // Hanya buka/tutup saat tidak collapsed
        if (isActiveInStudio) {
            setIsStudioOpen(true);
            setIsAkademikOpen(false); // Tutup Akademik jika Studio aktif
        } else if (isActiveInAkademik) {
            setIsAkademikOpen(true);
            setIsStudioOpen(false); // Tutup Studio jika Akademik aktif
        } else {
            // Jika tidak ada yang aktif, tutup keduanya
            setIsStudioOpen(false);
            setIsAkademikOpen(false);
        }
    } else {
        // Jika collapsed, selalu tutup keduanya
        setIsStudioOpen(false);
        setIsAkademikOpen(false);
    }
  }, [pathname, isCollapsed, studioSubMenu, akademikSubMenu]);
  // --- END PERBAIKAN useEffect ---

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const menuClass = (path: string) => `
    flex items-center gap-4 p-3 rounded-xl text-sm font-semibold transition-all duration-200
    ${pathname === path || (!isCollapsed && path !== "/dashboard" && pathname.startsWith(path)) 
      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}
    ${isCollapsed ? "justify-center" : ""}
  `;

  // --- PERBAIKAN UTAMA 2: Fungsi toggle yang saling menutup ---
  const toggleStudio = () => {
    if (isCollapsed) setIsCollapsed(false); // Selalu perlebar dulu jika ciut
    
    if (!isStudioOpen && isAkademikOpen) { // Jika Studio mau dibuka DAN Akademik sedang terbuka
      setIsAkademikOpen(false); // Tutup Akademik
    }
    setIsStudioOpen(!isStudioOpen); // Kemudian toggle Studio
  };

  const toggleAkademik = () => {
    if (isCollapsed) setIsCollapsed(false); // Selalu perlebar dulu jika ciut
    
    if (!isAkademikOpen && isStudioOpen) { // Jika Akademik mau dibuka DAN Studio sedang terbuka
      setIsStudioOpen(false); // Tutup Studio
    }
    setIsAkademikOpen(!isAkademikOpen); // Kemudian toggle Akademik
  };
  // --- END PERBAIKAN toggle functions ---

  // User info for collapsed state
  const userInitial = userName?.charAt(0)?.toUpperCase() || 'U';
  const roleInitial = role?.charAt(0)?.toUpperCase() || 'R';

  return (
    <aside 
      className={`relative min-h-screen bg-white border-r border-slate-100 flex flex-col p-6 transition-all duration-300 ease-in-out ${isCollapsed ? "w-24" : "w-72"} shrink-0 z-20 shadow-sm`}
    >
      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-4 top-12 w-8 h-8 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm hover:shadow-md hover:scale-110 transition-all z-30"
        title={isCollapsed ? "Perlebar Sidebar" : "Ciutkan Sidebar"}
      >
        <ChevronLeft size={16} className={`text-slate-600 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
      </button>

      {/* Brand Logo */}
      <div className={`flex items-center mb-10 transition-all duration-300 ${isCollapsed ? "justify-center" : "px-2"}`}>
        <Link href="/dashboard" className="relative">
          <Image
            src="/vero-logo.svg" 
            alt="VeroApp Logo"
            width={isCollapsed ? 45 : 130} 
            height={40}
            priority
            className="transition-all duration-300 object-contain"
          />
        </Link>
      </div>

      {/* User Badge */}
      <div className={`mb-6 p-3 bg-slate-50 rounded-2xl border border-slate-100 transition-all duration-300 ${isCollapsed ? "flex flex-col items-center justify-center py-4" : ""}`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold leading-none mb-1">
              {userInitial}
            </div>
            <p className="text-[9px] font-bold text-slate-800 leading-none">{roleInitial}</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userInitial}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{userName}</p>
              <p className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md inline-block mt-0.5">
                {role}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
        <Link href="/dashboard" className={menuClass("/dashboard")}>
          <LayoutGrid size={20} strokeWidth={2} /> 
          {!isCollapsed && <span>Beranda</span>}
        </Link>

        {/* Dropdown Studio */}
        <div>
          <button 
            onClick={toggleStudio} 
            className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-between"} p-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all`}
          >
            <div className="flex items-center gap-4">
              <Box size={20} strokeWidth={2} /> 
              {!isCollapsed && <span>Studio</span>}
            </div>
            {!isCollapsed && (
              <ChevronRight size={14} className={`transition-transform duration-200 ${isStudioOpen ? "rotate-90" : ""}`} />
            )}
          </button>
          
          <AnimatePresence initial={false}>
            {isStudioOpen && !isCollapsed && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden ml-6 mt-1 border-l-2 border-slate-100 pl-4 space-y-1"
              >
                {studioSubMenu.map((sub) => (
                  <Link 
                    key={sub.name} 
                    href={sub.href} 
                    className={`block py-2.5 text-xs font-semibold transition-colors ${pathname.startsWith(sub.href) ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"}`}
                  >
                    {sub.name}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dropdown Akademik */}
        <div>
          <button 
            onClick={toggleAkademik} 
            className={`w-full flex items-center ${isCollapsed ? "justify-center" : "justify-between"} p-3 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all`}
          >
            <div className="flex items-center gap-4">
              <Users size={20} strokeWidth={2} /> 
              {!isCollapsed && <span>Akademik</span>}
            </div>
            {!isCollapsed && (
              <ChevronRight size={14} className={`transition-transform duration-200 ${isAkademikOpen ? "rotate-90" : ""}`} />
            )}
          </button>
          
          <AnimatePresence initial={false}>
            {isAkademikOpen && !isCollapsed && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden ml-6 mt-1 border-l-2 border-slate-100 pl-4 space-y-1"
              >
                {akademikSubMenu.map((sub) => (
                  <Link 
                    key={sub.name} 
                    href={sub.href} 
                    className={`block py-2.5 text-xs font-semibold transition-colors ${pathname.startsWith(sub.href) ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"}`}
                  >
                    {sub.name}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link href="/dashboard/diskusi" className={menuClass("/dashboard/diskusi")}>
          <MessagesSquare size={20} strokeWidth={2} /> 
          {!isCollapsed && <span>Diskusi & Grup</span>}
        </Link>
      </nav>

      {/* Footer Actions */}
      <div className="mt-auto pt-6 border-t border-slate-100 space-y-1">
        <Link href="/dashboard/settings" 
          className={`flex items-center gap-4 p-3 rounded-xl text-slate-600 hover:bg-slate-50 transition-all ${isCollapsed ? "justify-center" : ""}`}
        >
          <Settings size={20} strokeWidth={2} />
          {!isCollapsed && <span className="font-semibold text-sm">Pengaturan</span>}
        </Link>
        <button 
          onClick={handleLogout} 
          className={`w-full flex items-center gap-4 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-all ${isCollapsed ? "justify-center" : ""}`}
        >
          <LogOut size={20} strokeWidth={2} /> 
          {!isCollapsed && <span className="font-semibold text-sm">Keluar</span>}
        </button>
      </div>
    </aside>
  );
} 