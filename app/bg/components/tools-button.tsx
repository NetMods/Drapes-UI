import { CameraIcon, PlayIcon, StopCircleIcon, XIcon, WrenchIcon } from "@phosphor-icons/react"
import { cn, captureScreenshot, getCanvasElement, startCanvasRecording, isRecordingSupported, RecordingController } from "@/lib/utils"
import { useState, useRef, useEffect } from "react"

interface ToolButtonProps {
  className?: string;
  backgroundName?: string;
  screenshotDelay?: number;
  maxRecordingDuration?: number;
  onRecordingStateChange?: (isRecording: boolean) => void;
  onRegisterStop?: (stopFn: () => void) => void;
}

const ToolButton = ({
  className,
  backgroundName = 'background',
  screenshotDelay = 0,
  maxRecordingDuration = 30000,
  onRecordingStateChange,
  onRegisterStop
}: ToolButtonProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const recorderRef = useRef<RecordingController | null>(null)

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
      setIsRecording(false);
      onRecordingStateChange?.(false);
    }
  };

  useEffect(() => {
    onRegisterStop?.(stopRecording);
  });

  const handleScreenshot = async () => {
    const canvas = getCanvasElement();
    const filename = `drapes-${backgroundName.toLowerCase().replace(/\s+/g, '-')}`;
    const result = await captureScreenshot(canvas, {
      delay: screenshotDelay,
      filename,
      format: 'png'
    });

    if (!result.success) {
      console.error('Screenshot failed:', result.error);
    }
  };

  const handleRecordToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      const { supported, reason } = isRecordingSupported();
      if (!supported) {
        window.alert(reason ?? 'Recording is not supported in this browser.');
        return;
      }

      const canvas = getCanvasElement();
      const filename = `drapes-${backgroundName.toLowerCase().replace(/\s+/g, '-')}`;

      const controller = startCanvasRecording(canvas, {
        frameRate: 30,
        maxDuration: maxRecordingDuration,
        filename
      }, () => {
        setIsRecording(false);
        onRecordingStateChange?.(false);
        recorderRef.current = null;
      });

      if (controller) {
        recorderRef.current = controller;
        setIsRecording(true);
        onRecordingStateChange?.(true);
      }
    }
  };

  const leftTools = [
    { icon: CameraIcon, label: "Screenshot", onClick: handleScreenshot, disabled: false },
  ]

  const rightTools = [
    { icon: isRecording ? StopCircleIcon : PlayIcon, label: isRecording ? "Stop Recording" : "Record", onClick: handleRecordToggle, isRecording },
  ]

  return (
    <div className={cn(className, "flex items-center justify-center -translate-x-1/2")}>
      {leftTools.map((item, index) => (
        <button
          key={item.label}
          onClick={item.onClick}
          disabled={item.disabled}
          title={item.label}
          className={cn(
            "p-2 rounded-md cursor-pointer hover:bg-white/10 backdrop-blur-lg text-base-content/70 transition-all duration-200",
            isOpen
              ? "opacity-100 scale-100 mr-2"
              : "opacity-0 scale-0 w-0 pointer-events-none",
            item.disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{
            transitionDelay: isOpen ? `${index * 50}ms` : `${(leftTools.length - index - 1) * 50}ms`
          }}
        >
          <item.icon weight="duotone" size={23} />
        </button>
      ))}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 rounded-md cursor-pointer hover:bg-white/10 backdrop-blur-lg text-base-content/70 transition-all duration-200",
          isOpen && "rotate-90"
        )}
      >
        {isOpen ? <XIcon size={23} /> : <WrenchIcon weight="duotone" size={23} />}
      </button>

      {rightTools.map((item, index) => (
        <button
          key={item.label}
          onClick={item.onClick}
          title={item.label}
          className={cn(
            "p-2 rounded-md cursor-pointer hover:bg-white/10 backdrop-blur-lg transition-all duration-200",
            isOpen
              ? "opacity-100 scale-100 ml-2"
              : "opacity-0 scale-0 w-0 pointer-events-none",
            item.label.includes("Record") && item.isRecording
              ? "text-red-500 bg-red-500/20 animate-pulse"
              : "text-base-content/70"
          )}
          style={{
            transitionDelay: isOpen ? `${index * 50}ms` : `${(rightTools.length - index - 1) * 50}ms`
          }}
        >
          <item.icon weight="duotone" size={23} />
        </button>
      ))}
    </div>
  )
}

export default ToolButton
