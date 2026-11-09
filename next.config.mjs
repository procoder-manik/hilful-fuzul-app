/** @type {import('next').NextConfig} */

// নিরাপত্তার মূল হেডার: ব্রাউজারকে শক্ত নিয়ম মানতে বলে (HTTPS বাধ্যতামূলক, অন্য সাইটে ভরে ক্লিকজ্যাকিং বন্ধ, MIME অনুমান বন্ধ ইত্যাদি)
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig = {
  poweredByHeader: false,
  images: { remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }] },
  experimental: { serverActions: { bodySizeLimit: '6mb' }, instrumentationHook: true, serverComponentsExternalPackages: ['exceljs', 'nodemailer'] },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
export default nextConfig;
