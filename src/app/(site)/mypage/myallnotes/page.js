import { redirect } from "next/navigation";
import AllNotes from "@/components/AllNotes";
import { createClient } from "@/lib/supabase/server";

function formatDate(createdAt) {
  return createdAt.slice(0, 10).replaceAll("-", ".");
}

export default async function MyAllNotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login?returnTo=%2Fmypage%2Fmyallnotes");
  }

  const [{ data: notes, error: notesError }, profileResult] = await Promise.all([
    supabase
      .from("learning_notes")
      .select("id, summary_id, title, is_quiz_completed, created_at")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false }),
    supabase.from("profiles").select("nickname").eq("id", user.id).maybeSingle(),
  ]);

  if (notesError || profileResult.error) {
    throw notesError || profileResult.error;
  }

  const learningNotes = notes ?? [];
  const items = learningNotes.map(note => ({
    noteId: note.id,
    summaryId: note.summary_id,
    authorNickname: profileResult.data?.nickname ?? "알 수 없는 사용자",
    title: note.title,
    createdAt: note.created_at,
    createdAtDisplay: formatDate(note.created_at),
    quizStatus: note.is_quiz_completed ? "completed" : "notStarted",
  }));

  return (
    <AllNotes
      scope="mine"
      initialPage={{
        totalCount: items.length,
        items,
        nextCursor: null,
        hasMore: false,
      }}
      accessState="authorized"
    />
  );
}
