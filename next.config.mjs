/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["192.168.29.235", "192.168.29.235:3000", "localhost:3000"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
