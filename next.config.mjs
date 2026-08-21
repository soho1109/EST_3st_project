import path from "path";
/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    loadPaths: [path.join(process.cwd(), "src")],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "butledktkepwtddjsoah.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "img1.kakaocdn.net",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "img1.kakaocdn.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
