import ArchiveGrid from './components/ArchiveGrid';
import { getArchiveEntries } from '../lib/data';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const entries = await getArchiveEntries();
  return <ArchiveGrid entries={entries} />;
}