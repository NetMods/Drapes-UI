'use client';
import '@/backgrounds';
import { registry } from '@/lib/registry';
import useLocalStorage from '@/hooks/use-local-storage';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { BackgroundCard } from '../ui/card';
import { StarIcon } from '@phosphor-icons/react';
import { useCommandPalette } from './command-palette/context';

export const Collections = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'fav'>('all');
  const [favourite, setFavourite] = useLocalStorage<string[]>('favourite', []);
  const backgrounds = registry.getAll();
  const { inputValue, setInputValue } = useCommandPalette();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const toggleFavourite = (id: string) => {
    setFavourite(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
    );
  };

  const filtered = useMemo(() => {
    let result = activeTab === 'fav'
      ? backgrounds.filter(({ config }) => favourite.includes(config.id))
      : backgrounds;

    if (inputValue.trim()) {
      const searchTerm = inputValue.toLowerCase();

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
  }, [activeTab, favourite, inputValue, backgrounds]);

  const handleClearFilter = () => setInputValue('')

  const handleChangeTab = (tab: 'all' | 'fav') => {
    setActiveTab(tab);
    setHoveredIndex(null)
  }

  return (
    <div className="text-base-content w-full mb-10">
      <TabSection
        activeTab={activeTab}
        filterInputValue={inputValue}
        backgroundLength={backgrounds.length}
        favouriteLength={favourite.length}
        handleChangeTab={handleChangeTab}
        handleClearFilter={handleClearFilter}
      />

      <div id='background-collections' className="w-full flex flex-wrap justify-center gap-5 px-5 md:px-10 min-h-full scroll-m-24">
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
          <div className="col-span-full text-center py-12 min-h-[50vh] text-base-content/60 font-sans">
            <p className="text-xl">
              {inputValue.trim()
                ? 'No favourite backgrounds match your search.'
                : "You haven't starred any backgrounds yet."}
            </p>
            {!inputValue.trim() && (
              <p className="mt-2">
                Click the{' '}
                <StarIcon className="inline-block size-4 mb-0.5" weight="fill" />{' '}
                on any card to add it to your favourites.
              </p>
            )}
          </div>
        )}

        {activeTab === 'all' && filtered.length === 0 && inputValue.trim() && (
          <div className="col-span-full text-center py-12 min-h-[50vh] text-base-content/60 font-sans">
            <p className="text-xl">No backgrounds match your search.</p>
          </div>
        )}
      </div>

      <PreFetechingScript />
    </div>
  );
};

const TabSection = ({
  activeTab,
  filterInputValue,
  backgroundLength,
  favouriteLength,
  handleClearFilter,
  handleChangeTab,
}: {
  activeTab: 'all' | 'fav';
  filterInputValue: string;
  backgroundLength: number;
  favouriteLength: number;
  handleClearFilter: () => void;
  handleChangeTab: (tab: 'all' | 'fav') => void;
}) => {
  if (filterInputValue.length > 0) {
    return (
      <div className='font-sans max-w-170 mb-10 flex justify-between mx-auto px-2'>
        <div className='text-xl md:text-3xl inline-flex max-sm:flex-col font-bold text-base-content/80'>
          <span className='text-base-content/70 mr-2'> Filtered Results for</span>
          <span className='text-base-content max-w-48 sm:max-w-60 inline-block truncate'> {filterInputValue} </span>
        </div>
        <button onClick={handleClearFilter} className='hover:underline text-sm md:text-md text-base-content/90 cursor-pointer' >
          Clear
        </button>
      </div>
    )
  }

  return (
    <div className="sticky flex gap-1 items-center justify-center top-0 z-40 w-full px-1">
      <div className='backdrop-blur-lg flex w-full max-w-xl mb-10 p-1 border border-white/15 rounded-[13px] bg-white/10 font-sans select-none'>
        {(['all', 'fav'] as const).map((tab) => {
          const label = tab === 'all' ? 'Our Collections' : 'Your Favourites';
          const count = tab === 'all' ? backgroundLength : favouriteLength;
          return (
            <button
              key={tab}
              onClick={() => handleChangeTab(tab)}
              className={cn(
                'flex-1 p-1 rounded-[10px] text-lg font-medium transition-colors relative',
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
  )
}

const PreFetechingScript = () => {
  return (
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
  )
}
