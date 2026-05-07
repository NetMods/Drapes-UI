import {
  CameraIcon,
  PlayIcon,
  StopCircleIcon,
  WrenchIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  captureScreenshot,
  cn,
  getCanvasElement,
  isRecordingSupported,
  type RecordingController,
  startCanvasRecording,
} from "@/lib/utils";

interface ToolButtonProps {
  className?: string;
  mobile?: boolean;
  backgroundName?: string;
  screenshotDelay?: number;
  maxRecordingDuration?: number;
  onRecordingStateChange?: (isRecording: boolean) => void;
  onRegisterStop?: (stopFn: () => void) => void;
}

const ToolButton = ({
  className,
  mobile = false,
  backgroundName = "background",
  screenshotDelay = 0,
  maxRecordingDuration = 30000,
  onRecordingStateChange,
  onRegisterStop,
}: ToolButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
  const recorderRef = useRef<RecordingController | null>(null);
  const recordingStartTimeRef = useRef<number | null>(null);

  const stopRecording = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
      recordingStartTimeRef.current = null;
      setRecordingElapsedMs(0);
      setIsRecording(false);
      onRecordingStateChange?.(false);
    }
  }, [onRecordingStateChange]);

  useEffect(() => {
    onRegisterStop?.(stopRecording);
  }, [onRegisterStop, stopRecording]);

  useEffect(() => {
    if (!isRecording || recordingStartTimeRef.current === null) {
      return;
    }

    const updateElapsed = () => {
      if (recordingStartTimeRef.current === null) {
        return;
      }
      setRecordingElapsedMs(Date.now() - recordingStartTimeRef.current);
    };

    updateElapsed();
    const intervalId = window.setInterval(updateElapsed, 250);

    return () => window.clearInterval(intervalId);
  }, [isRecording]);

  const formatRecordingTime = (elapsedMs: number) => {
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleScreenshot = async () => {
    const canvas = getCanvasElement();
    const filename = `drapes-${backgroundName.toLowerCase().replace(/\s+/g, "-")}`;
    const result = await captureScreenshot(canvas, {
      delay: screenshotDelay,
      filename,
      format: "png",
    });

    if (!result.success) {
      console.error("Screenshot failed:", result.error);
    }
  };

  const handleRecordToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      const { supported, reason } = isRecordingSupported();
      if (!supported) {
        window.alert(reason ?? "Recording is not supported in this browser.");
        return;
      }

      const canvas = getCanvasElement();
      const filename = `drapes-${backgroundName.toLowerCase().replace(/\s+/g, "-")}`;

      const controller = startCanvasRecording(
        canvas,
        {
          frameRate: 30,
          maxDuration: maxRecordingDuration,
          filename,
        },
        () => {
          recordingStartTimeRef.current = null;
          setRecordingElapsedMs(0);
          setIsRecording(false);
          onRecordingStateChange?.(false);
          recorderRef.current = null;
        },
      );

      if (controller) {
        recorderRef.current = controller;
        recordingStartTimeRef.current = Date.now();
        setRecordingElapsedMs(0);
        setIsRecording(true);
        onRecordingStateChange?.(true);
      }
    }
  };

  const leftTools = [
    {
      icon: CameraIcon,
      label: "Screenshot",
      onClick: handleScreenshot,
      disabled: false,
    },
  ];

  const rightTools = [
    {
      icon: isRecording ? StopCircleIcon : PlayIcon,
      label: isRecording ? "Stop Recording" : "Record",
      onClick: handleRecordToggle,
      isRecording,
    },
  ];

  return (
    <div
      className={cn(
        className,
        "flex items-center justify-center md:-translate-x-1/2",
      )}
    >
      {leftTools.map((item, index) => (
        <button
          type="button"
          key={item.label}
          onClick={item.onClick}
          disabled={item.disabled}
          title={item.label}
          className={cn(
            "p-2 rounded-md cursor-pointer hover:bg-white/10 backdrop-blur-lg text-base-content/70 transition-all duration-200",
            isOpen
              ? "opacity-100 scale-100 mr-2"
              : "opacity-0 scale-0 w-0 pointer-events-none",
            item.disabled && "opacity-50 cursor-not-allowed",
          )}
          style={{
            transitionDelay: isOpen
              ? `${index * 50}ms`
              : `${(leftTools.length - index - 1) * 50}ms`,
          }}
        >
          <item.icon weight="duotone" size={23} />
        </button>
      ))}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "p-2 rounded-md cursor-pointer hover:bg-white/10 backdrop-blur-lg text-base-content/70 transition-all duration-200",
          isOpen && "rotate-90",
        )}
      >
        {isOpen ? (
          <XIcon size={23} />
        ) : (
          <WrenchIcon weight="duotone" size={23} />
        )}
      </button>

      {rightTools.map((item, index) => (
        <button
          type="button"
          key={item.label}
          onClick={item.onClick}
          title={item.label}
          className={cn(
            "flex items-center gap-2 rounded-md cursor-pointer hover:bg-white/10 backdrop-blur-lg transition-all duration-200",
            isOpen
              ? "opacity-100 scale-100 ml-2 px-2 py-2"
              : "opacity-0 scale-0 w-0 pointer-events-none",
            item.label.includes("Record") && item.isRecording
              ? "text-red-500 bg-red-500/20 animate-pulse"
              : "text-base-content/70",
          )}
          style={{
            transitionDelay: isOpen
              ? `${index * 50}ms`
              : `${(rightTools.length - index - 1) * 50}ms`,
          }}
        >
          <item.icon weight="duotone" size={23} />
          {item.isRecording && (
            <span className="min-w-11 text-sm font-medium tabular-nums">
              {formatRecordingTime(recordingElapsedMs)}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default ToolButton;
