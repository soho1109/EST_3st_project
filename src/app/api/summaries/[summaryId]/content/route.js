import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import {
  createSummaryAccessToken,
  getSummaryAccessCookieName,
  summaryAccessCookieOptions,
  verifySummaryAccessToken,
} from "@/lib/summary-access";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request, { params }) {
  try {
    const { summaryId } = await params;
    const body = await request.json().catch(() => ({}));
    const password = body.password ?? null;

    if (!UUID_PATTERN.test(summaryId)) {
      return Response.json(
        {
          code: "INVALID_SUMMARY_ID",
          message: "올바른 요약본 정보가 필요합니다.",
        },
        { status: 400 },
      );
    }

    if (password !== null && typeof password !== "string") {
      return Response.json(
        {
          code: "INVALID_PASSWORD_FORMAT",
          message: "비밀번호 형식이 올바르지 않습니다.",
        },
        { status: 400 },
      );
    }

    const supabaseAdmin = createAdminClient();

    const cookieStore = await cookies();
    const accessToken = cookieStore.get(getSummaryAccessCookieName(summaryId))?.value;

    const hasSummaryAccess = await verifySummaryAccessToken(accessToken, summaryId);

    if (hasSummaryAccess) {
      const { data: summaryContent, error: contentError } = await supabaseAdmin
        .from("summary_contents")
        .select("content")
        .eq("summary_id", summaryId)
        .maybeSingle();

      if (contentError) {
        console.error("접근 승인된 요약본 본문 조회 오류:", contentError);

        return Response.json(
          {
            code: "CONTENT_REQUEST_FAILED",
            message: "요약본 본문을 불러오지 못했습니다.",
          },
          { status: 500 },
        );
      }

      if (!summaryContent) {
        return Response.json(
          {
            code: "SUMMARY_NOT_FOUND",
            message: "요약본을 찾을 수 없습니다.",
          },
          { status: 404 },
        );
      }

      return Response.json(
        {
          content: summaryContent.content,
        },
        { status: 200 },
      );
    }

    const { data: result, error } = await supabaseAdmin.rpc("get_summary_content", {
      p_summary_id: summaryId,
      p_password: password,
    });

    if (error) {
      console.error("요약본 본문 RPC 오류:", error);

      return Response.json(
        {
          code: "CONTENT_REQUEST_FAILED",
          message: "요약본 본문을 불러오지 못했습니다.",
        },
        { status: 500 },
      );
    }

    if (result.status === "not_found") {
      return Response.json(
        {
          code: "SUMMARY_NOT_FOUND",
          message: "요약본을 찾을 수 없습니다.",
        },
        { status: 404 },
      );
    }

    if (result.status === "password_required") {
      return Response.json(
        {
          code: "PASSWORD_REQUIRED",
          message: "비밀번호 확인이 필요합니다.",
        },
        { status: 403 },
      );
    }

    if (result.status === "invalid_password") {
      return Response.json(
        {
          code: "INVALID_PASSWORD",
          message: "비밀번호가 일치하지 않습니다.",
        },
        { status: 403 },
      );
    }

    if (result.status !== "ok" || typeof result.content !== "string") {
      return Response.json(
        {
          code: "INVALID_CONTENT_RESPONSE",
          message: "요약본 본문 응답이 올바르지 않습니다.",
        },
        { status: 500 },
      );
    }

    if (password !== null) {
      const newAccessToken = await createSummaryAccessToken(summaryId);

      cookieStore.set(
        getSummaryAccessCookieName(summaryId),
        newAccessToken,
        summaryAccessCookieOptions,
      );
    }

    return Response.json(
      {
        content: result.content,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("요약본 본문 API 오류:", error);

    return Response.json(
      {
        code: "CONTENT_REQUEST_FAILED",
        message: "요약본 본문을 불러오는 중 문제가 발생했습니다.",
      },
      { status: 500 },
    );
  }
}
