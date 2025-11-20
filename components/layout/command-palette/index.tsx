'use client'
import { createPortal } from "react-dom";
import { MagnifyingGlassIcon } from "@phosphor-icons/react";
import useLocalStorage from "@/hooks/use-local-storage";
import { CommandPaletteHistoryType, useCommandPalette } from "@/lib/command-palette-context";
import CommandPaletteHistory from "./dropdown";

export function CommandPalette() {
  const { isOpen, toggleOpen, filterInput, setFilterInput } = useCommandPalette()
  const [, setHistory] = useLocalStorage<CommandPaletteHistoryType[]>('cmd-palette-history', [])

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
    <div className="fixed inset-0 z-50 flex justify-center font-sans"
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
      <div
        className={`absolute rounded-lg shadow-xl animate-in top-[20vh]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col bg-white/10 text-base-content backdrop-blur-sm rounded-lg p-0.5 border border-base-300/50">

          <div className="relative h-10 w-full md:w-lg md:h-14">
            <div className="w-full h-full flex justify-center items-center p-2">
              <MagnifyingGlassIcon size={22} className="mr-3 text-base-content" weight="bold" />
              <input
                placeholder="Search by tags, name or descriptions"
                type="text"
                autoComplete="off"
                onFocus={(e) => e.target.select()}
                spellCheck="false"
                value={filterInput}
                onChange={(e) => setFilterInput(e.target.value)}
                autoFocus
                onKeyDown={handleKey}
                className="flex-1 border-none text-md sm:text-lg outline-none select-all"
              />
            </div>
          </div>

          <CommandPaletteHistory />
        </div>
      </div>
    </div>
  )

  return createPortal(Content, document.body)
}
