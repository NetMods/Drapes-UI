'use client'

import '@/backgrounds'
import { StarIcon } from "@phosphor-icons/react/dist/ssr"
import { useCodeSidebar } from "../ui/code-sidebar";
import { useRouter } from "next/navigation";
import { registry } from '@/lib/registry';
import { BackgroundConfig } from '@/lib/types';

export const Collections = () => {
  const router = useRouter()

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

  return (
    <div className="flex flex-col items-center text-base-content w-full mb-5">
      <span className="text-4xl font-serif">Our Collections</span>
      <div className="w-full grid max-sm:grid-cols-1 grid-cols-2 xl:grid-cols-3 mt-5 gap-5 wrap-break-word md:px-10">
        {backgrounds.map(({ config }, index) => (
          <div
            className={`relative w-full h-96 overflow-hidden ${index % 2 === 0 ? 'justify-self-end' : 'justify-self-start'}`}
            key={index}
          >
            <div className={`size-full bg-base-content/20 rounded-2xl overflow-hidden group border border-white/20`} >
              <div className='size-full object-cover flex'>
                <img
                  src={config.thumbnail} className='rounded-2xl scale-110'
                  onClick={() => router.push(`/bg?id=${config.id}`)}
                />
              </div>

              <div className="group-hover:-translate-y-[5.9rem] bg-base-content/20 rounded-b-2xl p-2 border-t border-white/20 w-full top-100"
                style={{
                  transitionProperty: "transform, border-radius",
                  transition: "ease-out",
                  transitionDuration: "100ms"
                }}>
                <span className="font-serif text-3xl italic">{config.name}</span>
                <div className="pt-2 space-x-2">
                  <button
                    className="inline-flex px-3 gap-2 items-center border border-base-content/30 cursor-pointer p-1 rounded-xl hover:shadow-lg hover:bg-base-content/20 bg-base-content/10 transition-all ease-linear"
                    onClick={() => router.push(`/bg?id=${config.id}`)}
                  >
                    Preview
                  </button>
                  <button
                    className="inline-flex px-3 gap-2 items-center border border-base-content/30 cursor-pointer p-1 rounded-xl hover:shadow-lg hover:bg-base-content/20 bg-base-content/10 transition-all ease-linear"
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
    </div >
  );
};
