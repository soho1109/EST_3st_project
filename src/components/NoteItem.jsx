import Image from "next/image";
import Link from "next/link";
import styles from "./NoteItem.module.scss";

const QUIZ_STATUS = {
  notStarted: {
    label: "학습 전",
    imageSrc: "/images/none-clear.webp",
  },
  completed: {
    label: "학습 완료",
    imageSrc: "/images/clear.webp",
  },
};

export default function NoteItem({
  summaryId,
  noteId,
  authorNickname,
  title,
  topic,
  createdAt,
  quizStatus,
}) {
  const status = QUIZ_STATUS[quizStatus] ?? QUIZ_STATUS.notStarted;
  const displayTitle = title ?? topic;

  return (
    <Link className={styles["note-item"]} href={`/summary/${summaryId}/notes/${noteId}`}>
      <span className={styles["status-cell"]}>
        <span className={styles["status-image"]}>
          <Image src={status.imageSrc} alt="" fill sizes="40px" />
        </span>
        <span className={styles["status-label"]}>{status.label}</span>
      </span>
      <span className={styles["author-cell"]}>{authorNickname}</span>
      <span className={styles["topic-cell"]}>{displayTitle}</span>
      <time className={styles["date-cell"]}>{createdAt}</time>
    </Link>
  );
}
