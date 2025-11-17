'use client';
import '@/backgrounds';
import { registry } from '@/lib/registry';
import useLocalStorage from '@/hooks/use-local-storage';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { BackgroundCard } from '../ui/card';
import { StarIcon } from '@phosphor-icons/react';
import { useCommandPalette } from '../ui/command-palette';

export const Collections = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'fav'>('all');
  const [favourite, toggleFavourite] = useLocalStorage<string>('favourite', []);
  const backgrounds = registry.getAll();
  const { toggleOpen, filterInput } = useCommandPalette();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    let result = activeTab === 'fav'
      ? backgrounds.filter(({ config }) => favourite.includes(config.id))
      : backgrounds;

    if (filterInput.trim()) {
      const searchTerm = filterInput.toLowerCase();

      result = result.filter(({ config }) => {
        const tagsMatch = config.tags?.some(tag =>
          tag.toLowerCase().includes(searchTerm)
        );
        const nameMatch = config.name.toLowerCase().includes(searchTerm);
        const descriptionMatch = config.description?.toLowerCase().includes(searchTerm);

        return tagsMatch || nameMatch || descriptionMatch;
      });
    }

    return result;
  }, [activeTab, favourite, filterInput, backgrounds]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName ?? '';
      const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable;

      // if (isEditable) return;
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === 'k') {
        event.preventDefault();
        event.stopPropagation();
        toggleOpen();
        return;
      }
      if (key === 'escape') {
        event.preventDefault();
        event.stopPropagation();
        toggleOpen(false);
        return;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggleOpen]);

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
                  'outline-none focus:outline-none focus-visible:ring-0 cursor-pointer',
                  activeTab === tab
                    ? 'bg-base-100/30'
                    : 'text-base-content/70 hover:text-base-content'
                )}
              >
                {label}{' '}
                <span className={`ml-1 text-sm opacity-70 count-${tab}`} suppressHydrationWarning >({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-full flex flex-wrap justify-center gap-5 px-5 md:px-10 min-h-full">
        {/* bg-base-content/10 backdrop-blur-3xl */}
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
            <p className="text-xl">
              {filterInput.trim()
                ? 'No favourite backgrounds match your search.'
                : "You haven't starred any backgrounds yet."}
            </p>
            {!filterInput.trim() && (
              <p className="mt-2">
                Click the{' '}
                <StarIcon className="inline-block size-4 mb-0.5 text-yellow-500" weight="fill" />{' '}
                on any card to add it to your favourites.
              </p>
            )}
          </div>
        )}

        {activeTab === 'all' && filtered.length === 0 && filterInput.trim() && (
          <div className="col-span-full text-center py-12 min-h-screen text-base-content/60 font-sans">
            <p className="text-xl">No backgrounds match your search.</p>
          </div>
        )}

      </div>


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
