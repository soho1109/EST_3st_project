'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CommonModal from '@/components/CommonModal';
import Loading from '@/components/Loading';
import NotePwModal from '@/components/NotePwModal';
import { getStudyNoteDetail, getSummaryContent } from '@/lib/api/summary';
import DeleteActionButton from './DeleteActionButton';
import styles from './page.module.scss';
import { useRouter } from 'next/navigation';

const NOTE_SECTIONS = [
  { key: 'learnedSummary', label: '오늘 배운 내용 요약' },
  { key: 'reflection', label: '오늘의 회고' },
  { key: 'references', label: '참고자료' },
];

export default function StudyNoteDetailClient({ summaryId, noteId }) {
  const router = useRouter();
  const [note, setNote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [errorStatus, setErrorStatus] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadStudyNote() {
      try {
        const studyNote = await getStudyNoteDetail(summaryId, noteId);

        if (isActive) {
          setNote(studyNote);
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (error.code === 'PASSWORD_REQUIRED') {
          setIsPasswordOpen(true);
          return;
        }

        setErrorStatus(error.status ?? 'network');
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadStudyNote();

    return () => {
      isActive = false;
    };
  }, [summaryId, noteId]);

  async function handlePasswordSubmit(password) {
    if (isPasswordSubmitting) {
      return;
    }

    setIsPasswordSubmitting(true);
    setPasswordError('');

    try {
      // 기존 요약본 API가 비밀번호를 확인하고 접근 쿠키를 발급합니다.
      await getSummaryContent(summaryId, password);

      // 발급된 쿠키를 이용해 보호된 학습노트를 다시 조회합니다.
      const studyNote = await getStudyNoteDetail(summaryId, noteId);

      setNote(studyNote);
      setIsPasswordOpen(false);
    } catch (error) {
      if (error.code === 'INVALID_PASSWORD' || error.status === 403) {
        setPasswordError('비밀번호가 일치하지 않습니다.');
        return;
      }

      setIsPasswordOpen(false);
      setErrorStatus(error.status ?? 'network');
    } finally {
      setIsPasswordSubmitting(false);
    }
  }

  function handlePasswordClose() {
    setIsPasswordOpen(false);
    router.replace('/');
  }

  return (
    <>
      {isLoading && <Loading />}

      {note && (
        <section
          className={styles['note-detail']}
          data-summary-id={summaryId}
          data-note-id={noteId}>
          <div className={styles['note-heading']}>
            <h2>{note.title}</h2>
          </div>

          <div className={styles['accent-line']} />

          <div className={styles['note-content']}>
            {NOTE_SECTIONS.map(section => (
              <section className={styles['content-section']} key={section.key}>
                <h3>{section.label}</h3>
                <p>{note[section.key] || '내용이 없습니다.'}</p>
              </section>
            ))}
          </div>

          {note.isOwner && (
            <div className={styles['note-actions']}>
              <DeleteActionButton
                className={styles['delete-button']}
                summaryId={summaryId}
                noteId={noteId}
              />
              <Link
                className={styles['edit-button']}
                href={`/summary/${summaryId}/notes/${noteId}/edit`}>
                수정
              </Link>
            </div>
          )}
        </section>
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
        mode='error'
        status={errorStatus}
        onClose={() => setErrorStatus(null)}
      />
    </>
  );
}
