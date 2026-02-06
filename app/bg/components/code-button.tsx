import { CodeIcon } from "@phosphor-icons/react"


const CodeButton = ({ action, className }: { action: () => void, className?: string }) => {
  return (
    <button
      className={`font-sans text-lg cursor-pointer hover:bg-base-content/20 p-2 rounded-sm text-base-content transition-colors ${className}`}
      onClick={action}
    >
      <span className='block md:hidden'> <CodeIcon size={23} weight='bold' /> </span>
      <span className='md:block hidden'> Code </span>
    </button>
  )
}
export default CodeButton

