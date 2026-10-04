import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ContributeForm from '../../../components/ContributeForm';
import { getEntryBySlug } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function EditPage({ params }) {
  const { slug } = await params;

  if (!slug) notFound();

  let user = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  if (!user) redirect('/login');

  const entry = await getEntryBySlug(slug);
  if (!entry) notFound();

  // Only the owner can edit
  if (entry.user_id !== user.id) {
    return (
      <main className="page page--auth">
        <p className="notice notice--error">
          This entry belongs to another contributor. You can only edit your own entries.
        </p>
        <a href="/" className="back">← Back to archive</a>
      </main>
    );
  }

  return (
    <main className="page">
      <ContributeForm user={user} entry={entry} />
    </main>
  );
}