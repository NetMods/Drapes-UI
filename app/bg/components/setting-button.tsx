import { GearIcon } from "@phosphor-icons/react"




const SettingsButton = ({ action, className }: { action: () => void, className?: string }) => {
  return (
    <button
      className={`font-sans text-lg cursor-pointer hover:bg-base-content/20 p-2 rounded-sm text-base-content transition-colors ${className}`}
      onClick={action}
    >
      <span className='block md:hidden'> <GearIcon weight='bold' size={23} /> </span>
      <span className='md:block hidden'> Settings </span>
    </button>
  )
}
export default SettingsButton
