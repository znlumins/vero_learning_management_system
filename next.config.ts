// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Atau biarkan true jika tidak ada masalah lain
  reactCompiler: true,

  // --- TAMBAHKAN KONFIGURASI IMAGES DI SINI ---
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Izinkan domain Unsplash
      },
      // Tambahkan domain lain jika diperlukan, contoh:
      // {
      //   protocol: 'https',
      //   hostname: 'res.cloudinary.com',
      // },
    ],
    // Alternative (jika remotePatterns tidak bekerja di versi lama):
    // domains: ['images.unsplash.com'], 
  },
  // ---------------------------------------------
};

module.exports = nextConfig;