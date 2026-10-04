import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ContributeForm from '../../components/ContributeForm';

export const dynamic = 'force-dynamic';

export default async function ContributePage() {
  let user = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  if (!user) redirect('/login');

  return (
    <main className="page">
      <ContributeForm user={user} />
    </main>
  );
}