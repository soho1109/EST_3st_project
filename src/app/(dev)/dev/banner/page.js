import Banner from "@/components/Banner";
import styles from "./page.module.scss";

export default function BannerDevPage() {
  return (
    <main className={styles["banner-dev-page"]}>
      <h1>Banner 개발 확인</h1>

      <section>
        <h2>내부 목적지 배너</h2>
        <div className={styles["banner-preview"]}>
          <Banner href="/dev" alt="개발 확인 페이지로 이동하는 프론트엔드 스킬업 이벤트" />
        </div>
      </section>

      <section>
        <h2>외부 목적지 배너</h2>
        <div className={styles["banner-preview"]}>
          <Banner
            href="https://example.com"
            alt="외부 이벤트 페이지로 이동하는 프론트엔드 스킬업 이벤트"
          />
        </div>
      </section>

      <section>
        <h2>부모 영역 너비별 배너</h2>

        <div className={styles["size-examples"]}>
          <div>
            <h3>좁은 부모 영역</h3>
            <div className={styles["narrow-parent"]}>
              <Banner href="/dev" alt="좁은 영역의 프론트엔드 스킬업 이벤트" />
            </div>
          </div>

          <div>
            <h3>중간 부모 영역</h3>
            <div className={styles["medium-parent"]}>
              <Banner href="/dev" alt="중간 영역의 프론트엔드 스킬업 이벤트" />
            </div>
          </div>

          <div>
            <h3>넓은 부모 영역</h3>
            <div className={styles["wide-parent"]}>
              <Banner href="/dev" alt="넓은 영역의 프론트엔드 스킬업 이벤트" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>목적지 없는 배너</h2>
        <div className={styles["banner-preview"]}>
          <Banner alt="이동하지 않는 프론트엔드 스킬업 이벤트" />
        </div>
      </section>

      <section>
        <h2>지원하지 않는 목적지 배너</h2>
        <div className={styles["banner-preview"]}>
          <Banner
            href="javascript:alert('invalid')"
            alt="지원하지 않는 목적지를 가진 프론트엔드 스킬업 이벤트"
          />
        </div>
      </section>

      <section>
        <h2>이미지 없는 배너</h2>
        <div className={styles["banner-preview"]}>
          <Banner imageSrc="" alt="" href="/dev" />
        </div>
      </section>
    </main>
  );
}
