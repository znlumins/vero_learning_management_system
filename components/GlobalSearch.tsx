// components/GlobalSearch.tsx
"use client";
import { Search } from "lucide-react";
import { useState } from "react";

export default function GlobalSearch() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Di sini Anda bisa mengarahkan ke halaman pencarian global
    // atau memicu fungsi pencarian di komponen parent.
    alert(`Mencari: ${searchTerm}`);
    console.log("Mencari:", searchTerm);
    // router.push(`/search?q=${searchTerm}`); // Jika ada halaman search
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-50 w-full max-w-md focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
      <Search size={16} className="text-slate-400" />
      <input 
        type="text" 
        placeholder="Cari materi, tugas, atau pengumuman..." 
        className="bg-transparent text-sm outline-none w-full font-medium" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </form>
  );
}