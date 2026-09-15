import Image from "next/image";
import styles from "./Loading.module.scss";

const SPINNER_BAR_COUNT = 12;

// 로딩 여부는 이 컴포넌트가 판단하지 않고 호출하는 쪽의 isLoading 상태가 결정합니다.
export default function Loading() {
  return (
    <div
      className={styles["loading-overlay"]}
      // 현재 화면이 처리 중이라는 상태를 보조기기에 전달합니다.
      role="status"
      // 로딩 UI가 나타났을 때 안내 문구를 사용자 작업을 방해하지 않는 방식으로 읽습니다.
      aria-live="polite"
      // 이 영역과 관련된 작업이 아직 완료되지 않았음을 보조기기에 알립니다.
      aria-busy="true"
    >
      <div className={styles["loading-content"]}>
        {/* 이미지와 스피너는 장식 요소이며 두 줄 문구가 로딩 상태를 대신 설명합니다. */}
        <div className={styles["spinner-wrapper"]} aria-hidden="true">
          <div className={styles["spinner-ring"]}>
            {/* 값이 아닌 반복 횟수만 필요한 배열을 만들어 고정된 스피너 막대 12개를 렌더링합니다. */}
            {/* 막대의 개수와 순서는 변하지 않으므로 배열 순번을 key로 사용합니다. */}
            {Array.from({ length: SPINNER_BAR_COUNT }, (_, index) => (
              <span className={styles["spinner-bar"]} key={index} />
            ))}
          </div>

          {/* 로딩 상태의 의미는 주변 문구로 제공하므로 중복 낭독을 막기 위해 빈 대체 텍스트를 사용합니다. */}
          <Image
            className={styles["profile-image"]}
            src="/images/clear.webp"
            alt=""
            width={48}
            height={48}
            priority
          />
        </div>

        <div className={styles["loading-message"]}>
          <p>잠시만 기다려주세요.</p>
          <p>로딩중입니다</p>
        </div>
      </div>
    </div>
  );
}
