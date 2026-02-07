'use client'
import '@/backgrounds'
import { registry } from '@/lib/registry';
import { ControlPanel } from '@/components/ui/control-panel';
import { CodeSidebarData, useCodeSidebar } from "@/components/ui/code-sidebar"
import { useSettingsSidebar } from "@/components/ui/settings-sidebar"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react";
import { useBackgroundProps } from '@/lib/background-context';
import { SettingsButton, LeftButton, RightButton, CodeButton, MobileControls } from './components'
import ToolButton from './components/tools-button';

export default function Page() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get('id')
  const currentId = id ? parseInt(id, 10) : 0
  const entry = registry.get(String(currentId));
  const totalBackground = registry.getSize()

  const { props, setProps } = useBackgroundProps();
  const propsRef = useRef(props);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => { propsRef.current = props; }, [props]);

  useEffect(() => {
    if (entry?.config.defaultProps) {
      setProps(entry.config.defaultProps);
    }
  }, [currentId, entry, setProps]);

  if (!currentId || !entry) {
    return (
      <div className=" flex justify-center items-center text-base-content/80 font-sans font-semibold text-xl min-h-screen">
        No background available with this id
      </div>
    )
  }

  const { config, component: Component } = entry;

  const generateUsageCode = () => {
    const baseCode = config.code.rawUsage;

    let updatedCode = baseCode;
    Object.entries(propsRef.current).forEach(([key, value]) => {
      const propValue = typeof value === 'string' ? `'${value}'` : value;
      const regex = new RegExp(`${key}={[^}]+}`, 'g');
      updatedCode = updatedCode.replace(regex, `${key}={${propValue}}`);
    });
    return updatedCode;
  };

  const { openSettingsSidebar, closeSettingsSidebar } = useSettingsSidebar();
  const { openCodeSidebar, closeCodeSidebar } = useCodeSidebar();

  const handleLeft = () => {
    // Close sidebars to prevent old controls affecting new background
    closeSettingsSidebar();
    closeCodeSidebar();
    const newId = Math.max(1, currentId - 1)
    router.replace(`?id=${newId}`)
  }

  const handleRight = () => {
    // Close sidebars to prevent old controls affecting new background
    closeSettingsSidebar();
    closeCodeSidebar();
    const newId = currentId + 1
    router.replace(`?id=${newId}`)
  }

  const handleSettingSidebar = () => {
    const controlpanel = <ControlPanel controls={config.controls} />
    openSettingsSidebar(controlpanel, handleCodeSidebar)
  }

  const handleCodeSidebar = () => {
    const data: CodeSidebarData = {
      name: config.name,
      usage: config.code.usage,
      rawUsage: generateUsageCode(),
      js: config.code.jsx,
      ts: config.code.tsx,
      rawjs: config.code.rawjsx,
      rawts: config.code.rawtsx
    }
    openCodeSidebar(data, { type: "settings", callback: handleSettingSidebar })
  }

  return (
    <div>
      <div className="flex justify-between items-center p-1 text-base-content/70 max-sm:justify-center">
        <SettingsButton action={handleSettingSidebar} className='max-sm:hidden backdrop-blur-xl' />

        <div className="flex justify-center gap-3 items-center max-sm:w-full">
          <LeftButton action={handleLeft} isDisabled={currentId === 1 || isRecording} className='max-sm:hidden p-2 backdrop-blur-xl' />
          <div className="max-sm:bg-white/10 py-0.5 rounded backdrop-blur-xl font-serif text-[1.3rem] md:text-2xl lg:text-3xl w-full md:w-60 flex justify-center items-center">{config.name}</div>
          <RightButton action={handleRight} isDisabled={currentId === totalBackground || isRecording} className='max-sm:hidden p-2 backdrop-blur-xl' />
        </div>

        <CodeButton action={handleCodeSidebar} className='max-sm:hidden  backdrop-blur-xl' />
      </div>

      <div className="inset-0 fixed top-0 left-0 -z-10">
        <Component key={currentId} {...props} />
      </div>

      <LeftButton
        action={handleLeft}
        isDisabled={currentId === 1 || isRecording}
        className='fixed top-1/2 sm:hidden bg-white/10 border border-white/30 text-base-content/70 ml-1 p-1 rounded-xl backdrop-blur-xl'
        size={23}
      />
      <RightButton
        action={handleRight}
        isDisabled={currentId === totalBackground || isRecording}
        className='fixed top-1/2 right-0 sm:hidden bg-white/10 border border-white/30 text-base-content/70 mr-1 p-1 rounded-xl backdrop-blur-xl'
        size={23}
      />
      <MobileControls
        handleSettingSidebar={handleSettingSidebar}
        handleCodeSidebar={handleCodeSidebar}
      />
      <ToolButton
        className='hidden sm:fixed bottom-4 left-1/2'
        backgroundName={config.name}
        onRecordingStateChange={setIsRecording}
       />
    </div>
  )
}
