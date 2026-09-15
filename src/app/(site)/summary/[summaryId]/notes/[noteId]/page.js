import StudyNoteDetailClient from "./StudyNoteDetailClient";

export default async function NoteDetailPage({ params }) {
  const { summaryId, noteId } = await params;

  return <StudyNoteDetailClient summaryId={summaryId} noteId={noteId} />;
}
