'use client'

import '@/backgrounds'
import { StarIcon } from "@phosphor-icons/react/dist/ssr"
import { useCodeSidebar } from "../ui/code-sidebar";
import { useRouter } from "next/navigation";
import { registry } from '@/lib/registry';
import { BackgroundConfig } from '@/lib/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { cn } from '@/lib/utils';

export const Collections = () => {
  const router = useRouter()
  const { value: favourite, toggleInArray: toggleFavourite } = useLocalStorage<string[]>('favourite', [])

  const backgrounds = registry.getAll();

  const { openCodeSidebar } = useCodeSidebar()
  const handleShowCode = (item: BackgroundConfig) => {
    openCodeSidebar({
      name: item.name,
      usage: item.code.usage,
      ts: item.code.tsx,
      js: item.code.jsx
    });
  };

  const handleFavourite = (id: string) => {
    toggleFavourite(id)
  }

  return (
    <div className="flex flex-col items-center text-base-content w-full mb-5">
      <span className="text-4xl font-serif">Our Collections</span>
      <div className="w-full grid max-sm:grid-cols-1 grid-cols-2 xl:grid-cols-3 mt-5 gap-5 wrap-break-word px-5 md:px-10">
        {backgrounds.map(({ config }, index) => (
          <div
            className={`relative max-md:max-w-96 md:w-full min-[2000px]:max-w-[700px] h-64 sm:h-96 overflow-hidden ${index % 2 === 0 ? 'md:justify-self-end justify-self-center' : 'md:justify-self-start justify-self-center'}`}
            key={index}
          >
            <div className={`size-full bg-base-content/20 rounded-2xl overflow-hidden group border-white/50`} >
              <div className='size-full object-cover flex'>
                <img
                  src={config.thumbnail} className='rounded-2xl scale-110 '
                  onClick={() => router.push(`/bg?id=${config.id}`)}
                />
              </div>

              <div className="sm:group-hover:-translate-y-[5.9rem] bg-base-content/10 sm:bg-base-content/20 rounded-b-2xl p-2 border-t border-white/20 w-full max-sm:-translate-y-full"
                style={{
                  transitionProperty: "transform, border-radius",
                  transition: "ease-out",
                  transitionDuration: "100ms"
                }}>
                <span className="font-serif text-2xl sm:text-3xl italic">{config.name}</span>
                <div className="pt-2 space-x-2 font-sans">
                  <button
                    className="inline-flex max-sm:text-sm px-3 gap-2 items-center border border-base-content/30 cursor-pointer p-1 
                    rounded-xl hover:shadow-lg hover:bg-base-content/20 bg-base-content/10 transition-all ease-linear"
                    onClick={() => router.push(`/bg?id=${config.id}`)}
                  >
                    Preview
                  </button>
                  <button
                    className="inline-flex max-sm:text-sm px-3 gap-2 items-center border border-base-content/30 cursor-pointer p-1 
                    rounded-xl hover:shadow-lg hover:bg-base-content/20 bg-base-content/10 transition-all ease-linear"
                    onClick={() => handleShowCode(config)}
                  >
                    Code
                  </button>
                </div>
              </div>
            </div>

            <button
              className="absolute top-0 right-0 m-2 p-2 rounded-xl cursor-pointer bg-base-content/20 group"
              onClick={() => handleFavourite(config.id)}
            >
              <StarIcon
                className={cn(
                  "group-hover:text-yellow-500 transition-colors ease-linear",
                  favourite.includes(config.id) ? 'text-yellow-500' : ''
                )} weight="fill" />
            </button>
          </div>
        ))}
      </div>
    </div >
  );
};
