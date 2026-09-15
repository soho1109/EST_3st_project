"use client";

import { useState } from "react";
import styles from "./QuizModal.module.scss";

export default function QuizModal({
  isOpen,
  quiz = null,
  isUnavailable = false,
  hasSubmitted = false,
  submittedOptionId = null,
  onSubmit,
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <QuizModalContent
      key={`${quiz?.id ?? "unavailable"}-${hasSubmitted}-${submittedOptionId ?? "none"}`}
      quiz={quiz}
      isUnavailable={isUnavailable}
      hasSubmitted={hasSubmitted}
      submittedOptionId={submittedOptionId}
      onSubmit={onSubmit}
      onClose={onClose}
    />
  );
}

function QuizModalContent({ quiz, isUnavailable, hasSubmitted, submittedOptionId, onSubmit, onClose }) {
  const [selectedOptionId, setSelectedOptionId] = useState(submittedOptionId);
  const [result, setResult] = useState("idle");
  const [isSaving, setIsSaving] = useState(false);

  const persistedResult =
    hasSubmitted && quiz && submittedOptionId !== null
      ? submittedOptionId === quiz.correctOptionId
        ? "correct"
        : "incorrect"
      : "idle";
  const currentResult = result === "idle" ? persistedResult : result;

  function handleOptionChange(event) {
    if (hasSubmitted || isSaving) {
      return;
    }

    setSelectedOptionId(event.target.value);
    setResult("idle");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!quiz || isUnavailable || hasSubmitted || !selectedOptionId || currentResult !== "idle" || isSaving) {
      return;
    }

    setResult(selectedOptionId === quiz.correctOptionId ? "correct" : "incorrect");
    setIsSaving(true);

    const saved = await onSubmit?.(selectedOptionId);

    if (saved === false) {
      setResult("idle");
    }

    setIsSaving(false);
  }

  function handleClose() {
    onClose();
  }

  const isQuizUnavailable = isUnavailable || !quiz;
  const isSubmitted = hasSubmitted || currentResult !== "idle";

  return (
    <div className={styles["modal-backdrop"]}>
      {/* 보조기기가 모달의 경계와 제목을 함께 인식하도록 대화상자 의미를 제공합니다. */}
      <section
        className={styles["modal-container"]}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-modal-title"
      >
        <div className={styles["modal-heading"]}>
          <h2 id="quiz-modal-title">퀴즈 풀기</h2>
          <button className={styles["close-button"]} type="button" onClick={handleClose}>
            {/* 숨김 텍스트가 닫기 동작을 설명하므로 아이콘의 중복 낭독을 막습니다. */}
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
            <span className={styles["screen-reader-only"]}>퀴즈 모달 닫기</span>
          </button>
        </div>

        {isQuizUnavailable ? (
          <div className={styles["unavailable-state"]}>
            <p>현재 풀 수 있는 퀴즈가 없습니다.</p>
          </div>
        ) : (
          <form className={styles["quiz-form"]} onSubmit={handleSubmit}>
            <fieldset className={styles["question-box"]} disabled={isSubmitted}>
              <legend>{quiz.question}</legend>
              <ul className={styles["option-list"]}>
                {quiz.options.map(option => {
                  const isCorrectOption = option.optionId === quiz.correctOptionId;
                  const isSelectedOption = option.optionId === selectedOptionId;

                  const optionClassName = [
                    styles["option-label"],
                    isSubmitted && isCorrectOption ? styles["is-correct"] : "",
                    isSubmitted && isSelectedOption && !isCorrectOption
                      ? styles["is-incorrect"]
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <li key={option.optionId}>
                      <label className={optionClassName}>
                        <input
                          type="radio"
                          name="quiz-option"
                          value={option.optionId}
                          checked={selectedOptionId === option.optionId}
                          onChange={handleOptionChange}
                        />
                        <span>{option.label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>

            {/* 키보드 포커스를 이동하지 않고 채점 결과를 보조기기에 알립니다. */}
            <p className={styles["result-message"]} aria-live="polite">
              {currentResult === "correct" && "정답입니다."}
              {currentResult === "incorrect" && "오답입니다."}
            </p>
            {isSubmitted && (
              <div className={styles["explanation"]} aria-live="polite">
                <h3>해설</h3>
                <p className={styles["answer"]}>
                  정답: {Number(quiz.correctOptionId) + 1}번
                </p>
                <p>{quiz.explanation || "등록된 해설이 없습니다."}</p>
              </div>
            )}
            <button
              className={styles["submit-button"]}
              type="submit"
              disabled={!selectedOptionId || isSubmitted || isSaving}
            >
              퀴즈 제출
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
