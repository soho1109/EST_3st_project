import Link from 'next/link';
import { notFound } from 'next/navigation';
import EmptyState from '@/components/EmptyState';
import NoteItem from '@/components/NoteItem';
import SummaryDeleteButton from './SummaryDeleteButton';
import {
  getCurrentUserId,
  getSummary,
  getSummaryNotes,
} from '@/lib/summary-detail';
import styles from './page.module.scss';

export default async function SummaryDetailPage({ params }) {
  const { summaryId } = await params;
  const [summary, notes, userId] = await Promise.all([
    getSummary(summaryId),
    getSummaryNotes(summaryId),
    getCurrentUserId(),
  ]);

  if (!summary) {
    notFound();
  }

  return (
    <section className={styles['notes-section']}>
      <div className={styles['action-row']}>
        {userId && (
          <Link
            className={styles['create-button']}
            href={`/summary/${summaryId}/notes/new`}>
            노트 생성
          </Link>
        )}
        {userId === summary.authorId && notes.length === 0 && (
          <SummaryDeleteButton
            className={styles['delete-button']}
            summaryId={summaryId}
          />
        )}
      </div>

      <div className={styles['section-heading']}>
        <h2>학습노트 리스트</h2>
        <Link
          className={styles['more-link']}
          href={`/allnote?summaryId=${encodeURIComponent(summaryId)}`}>
          더보기
        </Link>
      </div>

      {notes.length > 0 ? (
        notes.map(note => (
          <NoteItem
            key={note.noteId}
            summaryId={note.summaryId}
            noteId={note.noteId}
            authorNickname={note.authorNickname}
            title={note.title}
            createdAt={note.createdAtDisplay}
            quizStatus={note.quizStatus}
          />
        ))
      ) : (
        <EmptyState message='현재 리스트가 없습니다.' />
      )}
    </section>
  );
}
