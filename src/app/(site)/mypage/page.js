"use client";
import AuthGuard from "@/components/AuthGuard";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import EmptyState from "@/components/EmptyState";
import NoteItem from "@/components/NoteItem";
import SummaryItemCard from "@/components/SummaryItemCard";
import attachProfilesToSummaries from "@/lib/supabase/summary";
import styles from "./page.module.scss";

// 프로필 이미지 Storage 연동: 업로드 이미지 형식과 최대 크기 설정.
const PROFILE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PROFILE_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const PROFILE_IMAGE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function formatLearningNoteDate(createdAt) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .replaceAll(". ", ".")
    .replace(/\.$/, "");
}

export default function Mypage() {
  // 공통 인증 정보에서 현재 로그인한 사용자와 Supabase 연결 객체를 가져오기.
  const { supabase, user } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  // 저장 요청이 진행되는 동안 수정완료 버튼을 다시 누르지 못하게 하기.
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [nickname, setNickname] = useState("사용자 닉네임");
  const [introduction, setIntroduction] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState("/images/clear.webp");
  const [learningNotes, setLearningNotes] = useState([]);
  const [isLearningNotesLoading, setIsLearningNotesLoading] = useState(true);
  const [mySummaryCards, setMySummaryCards] = useState([]);
  const [isMySummariesLoading, setIsMySummariesLoading] = useState(true);
  const [bookmarkCards, setBookmarkCards] = useState([]);
  const [isBookmarksLoading, setIsBookmarksLoading] = useState(true);
  // 토스트방식 오류메세지
  const [toastMessage, setToastMessage] = useState("");
  // 프로필 이미지 Storage 연동: 저장 전 선택 파일과 미리보기 주소 관리.
  const [draftProfileImage, setDraftProfileImage] = useState(null);
  const [draftProfileImageUrl, setDraftProfileImageUrl] = useState("");
  const [draftNickname, setDraftNickname] = useState(nickname);
  const [draftIntroduction, setDraftIntroduction] = useState(introduction);
  const draftNicknameValue = draftNickname.trim();
  const draftNicknameError = !draftNicknameValue
    ? "닉네임을 입력해 주세요."
    : draftNicknameValue.length < 2 || draftNicknameValue.length > 16
      ? "닉네임은 2~16자로 입력해 주세요."
      : "";
  const summaryListDragRef = useRef({
    element: null,
    startX: 0,
    startScrollLeft: 0,
    targetScrollLeft: 0,
    animationFrameId: null,
    isDragging: false,
  });

  // 프로필 이미지 Storage 연동: 미리보기 변경 또는 화면 이탈 시 임시 주소 정리.
  useEffect(() => {
    if (!toastMessage) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setToastMessage("");
    }, 3000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [toastMessage]);

  useEffect(() => {
    // 사용이 끝난 로컬 이미지 미리보기 주소 해제.
    return () => {
      if (draftProfileImageUrl) {
        URL.revokeObjectURL(draftProfileImageUrl);
      }
    };
  }, [draftProfileImageUrl]);

  useEffect(() => {
    // 로그인 사용자 정보가 준비된 뒤에만 프로필을 조회
    if (!user) {
      return undefined;
    }

    // 사용자가 바뀌거나 페이지를 벗어나면 이전 요청 결과를 화면에 반영x.
    let isCurrentRequest = true;

    async function fetchProfile() {
      // 로그인 사용자 ID와 같은 profiles 행에서 화면에 필요한 정보만 가져오기.
      const { data, error } = await supabase
        .from("profiles")
        .select("nickname, profile_image_url, bio")
        .eq("id", user.id)
        .single();

      if (!isCurrentRequest) {
        return;
      }

      if (error) {
        setToastMessage("프로필 정보를 불러오지 못했습니다.");
        return;
      }

      // 비어 있는 값은 마이페이지에서 사용하는 기본값으로 바꿔 표시.
      setNickname(data.nickname ?? "사용자 닉네임");
      setIntroduction(data.bio?.trim() ?? "");
      setProfileImageUrl(data.profile_image_url || "/images/clear.webp");
    }

    fetchProfile();

    return () => {
      // 이미 끝난 화면의 조회 결과가 나중에 상태를 바꾸지 못하게 표시.
      isCurrentRequest = false;
    };
  }, [supabase, user]); //로그인 후 user 정보 데이터를 가져오기

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    let isCurrentRequest = true;

    async function fetchLearningNotes() {
      setIsLearningNotesLoading(true);

      const { data, error } = await supabase
        .from("learning_notes")
        .select("id, summary_id, title, is_quiz_completed, created_at")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false });

      if (!isCurrentRequest) {
        return;
      }

      if (error) {
        setLearningNotes([]);
        setIsLearningNotesLoading(false);
        setToastMessage("내 학습노트를 불러오지 못했습니다.");
        return;
      }

      setLearningNotes(
        (data ?? []).map(note => ({
          summaryId: note.summary_id,
          noteId: note.id,
          topic: note.title,
          createdAt: formatLearningNoteDate(note.created_at),
          quizStatus: note.is_quiz_completed ? "completed" : "notStarted",
        })),
      );
      setIsLearningNotesLoading(false);
    }

    void fetchLearningNotes();

    return () => {
      isCurrentRequest = false;
    };
  }, [supabase, user]);

  useEffect(() => {
    if (!user) {
      return undefined;
    } //user가 없으면 실행 x

    let isCurrentRequest = true;
    // 내요약 노트supabase연동
    async function fetchMySummaries() {
      const { data, error } = await supabase
        .from("summaries")
        .select("id, title, excerpt, is_locked, created_at")
        .eq("author_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8);

      if (!isCurrentRequest) {
        return;
      }

      if (error) {
        setIsMySummariesLoading(false);
        setToastMessage("내 요약 노트를 불러오지 못했습니다.");
        return;
      }

      const summaryIds = data.map(summary => summary.id);
      const { data: bookmarks, error: summaryBookmarksError } = summaryIds.length
        ? await supabase
            .from("bookmarks")
            .select("summary_id")
            .eq("user_id", user.id)
            .in("summary_id", summaryIds)
        : { data: [] };

      if (!isCurrentRequest) {
        return;
      }

      if (summaryBookmarksError) {
        setToastMessage("요약 노트의 북마크 상태를 불러오지 못했습니다.");
      }

      const bookmarkedSummaryIds = new Set((bookmarks ?? []).map(bookmark => bookmark.summary_id));

      //카드 아이템 컴포로 변경 / 렌더
      setMySummaryCards(
        data.map(summary => ({
          summaryId: summary.id,
          title: summary.title,
          excerpt: summary.excerpt ?? "",
          isPrivate: summary.is_locked,
          createdAt: summary.created_at,
          isBookmarked: bookmarkedSummaryIds.has(summary.id),
        })),
      );
      setIsMySummariesLoading(false);
    }

    fetchMySummaries();

    return () => {
      isCurrentRequest = false;
    };
  }, [supabase, user]);

  useEffect(() => {
    if (!user) {
      return undefined;
    }

    let isCurrentRequest = true;

    async function fetchBookmarks() {
      // 수정: 현재 사용자가 가장 최근에 추가한 북마크 8개의 요약 ID를 먼저 조회합니다.
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from("bookmarks")
        .select("summary_id, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8);

      if (!isCurrentRequest) {
        return;
      }

      if (bookmarksError) {
        setIsBookmarksLoading(false);
        setToastMessage("북마크 목록을 불러오지 못했습니다.");
        return;
      }

      if ((bookmarks ?? []).length === 0) {
        setBookmarkCards([]);
        setIsBookmarksLoading(false);
        return;
      }

      const summaryIds = bookmarks.map(bookmark => bookmark.summary_id);
      const { data: summaries, error: summariesError } = await supabase
        .from("summaries")
        .select("id, author_id, title, excerpt, is_locked, created_at")
        .in("id", summaryIds);

      if (!isCurrentRequest) {
        return;
      }

      if (summariesError) {
        setBookmarkCards([]);
        setIsBookmarksLoading(false);
        setToastMessage("북마크한 요약 노트를 불러오지 못했습니다.");
        return;
      }

      // 수정: 카드에 작성자 정보를 표시하고 북마크 등록 최신순을 유지합니다.
      const summariesWithProfiles = await attachProfilesToSummaries(supabase, summaries ?? []);
      const summaryMap = new Map(summariesWithProfiles.map(summary => [summary.id, summary]));
      const nextBookmarkCards = summaryIds
        .map(summaryId => summaryMap.get(summaryId))
        .filter(Boolean)
        .map(summary => ({
          summaryId: summary.id,
          nickname: summary.nickname ?? "알 수 없는 사용자",
          profileImageUrl: summary.profile_image_url ?? "/images/main_profile.webp",
          title: summary.title,
          excerpt: summary.excerpt ?? "",
          isPrivate: summary.is_locked,
          createdAt: summary.created_at,
          isBookmarked: true,
        }));

      if (isCurrentRequest) {
        setBookmarkCards(nextBookmarkCards);
        setIsBookmarksLoading(false);
      }
    }

    fetchBookmarks();

    return () => {
      isCurrentRequest = false;
    };
  }, [supabase, user]);

  function handleStartProfileEdit() {
    setDraftNickname(nickname);
    setDraftIntroduction(introduction);
    setDraftProfileImage(null);
    setDraftProfileImageUrl("");
    setIsEditingProfile(true);
  }

  async function handleBookmarkToggle(summaryId) {
    if (!user) {
      return;
    }

    const targetSummary =
      bookmarkCards.find(summary => summary.summaryId === summaryId) ??
      mySummaryCards.find(summary => summary.summaryId === summaryId);

    if (!targetSummary) {
      return;
    }

    const isBookmarked = targetSummary.isBookmarked ?? false;

    if (isBookmarked) {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("summary_id", summaryId);

      if (error) {
        setToastMessage("북마크를 해제하지 못했습니다.");
        return;
      }
    } else {
      const { error } = await supabase.from("bookmarks").insert({
        user_id: user.id,
        summary_id: summaryId,
      });

      if (error) {
        setToastMessage("북마크를 추가하지 못했습니다.");
        return;
      }
    }

    const nextIsBookmarked = !isBookmarked;

    setMySummaryCards(currentCards =>
      currentCards.map(summary =>
        summary.summaryId === summaryId ? { ...summary, isBookmarked: nextIsBookmarked } : summary,
      ),
    );

    if (nextIsBookmarked) {
      setBookmarkCards(currentCards =>
        [
          {
            ...targetSummary,
            nickname,
            profileImageUrl,
            isBookmarked: true,
          },
          ...currentCards.filter(summary => summary.summaryId !== summaryId),
        ].slice(0, 8),
      );
      return;
    }

    // 북마크 삭제가 성공한 카드는 마이페이지 북마크 목록에서 제거합니다.
    setBookmarkCards(currentCards =>
      currentCards.filter(summary => summary.summaryId !== summaryId),
    );
  }

  // 프로필 이미지 Storage 연동: 선택 이미지 형식·크기 검증과 미리보기 표시.
  function handleProfileImageChange(event) {
    const selectedImage = event.target.files?.[0];

    if (!selectedImage) {
      return;
    }

    // JPEG, PNG, WebP 형식과 5MB 이하 파일만 허용.
    if (
      !PROFILE_IMAGE_TYPES.includes(selectedImage.type) ||
      selectedImage.size > PROFILE_IMAGE_MAX_SIZE
    ) {
      event.target.value = "";
      return;
    }

    setDraftProfileImage(selectedImage);
    setDraftProfileImageUrl(URL.createObjectURL(selectedImage));
  }

  async function handleCompleteProfileEdit() {
    if (!user || isSavingProfile) {
      return;
    }

    const nextNickname = draftNickname.trim();
    const nextIntroduction = draftIntroduction.trim();

    if (draftNicknameError) {
      setToastMessage(draftNicknameError);
      return;
    }

    let nextProfileImageUrl = profileImageUrl;
    setIsSavingProfile(true);

    try {
      // 프로필 이미지 Storage 연동: 새 선택 이미지만 Public 버킷에 업로드.
      if (draftProfileImage) {
        const fileExtension = PROFILE_IMAGE_EXTENSIONS[draftProfileImage.type];
        const filePath = `${user.id}/profile.${fileExtension}`;

        // Storage 정책에 맞춰 사용자 ID 폴더에 이미지 저장.
        const { error: uploadError } = await supabase.storage
          .from("profile-images")
          .upload(filePath, draftProfileImage, {
            cacheControl: "3600",
            contentType: draftProfileImage.type,
            upsert: true,
          });

        if (uploadError) {
          setToastMessage("프로필 이미지를 업로드하지 못했습니다.");
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("profile-images")
          .getPublicUrl(filePath);
        nextProfileImageUrl = publicUrlData.publicUrl;
      }

      // 프로필 이미지 Storage 연동: 새 업로드 이미지가 있을 때만 DB 이미지 URL 변경.
      const profileUpdates = {
        nickname: nextNickname,
        bio: nextIntroduction,
      };

      if (draftProfileImage) {
        profileUpdates.profile_image_url = nextProfileImageUrl;
      }

      // 새 이미지의 공개 URL을 profiles 테이블에 저장.
      const { error } = await supabase.from("profiles").update(profileUpdates).eq("id", user.id);

      if (error) {
        setToastMessage("프로필 정보를 저장하지 못했습니다.");
        return;
      }

      // Supabase 저장에 성공한 경우에만 화면 값을 바꾸고 수정 상태를 끝내기.
      setNickname(nextNickname);
      setIntroduction(nextIntroduction);
      // Storage 덮어쓰기 직후 이전 이미지 캐시 사용 방지.
      setProfileImageUrl(
        draftProfileImage ? `${nextProfileImageUrl}?updated=${Date.now()}` : nextProfileImageUrl,
      );
      setDraftProfileImage(null);
      setDraftProfileImageUrl("");
      setIsEditingProfile(false);
      // 저장된 프로필의 헤더 재조회 알림.
      window.dispatchEvent(new Event("profile-updated"));
    } finally {
      // 성공과 실패에 관계없이 저장 요청이 끝나면 버튼을 다시 사용
      setIsSavingProfile(false);
    }
  }

  function handleSummaryListPointerDown(event) {
    if (event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }

    // 북마크 버튼 조작은 가로 드래그로 처리하지 않습니다.
    if (event.target.closest("button[aria-pressed]")) {
      return;
    }

    summaryListDragRef.current = {
      element: event.currentTarget,
      startX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
      targetScrollLeft: event.currentTarget.scrollLeft,
      animationFrameId: null,
      isDragging: false,
    };
  }

  function handleSummaryListPointerMove(event) {
    const dragState = summaryListDragRef.current;

    if (dragState.element !== event.currentTarget) {
      return;
    }

    if ((event.buttons & 1) !== 1) {
      if (dragState.animationFrameId !== null) {
        window.cancelAnimationFrame(dragState.animationFrameId);
        dragState.animationFrameId = null;
      }

      dragState.element = null;
      dragState.isDragging = false;
      return;
    }

    const dragDistance = event.clientX - dragState.startX;

    if (Math.abs(dragDistance) > 5) {
      dragState.isDragging = true;
    }

    if (dragState.isDragging) {
      event.preventDefault();
      dragState.targetScrollLeft = dragState.startScrollLeft - dragDistance;

      if (dragState.animationFrameId === null) {
        dragState.animationFrameId = window.requestAnimationFrame(() => {
          if (dragState.element) {
            dragState.element.scrollLeft = dragState.targetScrollLeft;
          }

          dragState.animationFrameId = null;
        });
      }
    }
  }

  function handleSummaryListPointerEnd(event) {
    const dragState = summaryListDragRef.current;

    if (dragState.element !== event.currentTarget) {
      return;
    }

    if (dragState.animationFrameId !== null) {
      window.cancelAnimationFrame(dragState.animationFrameId);
      dragState.animationFrameId = null;
      event.currentTarget.scrollLeft = dragState.targetScrollLeft;
    }

    dragState.element = null;

    // 드래그 직후 발생하는 click을 먼저 차단한 다음 남은 드래그 상태를 정리합니다.
    window.setTimeout(() => {
      dragState.isDragging = false;
    }, 0);
  }

  function handleSummaryListPointerCancel(event) {
    handleSummaryListPointerEnd(event);
    summaryListDragRef.current.isDragging = false;
  }

  function handleSummaryListClickCapture(event) {
    if (!summaryListDragRef.current.isDragging) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    summaryListDragRef.current.isDragging = false;
  }

  return (
    <AuthGuard>
      <main className={styles["mypage"]}>
        <div className={styles.container}>
          <h1>마이페이지</h1>

          <section className={styles["profile-section"]} aria-labelledby="profile-title">
            <h2 id="profile-title">내 프로필</h2>

            <div className={styles["profile-content"]}>
              {/* 프로필 이미지 Storage 연동: 수정 중 이미지 미리보기와 파일 선택 버튼 표시. */}
              <div className={styles["profile-image"]}>
                <Image
                  src={draftProfileImageUrl || profileImageUrl}
                  alt="사용자 프로필 이미지"
                  width={120}
                  height={120}
                  unoptimized={
                    (draftProfileImageUrl || profileImageUrl).startsWith("http") ||
                    Boolean(draftProfileImageUrl)
                  }
                />
                {isEditingProfile && (
                  <label className={styles["profile-image-selector"]}>
                    {/* 키보드·스크린 리더 사용자를 위한 프로필 이미지 선택 설명. */}
                    <span className="material-symbols-outlined" aria-hidden="true">
                      photo_camera
                    </span>
                    <span className={styles["visually-hidden"]}>프로필 이미지 선택</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={isSavingProfile}
                      onChange={handleProfileImageChange}
                    />
                  </label>
                )}
              </div>

              <div className={styles["profile-details"]}>
                {isEditingProfile ? (
                  <div className={styles["profile-form"]}>
                    <label>
                      <input
                        value={draftNickname}
                        minLength={2}
                        maxLength={16}
                        aria-invalid={Boolean(draftNicknameError)}
                        onChange={event => setDraftNickname(event.target.value)}
                      />
                    </label>
                      {draftNicknameError && (
                        <span className={styles["nickname-error"]} role="alert">
                          {draftNicknameError}
                        </span>
                      )}
                    <label>
                      <input
                        value={draftIntroduction}
                        placeholder="한줄소개를 입력 해주세요"
                        onChange={event => setDraftIntroduction(event.target.value)}
                      />
                    </label>
                  </div>
                ) : (
                  <div className={styles["profile-text"]}>
                    <p className={styles.nickname}>{nickname}</p>
                    <p>{introduction || "한줄소개를 입력 해주세요"}</p>
                  </div>
                )}

                <button
                  className={styles["profile-edit-button"]}
                  type="button"
                  onClick={isEditingProfile ? handleCompleteProfileEdit : handleStartProfileEdit}
                  disabled={isSavingProfile}
                >
                  {isEditingProfile ? "수정완료" : "프로필 수정"}
                </button>
              </div>
            </div>
          </section>

          <section
            className={styles["learning-note-section"]}
            aria-labelledby="learning-note-title"
          >
            <div className={styles["section-heading"]}>
              <h2 id="learning-note-title">내 학습노트 리스트</h2>
              <Link href="/mypage/myallnotes" className={styles["more-link"]}>
                <span>더보기</span>
                <span
                  className={`material-symbols-outlined ${styles["more-icon"]}`}
                  aria-hidden="true"
                >
                  arrow_forward_ios
                </span>
              </Link>
            </div>

            <div className={styles["learning-note-table"]}>
              <div className={styles["table-header"]}>
                <div className={styles["table-leading"]}>
                  <span>상태</span>
                  <span>작성자</span>
                </div>
                <span className={styles["table-topic"]}>주제</span>
                <span>작성일</span>
              </div>
              {isLearningNotesLoading ? null : learningNotes.length === 0 ? (
                <p className={styles["empty-message"]}>현재 리스트가 없습니다.</p>
              ) : (
                learningNotes.map(note => (
                  <NoteItem
                    key={note.noteId}
                    {...note}
                    authorNickname={nickname}
                  />
                ))
              )}
            </div>
          </section>

          <section className={styles["summary-section"]} aria-labelledby="my-summary-title">
            <div className={styles["section-heading"]}>
              <h2 id="my-summary-title">내 요약 노트</h2>
              <Link href="/mypage/summaries" className={styles["more-link"]}>
                <span>더보기</span>
                <span
                  className={`material-symbols-outlined ${styles["more-icon"]}`}
                  aria-hidden="true"
                >
                  arrow_forward_ios
                </span>
              </Link>
            </div>

            {/* 가로 카드 목록을 키보드 사용자도 직접 탐색할 수 있도록 스크롤 영역에 포커스를 허용. */}
            <div
              className={styles["summary-list"]}
              aria-label="내 요약 노트 목록"
              tabIndex={0}
              onPointerDown={handleSummaryListPointerDown}
              onPointerMove={handleSummaryListPointerMove}
              onPointerUp={handleSummaryListPointerEnd}
              onPointerLeave={handleSummaryListPointerCancel}
              onPointerCancel={handleSummaryListPointerCancel}
              onClickCapture={handleSummaryListClickCapture}
            >
              {!isMySummariesLoading && mySummaryCards.length === 0 ? (
                <EmptyState message="요약 노트가 아직 생성되지 않았습니다." />
              ) : (
                mySummaryCards.map(summary => (
                  <SummaryItemCard
                    key={summary.summaryId}
                    {...summary}
                    nickname={nickname}
                    profileImageUrl={profileImageUrl}
                    onBookmarkToggle={handleBookmarkToggle}
                  />
                ))
              )}
            </div>
          </section>

          <section className={styles["summary-section"]} aria-labelledby="bookmark-title">
            <div className={styles["section-heading"]}>
              <h2 id="bookmark-title">북마크</h2>
              <Link href="/mypage/bookmarks" className={styles["more-link"]}>
                <span>더보기</span>
                <span
                  className={`material-symbols-outlined ${styles["more-icon"]}`}
                  aria-hidden="true"
                >
                  arrow_forward_ios
                </span>
              </Link>
            </div>

            {/* 가로 카드 목록을 키보드 사용자도 직접 탐색할 수 있도록 스크롤 영역에 포커스를 허용. */}
            <div
              className={styles["summary-list"]}
              aria-label="북마크 목록"
              tabIndex={0}
              onPointerDown={handleSummaryListPointerDown}
              onPointerMove={handleSummaryListPointerMove}
              onPointerUp={handleSummaryListPointerEnd}
              onPointerLeave={handleSummaryListPointerCancel}
              onPointerCancel={handleSummaryListPointerCancel}
              onClickCapture={handleSummaryListClickCapture}
            >
              {!isBookmarksLoading && bookmarkCards.length === 0 ? (
                <EmptyState message="북마크한 요약 노트가 없습니다." />
              ) : (
                bookmarkCards.map(summary => (
                  <SummaryItemCard
                    key={`bookmark-${summary.summaryId}`}
                    {...summary}
                    onBookmarkToggle={handleBookmarkToggle}
                  />
                ))
              )}
            </div>
          </section>
        </div>
        {/* 오류 안내를 즉시 읽어 주고 사용자가 자동 종료 전에 직접 닫을 수도 있게 합니다. */}
        {toastMessage && (
          <div role="alert" aria-live="assertive">
            <span>{toastMessage}</span>
            <button type="button" aria-label="오류 알림 닫기" onClick={() => setToastMessage("")}>
              <span className="material-symbols-outlined" aria-hidden="true">
                close
              </span>
            </button>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
