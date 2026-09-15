import { notFound, redirect } from "next/navigation";
import StudyNoteForm from "@/app/(site)/summary/[summaryId]/notes/StudyNoteForm";
import { updateStudyNote } from "@/app/(site)/summary/[summaryId]/actions";
import {
  getCurrentUserId,
  getStudyNote,
  getSummary,
} from "@/lib/summary-detail";
import styles from "./page.module.scss";

export default async function EditNotePage({ params }) {
  const { summaryId, noteId } = await params;
  const [summary, note, userId] = await Promise.all([
    getSummary(summaryId),
    getStudyNote(summaryId, noteId),
    getCurrentUserId(),
  ]);

  if (!summary || !note) {
    notFound();
  }

  if (!userId || userId !== note.authorId) {
    redirect(`/summary/${summaryId}`);
  }

  return (
    <section
      className={styles["note-form-section"]}
      data-summary-id={summaryId}
      data-note-id={noteId}
    >
      <StudyNoteForm
        mode="edit"
        action={updateStudyNote.bind(null, summaryId, noteId)}
        initialValues={{
          title: note.title,
          learnedSummary: note.learnedSummary,
          reflection: note.reflection,
          references: note.references,
        }}
      />
    </section>
  );
}
