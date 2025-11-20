'use client'
import { createContext, ReactNode, useContext, useState } from "react";
import { createPortal } from "react-dom";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import useLocalStorage from "@/hooks/use-local-storage";
import CommandPaletteHistory from "./command-palette-history";

interface CommandPaletteContextType {
  isOpen: boolean;
  filterInput: string;
  toggleOpen: (value?: boolean) => void;
  setFilterInput: (value: string) => void;
}

export interface CommandPaletteHistoryType {
  date: Date,
  filterInput: string
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined)

export function CommandPaletteContextProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [filterInput, setFilterInput] = useState<string>('')
  const toggleOpen = (value?: boolean) => {
    if (value !== undefined) {
      setIsOpen(value)
    } else {
      setIsOpen(prev => !prev)
    }
  };

  return (
    <CommandPaletteContext.Provider value={{
      isOpen,
      filterInput,
      toggleOpen,
      setFilterInput
    }}>
      {children}
    </CommandPaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const context = useContext(CommandPaletteContext)
  if (context === undefined) {
    throw new Error('useCommandPalette must be used within a CommandPaletteContext');
  }
  return context
}

export function CommandPalette() {
  const { isOpen, toggleOpen, filterInput, setFilterInput } = useCommandPalette()
  const [, , setHistory] = useLocalStorage<CommandPaletteHistoryType[]>('cmd-palette-history', [])

  const handleKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      toggleOpen(false)
      if (filterInput.trim()) {
        setHistory((prev) => {
          const arr = Array.isArray(prev) ? prev : [];
          const index = arr.findIndex((ele) => {
            return ele.filterInput === filterInput
          })
          if (index > -1) {
            arr[index] = {
              date: new Date(),
              filterInput
            }
            return arr;
          }
          return [...arr, { date: new Date(), filterInput }];
        })
        const element = document.getElementById("background-collections")
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }

    }
  }

  if (!isOpen) return null;

  const Content = (
    <div className="fixed inset-0 z-50 flex justify-center"
      onClick={() => toggleOpen()}
    >
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{
          backgroundImage: `
            radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 0 0' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='3.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.3'/%3E%3C/svg%3E")
          `,
          backgroundSize: '3px 3px, 100% 100%',
          backgroundPosition: '0 0, 0 0',
          backgroundColor: 'rgba(0, 0, 0, 0.4)'
        }}
      />
      <div className={`absolute rounded-lg shadow-xl animate-in top-[20vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col bg-white/10 text-base-content backdrop-blur-sm rounded-lg p-0.5 border border-base-300/50">
          <div className="relative h-10 w-full md:w-lg md:h-14">
            <div className="w-full h-full flex justify-center items-center gap-6 px-1">
              <MagnifyingGlassIcon size={24} className="text-base-content" />
              <input
                placeholder="Search by Tags, name or descriptions...."
                type="text"
                autoComplete="off"
                value={filterInput}
                onChange={(e) => setFilterInput(e.target.value)}
                autoFocus
                onKeyDown={handleKey}
                className="flex-1 border-none text-xl outline-none"
              />
            </div>
          </div>
          <div className="border border-base-300" />
          <div className="flex flex-col max-h-[40vh] overflow-x-scroll p-2">
            <CommandPaletteHistory />
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(Content, document.body)
}
