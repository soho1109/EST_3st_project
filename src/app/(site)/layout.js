import { AuthProvider } from "@/components/AuthProvider";
import Header from "@/components/Header";
import styles from "./layout.module.scss";

export const metadata = {
  title: "홈 | 프다!",
  description: "AI 기반 요약과 학습을 돕는 Front Digest 서비스",
};

export default function RootLayout({ children }) {
  return (
    <AuthProvider>
      <div className={styles["site-layout"]}>
        <Header />
        <div className={styles["site-content"]}>{children}</div>
      </div>
    </AuthProvider>
  );
}
