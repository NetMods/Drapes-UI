'use client'
import useLocalStorage from "@/hooks/use-local-storage";
import { usePathname, useRouter } from "next/navigation";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

interface CommandPaletteContextType {
  isOpen: boolean;
  inputValue: string;
  history: CommandPaletteHistoryType[];
  toggleOpen: () => void;
  handleSubmit: (value?: string) => void;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  setHistory: React.Dispatch<React.SetStateAction<CommandPaletteHistoryType[]>>;
}

export interface CommandPaletteHistoryType {
  date: Date,
  inputValue: string
}

const CommandPaletteContext = createContext<CommandPaletteContextType | undefined>(undefined)

export function CommandPaletteContextProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [inputValue, setInputValue] = useState<string>('')
  const [history, setHistory] = useLocalStorage<CommandPaletteHistoryType[]>('cmd-palette-history', [])

  const router = useRouter();
  const pathname = usePathname();

  const toggleOpen = () => setIsOpen(prev => !prev);

  const handleSubmit = useCallback((value?: string) => {
    const query = value || inputValue
    if (!query.trim()) return;

    setHistory((prev) => {
      const arr = Array.isArray(prev) ? prev : [];
      const existingIndex = arr.findIndex(item => item.inputValue === query);

      let newHistory: CommandPaletteHistoryType[];
      if (existingIndex > -1) {
        newHistory = [...arr];
        newHistory[existingIndex] = { date: new Date(), inputValue: query };
      } else {
        newHistory = [...arr, { date: new Date(), inputValue: query }];
      }
      return newHistory.slice(-50);
    });

    toggleOpen()
    if (pathname !== '/') {
      router.push('/#background-collections')
    } else {
      const element = document.getElementById("background-collections");
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [inputValue, setHistory]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (!['arrowup', 'arrowdown', 'k', 'enter', 'escape'].includes(key)) return

      event.preventDefault();
      event.stopPropagation();

      if (key === 'enter' && isOpen) handleSubmit()
      else if ((event.metaKey || event.ctrlKey) && key === 'k') toggleOpen();
      else if (key === 'escape' && isOpen) toggleOpen();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [inputValue, isOpen]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <CommandPaletteContext.Provider
      value={{ isOpen, toggleOpen, inputValue, setInputValue, history, setHistory, handleSubmit }}
    >
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

