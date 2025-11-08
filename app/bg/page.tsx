'use client'
import '@/backgrounds'
import { registry } from '@/lib/registry';
import { ControlPanel } from '@/components/ui/control-panel';
import { useCodeSidebar } from "@/components/ui/code-sidebar"
import { useSettingsSidebar } from "@/components/ui/settings-sidebar"
import { CaretUpIcon, GearIcon, ArrowLeftIcon, ArrowRightIcon, CodeIcon } from "@phosphor-icons/react"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react";
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
        No background available with this id.
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

  const handleSettingSidebar = () => {
    const controlpanel = <ControlPanel controls={config.controls} />
    openSettingsSidebar(controlpanel, handleCodeSidebar)
  }

  const handleCodeSidebar = () => {
    const data = {
      name: config.name,
      usage: generateUsageCode(),
      js: config.code.jsx,
      ts: config.code.tsx,
    }
    openCodeSidebar(data, { type: "settings", callback: handleSettingSidebar })
  }

  return (
    <div>
      <div className="flex justify-between items-center p-1 text-base-content/70 max-sm:justify-center">
        <SettingsButton action={handleSettingSidebar} className='max-sm:hidden' />

        <div className="flex justify-center gap-3 items-center">
          <LeftButton action={handleLeft} isDisabled={currentId === 1} className='max-sm:hidden' />
          <span className="font-serif text-3xl">{config.name}</span>
          <RightButton action={handleRight} isDisabled={currentId === totalBackground} className='max-sm:hidden' />
        </div>

        <CodeButton action={handleCodeSidebar} className='max-sm:hidden' />
      </div>

      <div className="inset-0 fixed top-0 left-0 -z-10">
        <Component {...props} />
      </div>

      <LeftButton
        action={handleLeft}
        isDisabled={currentId === 1}
        className='fixed top-1/2 translate-y-[-50%] sm:hidden'
      />
      <RightButton
        action={handleRight}
        isDisabled={currentId === totalBackground}
        className='fixed top-1/2 right-0 translate-y-[-50%] sm:hidden'
      />
      <MobileControls
        handleSettingSidebar={handleSettingSidebar}
        handleCodeSidebar={handleCodeSidebar}
      />
    </div>
  )
}

const LeftButton = ({ action, isDisabled, className }: { action: () => void, isDisabled: boolean, className?: string }) => {
  return (
    <button
      onClick={action}
      className={`enabled:active:scale-95 cursor-pointer enabled:hover:bg-base-content/20 p-2 disabled:opacity-40 enabled:hover:ring-1 rounded-sm ring-base-content/40 transition-colors disabled:cursor-not-allowed ${className}`}
      disabled={isDisabled}
    >
      <ArrowLeftIcon size={25} weight="bold" />
    </button>
  )
}

const RightButton = ({ action, isDisabled, className }: { action: () => void, isDisabled: boolean, className?: string }) => {
  return (
    <button
      onClick={action}
      className={`enabled:active:scale-95 cursor-pointer enabled:hover:bg-base-content/20 p-2 disabled:opacity-40 enabled:hover:ring-1 rounded-sm ring-base-content/40 transition-colors disabled:cursor-not-allowed ${className}`}
      disabled={isDisabled}
    >
      <ArrowRightIcon size={25} weight="bold" />
    </button>
  )
}

const SettingsButton = ({ action, className }: { action: () => void, className?: string }) => {
  return (
    <button
      className={`font-sans text-lg cursor-pointer hover:bg-base-content/20 p-2 rounded-sm transition-colors ${className}`}
      onClick={action}
    >
      <span className='block md:hidden'> <GearIcon weight='bold' size={23} /> </span>
      <span className='md:block hidden'> Settings </span>
    </button>
  )
}

const CodeButton = ({ action, className }: { action: () => void, className?: string }) => {
  return (
    <button
      className={`font-sans text-lg cursor-pointer hover:bg-base-content/20 p-2 rounded-sm transition-colors ${className}`}
      onClick={action}
    >
      <span className='block md:hidden'> <CodeIcon size={23} weight='bold' /> </span>
      <span className='md:block hidden'> Code </span>
    </button>
  )
}

const MobileControls = ({ handleSettingSidebar, handleCodeSidebar }: { handleSettingSidebar: () => void; handleCodeSidebar: () => void }) => {
  const [isClicked, setIsClicked] = useState(false);

  return (
    <div className='border border-white/30 rounded-xl fixed bottom-4 left-1/2 translate-x-[-50%] text-base-content/70
      sm:hidden bg-white/10 backdrop-blur-lg
    '>
      {!isClicked && (
        <CaretUpIcon className='left-1/2 translate-x-[-50%] top-[-25] animate-bounce absolute' weight='bold' size={24} />
      )}

      <SettingsButton
        action={() => {
          handleSettingSidebar();
          setIsClicked(true);
        }}
      />

      <CodeButton
        action={() => {
          handleCodeSidebar();
          setIsClicked(true);
        }}
      />
    </div>
  )
}
