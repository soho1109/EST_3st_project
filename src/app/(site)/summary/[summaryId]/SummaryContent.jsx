"use client";

import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { getSummaryContent } from "@/lib/api/summary";
import { useRouter } from "next/navigation";
import Loading from "@/components/Loading";
import NotePwModal from "@/components/NotePwModal";
import CommonModal from "@/components/CommonModal";

export default function SummaryContent({ summaryId }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  useEffect(() => {
    let isActive = true;

    async function loadSummaryContent() {
      try {
        const summaryContent = await getSummaryContent(summaryId);

        if (isActive) {
          setContent(summaryContent);
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error.code === "PASSWORD_REQUIRED") {
          setIsPasswordOpen(true);
          return;
        }

        setErrorStatus(error.status ?? "network");
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadSummaryContent();

    return () => {
      isActive = false;
    };
  }, [summaryId]);

  async function handlePasswordSubmit(password) {
    setIsPasswordSubmitting(true);
    setPasswordError("");

    try {
      const summaryContent = await getSummaryContent(summaryId, password);

      setContent(summaryContent);
      setIsPasswordOpen(false);
      // 접근 쿠키 발급 후 서버 컴포넌트의 학습노트 목록을 다시 조회합니다.
      router.refresh();
    } catch (error) {
      if (error.code === "INVALID_PASSWORD" || error.status === 403) {
        setPasswordError("비밀번호가 일치하지 않습니다.");
        return;
      }

      setIsPasswordOpen(false);
      setErrorStatus(error.status ?? "network");
    } finally {
      setIsPasswordSubmitting(false);
    }
  }
  function handlePasswordClose() {
    setIsPasswordOpen(false);
    router.replace("/");
  }
  return (
    <>
      {isLoading && <Loading />}

      {!isLoading && content && (
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children }) {
              const match = /language-(\w+)/.exec(className || "");

              return match ? (
                <SyntaxHighlighter language={match[1]} style={vscDarkPlus} PreTag="div">
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code className={className}>{children}</code>
              );
            },
          }}
        >
          {content}
        </Markdown>
      )}

      <NotePwModal
        isOpen={isPasswordOpen}
        isSubmitting={isPasswordSubmitting}
        errorMessage={passwordError}
        onSubmit={handlePasswordSubmit}
        onClose={handlePasswordClose}
      />

      <CommonModal
        isOpen={errorStatus !== null}
        mode="error"
        status={errorStatus}
        onClose={() => setErrorStatus(null)}
      />
    </>
  );
}
