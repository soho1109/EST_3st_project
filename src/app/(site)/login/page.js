"use client";
// 함수 호출
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// 컴포넌트 호출
import Image from "next/image";
import Link from "next/link";
import Loading from "@/components/Loading";
import CommonModal from "@/components/CommonModal";
import GuestGuard from "@/components/GuestGuard";

// 스타일 호출
import styles from "./page.module.scss";

// 정규화
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email) {
  if (!email.trim()) {
    return "이메일을 입력해 주세요.";
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "올바른 이메일 형식을 입력해 주세요.";
  }

  return "";
}

function validatePassword(password) {
  return password ? "" : "비밀번호를 입력해 주세요.";
}

function getReturnDestination() {
  const returnTo = new URLSearchParams(window.location.search).get("returnTo");

  return returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
}

export default function LoginPage() {
  const router = useRouter();

  // 사용자가 입력한 이메일 값을 제어하고 이메일 검증에 사용합니다.
  const [email, setEmail] = useState("");
  // 사용자가 입력한 비밀번호 값을 제어하며 실제 인증 연동 시 요청 값으로 사용합니다.
  const [password, setPassword] = useState("");
  // 이메일 입력란을 한 번이라도 벗어났는지 기록해 오류 문구의 공개 시점을 결정합니다.
  const [isEmailTouched, setIsEmailTouched] = useState(false);
  // 비밀번호 입력란을 한 번이라도 벗어났는지 기록해 오류 문구의 공개 시점을 결정합니다.
  const [isPasswordTouched, setIsPasswordTouched] = useState(false);
  // 로그인 요청 상태를 관리해 중복 제출을 막고 공통 Loading을 제어합니다.
  const [isLoading, setIsLoading] = useState(false);
  // 입력 형식은 정상이지만 Supabase 인증에 실패했을 때 표시할 문구를 관리합니다.
  const [authError, setAuthError] = useState("");
  // 네트워크 또는 서버 장애만 공통 오류 모달에 전달합니다.
  const [modalStatus, setModalStatus] = useState(null);

  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  const shouldShowValidation = isEmailTouched || isPasswordTouched;
  const validationMessage = shouldShowValidation ? emailError || passwordError : "";
  const visibleErrorMessage = authError || validationMessage;
  const hasVisibleEmailError = shouldShowValidation && Boolean(emailError);
  const hasVisiblePasswordError = shouldShowValidation && !emailError && Boolean(passwordError);
  const isFormValid = !emailError && !passwordError; // 입력값이 유효한지
  const isLoginDisabled = !isFormValid || isLoading; // 입력값 유효하지 않거나, 로딩중이거나
  const modalMode = modalStatus !== null ? "error" : null;

  function handleEmailChange(e) {
    setEmail(e.target.value);
    setAuthError("");
  }

  function handlePasswordChange(e) {
    setPassword(e.target.value);
    setAuthError("");
  }

  function handleEmailBlur() {
    setIsEmailTouched(true);
  }

  function handlePasswordBlur() {
    setIsPasswordTouched(true);
  }

  // 폼 제출
  async function handleSubmit(e) {
    e.preventDefault();
    setIsEmailTouched(true);
    setIsPasswordTouched(true);

    if (isLoginDisabled) {
      return;
    }
    setIsLoading(true);
    setAuthError("");
    setModalStatus(null);
    // 로그인 시도
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setPassword("");
        if (error.code === "invalid_credentials") {
          setAuthError("이메일 또는 비밀번호를 확인해 주세요.");
          return;
        }
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
        setAuthError("로그인에 실패 했습니다. 다시 시도해 주세요.");
        return;
      }
      router.replace(getReturnDestination());
      router.refresh();
    } catch {
      setPassword("");
      setModalStatus("network");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSocialLogin(provider) {
    setIsLoading(true);
    setModalStatus(null);

    try {
      const supabase = createClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("returnTo", getReturnDestination());
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        setModalStatus("network");
        setIsLoading(false);
      }
    } catch {
      setModalStatus("network");
      setIsLoading(false);
    }
  }

  return (
    <GuestGuard>
      <main className={styles["login-page"]}>
        <section className={styles["login-content"]} aria-labelledby="login-page-title">
          <h1 className={styles["visually-hidden"]} id="login-page-title">
            로그인
          </h1>

          <header className={styles["brand-area"]}>
            <Image
              className={styles["brand-logo"]}
              src="/images/logo.webp"
              alt="프다!"
              width={550}
              height={237}
              priority
            />
            <p className={styles["brand-description"]}>프론트엔드 지식을, 더 쉽게</p>
          </header>

          <form className={styles["login-form"]} onSubmit={handleSubmit} noValidate>
            <div className={styles["credential-row"]}>
              <fieldset className={styles["input-section"]}>
                <legend className={styles["visually-hidden"]}>이메일 로그인 정보</legend>

                <div className={styles["field-group"]}>
                  <label className={styles["visually-hidden"]} htmlFor="login-email">
                    이메일
                  </label>
                  <div className={styles["input-box"]}>
                    {/* 아이콘은 장식용이며 입력 이름은 연결된 label이 전달하므로 중복 낭독을 막습니다. */}
                    <span className="material-symbols-outlined" aria-hidden="true">
                      person
                    </span>
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      value={email}
                      placeholder="이메일"
                      autoComplete="email"
                      disabled={isLoading}
                      // 오류 상태와 문구의 관계를 보조기기가 함께 인식하도록 연결합니다.
                      aria-invalid={hasVisibleEmailError}
                      aria-describedby={
                        hasVisibleEmailError ? "login-validation-message" : undefined
                      }
                      onChange={handleEmailChange}
                      onBlur={handleEmailBlur}
                    />
                  </div>
                </div>

                <div className={styles["field-group"]}>
                  <label className={styles["visually-hidden"]} htmlFor="login-password">
                    비밀번호
                  </label>
                  <div className={styles["input-box"]}>
                    {/* 아이콘은 장식용이며 입력 이름은 연결된 label이 전달하므로 중복 낭독을 막습니다. */}
                    <span className="material-symbols-outlined" aria-hidden="true">
                      lock
                    </span>
                    <input
                      id="login-password"
                      name="password"
                      type="password"
                      value={password}
                      placeholder="비밀번호"
                      autoComplete="current-password"
                      disabled={isLoading}
                      // 오류 상태와 문구의 관계를 보조기기가 함께 인식하도록 연결합니다.
                      aria-invalid={hasVisiblePasswordError}
                      aria-describedby={
                        hasVisiblePasswordError ? "login-validation-message" : undefined
                      }
                      onChange={handlePasswordChange}
                      onBlur={handlePasswordBlur}
                    />
                  </div>
                </div>
              </fieldset>

              <button className={styles["login-button"]} type="submit" disabled={isLoginDisabled}>
                로그인
              </button>
            </div>

            {/* 오류가 없어도 영역을 유지해 메시지 표시 전후에 로그인 레이아웃이 움직이지 않게 합니다. */}
            <p
              className={styles["form-error"]}
              id="login-validation-message"
              // 현재 사용자가 수정해야 할 단일 오류 문구를 즉시 알립니다.
              role={visibleErrorMessage ? "alert" : undefined}
            >
              {visibleErrorMessage}
            </p>

            <p className={styles["session-guide"]}>
              {/* 안내 문구가 동일한 의미를 제공하므로 장식 아이콘의 중복 낭독을 막습니다. */}
              <span className="material-symbols-outlined" aria-hidden="true">
                info
              </span>
              로그아웃 전까지 로그인 상태가 유지됩니다.
            </p>

            <div className={styles["social-divider"]}>
              <span aria-hidden="true" />
              <p>간편 로그인</p>
              <span aria-hidden="true" />
            </div>

            <fieldset className={styles["social-buttons"]}>
              <legend className={styles["visually-hidden"]}>간편 로그인 제공자</legend>

              <button
                className={styles["social-button"]}
                type="button"
                disabled={isLoading}
                aria-label="카카오로 로그인"
                onClick={() => handleSocialLogin("kakao")}
              >
                {/* 접근 가능한 이름은 버튼이 제공하므로 아이콘의 중복 낭독을 막습니다. */}
                <Image src="/images/kakao-icon.svg" alt="" width={56} height={56} />
              </button>
              <button
                className={styles["social-button"]}
                type="button"
                disabled={isLoading}
                aria-label="구글로 로그인"
                onClick={() => handleSocialLogin("google")}
              >
                {/* 접근 가능한 이름은 버튼이 제공하므로 아이콘의 중복 낭독을 막습니다. */}
                <Image src="/images/google-icon.svg" alt="" width={56} height={56} />
              </button>
            </fieldset>

            <p className={styles["signup-guide"]}>
              아직 계정이 없으신가요?
              <Link href="/signup">회원가입</Link>
            </p>
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
