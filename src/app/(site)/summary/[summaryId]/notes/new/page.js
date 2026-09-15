import { redirect, notFound } from "next/navigation";
import StudyNoteForm from "@/app/(site)/summary/[summaryId]/notes/StudyNoteForm";
import { createStudyNote } from "@/app/(site)/summary/[summaryId]/actions";
import {
  getCurrentUserId,
  getSummary,
} from "@/lib/summary-detail";
import styles from "./page.module.scss";

export default async function NewNotePage({ params }) {
  const { summaryId } = await params;
  const [summary, userId] = await Promise.all([
    getSummary(summaryId),
    getCurrentUserId(),
  ]);

  if (!summary) {
    notFound();
  }

  if (!userId) {
    redirect(`/login?returnTo=${encodeURIComponent(`/summary/${summaryId}/notes/new`)}`);
  }

  return (
    <section className={styles["note-form-section"]} data-summary-id={summaryId}>
      <StudyNoteForm
        mode="create"
        action={createStudyNote.bind(null, summaryId)}
        initialValues={{
          title: "",
          learnedSummary: "",
          reflection: "",
          references: "",
        }}
      />
    </section>
  );
}
