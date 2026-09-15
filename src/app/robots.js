const siteUrl = "https://est-fe13-final-project.vercel.app";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/summary", "/allnote"],
      disallow: ["/login", "/signup", "/mypage", "/summary/*/notes"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
