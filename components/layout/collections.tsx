'use client'
import '@/backgrounds'
import { StarIcon } from "@phosphor-icons/react/dist/ssr"
import { useCodeSidebar } from "../ui/code-sidebar";
import { useRouter } from "next/navigation";
import { registry } from '@/lib/registry';
import { BackgroundConfig } from '@/lib/types';
import { useState } from 'react';

export const Collections = () => {
  const router = useRouter()
  const backgrounds = registry.getAll();
  const { openCodeSidebar } = useCodeSidebar()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const OpenPreview = (id: string) => router.push(`/bg?id=${id}`);

  const handleShowCode = (item: BackgroundConfig) => {
    const data = {
      name: item.name,
      usage: item.code.usage,
      ts: item.code.tsx,
      js: item.code.jsx
    }
    openCodeSidebar(data, { type: "preview", callback: () => OpenPreview(item.id) })
  };

  return (
    <div className="flex flex-col items-center text-base-content w-full mb-5">
      <span className="text-4xl font-serif">Our Collections</span>
      <div className="w-full grid max-sm:grid-cols-1 grid-cols-2 xl:grid-cols-3 mt-5 gap-5 wrap-break-word px-5 md:px-10">
        {backgrounds.map(({ config, component: Component }, index) => (
          <div
            className={`aspect-4/3 relative max-md:max-w-96 md:w-full min-[2000px]:max-w-[700px] h-64 sm:h-96 overflow-hidden ${index % 2 === 0 ? 'md:justify-self-end justify-self-center' : 'md:justify-self-start justify-self-center'}`}
            key={index}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className={`size-full bg-base-content/20 rounded-2xl overflow-hidden group border-white/50`}>
              <div className='size-full object-cover flex relative'>
                <img
                  src={`/thumbnails/${config.name.split(' ').join('-').toLowerCase()}.webp`}
                  className={`rounded-2xl scale-110 absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out ${hoveredIndex === index ? 'opacity-0' : 'opacity-100'}`}
                  onClick={() => OpenPreview(config.id)}
                  alt={config.name}
                />

                <div
                  className={`absolute inset-0 w-full h-full transition-opacity duration-500 ease-in-out ${hoveredIndex === index ? 'opacity-100' : 'opacity-0'}`}
                  onClick={() => OpenPreview(config.id)}
                >
                  <Component {...config.defaultProps} />
                </div>
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
            <div className="absolute top-0 right-0 m-2 p-2 rounded-xl cursor-pointer bg-base-content/20 group">
              <StarIcon className="group-hover:text-yellow-500 transition-colors ease-linear" weight="fill" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
