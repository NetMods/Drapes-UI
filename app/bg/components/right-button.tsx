import { ArrowRightIcon } from "@phosphor-icons/react"


const RightButton = ({ action, isDisabled, className, size }: { action: () => void, isDisabled: boolean, className?: string, size?: number }) => {
  return (
    <button
      onClick={action}
      className={`enabled:active:scale-95 cursor-pointer enabled:hover:bg-base-content/20 disabled:opacity-40 
        enabled:hover:ring-1 rounded-sm ring-base-content/40 transition-all disabled:cursor-not-allowed ${className}`}
      disabled={isDisabled}
    >
      <ArrowRightIcon size={size ?? 25} weight="bold" />
    </button>
  )
}

export default RightButton

