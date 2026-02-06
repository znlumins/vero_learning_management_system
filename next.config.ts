/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, 
  reactCompiler: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // --- TAMBAHKAN INI: Agar foto profil dari Supabase bisa muncul ---
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  // --- TAMBAHKAN REWRITES DI SINI ---
  // Fungsinya: Menghubungkan Frontend Next.js ke Backend Python (api/index.py)
  rewrites: async () => {
    return [
      {
        source: "/api/:path*",
        destination: "/api/index.py",
      },
    ];
  },
};

module.exports = nextConfig;