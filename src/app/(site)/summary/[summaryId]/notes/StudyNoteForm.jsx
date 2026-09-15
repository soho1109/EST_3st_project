"use client";

import Loading from "@/components/Loading";
import { useActionState, useState } from "react";
import styles from "./StudyNoteForm.module.scss";

const FIELD_CONFIG = [
  {
    id: "learned-summary",
    name: "learnedSummary",
    label: "오늘 배운 내용 요약",
    placeholder: "오늘 배운 내용 입력",
  },
  {
    id: "reflection",
    name: "reflection",
    label: "오늘의 회고",
    placeholder: "오늘의 회고 입력",
  },
  {
    id: "references",
    name: "references",
    label: "참고자료",
    placeholder: "참고자료 입력",
  },
];

const INITIAL_STATE = {
  status: "idle",
  fieldErrors: {},
  formError: "",
  errorCode: "",
};

function validateField(name, value) {
  const normalizedValue = value.trim();

  if (name === "title") {
    if (!normalizedValue) {
      return "제목을 입력해 주세요.";
    }

    if (normalizedValue.length > 50) {
      return "제목은 50자 이내로 입력해 주세요.";
    }

    return "";
  }

  if (normalizedValue.length > 1000) {
    return "1,000자 이내로 입력해 주세요.";
  }

  return "";
}

function getClientErrors(form) {
  const formData = new FormData(form);
  const errors = {};

  for (const name of ["title", "learnedSummary", "reflection", "references"]) {
    const value = formData.get(name);
    const error = validateField(name, typeof value === "string" ? value : "");

    if (error) {
      errors[name] = error;
    }
  }

  return errors;
}

export default function StudyNoteForm({ mode, action, initialValues }) {
  const [state, formAction, isPending] = useActionState(action, INITIAL_STATE);
  const [clientErrors, setClientErrors] = useState({});
  const titleId = mode === "edit" ? "edit-note-title" : "note-title";

  function handleBlur(event) {
    const { name, value } = event.target;
    const error = validateField(name, value);

    setClientErrors(currentErrors => {
      if (!error) {
        const nextErrors = { ...currentErrors };
        delete nextErrors[name];
        return nextErrors;
      }

      return { ...currentErrors, [name]: error };
    });
  }

  function handleSubmit(event) {
    const errors = getClientErrors(event.currentTarget);

    if (Object.keys(errors).length > 0) {
      event.preventDefault();
      setClientErrors(errors);
    }
  }

  function getFieldError(name) {
    return clientErrors[name] ?? state.fieldErrors?.[name] ?? "";
  }

  return (
    <>
      <form
        className={styles["note-form"]}
        action={formAction}
        noValidate
        onSubmit={handleSubmit}
      >
        <div className={styles["title-field"]}>
          <label className={styles["screen-reader-only"]} htmlFor={titleId}>
            제목
          </label>
          <input
            id={titleId}
            name="title"
            type="text"
            maxLength={50}
            placeholder="제목을 입력하세요"
            defaultValue={initialValues.title}
            aria-invalid={Boolean(getFieldError("title"))}
            aria-describedby={getFieldError("title") ? `${titleId}-error` : undefined}
            onBlur={handleBlur}
          />
          {getFieldError("title") && (
            <p className={styles["field-error"]} id={`${titleId}-error`} role="alert">
              {getFieldError("title")}
            </p>
          )}
        </div>

        <div className={styles["accent-line"]} />

        <div className={styles["body-fields"]}>
          {FIELD_CONFIG.map(field => {
            const fieldError = getFieldError(field.name);
            const inputId = mode === "edit" ? `edit-${field.id}` : field.id;

            return (
              <div className={styles["body-field"]} key={field.id}>
                <label htmlFor={inputId}>{field.label}</label>
                <textarea
                  id={inputId}
                  name={field.name}
                  maxLength={1000}
                  placeholder={field.placeholder}
                  defaultValue={initialValues[field.name]}
                  aria-invalid={Boolean(fieldError)}
                  aria-describedby={fieldError ? `${inputId}-error` : undefined}
                  onBlur={handleBlur}
                />
                {fieldError && (
                  <p className={styles["field-error"]} id={`${inputId}-error`} role="alert">
                    {fieldError}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {state.formError && (
          <p className={styles["form-error"]} role="alert">
            {state.formError}
          </p>
        )}

        <div className={styles["form-actions"]}>
          <button type="submit" disabled={isPending} aria-busy={isPending}>
            {mode === "edit" ? "수정 완료" : "노트작성 완료"}
          </button>
        </div>
      </form>

      {isPending && <Loading />}
    </>
  );
}
