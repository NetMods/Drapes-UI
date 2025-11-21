'use client';

import { StarIcon } from '@phosphor-icons/react/dist/ssr';
import { BackgroundConfig } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useCodeSidebar } from '../ui/code-sidebar';

interface BackgroundCardProps {
  config: BackgroundConfig;
  component: React.ComponentType<any>;
  index: number;
  isHovered: boolean;
  isFavourite: boolean;
  toggleFavourite: (index: string) => void;
  setHoveredIndex: (index: number | null) => void;
}

export const BackgroundCard = ({
  config,
  component: Component,
  index,
  isFavourite,
  isHovered,
  toggleFavourite,
  setHoveredIndex,
}: BackgroundCardProps) => {
  const router = useRouter();
  const { openCodeSidebar } = useCodeSidebar();

  const OpenPreview = () => router.push(`/bg?id=${config.id}`);

  const handleShowCode = () => {
    const data = {
      name: config.name,
      usage: config.code.usage,
      rawUsage: config.code.rawUsage,
      ts: config.code.tsx,
      js: config.code.jsx,
    };
    openCodeSidebar(data, {
      type: 'preview',
      callback: () => OpenPreview(),
    });
  };

  return (
    <div className='select-none bg-base-content/10 p-2 rounded-[24px] ring-1 ring-base-content/20'>
      <div
        className={cn(
          'aspect-square shrink-0 size-72 md:size-[385px] relative overflow-hidden',
          'rounded-[18px]'
        )}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <div className="size-full bg-base-content/20 group">
          <div className="size-full object-cover flex relative">
            <img
              src={`/thumbnails/${config.name.split(' ').join('-').toLowerCase()}.webp`}
              className={cn(
                'w-full h-full object-cover',
                isHovered && 'hidden'
              )}
              onClick={OpenPreview}
              alt={config.name}
            />
            <div
              className="absolute inset-0 w-full h-full cursor-pointer"
              onClick={OpenPreview}
            >
              {isHovered && <Component {...config.defaultProps} />}
            </div>
          </div>

          <div
            className={cn(
              'bg-base-content/10 backdrop-blur-3xl sm:bg-base-content/20',
              'p-2 border-t border-base-content/20 w-full max-sm:-translate-y-full',
              isHovered && "-translate-y-[5.9rem] "
            )}
            style={{
              transitionProperty: 'transform, border-radius',
              transition: 'ease-out 100ms',
            }}
          >
            <span className="font-serif text-2xl sm:text-3xl italic">
              {config.name}
            </span>
            <div className="pt-2 space-x-2 font-sans">
              <button
                className="inline-flex max-sm:text-sm px-3 gap-2 items-center border border-base-content/30 cursor-pointer p-1 rounded-xl hover:shadow-lg hover:bg-base-content/20 bg-base-content/10 transition-all ease-linear"
                onClick={OpenPreview}
              >
                Preview
              </button>
              <button
                className="inline-flex max-sm:text-sm px-3 gap-2 items-center border border-base-content/30 cursor-pointer p-1 rounded-xl hover:shadow-lg hover:bg-base-content/20 bg-base-content/10 transition-all ease-linear"
                onClick={handleShowCode}
              >
                Code
              </button>
            </div>
          </div>
        </div>

        <button
          className={cn(
            "absolute top-0 right-0 m-2 p-2 rounded-xl bg-base-content/20 cursor-pointer",
            "hover:bg-base-content/30"
          )}
          data-fav-id={config.id}
          onClick={() => toggleFavourite(config.id)}
        >
          <StarIcon
            className={cn(
              'transition-colors ease-linear',
              isFavourite && 'text-yellow-500'
            )}
            weight="fill"
          />
        </button>

        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              if (typeof window === 'undefined' || !window.localStorage) return;
              try {
                const favData = window.localStorage.getItem('favourite');
                const fav = favData ? JSON.parse(favData) : [];
                const isArray = Array.isArray(fav);
                const favButton = document.querySelector('[data-fav-id="${config.id}"]');
                if (favButton) {
                  const starIcon = favButton.querySelector('svg');
                  if (starIcon && isArray && fav.includes('${config.id}')) {
                    starIcon.classList.add('text-yellow-500');
                  }
                }
              } catch (e) {
                console.warn('Failed to load favourite state:', e);
              }
            })();
          `,
          }}
        />
      </div>
    </div>
  );
};
