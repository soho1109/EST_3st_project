"use client";
import { useAuth } from "./AuthProvider";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import CommonModal from "./CommonModal";
import styles from "./Header.module.scss";
import Loading from "./Loading";

const menuItems = [
  {
    label: "요약 노트 생성 (HOME)",
    icon: "assignment_add",
    href: "/",
  },
  {
    label: "전체 요약 노트",
    icon: "book_4",
    href: "/summary",
  },
  {
    label: "퀴즈",
    icon: "quiz",
    modalMode: "preparing",
  },
  {
    label: "마이페이지",
    icon: "person",
    href: "/mypage",
    requiresLogin: true,
  },
];

//헤더가 접힌 페이지
const COLLAPSED_PATHS = ["/login", "/signup", "/signup/complete"];
const HEADER_STATE_STORAGE_KEY = "isHeaderCollapsed";

export default function Header() {
  const { isAuthenticated, isLoggingOut, signOut, supabase, user } = useAuth();
  // 최초 헤더 렌더링 시 현재 경로를 기준으로 접힘/펼침 상태 결정
  // useState의 초기값, 페이지 이동 시 사용자가 선택된 상태 유지
  const pathname = usePathname();
  const loginHref = ["/signup", "/signup/complete"].includes(pathname)
    ? "/login"
    : `/login?returnTo=${encodeURIComponent(pathname || "/")}`;
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(() =>
    COLLAPSED_PATHS.includes(pathname),
  );
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPreparingModalOpen, setIsPreparingModalOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const profileNickname = user ? profile?.nickname || "user name" : "user name";
  const profileImageUrl = user
    ? profile?.profileImageUrl || "/images/main_profile.webp"
    : "/images/main_profile.webp";

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    let isCurrentRequest = true;

    async function fetchHeaderProfile() {
      // profiles 테이블에서 로그인 사용자의 헤더 정보 조회.
      const { data, error } = await supabase
        .from("profiles")
        .select("nickname, profile_image_url")
        .eq("id", user.id)
        .single();

      if (!isCurrentRequest || error) {
        return;
      }

      setProfile({
        nickname: data.nickname,
        profileImageUrl: data.profile_image_url,
      });
    }

    function handleProfileUpdated() {
      fetchHeaderProfile();
    }

    fetchHeaderProfile();
    window.addEventListener("profile-updated", handleProfileUpdated);

    return () => {
      isCurrentRequest = false;
      window.removeEventListener("profile-updated", handleProfileUpdated);
    };
  }, [supabase, user]);

  useEffect(() => {
    const mobileMediaQuery = window.matchMedia("(max-width: 480px)");

    function handleMobileViewportChange(event) {
      const savedHeaderState = window.localStorage.getItem(HEADER_STATE_STORAGE_KEY);

      if (savedHeaderState !== null) {
        setIsHeaderCollapsed(savedHeaderState === "true");
        return;
      }

      setIsHeaderCollapsed(event.matches || COLLAPSED_PATHS.includes(pathname));
    }

    handleMobileViewportChange(mobileMediaQuery);
    mobileMediaQuery.addEventListener("change", handleMobileViewportChange);

    return () => {
      mobileMediaQuery.removeEventListener("change", handleMobileViewportChange);
    };
  }, [pathname]);

  function handleCollapse() {
    setIsHeaderCollapsed(true);
    window.localStorage.setItem(HEADER_STATE_STORAGE_KEY, "true");
  }

  function handleExpand() {
    setIsHeaderCollapsed(false);
    window.localStorage.setItem(HEADER_STATE_STORAGE_KEY, "false");
  }

  function handleMypageClick() {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
    }
  }

  function handleQuizClick() {
    setIsPreparingModalOpen(true);
  }

  const headerClassName = [styles.header, isHeaderCollapsed && styles["is-collapsed"]]
    .filter(Boolean)
    .join(" ");

  //로그아웃
  async function handleLogout() {
    const { error } = await signOut();

    if (error) {
      console.error("로그아웃에 실패했습니다.", error);
    }
  }
  return (
    <aside className={headerClassName} aria-label="사이드 헤더">
      <div className={styles["header-top"]}>
        {isHeaderCollapsed ? (
          <button
            className={styles["collapsed-logo-button"]}
            type="button"
            aria-label="헤더 펼치기"
            aria-expanded="false"
            onClick={handleExpand}
          >
            <Image
              className={styles["collapsed-logo-image"]}
              src="/images/logo-mini.webp"
              alt=""
              width={40}
              height={36}
            />
            {/* 아이콘 전환은 장식 표현이므로 스크린 리더에는 버튼의 "헤더 펼치기" 이름만 전달합니다. */}
            <span
              className={`material-symbols-outlined ${styles["collapsed-panel-icon"]}`}
              aria-hidden="true"
            >
              left_panel_open
            </span>
          </button>
        ) : (
          <Link href="/" className={styles["logo-button"]} aria-label="홈으로 이동">
            <Image src="/images/logo.webp" alt="로고" width={59} height={25} />
          </Link>
        )}

        {!isHeaderCollapsed && (
          <button
            className={styles["panel-button"]}
            type="button"
            aria-label="헤더 접기"
            aria-expanded={!isHeaderCollapsed}
            onClick={handleCollapse}
          >
            <span className={`material-symbols-outlined left_panel_close ${styles.icon}`}>
              left_panel_close
            </span>
          </button>
        )}
      </div>

      {!isHeaderCollapsed && (
        <div className={styles["user-section"]}>
          {isAuthenticated ? (
            <div className={styles["logged-in-user"]}>
              <div className={styles["profile-slot"]}>
                <Image
                  src={profileImageUrl}
                  alt="프로필 이미지"
                  width={48}
                  height={48}
                  unoptimized={profileImageUrl.startsWith("http")}
                />
              </div>
              <div className={styles["profile-content"]}>
                <p className={styles["user-name"]}>{profileNickname}</p>
                <div className={styles["account-buttons"]}>
                  <Link href="/mypage" className={styles["profile-button"]}>
                    프로필 수정
                  </Link>
                  <button
                    className={styles["logout-button"]}
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles["guest-buttons"]}>
              <Link href={loginHref} className={styles["login-button"]}>
                로그인
              </Link>
              <Link href="/signup" className={styles["signup-button"]}>
                가입하기
              </Link>
            </div>
          )}
        </div>
      )}

      <nav className={styles["menu-list"]} aria-label="주요 메뉴">
        {menuItems.map(menu => {
          const menuContent = (
            <>
              <span
                className={`material-symbols-outlined ${styles["menu-icon-slot"]}`}
                aria-hidden="true"
              >
                {menu.icon}
              </span>

              {!isHeaderCollapsed && <span className={styles["menu-label"]}>{menu.label}</span>}

              {isHeaderCollapsed && (
                <span className={styles["collapsed-menu-tooltip"]}>{menu.label}</span>
              )}
            </>
          );

          if (menu.href && (!menu.requiresLogin || isAuthenticated)) {
            return (
              <Link className={styles["menu-item"]} href={menu.href} key={menu.label}>
                {menuContent}
              </Link>
            );
          }

          return (
            <button
              className={styles["menu-item"]}
              type="button"
              key={menu.label}
              onClick={
                menu.requiresLogin
                  ? handleMypageClick
                  : menu.modalMode
                    ? handleQuizClick
                    : undefined
              }
            >
              {menuContent}
            </button>
          );
        })}
      </nav>

      {isHeaderCollapsed ? (
        <div className={styles["collapsed-user-slot"]}>
          <Image
            className={`${styles["collapsed-profile-image"]} ${!isAuthenticated ? styles["is-guest"] : ""}`}
            src={isAuthenticated ? profileImageUrl : "/images/main_profile.webp"}
            alt={isAuthenticated ? "프로필 이미지" : "비로그인 사용자 프로필 이미지"}
            width={30}
            height={30}
            unoptimized={isAuthenticated && profileImageUrl.startsWith("http")}
          />
        </div>
      ) : (
        <footer className={styles.footer}>
          <span>이용약관</span>
          <span aria-hidden="true">|</span>
          <span>개인정보처리방침</span>
          <span aria-hidden="true">|</span>
          <span>고객센터</span>
        </footer>
      )}
      <CommonModal
        isOpen={isLoginModalOpen}
        mode="suggestLogin"
        loginHref="/login?returnTo=%2Fmypage"
        onClose={() => setIsLoginModalOpen(false)}
      />
      <CommonModal
        isOpen={isPreparingModalOpen}
        mode="preparing"
        onClose={() => setIsPreparingModalOpen(false)}
      />
      {isLoggingOut && <Loading />}
    </aside>
  );
}
