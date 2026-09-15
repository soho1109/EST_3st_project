import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getSummaryAccessCookieName, verifySummaryAccessToken } from "@/lib/summary-access";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
async function getCurrentUserId() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    return null;
  }

  return data?.claims?.sub ?? null;
}
export async function GET(request, { params }) {
  try {
    const { summaryId, noteId } = await params;

    if (!isUuid(summaryId) || !isUuid(noteId)) {
      return Response.json(
        {
          code: "INVALID_NOTE_ID",
          message: "올바른 학습노트 정보가 필요합니다.",
        },
        { status: 400 },
      );
    }

    const supabaseAdmin = createAdminClient();

    const [summaryResult, noteResult, currentUserId] = await Promise.all([
      supabaseAdmin.from("summaries").select("id,is_locked").eq("id", summaryId).maybeSingle(),

      supabaseAdmin
        .from("learning_notes")
        .select(
          "id,summary_id,author_id,title,learning_summary,learning_reflection,reference_materials,is_quiz_completed,created_at,updated_at",
        )
        .eq("id", noteId)
        .eq("summary_id", summaryId)
        .maybeSingle(),

      getCurrentUserId(),
    ]);

    if (summaryResult.error || noteResult.error) {
      console.error("학습노트 조회 오류:", {
        summaryError: summaryResult.error,
        noteError: noteResult.error,
      });

      return Response.json(
        {
          code: "NOTE_REQUEST_FAILED",
          message: "학습노트를 불러오지 못했습니다.",
        },
        { status: 500 },
      );
    }

    const summary = summaryResult.data;
    const note = noteResult.data;

    if (!summary || !note) {
      return Response.json(
        {
          code: "NOTE_NOT_FOUND",
          message: "학습노트를 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    const isPublicSummary = !summary.is_locked;
    const isNoteAuthor = currentUserId !== null && currentUserId === note.author_id;

    let hasSummaryAccess = false;

    if (!isPublicSummary && !isNoteAuthor) {
      const cookieStore = await cookies();
      const accessToken = cookieStore.get(getSummaryAccessCookieName(summaryId))?.value;

      hasSummaryAccess = await verifySummaryAccessToken(accessToken, summaryId);
    }

    if (!isPublicSummary && !isNoteAuthor && !hasSummaryAccess) {
      return Response.json(
        {
          code: "PASSWORD_REQUIRED",
          message: "요약본 비밀번호 확인이 필요합니다.",
        },
        { status: 403 },
      );
    }

    return Response.json(
      {
        note: {
          noteId: note.id,
          summaryId: note.summary_id,
          authorId: note.author_id,
          title: note.title,
          learnedSummary: note.learning_summary ?? "",
          reflection: note.learning_reflection ?? "",
          references: note.reference_materials ?? "",
          isQuizCompleted: Boolean(note.is_quiz_completed),
          isOwner: isNoteAuthor,
          createdAt: note.created_at,
          updatedAt: note.updated_at,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("학습노트 API 오류:", error);

    return Response.json(
      {
        code: "NOTE_REQUEST_FAILED",
        message: "학습노트를 불러오는 중 문제가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
