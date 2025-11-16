'use client';
import '@/backgrounds';
import { registry } from '@/lib/registry';
import useLocalStorage from '@/hooks/use-local-storage';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { BackgroundCard } from '../ui/card';
import { StarIcon } from '@phosphor-icons/react';
import { useCommandPalette } from '../ui/command-palette';

export const Collections = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'fav'>('all');
  const [favourite, toggleFavourite] = useLocalStorage<string>('favourite', []);
  const { toggleOpen } = useCommandPalette()
  const backgrounds = registry.getAll();

  const filtered = activeTab === 'fav'
    ? backgrounds.filter(({ config }) => favourite.includes(config.id))
    : backgrounds;

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        toggleOpen()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }

  }, [])


  return (
    <div className="text-base-content w-full mb-10">
      <div className="sticky top-0 z-40 w-full">

        <div className='backdrop-blur-lg flex w-full max-w-xl mx-auto mb-10 p-2 border border-white/30 rounded-lg bg-white/10 font-sans'>
          {(['all', 'fav'] as const).map((tab) => {
            const label = tab === 'all' ? 'Our Collections' : 'Your Favourites';
            const count = tab === 'all' ? backgrounds.length : favourite.length;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 p-2 rounded-lg text-lg font-medium transition-colors relative',
                  'outline-none focus:outline-none focus-visible:ring-0 ',
                  activeTab === tab
                    ? 'bg-base-100/30'
                    : 'text-base-content/70 hover:text-base-content'
                )}
              >
                {label}{' '}
                <span className={`ml-1 text-sm opacity-70 count-${tab}`} suppressHydrationWarning>({count})</span>
              </button>
            );
          })}
        </div>
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

      <p className='mt-10 font-sans text-xs text-center text-base-content/30 capitalize'>new background every week</p>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              if (typeof window === 'undefined' || !window.localStorage) return;
              try {
                const favData = window.localStorage.getItem('favourite');
                const fav = favData ? JSON.parse(favData) : [];
                const count = Array.isArray(fav) ? fav.length : 0;
                const el = document.querySelector('.count-fav');
                if (el) {
                  el.textContent = '(' + count + ')';
                }
              } catch (e) {
                console.warn('Failed to load favourite count:', e);
              }
            })();
            `,
        }}
      />
    </div>
  );
};
