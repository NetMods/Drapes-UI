"use client";

import { Drawer } from 'vaul';
import { createContext, useContext, useState, ReactNode, MouseEvent } from 'react';
import { CheckIcon, XIcon } from '@phosphor-icons/react';
import { ClipboardTextIcon } from '@phosphor-icons/react/dist/ssr';
import { usePathname } from 'next/navigation';

interface CodeSidebarData {
  name: string;
  usage: string;
  js: string;
  ts: string;
}

interface CodeSidebarContextType {
  isOpen: boolean;
  data: CodeSidebarData | null;
  openCodeSidebar: (data: CodeSidebarData) => void;
  closeCodeSidebar: () => void;
}

const CodeSidebarContext = createContext<CodeSidebarContextType | undefined>(undefined);

export function CodeSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<CodeSidebarData | null>(null);

  const openCodeSidebar = (newData: CodeSidebarData) => {
    setData(newData);
    setIsOpen(true);
  };

  const closeCodeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <CodeSidebarContext.Provider value={{ isOpen, data, openCodeSidebar, closeCodeSidebar }}>
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
  const { isOpen, data, closeCodeSidebar } = useCodeSidebar();
  const [activeTab, setActiveTab] = useState('ts');
  const pathname = usePathname()

  const copyCode = (e: MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    button.classList.add('clicked');
    if (data) navigator.clipboard.writeText(activeTab === 'js' ? data.js : data.ts)
    setTimeout(() => button.classList.remove('clicked'), 500);
  }

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => !open && closeCodeSidebar()}
      direction="right"
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-base-200/60 backdrop-blur-sm z-200" />
        <Drawer.Content
          className="bg-base-content/10 border border-base-content/20 z-300 shadow backdrop-blur-3xl flex flex-col rounded-l-[10px] h-full max-sm:min-w-[300px] max-sm:w-full sm:min-w-[500px] xl:w-1/3 mt-24 fixed bottom-0 right-0 text-base-content"
        >
          <div className="p-4 rounded-t-[10px] flex-1 overflow-y-auto">
            <Drawer.Title className="font-medium mb-4 flex justify-between items-center">
              <span className='text-4xl font-serif'>
                {pathname === '/' ? data?.name : "Code"}
              </span>
              <button
                onClick={closeCodeSidebar}
                className="text-white cursor-pointer p-1 rounded-lg bg-base-content/20 border border-base-content/20 transition-colors"
              >
                <XIcon size={17} weight='bold' />
              </button>
            </Drawer.Title>
            <div>
              <span className='pl-3 font-semibold text-base-content/70'>Usage</span>
              <div className='border relative border-base-content/20 bg-base-100/20 p-3 rounded-lg mt-1'>
                <button
                  onClick={copyCode}
                  className="absolute right-3 text-white cursor-pointer p-1 rounded-lg hover:bg-base-content/20 transition-colors group"
                >
                  <ClipboardTextIcon size={17} weight='bold' className="group-[.clicked]:hidden"
                  />
                  <CheckIcon size={17} weight='bold' className="hidden group-[.clicked]:block"
                  />
                </button>
                <pre className='overflow-clip'>
                  {data && data?.usage}
                </pre>
              </div>
            </div>
            <div className='mt-4'>
              <div className="flex w-full mb-4">
                <button
                  onClick={() => setActiveTab('ts')}
                  className={`px-4 py-2 w-1/2 rounded-l-lg transition-colors ${activeTab === 'ts'
                    ? 'bg-base-content/20 text-base-content border border-base-content/20 inset-shadow-2xs'
                    : 'bg-base-100/20 text-base-content/70 '
                    }`}
                >
                  TypeScript
                </button>
                <button
                  onClick={() => setActiveTab('js')}
                  className={`px-4 py-2 w-1/2 rounded-r-lg transition-colors ${activeTab === 'js'
                    ? 'bg-base-content/20 text-base-content border border-base-content/20'
                    : 'bg-base-100/20 text-base-content/70 '
                    }`}
                >
                  JavaScript
                </button>
              </div>
              <div className='relative border border-base-content/20 bg-base-100/20 p-3 rounded-lg'>
                <button
                  onClick={copyCode}
                  className="absolute right-3 text-white cursor-pointer p-1 rounded-lg hover:bg-base-content/20 transition-colors group"
                >
                  <ClipboardTextIcon size={17} weight='bold' className="group-[.clicked]:hidden"
                  />
                  <CheckIcon size={17} weight='bold' className="hidden group-[.clicked]:block"
                  />
                </button>
                <pre className='overflow-clip'>
                  {data && (activeTab === 'js' ? data?.js : data?.ts)}
                </pre>
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
