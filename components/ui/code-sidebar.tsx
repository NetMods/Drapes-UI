"use client";
import { Drawer } from 'vaul';
import { createContext, useContext, useState, ReactNode } from 'react';
import { PuzzlePieceIcon, FileTsxIcon, FileJsxIcon, XIcon, GearIcon } from '@phosphor-icons/react';
import { usePathname } from 'next/navigation';
import Code from './code';
import { CodeIcon } from '@phosphor-icons/react/dist/ssr';
import { useMediaQuery } from '@/hooks/use-media-query';

interface CodeSidebarData {
  name: string;
  usage: string;
  js: string;
  ts: string;
}

interface CodeSidebarContextType {
  isOpen: boolean;
  data: CodeSidebarData | null;
  settingsOpener: (() => void) | null;
  openCodeSidebar: (data: CodeSidebarData, SettingsSidebarHelper?: () => void) => void;
  closeCodeSidebar: () => void;
}

const CodeSidebarContext = createContext<CodeSidebarContextType | undefined>(undefined);

export function CodeSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<CodeSidebarData | null>(null);
  const [settingsOpener, setSettingsOpener] = useState<(() => void) | null>(null);

  const openCodeSidebar = (newData: CodeSidebarData, SettingsSidebarHelper?: () => void) => {
    setSettingsOpener(() => SettingsSidebarHelper);
    setData(newData);
    setIsOpen(true);
  };

  const closeCodeSidebar = () => {
    setIsOpen(false);
    setSettingsOpener(null);
  };

  return (
    <CodeSidebarContext.Provider value={{
      isOpen,
      data,
      settingsOpener,
      openCodeSidebar,
      closeCodeSidebar
    }}>
      {children}
    </CodeSidebarContext.Provider>
  );
}

export function useCodeSidebar() {
  const context = useContext(CodeSidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export function CodeSidebar() {
  const { isOpen, data, closeCodeSidebar, settingsOpener } = useCodeSidebar();
  const [activeTab, setActiveTab] = useState('ts');
  const pathname = usePathname();
  const { isMobile } = useMediaQuery()

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => !open && closeCodeSidebar()}
      direction={isMobile ? "bottom" : "right"}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-base-200/30 z-200" />
        <Drawer.Content
          data-vaul-no-drag
          className="bg-base-content/5 border border-base-content/20 z-300 shadow backdrop-blur-3xl flex flex-col
          sm:rounded-l-[10px] rounded-t-[10px] h-2/3 sm:h-full max-sm:min-w-[300px] max-sm:w-full sm:min-w-[500px] xl:w-1/3
          mt-24 fixed bottom-0 right-0 text-base-content"
        >
          <div className="p-4 rounded-t-[10px] flex-1 overflow-y-auto">
            <Drawer.Title className="font-medium mb-4 flex justify-between items-center">
              <span className='text-3xl sm:text-4xl font-serif inline-flex justify-center items-center gap-2'>
                <CodeIcon />
                {pathname === '/' ? data?.name : "Code"}
              </span>
              <div className="flex items-center gap-2">
                {settingsOpener && (
                  <button
                    onClick={() => {
                      settingsOpener();
                      closeCodeSidebar();
                    }}
                    className="text-white cursor-pointer p-1 rounded-lg bg-base-content/20 border border-base-content/20 transition-colors hover:bg-base-content/30"
                  >
                    <GearIcon size={17} weight='bold' />
                  </button>
                )}
                <button
                  onClick={closeCodeSidebar}
                  className="text-white cursor-pointer p-1 rounded-lg bg-base-content/20 border border-base-content/20 transition-colors"
                >
                  <XIcon size={17} weight='bold' />
                </button>
              </div>
            </Drawer.Title>
            <div>
              <div className='font-semibold font-sans text-base-content/70 flex justify-between items-center'>
                <div className=' inline-flex justify-center items-center gap-1 '>
                  <PuzzlePieceIcon size={20} weight='bold' />
                  <span className='mt-0.5'> Usage </span>
                </div>
              </div>
              <div className='relative mt-1'>
                {data &&
                  <Code lang='javascript' filename='app/page.jsx'>
                    {data?.usage}
                  </Code>
                }
              </div>
            </div>
            <div className='mt-4'>
              <div className="flex w-full mb-4 font-sans">
                <button
                  onClick={() => setActiveTab('ts')}
                  className={`flex justify-center items-center font-medium gap-2 px-4 py-1 w-1/2 rounded-l-lg transition-colors ${activeTab === 'ts'
                    ? 'bg-base-content/20 text-base-content border border-base-content/20 inset-shadow-2xs'
                    : 'bg-base-100/20 text-base-content/70 '
                    }`}
                >
                  <FileTsxIcon size={20} className='shrink-0' />
                  Typescript
                </button>
                <button
                  onClick={() => setActiveTab('js')}
                  className={`flex justify-center items-center font-medium gap-2 px-4 py-1 w-1/2 rounded-r-lg transition-colors ${activeTab === 'js'
                    ? 'bg-base-content/20 text-base-content border border-base-content/20'
                    : 'bg-base-100/20 text-base-content/70 '
                    }`}
                >
                  <FileJsxIcon size={20} className='shrink-0' />
                  Javascript
                </button>
              </div>
              <div className='relative'>
                {data && (activeTab === 'js'
                  ? <Code lang='javascript' filename='app/components/ui/background.jsx'>{data.js}</Code>
                  : <Code lang='typescript' filename='app/components/ui/background.tsx'>{data.ts}</Code>
                )}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
