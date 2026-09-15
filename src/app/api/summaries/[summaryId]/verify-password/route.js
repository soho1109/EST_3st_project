import { createClient } from "@/lib/supabase/server";

export async function POST(request, { params }) {
  try {
    const { summaryId } = await params;
    const { password } = await request.json();

    if (!summaryId) {
      return Response.json({ message: "요약본 정보가 필요합니다." }, { status: 400 });
    }

    if (!/^\d{4}$/.test(password ?? "")) {
      return Response.json(
        {
          isValid: false,
          message: "비밀번호는 숫자 4자리여야 합니다.",
        },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { data: isValid, error } = await supabase.rpc("verify_summary_password", {
      p_summary_id: summaryId,
      p_password: password,
    });

    if (error) {
      console.error("요약본 비밀번호 확인 오류:", error);

      return Response.json({ message: "비밀번호를 확인하지 못했습니다." }, { status: 500 });
    }

    return Response.json({ isValid });
  } catch (error) {
    console.error("요약본 비밀번호 API 오류:", error);

    return Response.json({ message: "비밀번호 확인 중 문제가 발생했습니다." }, { status: 500 });
  }
}
