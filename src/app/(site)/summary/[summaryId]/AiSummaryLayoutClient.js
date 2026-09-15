"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";

import QuizModal from "@/components/QuizModal";
import { createClient } from "@/lib/supabase/client";

import styles from "./SummaryId.module.scss";

export default function AiSummaryLayoutClient({ summaryId, type }) {
  // 현재 페이지 정보
  const params = useParams();
  const noteId = params.noteId;

  const pathname = usePathname();
  const isEditPage = pathname.endsWith("/edit");

  // 상태 관리
  const [isBookmarked, setBookmarked] = useState(null);
  const [canCreateQuiz, setCanCreateQuiz] = useState(false);
  const [quizSubmission, setQuizSubmission] = useState({
    isCompleted: false,
    selectedOptionId: null,
  });

  //퀴즈 모달 열림 상태 관리
  const [isQuizModalOpen, setQuizModalOpen] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [isQuizUnavailable, setQuizUnavailable] = useState(true);

  const bookmarkLabel = isBookmarked ? "북마크 삭제" : "북마크 담기";

  // 북마크 상태 조회
  useEffect(() => {
    async function checkBookmarkStatus() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setBookmarked(false);
        return;
      }

      const { data, error } = await supabase
        .from("bookmarks")
        .select("summary_id")
        .eq("user_id", user.id)
        .eq("summary_id", summaryId)
        .maybeSingle();

      if (error) {
        console.error("북마크 상태 조회 실패:", error);
        return;
      }

      setBookmarked(!!data);
    }

    checkBookmarkStatus();
  }, [summaryId]);

  // 퀴즈 풀기 버튼 노출 여부 확인
  useEffect(() => {
    async function checkQuizPermission() {
      if (!noteId || noteId === "new" || isEditPage) {
        setCanCreateQuiz(false);
        setQuizSubmission({ isCompleted: false, selectedOptionId: null });
        return;
      }

      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setCanCreateQuiz(false);
        setQuizSubmission({ isCompleted: false, selectedOptionId: null });
        return;
      }

      const { data: learningNote, error } = await supabase
        .from("learning_notes")
        .select("author_id, is_quiz_completed, selected_option_index")
        .eq("id", noteId)
        .eq("summary_id", summaryId)
        .maybeSingle();

      if (error) {
        console.error("학습노트 작성자 조회 실패:", error);
        setCanCreateQuiz(false);
        setQuizSubmission({ isCompleted: false, selectedOptionId: null });
        return;
      }

      setCanCreateQuiz(learningNote?.author_id === user.id);
      setQuizSubmission({
        isCompleted: Boolean(learningNote?.is_quiz_completed),
        selectedOptionId:
          learningNote?.selected_option_index === null || learningNote?.selected_option_index === undefined
            ? null
            : String(learningNote.selected_option_index),
      });
    }

    checkQuizPermission();
  }, [noteId, summaryId, isEditPage]);

  // 퀴즈 데이터 조회
  useEffect(() => {
    async function fetchQuiz() {
      if (!summaryId) return;

      const supabase = createClient();

      const { data, error } = await supabase
        .from("quizzes")
        .select("id, question, options, answer_index, explanation")
        .eq("summary_id", summaryId)
        .maybeSingle();

      if (error) {
        console.error("퀴즈 조회 실패:", error);
        setQuiz(null);
        setQuizUnavailable(true);
        return;
      }

      if (!data) {
        setQuiz(null);
        setQuizUnavailable(true);
        return;
      }

      const formattedQuiz = {
        id: data.id,
        question: data.question,
        options: data.options.map((option, index) => ({
          optionId: String(index),
          label: option,
        })),
        correctOptionId: String(data.answer_index),
        explanation: data.explanation,
      };

      setQuiz(formattedQuiz);
      setQuizUnavailable(false);
    }

    fetchQuiz();
  }, [summaryId]);

  // 북마크 추가 / 삭제
  async function handleBookmarkToggle() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    if (isBookmarked) {
      const { error } = await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("summary_id", summaryId);

      if (error) {
        console.error("북마크 삭제 실패:", error);
        return;
      }
    } else {
      const { error } = await supabase.from("bookmarks").insert({
        user_id: user.id,
        summary_id: summaryId,
      });

      if (error) {
        console.error("북마크 추가 실패:", error);
        return;
      }
    }

    setBookmarked(current => !current);
  }

  // 퀴즈 모달
  function handleQuizModalOpen() {
    setQuizModalOpen(true);
  }

  function handleQuizModalClose() {
    setQuizModalOpen(false);
  }

  async function handleQuizSubmit(selectedOptionId) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !noteId || noteId === "new") {
      return false;
    }

    const { data, error } = await supabase
      .from("learning_notes")
      .update({
        is_quiz_completed: true,
        selected_option_index: Number(selectedOptionId),
      })
      .eq("id", noteId)
      .eq("summary_id", summaryId)
      .eq("author_id", user.id)
      .select("id")
      .maybeSingle();

    if (error || !data) {
      console.error("퀴즈 결과 저장 실패:", error);
      return false;
    }

    setQuizSubmission({ isCompleted: true, selectedOptionId });
    return true;
  }

  if (type === "bookmark") {
    if (isBookmarked === null) return null;

    return (
      <button
        className={styles["bookmark-btn"]}
        type="button"
        aria-label={bookmarkLabel}
        aria-pressed={isBookmarked}
        data-tooltip={bookmarkLabel}
        onClick={handleBookmarkToggle}
      >
        <span
          className={`material-symbols-outlined ${styles["bookmark-icon"]} ${isBookmarked ? styles["is-active"] : ""}`}
          aria-hidden="true"
        >
          bookmark_add
        </span>
      </button>
    );
  }

  if (type === "quiz" && canCreateQuiz) {
    return (
      <>
        <div className={styles["quiz-action"]}>
          <button type="button" onClick={handleQuizModalOpen}>
            퀴즈 풀기
          </button>
        </div>

        <QuizModal
          isOpen={isQuizModalOpen}
          quiz={quiz}
          isUnavailable={isQuizUnavailable}
          hasSubmitted={quizSubmission.isCompleted}
          submittedOptionId={quizSubmission.selectedOptionId}
          onSubmit={handleQuizSubmit}
          onClose={handleQuizModalClose}
        />
      </>
    );
  }

  return null;
}
