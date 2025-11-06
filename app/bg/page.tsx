'use client'
import '@/backgrounds'
import { registry } from '@/lib/registry';
import { ControlPanel } from '@/components/ui/control-panel';
import { useCodeSidebar } from "@/components/ui/code-sidebar"
import { useSettingsSidebar } from "@/components/ui/settings-sidebar"
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect } from "react";
import { useBackgroundProps } from '@/lib/background-context';

export default function Page() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get('id')
  const currentId = id ? parseInt(id, 10) : 0
  const entry = registry.get(String(currentId));
  const totalBackground = registry.getSize()

  const { props, setProps } = useBackgroundProps();

  useEffect(() => {
    if (entry?.config.defaultProps) {
      setProps(entry.config.defaultProps);
    }
  }, [currentId, entry, setProps]);

  if (!currentId || !entry) {
    return (
      <div className=" flex justify-center items-center text-base-content/80 font-sans font-semibold text-xl min-h-screen">
        Get your ass off from this website. you insect !!
      </div>
    )
  }

  const { config, component: Component } = entry;

  const generateUsageCode = () => {
    const baseCode = config.code.usage;
    let updatedCode = baseCode;

    Object.entries(props).forEach(([key, value]) => {
      const propValue = typeof value === 'string' ? `"${value}"` : value;
      const regex = new RegExp(`${key}={[^}]+}`, 'g');
      updatedCode = updatedCode.replace(regex, `${key}={${propValue}}`);
    });

    return updatedCode;
  };

  const { openSettingsSidebar } = useSettingsSidebar();
  const { openCodeSidebar } = useCodeSidebar();

  const handleLeft = () => {
    const newId = Math.max(1, currentId - 1)
    router.replace(`?id=${newId}`)
  }

  const handleRight = () => {
    const newId = currentId + 1
    router.replace(`?id=${newId}`)
  }

  return (
    <div>
      <div className="flex justify-between items-center p-1 text-base-content/70">
        <button
          className="font-sans text-lg cursor-pointer hover:bg-base-content/20 p-2 rounded-sm transition-colors"
          onClick={() => openSettingsSidebar(
            <ControlPanel
              controls={config.controls}
            />
          )}
        >
          Settings
        </button>
        <div className="flex justify-center gap-3 items-center">
          <button
            onClick={handleLeft}
            className="enabled:active:scale-95 cursor-pointer enabled:hover:bg-base-content/20 p-2 disabled:opacity-40 enabled:hover:ring-1 rounded-sm ring-base-content/40 transition-colors disabled:cursor-not-allowed"
            disabled={currentId === 1}
          >
            <ArrowLeftIcon size={25} weight="bold" />
          </button>
          <span className="font-serif text-3xl">{config.name}</span>
          <button
            onClick={handleRight}
            className="enabled:active:scale-95 cursor-pointer enabled:hover:bg-base-content/20 p-2 disabled:opacity-40 enabled:hover:ring-1 rounded-sm ring-base-content/40 transition-colors disabled:cursor-not-allowed"
            disabled={currentId === totalBackground}
          >
            <ArrowRightIcon size={25} weight="bold" />
          </button>
        </div>
        <button
          className="font-sans text-lg cursor-pointer  hover:bg-base-content/20 p-2 rounded-sm transition-colors"
          onClick={() => openCodeSidebar({
            name: config.name,
            usage: generateUsageCode(),
            js: config.code.jsx,
            ts: config.code.tsx,
          })}
        >
          Code
        </button>
      </div>
      <div className="inset-0 fixed top-0 left-0 -z-10">
        <Component {...props} />
      </div>
    </div>
  )
}
