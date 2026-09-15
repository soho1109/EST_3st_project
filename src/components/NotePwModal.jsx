"use client";

import { useState } from "react";
import styles from "./NotePwModal.module.scss";

export default function NotePwModal({
  isOpen,
  isSubmitting = false,
  errorMessage = "",
  onSubmit,
  onClose,
}) {
  const [password, setPassword] = useState("");

  function handlePasswordChange(event) {
    setPassword(event.target.value);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting || password.trim() === "") {
      return;
    }

    onSubmit(password);
    setPassword("");
  }

  function handleClose() {
    setPassword("");
    onClose();
  }

  if (!isOpen) {
    return null;
  }

  const errorMessageId = errorMessage ? "note-password-error" : undefined;

  return (
    <div className={styles["modal-backdrop"]}>
      <section
        className={styles["modal-container"]}
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-password-title"
      >
        <button
          className={styles["close-button"]}
          type="button"
          aria-label="닫기"
          onClick={handleClose}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            close
          </span>
        </button>

        <h2 id="note-password-title" className={styles["modal-title"]}>
          게시글 비밀번호 입력
        </h2>

        <form className={styles["password-form"]} onSubmit={handleSubmit}>
          <label className={styles["input-label"]} htmlFor="note-password-input">
            비밀번호 입력
          </label>

          <div className={styles["input-wrapper"]}>
            <span className={`material-symbols-outlined ${styles["lock-icon"]}`} aria-hidden="true">
              lock
            </span>
            <input
              id="note-password-input"
              className={styles["password-input"]}
              type="password"
              value={password}
              placeholder="비밀번호 입력"
              aria-describedby={errorMessageId}
              aria-invalid={Boolean(errorMessage)}
              disabled={isSubmitting}
              onChange={handlePasswordChange}
            />
          </div>

          {errorMessage && (
            <p id={errorMessageId} className={styles["error-message"]} role="alert">
              {errorMessage}
            </p>
          )}

          <button className={styles["submit-button"]} type="submit" disabled={isSubmitting}>
            입력 완료
          </button>
        </form>
      </section>
    </div>
  );
}
