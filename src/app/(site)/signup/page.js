"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
// 컴포넌트
import Link from "next/link";
import Loading from "@/components/Loading";
import CommonModal from "@/components/CommonModal";
import GuestGuard from "@/components/GuestGuard";
// 스타일
import styles from "./page.module.scss";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s])\S{8,16}$/;
const SIGNUP_COMPLETED_KEY = "signupCompletedAt";

// 빈 값과 이메일 형식 오류의 우선순위를 한곳에서 관리합니다.
function validateEmail(email) {
  if (!email.trim()) {
    return "이메일을 입력해 주세요.";
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "올바른 이메일 형식을 입력해 주세요.";
  }

  return "";
}

// 비밀번호는 공백 없이 영문·숫자·특수문자를 포함한 8~16자인지 확인합니다.
function validatePassword(password) {
  if (!password) {
    return "비밀번호를 입력해 주세요.";
  }

  if (!PASSWORD_PATTERN.test(password)) {
    return "영문, 숫자, 특수문자를 포함해 8~16자로 입력해 주세요.";
  }

  return "";
}

export default function SignupPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false); // 회원가입 요청과 공통 Loading 표시 여부
  const [signupError, setSignupError] = useState(""); // 사용자가 수정할 수 있는 회원가입 오류 문구
  const [emailAuthError, setEmailAuthError] = useState(""); // 가입 요청에서 확인된 이메일 전용 오류
  const [modalStatus, setModalStatus] = useState(null); // 서버·네트워크 오류 모달에 전달할 상태
  const [nickname, setNickname] = useState(""); // 닉네임 입력값
  const [email, setEmail] = useState(""); // 이메일 입력값
  const [password, setPassword] = useState(""); // 비밀번호 입력값
  const [passwordConfirm, setPasswordConfirm] = useState(""); // 비밀번호 확인 입력값
  const [isServiceTermsAccepted, setIsServiceTermsAccepted] = useState(false); // 서비스 이용약관 동의 여부
  const [isAiTermsAccepted, setIsAiTermsAccepted] = useState(false); // AI 콘텐츠 이용 안내 동의 여부
  const [isNicknameTouched, setIsNicknameTouched] = useState(false); // 닉네임 오류 공개 여부
  const [isEmailTouched, setIsEmailTouched] = useState(false); // 이메일 오류 공개 여부
  const [isPasswordTouched, setIsPasswordTouched] = useState(false); // 비밀번호 오류 공개 여부
  const [isPasswordConfirmTouched, setIsPasswordConfirmTouched] = useState(false); // 비밀번호 확인 오류 공개 여부
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // 비밀번호 공개 여부
  const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] = useState(false); // 비밀번호 확인 공개 여부
  const [nicknameAvailability, setNicknameAvailability] = useState(null); // 닉네임 중복 확인 상태
  const nicknameCheckIdRef = useRef(0); // 늦게 도착한 이전 중복 확인 결과가 최신 입력을 덮지 않게 구분합니다.

  const isAllTermsAccepted = isServiceTermsAccepted && isAiTermsAccepted;
  const nicknameValue = nickname.trim();
  const nicknameError = !nicknameValue
    ? "닉네임을 입력해 주세요."
    : nicknameValue.length < 2 || nicknameValue.length > 16
      ? "닉네임은 2~16자로 입력해 주세요."
      : "";
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  const passwordConfirmError = !passwordConfirm
    ? "비밀번호 확인을 입력해 주세요."
    : passwordConfirm !== password
      ? "비밀번호가 일치하지 않습니다."
      : "";
  const visibleNicknameError = isNicknameTouched ? nicknameError : "";
  const visibleEmailError = isEmailTouched ? emailError : "";
  const visiblePasswordError = isPasswordTouched ? passwordError : "";
  const visiblePasswordConfirmError = isPasswordConfirmTouched ? passwordConfirmError : "";
  const nicknameFeedback = visibleNicknameError
    ? visibleNicknameError
    : nicknameAvailability === "checking"
      ? "닉네임을 확인하고 있습니다."
      : nicknameAvailability === "available"
        ? "사용 가능한 닉네임입니다."
        : nicknameAvailability === "duplicate"
          ? "이미 사용 중인 닉네임입니다."
          : nicknameAvailability === "error"
            ? "닉네임 확인에 실패했습니다. 다시 시도해 주세요."
            : "";
  const emailFeedback =
    visibleEmailError || emailAuthError || (isEmailTouched ? "사용 가능한 이메일 형식입니다." : "");
  const passwordFeedback =
    visiblePasswordError || (isPasswordTouched ? "사용 가능한 비밀번호입니다." : "");
  const passwordConfirmFeedback =
    visiblePasswordConfirmError || (isPasswordConfirmTouched ? "비밀번호가 일치합니다." : "");
  const isNicknameFeedbackError =
    Boolean(visibleNicknameError) ||
    nicknameAvailability === "duplicate" ||
    nicknameAvailability === "error";
  const isFormLocallyValid =
    isAllTermsAccepted && !nicknameError && !emailError && !passwordError && !passwordConfirmError;
  const isSignupDisabled =
    !isFormLocallyValid ||
    nicknameAvailability !== "available" ||
    Boolean(emailAuthError) ||
    isLoading;
  const modalMode = modalStatus !== null ? "error" : null;

  // 각 입력을 제어 상태로 유지해 검증 결과가 현재 화면 값과 항상 일치하게 합니다.
  function handleNicknameChange(event) {
    setNickname(event.target.value);
    nicknameCheckIdRef.current += 1;
    setNicknameAvailability(null);
    setSignupError("");
  }

  function handleEmailChange(event) {
    setEmail(event.target.value);
    setEmailAuthError("");
    setSignupError("");
  }

  function handlePasswordChange(event) {
    setPassword(event.target.value);
    setSignupError("");
  }

  function handlePasswordConfirmChange(event) {
    setPasswordConfirm(event.target.value);
    setSignupError("");
  }

  // 전체 동의는 별도 원본 상태로 저장하지 않고 두 필수 약관을 같은 값으로 변경합니다.
  function handleAllTermsChange(event) {
    const isChecked = event.target.checked;
    setIsServiceTermsAccepted(isChecked);
    setIsAiTermsAccepted(isChecked);
  }

  function handleServiceTermsChange(event) {
    setIsServiceTermsAccepted(event.target.checked);
  }

  function handleAiTermsChange(event) {
    setIsAiTermsAccepted(event.target.checked);
  }

  // 입력을 한 번 벗어난 뒤부터 오류를 공개하기 위해 입력별 touched 상태를 기록합니다.
  async function handleNicknameBlur() {
    setIsNicknameTouched(true);

    if (nicknameError) {
      setNicknameAvailability(null);
      return;
    }

    const nicknameToCheck = nickname.trim();
    const checkId = nicknameCheckIdRef.current + 1;
    nicknameCheckIdRef.current = checkId;
    setNicknameAvailability("checking");

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("nickname", nicknameToCheck)
        .maybeSingle();

      if (nicknameCheckIdRef.current !== checkId) {
        return;
      }

      if (error) {
        setNicknameAvailability("error");
        return;
      }

      setNicknameAvailability(data ? "duplicate" : "available");
    } catch {
      if (nicknameCheckIdRef.current === checkId) {
        setNicknameAvailability("error");
      }
    }
  }

  function handleEmailBlur() {
    setIsEmailTouched(true);
  }

  function handlePasswordBlur() {
    setIsPasswordTouched(true);
  }

  function handlePasswordConfirmBlur() {
    setIsPasswordConfirmTouched(true);
  }

  // 포인터나 키보드를 누르기 시작한 동안에만 첫 번째 비밀번호를 평문으로 공개합니다.
  function handlePasswordVisibilityStart() {
    setIsPasswordVisible(true);
  }

  // 버튼에서 손을 떼거나 포커스를 잃는 모든 종료 경로에서 비밀번호를 다시 숨깁니다.
  function handlePasswordVisibilityEnd() {
    setIsPasswordVisible(false);
  }

  // 비밀번호 확인 입력은 첫 번째 입력과 공개 상태를 공유하지 않습니다.
  function handlePasswordConfirmVisibilityStart() {
    setIsPasswordConfirmVisible(true);
  }

  // 확인 입력의 누름 동작이 끝나면 해당 값만 다시 마스킹합니다.
  function handlePasswordConfirmVisibilityEnd() {
    setIsPasswordConfirmVisible(false);
  }

  // 키보드 사용자가 Enter 또는 Space를 누르는 동안에도 비밀번호를 확인할 수 있게 합니다.
  function handlePasswordVisibilityKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handlePasswordVisibilityStart();
    }
  }

  function handlePasswordVisibilityKeyUp(event) {
    if (event.key === "Enter" || event.key === " ") {
      handlePasswordVisibilityEnd();
    }
  }

  function handlePasswordConfirmVisibilityKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handlePasswordConfirmVisibilityStart();
    }
  }

  function handlePasswordConfirmVisibilityKeyUp(event) {
    if (event.key === "Enter" || event.key === " ") {
      handlePasswordConfirmVisibilityEnd();
    }
  }

  // 폼 제출
  async function handleSubmit(event) {
    event.preventDefault();
    setIsNicknameTouched(true);
    setIsEmailTouched(true);
    setIsPasswordTouched(true);
    setIsPasswordConfirmTouched(true);

    if (isSignupDisabled) {
      return;
    }
    setIsLoading(true);
    setSignupError("");
    setEmailAuthError("");
    setModalStatus(null);

    // 회원가입 요청
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nickname: nickname.trim(),
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      if (error) {
        if (
          error.name === "AuthRetryableFetchError" ||
          error.status === 0 ||
          typeof error.status !== "number"
        ) {
          setModalStatus("network");
          return;
        }

        if (error.status === 429 || error.status >= 500) {
          setModalStatus(error.status);
          return;
        }

        setSignupError("회원가입을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }

      // 이메일 존재 여부 노출 방지 설정에서는 기존 사용자도 오류 없이 빈 identities로 반환될 수 있습니다.
      if (data.user?.identities?.length === 0) {
        setEmailAuthError("이미 가입된 이메일입니다.");
        return;
      }

      sessionStorage.setItem(SIGNUP_COMPLETED_KEY, Date.now().toString());
      router.replace("/signup/complete");
    } catch {
      setModalStatus("network");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <GuestGuard>
      <main className={styles["signup-page"]}>
        <section className={styles["signup-content"]}>
          <header className={styles["title-area"]}>
            <h1>회원가입</h1>
          </header>

          <form className={styles["signup-form"]} onSubmit={handleSubmit} noValidate>
            <fieldset className={styles["terms-section"]}>
              <legend>
                약관 동의 <span aria-hidden="true">*</span>
              </legend>

              <div className={styles["terms-box"]}>
                <label className={styles["all-terms"]}>
                  <input
                    type="checkbox"
                    checked={isAllTermsAccepted}
                    disabled={isLoading}
                    onChange={handleAllTermsChange}
                  />
                  <span>
                    <strong>전체동의</strong>
                    <small>두 필수 약관에 모두 동의합니다.</small>
                  </span>
                </label>

                <div className={styles["terms-divider"]} aria-hidden="true" />

                <label className={styles["term-option"]}>
                  <input
                    type="checkbox"
                    checked={isServiceTermsAccepted}
                    disabled={isLoading}
                    onChange={handleServiceTermsChange}
                  />
                  <span>(필수) 서비스 이용약관 동의</span>
                </label>

                <label className={styles["term-option"]}>
                  <input
                    type="checkbox"
                    checked={isAiTermsAccepted}
                    disabled={isLoading}
                    onChange={handleAiTermsChange}
                  />
                  <span>(필수) AI 생성 콘텐츠 이용 안내 동의</span>
                </label>
              </div>
            </fieldset>

            <div className={styles["fields-section"]}>
              <div className={styles["field-row"]}>
                <label htmlFor="signup-nickname">
                  닉네임 <span aria-hidden="true">*</span>
                </label>
                <div className={styles["field-control"]}>
                  <input
                    id="signup-nickname"
                    name="nickname"
                    type="text"
                    minLength={2}
                    maxLength={16}
                    value={nickname}
                    placeholder="닉네임"
                    autoComplete="nickname"
                    disabled={isLoading}
                    // 검증 이후 잘못된 값임을 보조기기에 전달합니다.
                    aria-invalid={isNicknameFeedbackError}
                    // 검증 결과가 있을 때 입력과 성공·오류 안내를 연결합니다.
                    aria-describedby={nicknameFeedback ? "signup-nickname-feedback" : undefined}
                    onChange={handleNicknameChange}
                    onBlur={handleNicknameBlur}
                  />
                  {nicknameFeedback && (
                    <p
                      className={
                        isNicknameFeedbackError
                          ? styles["feedback-error"]
                          : styles["feedback-success"]
                      }
                      id="signup-nickname-feedback"
                      role={isNicknameFeedbackError ? "alert" : "status"}
                    >
                      {nicknameFeedback}
                    </p>
                  )}
                </div>
              </div>

              <div className={styles["field-row"]}>
                <label htmlFor="signup-email">
                  이메일 <span aria-hidden="true">*</span>
                </label>
                <div className={styles["field-control"]}>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    value={email}
                    placeholder="사용할 이메일을 입력해 주세요."
                    autoComplete="email"
                    disabled={isLoading}
                    // 검증 이후 잘못된 값임을 보조기기에 전달합니다.
                    aria-invalid={Boolean(visibleEmailError || emailAuthError)}
                    // 공개된 오류가 있을 때만 입력과 해당 설명을 연결합니다.
                    aria-describedby={emailFeedback ? "signup-email-feedback" : undefined}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                  />
                  {emailFeedback && (
                    <p
                      className={
                        visibleEmailError || emailAuthError
                          ? styles["feedback-error"]
                          : styles["feedback-success"]
                      }
                      id="signup-email-feedback"
                      role={visibleEmailError || emailAuthError ? "alert" : "status"}
                    >
                      {emailFeedback}
                    </p>
                  )}
                </div>
              </div>

              <div className={styles["field-row"]}>
                <label htmlFor="signup-password">
                  비밀번호 <span aria-hidden="true">*</span>
                </label>
                <div className={styles["field-control"]}>
                  <div className={styles["password-input"]}>
                    <input
                      id="signup-password"
                      name="password"
                      type={isPasswordVisible ? "text" : "password"}
                      value={password}
                      placeholder="비밀번호"
                      autoComplete="new-password"
                      disabled={isLoading}
                      // 검증 이후 잘못된 값임을 보조기기에 전달합니다.
                      aria-invalid={Boolean(visiblePasswordError)}
                      // 공개된 오류가 있을 때만 입력과 해당 설명을 연결합니다.
                      aria-describedby={passwordFeedback ? "signup-password-feedback" : undefined}
                      onChange={handlePasswordChange}
                      onBlur={handlePasswordBlur}
                    />
                    <button
                      type="button"
                      disabled={isLoading}
                      // 아이콘만 있는 버튼의 기능을 보조기기가 알 수 있도록 동작을 이름으로 제공합니다.
                      aria-label="누르고 있는 동안 비밀번호 보기"
                      // 현재 비밀번호가 표시되는지 버튼의 눌림 상태로 전달합니다.
                      aria-pressed={isPasswordVisible}
                      onPointerDown={handlePasswordVisibilityStart}
                      onPointerUp={handlePasswordVisibilityEnd}
                      onPointerCancel={handlePasswordVisibilityEnd}
                      onPointerLeave={handlePasswordVisibilityEnd}
                      onKeyDown={handlePasswordVisibilityKeyDown}
                      onKeyUp={handlePasswordVisibilityKeyUp}
                      onBlur={handlePasswordVisibilityEnd}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">
                        {isPasswordVisible ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  {passwordFeedback && (
                    <p
                      className={
                        visiblePasswordError ? styles["feedback-error"] : styles["feedback-success"]
                      }
                      id="signup-password-feedback"
                      role={visiblePasswordError ? "alert" : "status"}
                    >
                      {passwordFeedback}
                    </p>
                  )}
                </div>
              </div>

              <div className={styles["field-row"]}>
                <label htmlFor="signup-password-confirm">
                  비밀번호 확인 <span aria-hidden="true">*</span>
                </label>
                <div className={styles["field-control"]}>
                  <div className={styles["password-input"]}>
                    <input
                      id="signup-password-confirm"
                      name="passwordConfirm"
                      type={isPasswordConfirmVisible ? "text" : "password"}
                      value={passwordConfirm}
                      placeholder="비밀번호 확인"
                      autoComplete="new-password"
                      disabled={isLoading}
                      // 검증 이후 잘못된 값임을 보조기기에 전달합니다.
                      aria-invalid={Boolean(visiblePasswordConfirmError)}
                      // 공개된 오류가 있을 때만 입력과 해당 설명을 연결합니다.
                      aria-describedby={
                        passwordConfirmFeedback ? "signup-password-confirm-feedback" : undefined
                      }
                      onChange={handlePasswordConfirmChange}
                      onBlur={handlePasswordConfirmBlur}
                    />
                    <button
                      type="button"
                      disabled={isLoading}
                      // 아이콘만 있는 버튼의 기능을 보조기기가 알 수 있도록 동작을 이름으로 제공합니다.
                      aria-label="누르고 있는 동안 비밀번호 확인 보기"
                      // 확인 입력의 공개 여부를 첫 번째 비밀번호와 독립된 눌림 상태로 전달합니다.
                      aria-pressed={isPasswordConfirmVisible}
                      onPointerDown={handlePasswordConfirmVisibilityStart}
                      onPointerUp={handlePasswordConfirmVisibilityEnd}
                      onPointerCancel={handlePasswordConfirmVisibilityEnd}
                      onPointerLeave={handlePasswordConfirmVisibilityEnd}
                      onKeyDown={handlePasswordConfirmVisibilityKeyDown}
                      onKeyUp={handlePasswordConfirmVisibilityKeyUp}
                      onBlur={handlePasswordConfirmVisibilityEnd}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">
                        {isPasswordConfirmVisible ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  {passwordConfirmFeedback && (
                    <p
                      className={
                        visiblePasswordConfirmError
                          ? styles["feedback-error"]
                          : styles["feedback-success"]
                      }
                      id="signup-password-confirm-feedback"
                      role={visiblePasswordConfirmError ? "alert" : "status"}
                    >
                      {passwordConfirmFeedback}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {signupError && (
              <p className={styles["signup-error"]} role="alert">
                {signupError}
              </p>
            )}
            <div className={styles["action-area"]}>
              <button className={styles["signup-button"]} type="submit" disabled={isSignupDisabled}>
                가입하기
              </button>
              <Link className={styles["login-link"]} href="/login">
                이미 계정이 있습니다.
              </Link>
            </div>
          </form>
        </section>
        {isLoading && <Loading />}

        <CommonModal
          isOpen={modalMode !== null}
          mode={modalMode}
          status={modalStatus}
          onClose={() => setModalStatus(null)}
        />
      </main>
    </GuestGuard>
  );
}
