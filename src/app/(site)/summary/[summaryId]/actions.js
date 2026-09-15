"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/summary-detail";
import { cookies } from "next/headers";
import { getSummaryAccessCookieName, verifySummaryAccessToken } from "@/lib/summary-access";

const INITIAL_ACTION_STATE = {
  status: "idle",
  fieldErrors: {},
  formError: "",
  errorCode: "",
};

const FIELD_LABELS = {
  learnedSummary: "오늘 배운 내용 요약",
  reflection: "오늘의 회고",
  references: "참고자료",
};

function getTextValue(formData, name) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getNoteInput(formData) {
  return {
    title: getTextValue(formData, "title"),
    learnedSummary: getTextValue(formData, "learnedSummary"),
    reflection: getTextValue(formData, "reflection"),
    references: getTextValue(formData, "references"),
  };
}

function validateNoteInput(input) {
  const fieldErrors = {};

  if (!input.title) {
    fieldErrors.title = "제목을 입력해 주세요.";
  } else if (input.title.length > 50) {
    fieldErrors.title = "제목은 50자 이내로 입력해 주세요.";
  }

  for (const fieldName of ["learnedSummary", "reflection", "references"]) {
    if (input[fieldName].length > 1000) {
      fieldErrors[fieldName] = `${FIELD_LABELS[fieldName]}은 1,000자 이내로 입력해 주세요.`;
    }
  }

  return fieldErrors;
}

function createErrorState(formError, errorCode, fieldErrors = {}) {
  return {
    ...INITIAL_ACTION_STATE,
    status: "error",
    fieldErrors,
    formError,
    errorCode,
  };
}

async function getAuthenticatedContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || !userId) {
    return { supabase, userId: null };
  }

  return { supabase, userId };
}

async function getAccessibleSummary(supabase, summaryId) {
  const { data, error } = await supabase
    .from("summaries")
    .select("id,is_locked")
    .eq("id", summaryId)
    .maybeSingle();

  if (error) {
    console.error("변경 대상 요약본 조회 실패:", error);
    return { code: "REQUEST_FAILED" };
  }

  if (!data) {
    return { code: "NOT_FOUND" };
  }

  if (data.is_locked) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(getSummaryAccessCookieName(summaryId))?.value;

    const hasSummaryAccess = await verifySummaryAccessToken(accessToken, summaryId);

    if (!hasSummaryAccess) {
      return { code: "FORBIDDEN" };
    }
  }

  return { summary: data };
}

function getDatabaseErrorCode(error) {
  if (error?.code === "23505") {
    return "CONFLICT";
  }

  if (error?.code === "42501") {
    return "FORBIDDEN";
  }

  if (error?.code === "23503") {
    return "CONFLICT";
  }

  return "REQUEST_FAILED";
}

