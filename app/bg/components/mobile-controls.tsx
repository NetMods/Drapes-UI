import { CaretUpIcon } from "@phosphor-icons/react"
import SettingsButton from "./setting-button";
import CodeButton from "./code-button";
import { useState } from "react";


const MobileControls = ({ handleSettingSidebar, handleCodeSidebar }: { handleSettingSidebar: () => void; handleCodeSidebar: () => void }) => {
  const [isClicked, setIsClicked] = useState(false);

  return (
    <div className='border border-white/30 rounded-xl fixed bottom-4 left-1/2 translate-x-[-50%] text-base-content/70
      sm:hidden bg-white/10 backdrop-blur-lg
    '>
      {!isClicked && (
        <CaretUpIcon className='left-1/2 translate-x-[-50%] top-[-25] animate-bounce absolute' weight='bold' size={24} />
      )}

      <SettingsButton
        action={() => {
          handleSettingSidebar();
          setIsClicked(true);
        }}
      />

      <CodeButton
        action={() => {
          handleCodeSidebar();
          setIsClicked(true);
        }}
      />
    </div>
  )
}
export default MobileControls
