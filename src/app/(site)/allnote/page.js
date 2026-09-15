import AllNotes from '@/components/AllNotes';

const ALL_NOTES_BANNER = {
  imageSrc: '/images/banner.webp',
  alt: '프론트엔드 스킬업 이벤트',
};

export default async function AllNotePage({ searchParams }) {
  const params = await searchParams;
  const summaryId =
    typeof params?.summaryId === 'string' ? params.summaryId : null;
  const scope = summaryId ? 'summary' : 'all';

  return (
    <AllNotes
      key={`${scope}:${summaryId ?? ''}`}
      scope={scope}
      summaryId={summaryId ?? undefined}
      banner={ALL_NOTES_BANNER}
      accessState='public'
    />
  );
}
