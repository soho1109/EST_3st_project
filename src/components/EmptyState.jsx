import Image from "next/image";
import styles from "./EmptyState.module.scss";

export default function EmptyState({ message }) {
  return (
    // 목록 갱신 후 나타나는 빈 결과를 화면 읽기 사용자에게 방해 없이 알립니다.
    <div className={styles["empty-state"]} role="status" aria-live="polite">
      <span className={styles["empty-image"]}>
        {/* 안내 문구가 상태 의미를 전달하므로 장식 이미지는 중복 낭독에서 제외합니다. */}
        <Image src="/images/clear.webp" alt="" fill sizes="171px" />
      </span>
      <p className={styles["empty-message"]}>{message}</p>
    </div>
  );
}
