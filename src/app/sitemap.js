import { createClient } from "@/lib/supabase/server";

const siteUrl = "https://est-fe13-final-project.vercel.app";

export default async function sitemap() {
  const staticRoutes = ["/", "/summary", "/allnote"].map(path => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "daily",
    priority: path === "/" ? 1 : 0.8,
  }));

  const supabase = await createClient();
  const { data: summaries } = await supabase
    .from("summaries")
    .select("id, updated_at")
    .eq("is_locked", false);

  const summaryRoutes = (summaries ?? []).map(summary => ({
    url: `${siteUrl}/summary/${summary.id}`,
    lastModified: summary.updated_at ? new Date(summary.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...summaryRoutes];
}