export async function createStudyNote(summaryId, _previousState, formData) {
  const input = getNoteInput(formData);
  const fieldErrors = validateNoteInput(input);

  if (!isUuid(summaryId)) {
    return createErrorState("요약본을 찾을 수 없습니다.", "NOT_FOUND");
  }

  if (Object.keys(fieldErrors).length > 0) {
    return createErrorState("입력 내용을 확인해 주세요.", "REQUEST_FAILED", fieldErrors);
  }

  const { supabase, userId } = await getAuthenticatedContext();

  if (!userId) {
    return createErrorState("로그인이 필요합니다.", "UNAUTHENTICATED");
  }

  const summaryResult = await getAccessibleSummary(supabase, summaryId);

  if (!summaryResult.summary) {
    const message =
      summaryResult.code === "FORBIDDEN"
        ? "이 요약본에 학습노트를 작성할 권한이 없습니다."
        : summaryResult.code === "REQUEST_FAILED"
          ? "요약본을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."
          : "요약본을 찾을 수 없습니다.";
    return createErrorState(message, summaryResult.code);
  }

  const { data, error } = await supabase
    .from("learning_notes")
    .insert({
      author_id: userId,
      summary_id: summaryId,
      title: input.title,
      learning_summary: input.learnedSummary || null,
      learning_reflection: input.reflection || null,
      reference_materials: input.references || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("학습노트 생성 실패:", error);
    return createErrorState("학습노트를 저장하지 못했습니다.", getDatabaseErrorCode(error));
  }

  revalidatePath(`/summary/${summaryId}`);
  redirect(`/summary/${summaryId}/notes/${data.id}`);
}

export async function updateStudyNote(summaryId, noteId, _previousState, formData) {
  const input = getNoteInput(formData);
  const fieldErrors = validateNoteInput(input);

  if (!isUuid(summaryId) || !isUuid(noteId)) {
    return createErrorState("학습노트를 찾을 수 없습니다.", "NOT_FOUND");
  }

  if (Object.keys(fieldErrors).length > 0) {
    return createErrorState("입력 내용을 확인해 주세요.", "REQUEST_FAILED", fieldErrors);
  }

  const { supabase, userId } = await getAuthenticatedContext();

  if (!userId) {
    return createErrorState("로그인이 필요합니다.", "UNAUTHENTICATED");
  }

  const { data, error } = await supabase
    .from("learning_notes")
    .update({
      title: input.title,
      learning_summary: input.learnedSummary || null,
      learning_reflection: input.reflection || null,
      reference_materials: input.references || null,
    })
    .eq("id", noteId)
    .eq("summary_id", summaryId)
    .eq("author_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("학습노트 수정 실패:", error);
    return createErrorState("학습노트를 수정하지 못했습니다.", getDatabaseErrorCode(error));
  }

  if (!data) {
    return createErrorState("학습노트를 수정할 권한이 없습니다.", "FORBIDDEN");
  }

  revalidatePath(`/summary/${summaryId}`);
  revalidatePath(`/summary/${summaryId}/notes/${noteId}`);
  revalidatePath(`/summary/${summaryId}/notes/${noteId}/edit`);
  redirect(`/summary/${summaryId}/notes/${noteId}`);
}

export async function deleteStudyNote(summaryId, noteId) {
  if (!isUuid(summaryId) || !isUuid(noteId)) {
    return createErrorState("학습노트를 찾을 수 없습니다.", "NOT_FOUND");
  }

  const { supabase, userId } = await getAuthenticatedContext();

  if (!userId) {
    return createErrorState("로그인이 필요합니다.", "UNAUTHENTICATED");
  }

  const { data, error } = await supabase
    .from("learning_notes")
    .delete()
    .eq("id", noteId)
    .eq("summary_id", summaryId)
    .eq("author_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("학습노트 삭제 실패:", error);
    return createErrorState("학습노트를 삭제하지 못했습니다.", getDatabaseErrorCode(error));
  }

  if (!data) {
    return createErrorState("학습노트를 삭제할 권한이 없습니다.", "FORBIDDEN");
  }

  revalidatePath(`/summary/${summaryId}`);
  return {
    ...INITIAL_ACTION_STATE,
    status: "success",
  };
}

export async function deleteSummary(summaryId) {
  if (!isUuid(summaryId)) {
    return createErrorState("요약본을 찾을 수 없습니다.", "NOT_FOUND");
  }

  const { supabase, userId } = await getAuthenticatedContext();

  if (!userId) {
    return createErrorState("로그인이 필요합니다.", "UNAUTHENTICATED");
  }

  const { data, error } = await supabase
    .from("summaries")
    .delete()
    .eq("id", summaryId)
    .eq("author_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("요약본 삭제 실패:", error);

    if (error.code === "23503") {
      return createErrorState(
        "학습노트가 있는 요약본은 삭제할 수 없습니다.",
        "CONFLICT",
      );
    }

    return createErrorState("요약본을 삭제하지 못했습니다.", getDatabaseErrorCode(error));
  }

  if (!data) {
    return createErrorState("요약본을 삭제할 권한이 없습니다.", "FORBIDDEN");
  }

  revalidatePath("/summary");
  revalidatePath("/allnote");
  revalidatePath("/mypage/summaries");
  revalidatePath("/mypage/bookmarks");
  revalidatePath(`/summary/${summaryId}`);

  return {
    ...INITIAL_ACTION_STATE,
    status: "success",
  };
}
