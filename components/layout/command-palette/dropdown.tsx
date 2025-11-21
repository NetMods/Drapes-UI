import { useEffect, useMemo, useRef, useState } from "react"
import { ClockClockwiseIcon, XIcon } from "@phosphor-icons/react"
import { CommandPaletteHistoryType, useCommandPalette } from "./context"
import { cn } from "@/lib/utils"

const CommandPaletteHistory = () => {
  const { inputValue, setInputValue, history, setHistory, handleSubmit } = useCommandPalette()
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const itemsRefs = useRef<(HTMLButtonElement | null)[]>([])

  const sortedHistory: CommandPaletteHistoryType[] = useMemo(() => {
    return [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [history])

  const handleClick = (index: number) => {
    const selectedItem = sortedHistory[index]?.inputValue
    if (!selectedItem) return

    handleSubmit(selectedItem)
    setInputValue(selectedItem)
  }

  const removeItem = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()

    const itemToRemove = sortedHistory[index]
    if (!itemToRemove) return

    setHistory((prev) => {
      const arr = Array.isArray(prev) ? prev : []
      return arr.filter((item) => item.inputValue !== itemToRemove.inputValue)
    })

    setHighlightedIndex(prev => {
      if (prev === index) return Math.max(0, prev - 1)
      if (prev > index) return prev - 1
      return prev
    })
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sortedHistory.length) return
      const key = e.key.toLowerCase()

      let updatedIndex = 0
      if (key === 'arrowdown')
        updatedIndex = (highlightedIndex + 1) % sortedHistory.length
      else if (key === 'arrowup')
        updatedIndex = highlightedIndex <= 0 ? sortedHistory.length - 1 : highlightedIndex - 1
      else return

      e.preventDefault()

      const selectedItem = sortedHistory[updatedIndex]?.inputValue
      if (selectedItem) setInputValue(selectedItem)

      itemsRefs.current[updatedIndex]?.scrollIntoView({
        block: 'center', behavior: "smooth"
      })

      setHighlightedIndex(updatedIndex)
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [sortedHistory, highlightedIndex])

  useEffect(() => {
    if (highlightedIndex === -1) return

    // Reset the highlightedIndex when inputValue changed
    const highlightedText = sortedHistory[highlightedIndex]?.inputValue
    if (highlightedText && inputValue !== highlightedText) {
      setHighlightedIndex(-1)
    }
  }, [inputValue, highlightedIndex])

  if (!sortedHistory.length) return

  return (
    <div className={cn('overflow-auto scrollbar border-white/10 pt-1 border-t flex flex-col max-h-[40vh]')}>
      {sortedHistory.map((history, i) => (
        <button
          key={i}
          ref={(el) => { itemsRefs.current[i] = el }}
          onClick={() => handleClick(i)}
          className={cn(
            "w-full outline-none px-3 p-2 flex items-center justify-between cursor-pointer rounded-md group",
            highlightedIndex === i ? "bg-white/20" : "hover:bg-white/20", "scroll-m-20"
          )}
        >
          <div className="flex gap-3 text-md sm:text-lg items-center justify-start truncate">
            <ClockClockwiseIcon weight="bold" size={15} className="text-base-content/80 shrink-0" />
            <p className="max-w-[16rem] sm:max-w-88 truncate"> {history.inputValue} </p>
          </div>

          <div className="h-full flex text-xs text-base-content/50 max-sm:hidden group-hover:hidden">
            {new Date(history.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>

          <XIcon className="group-hover:block text-base-content/80 sm:hidden z-70" size={15} weight="bold" onClick={(e) => removeItem(e, i)} />
        </button>
      ))}
    </div>
  )
}

export default CommandPaletteHistory
