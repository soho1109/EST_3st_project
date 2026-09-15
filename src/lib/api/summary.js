// 비밀번호
export async function verifySummaryPassword(summaryId, password) {
  const response = await fetch(`/api/summaries/${summaryId}/verify-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message ?? "비밀번호를 확인하지 못했습니다.");

    error.status = response.status;
    throw error;
  }

  return data.isValid;
}
// 요약 노트
export async function getSummaryContent(summaryId, password = null) {
  const response = await fetch(`/api/summaries/${summaryId}/content`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.message ?? "요약노트 본문을 불러오지 못했습니다.");

    error.code = data.code;
    error.status = response.status;

    throw error;
  }

  return data.content;
}

// 학습노트
export async function getStudyNoteDetail(summaryId, noteId) {
  const response = await fetch(
    `/api/summaries/${summaryId}/notes/${noteId}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(
      data.message ?? "학습노트를 불러오지 못했습니다.",
    );

    error.code = data.code;
    error.status = response.status;

    throw error;
  }

  return data.note;
}