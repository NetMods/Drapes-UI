import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ClockClockwiseIcon, HashIcon, ImageIcon, XIcon } from "@phosphor-icons/react"
import { CommandPaletteHistoryType, useCommandPalette } from "./context"
import { cn } from "@/lib/utils"
import { registry } from "@/lib/registry"
import { useRouter } from "next/navigation"

type SuggestionItem =
  | { type: 'history'; inputValue: string; date: Date }
  | { type: 'background'; id: string; name: string; description?: string; tags: string[] }
  | { type: 'tag'; tag: string; count: number }

const CommandPaletteDropdown = () => {
  const { inputValue, toggleOpen, setInputValue, history, setHistory, handleSubmit } = useCommandPalette()
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const itemsRefs = useRef<(HTMLButtonElement | null)[]>([])
  const router = useRouter()
  const backgrounds = registry.getAll()

  const sortedHistory: CommandPaletteHistoryType[] = useMemo(() => {
    return [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [history])

  const allTags = useMemo(() => {
    const tagsSet = new Set<string>()
    backgrounds.forEach(({ config }) => {
      config.tags?.forEach(tag => tagsSet.add(tag))
    })
    return Array.from(tagsSet).sort()
  }, [backgrounds])

  const suggestions: SuggestionItem[] = useMemo(() => {
    if (!inputValue.trim()) {
      return sortedHistory.map(h => ({ type: 'history', ...h }))
    }

    const searchTerm = inputValue.toLowerCase()

    const filteredBgs = backgrounds
      .filter(({ config }) => {
        const tagsMatch = config.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        const nameMatch = config.name.toLowerCase().includes(searchTerm)
        const descriptionMatch = config.description?.toLowerCase().includes(searchTerm)
        return tagsMatch || nameMatch || descriptionMatch
      })
      .map(({ config }) => ({
        type: 'background' as const,
        id: config.id,
        name: config.name,
        description: config.description,
        tags: config.tags || []
      }))
      .slice(0, 10)

    const filteredTags = allTags
      .filter(tag => tag.toLowerCase().includes(searchTerm))
      .map(tag => ({
        type: 'tag' as const,
        tag,
        count: backgrounds.filter(b => b.config.tags?.includes(tag)).length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const filteredHistory = sortedHistory
      .filter(h => h.inputValue.toLowerCase().includes(searchTerm))
      .map(h => ({ type: 'history' as const, ...h }))
      .slice(0, 5)

    return [...filteredBgs, ...filteredTags, ...filteredHistory]
  }, [inputValue, backgrounds, allTags, sortedHistory, highlightedIndex])

  const handleSelect = useCallback((item: SuggestionItem) => {
    const query = inputValue.trim()
    switch (item.type) {
      case 'history':
        setInputValue(item.inputValue)
        handleSubmit(item.inputValue)
        break
      case 'tag':
        setInputValue(item.tag)
        handleSubmit(item.tag)
        break
      case 'background':
        if (query) {
          setHistory(prev => {
            const arr = Array.isArray(prev) ? prev : []
            const existingIndex = arr.findIndex(h => h.inputValue === query)
            let newHistory: CommandPaletteHistoryType[]
            if (existingIndex > -1) {
              newHistory = [...arr]
              newHistory[existingIndex] = { date: new Date(), inputValue: query }
            } else {
              newHistory = [...arr, { date: new Date(), inputValue: query }]
            }
            return newHistory.slice(-50)
          })
        }
        router.push(`/bg?id=${item.id}`)
        toggleOpen()
        break
    }
  }, [inputValue, setInputValue, highlightedIndex, handleSubmit, setHistory, router, toggleOpen])

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
      if (!['arrowdown', 'arrowup', 'enter'].includes(key)) return
      e.preventDefault()

      let updatedIndex = highlightedIndex
      if (key === 'arrowdown')
        updatedIndex = (highlightedIndex + 1) % suggestions.length
      else if (key === 'arrowup')
        updatedIndex = highlightedIndex <= 0 ? suggestions.length - 1 : highlightedIndex - 1
      else if (key === 'enter') {
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex])
        } else handleSubmit(inputValue)
        return
      }

      itemsRefs.current[updatedIndex]?.scrollIntoView({
        block: 'center', behavior: "smooth"
      })

      setHighlightedIndex(updatedIndex)
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [suggestions, highlightedIndex])

  if (!suggestions.length) return

  return (
    <div className={cn('overflow-auto scrollbar border-white/10 pt-1 border-t flex flex-col max-h-[40vh]')}>
      {suggestions.map((item, i) => (
        <button
          key={i}
          ref={(el) => { itemsRefs.current[i] = el }}
          onClick={() => handleSelect(item)}
          className={cn(
            "w-full outline-none px-3 p-2 flex items-center justify-between cursor-pointer rounded-md group",
            highlightedIndex === i ? "bg-white/20" : "hover:bg-white/20",
            "scroll-m-20"
          )}
        >
          <div className="flex gap-3 text-md sm:text-lg items-center justify-start truncate flex-1">
            {item.type === 'history' && (
              <ClockClockwiseIcon weight="bold" size={15} className="text-base-content/80 shrink-0" />
            )}
            {item.type === 'tag' && (
              <HashIcon weight="bold" size={15} className="text-base-content/80 shrink-0" />
            )}
            {item.type === 'background' && (
              <ImageIcon weight="duotone" size={15} className="text-base-content/80 shrink-0" />
            )}
            <div className="truncate">
              {item.type === 'background' && (
                <p className="font-medium truncate">{item.name}</p>
              )}
              {item.type === 'tag' && (
                <p className="truncate inline-flex justify-center items-center ">
                  {item.tag}
                  {item.count > 0 && <span className="text-xs text-base-content/50 ml-1">({item.count})</span>}
                </p>
              )}
              {item.type === 'history' && (
                <p className="max-w-[16rem] sm:max-w-88 truncate">
                  {item.inputValue}
                </p>
              )}
            </div>
          </div>
          {item.type === 'history' && (
            <>
              <div className="h-full flex text-xs text-base-content/50 max-sm:hidden group-hover:hidden">
                {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
              <XIcon
                className="group-hover:block text-base-content/80 sm:hidden z-70"
                size={15}
                weight="bold"
                onClick={(e) => removeItem(e, i)}
              />
            </>
          )}
        </button>
      ))}
    </div>
  )
}

export default CommandPaletteDropdown
