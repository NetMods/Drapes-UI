'use client'
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

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

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <CommandPaletteContext.Provider value={{ isOpen, filterInput, toggleOpen, setFilterInput }}>
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

