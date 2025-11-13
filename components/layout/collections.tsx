'use client';

import '@/backgrounds';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { registry } from '@/lib/registry';
import useLocalStorage from '@/hooks/use-local-storage';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { BackgroundCard } from '../ui/card';
import { StarIcon } from '@phosphor-icons/react';
import { ClientOnly } from '../ui/client-only';

export const Collections = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'all' | 'fav') || 'all';
  const [favourite, toggleFavourite] = useLocalStorage<string>('favourite', []);
  const backgrounds = registry.getAll();

  const filtered = activeTab === 'fav'
    ? backgrounds.filter(({ config }) => favourite.includes(config.id))
    : backgrounds;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const setActiveTab = (tab: 'all' | 'fav') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex flex-col items-center text-base-content w-full mb-5">
      <div className="sticky top-5 flex w-full max-w-xl mx-auto mb-6 p-2 border border-white/30 rounded-lg bg-white/10 font-sans">
        {(['all', 'fav'] as const).map((tab) => {
          const label = tab === 'all' ? 'Our Collections' : 'Your Favourites';
          const count = tab === 'all' ? backgrounds.length : favourite.length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 p-2 rounded-lg text-lg font-medium transition-colors relative',
                activeTab === tab
                  ? 'bg-base-100/30'
                  : 'text-base-content/70 hover:text-base-content'
              )}
            >
              {label}{' '}
              <ClientOnly fallback={<span className="ml-1 text-sm opacity-70">(0)</span>}>
                <span className="ml-1 text-sm opacity-70">({count})</span>
              </ClientOnly>
            </button>
          );
        })}
      </div>

      <div className="w-full flex flex-wrap justify-center gap-5 px-5 md:px-10 min-h-full">
        {filtered.map(({ config, component: Component }, index) => (
          <BackgroundCard
            key={config.id}
            index={index}
            config={config}
            component={Component}
            isHovered={hoveredIndex === index}
            isFavourite={favourite.includes(config.id)}
            toggleFavourite={toggleFavourite}
            setHoveredIndex={setHoveredIndex}
          />
        ))}

        {activeTab === 'fav' && filtered.length === 0 && (
          <div className="col-span-full text-center py-12 min-h-screen text-base-content/60 font-sans">
            <p className="text-xl">You haven’t starred any backgrounds yet.</p>
            <p className="mt-2">
              Click the{' '}
              <StarIcon className="inline-block size-4 mb-0.5 text-yellow-500" weight="fill" />{' '}
              on any card to add it to your favourites.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
