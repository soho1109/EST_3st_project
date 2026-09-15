import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import {
  getSummaryAccessCookieName,
  verifySummaryAccessToken,
} from "@/lib/summary-access";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function formatCreatedAt(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const parts = new Intl.DateTimeFormat("ko-KR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(date);
  const partMap = new Map(parts.map(part => [part.type, part.value]));

  return `${partMap.get("year")}.${partMap.get("month")}.${partMap.get("day")}`;
}

function normalizeSectionHeading(heading) {
  return heading.replace(/^\d+\.\s*/, "").trim();
}

function parseSummaryContent(content, fallbackExcerpt) {
  const source = typeof content === "string" ? content.trim() : "";

  if (!source) {
    return fallbackExcerpt ? [{ heading: "요약", content: [fallbackExcerpt] }] : [];
  }

  const sections = [];
  let currentSection = null;
  let isCodeBlock = false;

  for (const line of source.split(/\r?\n/)) {
    if (line.trim().startsWith("```")) {
      isCodeBlock = !isCodeBlock;
      if (currentSection) {
        currentSection.content.push(line);
      }
      continue;
    }

    const headingMatch = !isCodeBlock ? line.match(/^#{1,6}\s+(.+)$/) : null;

    if (headingMatch) {
      currentSection = {
        heading: normalizeSectionHeading(headingMatch[1]),
        content: [],
      };
      sections.push(currentSection);
      continue;
    }

    const normalizedLine = line.replace(/^\s*[-*]\s*/, "").trim();

    if (normalizedLine && currentSection) {
      currentSection.content.push(normalizedLine);
    }
  }

  if (sections.length === 0) {
    return [{ heading: "요약", content: [source] }];
  }

  return sections.map(section => ({
    ...section,
    content: section.content.length > 0 ? section.content : ["내용이 없습니다."],
  }));
}

function normalizeSummary(row, content) {
  return {
    summaryId: row.id,
    authorId: row.author_id,
    topic: row.topic,
    title: row.title,
    excerpt: row.excerpt ?? "",
    isLocked: Boolean(row.is_locked),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    contentSections: parseSummaryContent(content, row.excerpt),
  };
}

function normalizeStudyNote(row, nickname) {
  return {
    noteId: row.id,
    summaryId: row.summary_id,
    authorId: row.author_id,
    authorNickname: nickname ?? "알 수 없는 사용자",
    title: row.title,
    learnedSummary: row.learning_summary ?? "",
    reflection: row.learning_reflection ?? "",
    references: row.reference_materials ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdAtDisplay: formatCreatedAt(row.created_at),
    quizStatus: row.is_quiz_completed ? "completed" : "notStarted",
    isOwner: false,
  };
}

async function attachNoteAuthors(supabase, rows) {
  const authorIds = [...new Set(rows.map(row => row.author_id).filter(Boolean))];
  let profiles = [];

  if (authorIds.length > 0) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,nickname")
      .in("id", authorIds);

    if (error) {
      console.error("학습노트 작성자 조회 실패:", error);
    } else {
      profiles = data ?? [];
    }
  }

  const profileMap = new Map(profiles.map(profile => [profile.id, profile.nickname]));

  return rows.map(row => normalizeStudyNote(row, profileMap.get(row.author_id)));
}

async function getClaimsUserId(supabase) {
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  return data.claims.sub;
}

export async function getCurrentUserId() {
  const supabase = await createClient();
  return getClaimsUserId(supabase);
}

export async function getSummary(summaryId) {
  if (!isUuid(summaryId)) {
    return null;
  }

  const supabase = await createClient();
  const { data: summary, error: summaryError } = await supabase
    .from("summaries")
    .select("id,author_id,topic,title,excerpt,is_locked,created_at,updated_at")
    .eq("id", summaryId)
    .maybeSingle();

  if (summaryError) {
    console.error("요약본 조회 실패:", summaryError);
    throw new Error("요약본을 조회할 수 없습니다.");
  }

  if (!summary) {
    return null;
  }

  return normalizeSummary(summary);
}

export async function getSummaryNotes(summaryId) {
  if (!isUuid(summaryId)) {
    return [];
  }

  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();
  const [summaryResult, userId] = await Promise.all([
    supabaseAdmin
      .from("summaries")
      .select("author_id,is_locked")
      .eq("id", summaryId)
      .maybeSingle(),
    getClaimsUserId(supabase),
  ]);

  if (summaryResult.error || !summaryResult.data) {
    return [];
  }

  const summary = summaryResult.data;
  let hasAccess = !summary.is_locked || summary.author_id === userId;

  if (!hasAccess) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(getSummaryAccessCookieName(summaryId))?.value;

    hasAccess = await verifySummaryAccessToken(accessToken, summaryId);
  }

  if (!hasAccess) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("learning_notes")
    .select(
      "id,summary_id,author_id,title,learning_summary,learning_reflection,reference_materials,is_quiz_completed,created_at,updated_at",
    )
    .eq("summary_id", summaryId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    console.error("학습노트 목록 조회 실패:", error);
    throw new Error("학습노트 목록을 조회할 수 없습니다.");
  }

  return attachNoteAuthors(supabaseAdmin, data ?? []);
}

export async function getStudyNote(summaryId, noteId) {
  if (!isUuid(summaryId) || !isUuid(noteId)) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("learning_notes")
    .select(
      "id,summary_id,author_id,title,learning_summary,learning_reflection,reference_materials,is_quiz_completed,created_at,updated_at",
    )
    .eq("summary_id", summaryId)
    .eq("id", noteId)
    .maybeSingle();

  if (error) {
    console.error("학습노트 조회 실패:", error);
    throw new Error("학습노트를 조회할 수 없습니다.");
  }

  if (!data) {
    return null;
  }

  const [note] = await attachNoteAuthors(supabase, [data]);
  return note ?? null;
}

export { isUuid };
