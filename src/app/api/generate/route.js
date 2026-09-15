import { GoogleGenAI } from "@google/genai";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import {
  createSummaryAccessToken,
  getSummaryAccessCookieName,
  summaryAccessCookieOptions,
} from "@/lib/summary-access";
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request) {
  try {
    const { topic, isLocked = false, password = null } = await request.json();

    if (!topic?.trim()) {
      return Response.json({ message: "주제를 입력해주세요." }, { status: 400 });
    }
    if (typeof isLocked !== "boolean") {
      return Response.json({ message: "잠금 설정이 올바르지 않습니다." }, { status: 400 });
    }

    if (isLocked && !/^\d{4}$/.test(password ?? "")) {
      return Response.json({ message: "비밀번호는 숫자 4자리여야 합니다." }, { status: 400 });
    }
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return Response.json({ message: "로그인이 필요합니다." }, { status: 401 });
    }
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",

      contents: `
        당신은 프론트엔드 학습 노트를 만드는 AI입니다.

        사용자가 입력한 주제에 대해 제목, 학습 요약, 퀴즈를 생성하세요.

        반드시 아래 JSON 구조로만 응답하세요.

        {
          "title": "학습 노트 제목",
          "excerpt": "카드에 표시할 3줄 이내의 짧은 미리보기",
          "summary": "Markdown 형식의 학습 내용",
          "quiz": {
            "question": "객관식 문제",
            "options": [
              "보기 1",
              "보기 2",
              "보기 3",
              "보기 4"
            ],
            "answerIndex": 0,
            "explanation": "정답 해설"
          }
        }

        summary는 반드시 아래 목차를 유지하세요.

        ## 1. 한 줄 요약
        - 핵심 내용을 3줄 이내로 설명

        ## 2. 개념 설명
        - 무엇인지
        - 왜 사용하는지
        - 언제 사용하는지

        ## 3. 기본 문법
        - 적절한 언어의 Markdown 코드 블록 포함
        - 문법에 대한 설명 포함

        ## 4. 실무 예제
        - 실제로 사용할 수 있는 코드 예제
        - 예제 코드에 대한 설명

        ## 5. 핵심 포인트
        - 꼭 기억해야 할 내용
        - 목록 형식으로 정리

        ## 6. 자주 하는 실수
        - 초보자가 자주 하는 실수
        - 올바른 해결 방법

        ## 7. 관련 개념
        - 함께 공부하면 좋은 개념
        - 목록 형식으로 정리

        추가 규칙:
        - excerpt는 summary의 "1. 한 줄 요약"과 같은 핵심 내용으로 작성하세요.
        - excerpt는 Markdown 문법을 포함하지 않은 일반 문자열이어야 합니다.
        - excerpt는 카드 미리보기에 사용할 수 있도록 3줄 이내로 작성하세요.
        - summary 내부는 Markdown 문자열로 작성하세요.
        - 코드 블록을 적절히 사용하세요.
        - 지나치게 장황하지 않게 작성하세요.
        - JSON 바깥에는 어떤 설명도 작성하지 마세요.

        사용자 주제:
        ${topic}
      `,

      config: {
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text);

    const isValidQuiz =
      data.quiz &&
      typeof data.quiz.question === "string" &&
      Array.isArray(data.quiz.options) &&
      data.quiz.options.length === 4 &&
      data.quiz.options.every(option => typeof option === "string") &&
      Number.isInteger(data.quiz.answerIndex) &&
      data.quiz.answerIndex >= 0 &&
      data.quiz.answerIndex <= 3 &&
      typeof data.quiz.explanation === "string";

    const isValidGeneratedData =
      typeof data.title === "string" &&
      data.title.trim() &&
      typeof data.excerpt === "string" &&
      data.excerpt.trim() &&
      typeof data.summary === "string" &&
      data.summary.trim() &&
      isValidQuiz;

    if (!isValidGeneratedData) {
      return Response.json(
        { message: "AI가 올바른 형식의 결과를 생성하지 못했습니다." },
        { status: 502 },
      );
    }

    const { data: summaryId, error: saveError } = await supabase.rpc("create_summary_with_quiz", {
      p_topic: topic.trim(),
      p_title: data.title.trim(),
      p_excerpt: data.excerpt.trim(),
      p_content: data.summary,
      p_is_locked: isLocked,
      p_password: isLocked ? password : null,
      p_question: data.quiz.question.trim(),
      p_options: data.quiz.options,
      p_answer_index: data.quiz.answerIndex,
      p_explanation: data.quiz.explanation.trim(),
    });

    if (saveError) {
      console.error("요약본 저장 오류:", saveError);

      return Response.json({ message: "생성된 학습 노트를 저장하지 못했습니다." }, { status: 500 });
    }
    if (isLocked) {
      const cookieStore = await cookies();
      const accessToken = await createSummaryAccessToken(summaryId);

      cookieStore.set(
        getSummaryAccessCookieName(summaryId),
        accessToken,
        summaryAccessCookieOptions,
      );
    }
    return Response.json({ summaryId }, { status: 201 });
  } catch (error) {
    console.error("Gemini 생성 오류:", error);

    return Response.json({ message: "학습 노트 생성에 실패했습니다." }, { status: 500 });
  }
}
