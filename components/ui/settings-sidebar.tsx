"use client";
import { Drawer } from 'vaul';
import { createContext, useContext, useState, ReactNode, ReactElement } from 'react';
import { XIcon, GearIcon, CodeIcon } from '@phosphor-icons/react';

interface SettingsSidebarContextType {
  isOpen: boolean;
  settingsComponent: ReactElement | null;
  codeSidebarOpener: (() => void) | null;
  openSettingsSidebar: (component: ReactElement, CodeSidebarHelper: () => void) => void;
  closeSettingsSidebar: () => void;
}

const SettingsSidebarContext = createContext<SettingsSidebarContextType | undefined>(undefined);

export function SettingsSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [settingsComponent, setSettingsComponent] = useState<ReactElement | null>(null);
  const [codeSidebarOpener, setCodeSidebarOpener] = useState<(() => void) | null>(null);

  const openSettingsSidebar = (component: ReactElement, CodeSidebarHelper: () => void) => {
    setCodeSidebarOpener(() => CodeSidebarHelper);
    setSettingsComponent(component);
    setIsOpen(true);
  };

  const closeSettingsSidebar = () => {
    setIsOpen(false);
    setCodeSidebarOpener(null);
  };

  return (
    <SettingsSidebarContext.Provider value={{
      isOpen,
      settingsComponent,
      codeSidebarOpener,
      openSettingsSidebar,
      closeSettingsSidebar
    }}>
      {children}
    </SettingsSidebarContext.Provider>
  );
}

export function useSettingsSidebar() {
  const context = useContext(SettingsSidebarContext);
  if (context === undefined) {
    throw new Error('useSettingsSidebar must be used within a SettingsSidebarProvider');
  }
  return context;
}

export function SettingsSidebar() {
  const { isOpen, settingsComponent, closeSettingsSidebar, codeSidebarOpener } = useSettingsSidebar();

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={(open) => !open && closeSettingsSidebar()}
      direction="left"
    >
      <Drawer.Portal>
        <Drawer.Content
          data-vaul-no-drag
          className=" bg-base-content/5 border border-base-content/20 z-300 shadow backdrop-blur-3xl flex flex-col rounded-r-[10px] h-full max-sm:min-w-[300px] max-sm:w-full sm:min-w-[500px] xl:w-1/4 mt-24 fixed bottom-0 left-0 text-base-content"
        >
          <div className="p-4 rounded-t-[10px] flex-1 overflow-y-auto">
            <Drawer.Title className="font-medium mb-4 flex justify-between items-center">
              <span className='text-4xl font-serif inline-flex justify-center items-center gap-1'>
                <GearIcon />
                Settings
              </span>
              <div className="flex items-center gap-2">
                {codeSidebarOpener && (
                  <button
                    onClick={() => {
                      codeSidebarOpener();
                      closeSettingsSidebar();
                    }}
                    className="text-white cursor-pointer p-1 rounded-lg bg-base-content/20 border border-base-content/20 transition-colors hover:bg-base-content/30"
                  >
                    <CodeIcon size={17} weight='bold' />
                  </button>
                )}
                <button
                  onClick={closeSettingsSidebar}
                  className="text-white cursor-pointer p-1 rounded-lg bg-base-content/20 border border-base-content/20 transition-colors hover:bg-base-content/30"
                >
                  <XIcon size={17} weight='bold' />
                </button>
              </div>
            </Drawer.Title>
            <div className="mt-4">
              {settingsComponent}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/*
{codeSidebarOpener && (
  <button
    className="inline-flex w-full gap-2 justify-center items-center border border-base-content/10 
    cursor-pointer p-1 rounded-lg bg-base-content/10 transition-all ease-linear
    mt-2
    "
    onClick={() => {
      codeSidebarOpener();
      closeSettingsSidebar();
    }}
  >
    Show Code
  </button>
)}
*/
