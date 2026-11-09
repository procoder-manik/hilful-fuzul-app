/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }] },
  experimental: { serverActions: { bodySizeLimit: '6mb' }, instrumentationHook: true, serverComponentsExternalPackages: ['exceljs', 'nodemailer'] },
};
export default nextConfig;
