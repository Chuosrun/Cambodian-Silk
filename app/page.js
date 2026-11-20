import { Suspense } from 'react';
import ArchiveGrid from './components/ArchiveGrid';
import ProductsShowcase from '../components/ProductsShowcase';
import { getArchiveEntries } from '../lib/data';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const entries = await getArchiveEntries();
  return (
    <Suspense>
      <ArchiveGrid entries={entries}>
        <ProductsShowcase />
      </ArchiveGrid>
    </Suspense>
  );
}