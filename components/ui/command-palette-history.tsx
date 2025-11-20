import { useMemo } from "react"
import useLocalStorage from "@/hooks/use-local-storage"
import { CommandPaletteHistoryType } from "./command-palette"
import { ClockClockwiseIcon } from "@phosphor-icons/react/dist/ssr"
import { useMediaQuery } from "@/hooks/use-media-query"
import { useCommandPalette } from "./command-palette"


const CommandPaletteHistory = () => {

  const { toggleOpen, setFilterInput } = useCommandPalette()
  const [historys, , setHistory] = useLocalStorage<CommandPaletteHistoryType[]>('cmd-palette-history', [])
  const { isMobile } = useMediaQuery()

  const sortedHistory: CommandPaletteHistoryType[] = useMemo(() => {
    const newArr = historys
    return newArr.sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })
  }, [historys])

  const options: Intl.DateTimeFormatOptions = isMobile
    ? { month: 'long', day: 'numeric' }
    : { year: 'numeric', month: 'long', day: 'numeric' }

  const handleClick = (filterInput: string) => {
    setFilterInput(filterInput)
    toggleOpen(false)
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
  }

  return (
    <>
      {
        sortedHistory.map((history) => {
          return (
            <button
              onClick={() => handleClick(history.filterInput)}
              className="w-full px-3 p-2 flex items-start justify-between cursor-pointer hover:bg-white/20 rounded-lg">
              <div className="flex gap-3 text-lg items-center justify-center">
                <ClockClockwiseIcon />
                {history.filterInput}
              </div>
              <div className="flex ml-2">
                {
                  new Date(history.date).toLocaleDateString('en-US', options)
                }
              </div>
            </button>
          )
        })
      }
    </>
  )
}

export default CommandPaletteHistory
