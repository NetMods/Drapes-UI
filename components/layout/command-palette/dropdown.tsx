import { useMemo } from "react"
import useLocalStorage from "@/hooks/use-local-storage"
import { ClockClockwiseIcon, XIcon } from "@phosphor-icons/react"
import { CommandPaletteHistoryType, useCommandPalette } from "@/lib/command-palette-context"
import { cn } from "@/lib/utils"

const CommandPaletteHistory = () => {
  const { toggleOpen, setFilterInput } = useCommandPalette()
  const [history, setHistory] = useLocalStorage<CommandPaletteHistoryType[]>('cmd-palette-history', [])

  const sortedHistory: CommandPaletteHistoryType[] = useMemo(() => {
    return [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [history])

  const handleClick = (index: number) => {
    const clickedItem = sortedHistory[index]
    if (!clickedItem) return

    setFilterInput(clickedItem.filterInput)
    toggleOpen(false)

    setHistory((prev) => {
      const arr = Array.isArray(prev) ? prev : []
      const filtered = arr.filter((item) => item.filterInput !== clickedItem.filterInput)

      return [
        { date: new Date(), filterInput: clickedItem.filterInput },
        ...filtered,
      ]
    })
  }

  const removeItem = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()

    const itemToRemove = sortedHistory[index]
    if (!itemToRemove) return

    setHistory((prev) => {
      const arr = Array.isArray(prev) ? prev : []
      return arr.filter((item) => item.filterInput !== itemToRemove.filterInput)
    })
  }

  if (!sortedHistory.length) return

  return (
    <div className={cn('overflow-auto scrollbar border-white/10 py-1 border-t flex flex-col max-h-[40vh]')}>
      {sortedHistory.map((history, i) => (
        <button
          key={i}
          onClick={() => handleClick(i)}
          className="w-full px-3 p-2 flex items-center justify-between cursor-pointer hover:bg-white/20 rounded-lg group"
        >
          <div className="flex gap-3 text-md sm:text-lg items-center justify-start truncate">
            <ClockClockwiseIcon weight="bold" size={15} className="text-base-content/80 shrink-0" />
            <p className="max-w-[16rem] sm:max-w-88 truncate"> {history.filterInput} </p>
          </div>

          <div className="h-full flex text-xs text-base-content/50 max-sm:hidden group-hover:hidden">
            {new Date(history.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>

          <XIcon className="group-hover:block sm:hidden z-70" weight="bold" onClick={(e) => removeItem(e, i)} />
        </button>
      ))}
    </div>
  )
}

export default CommandPaletteHistory
