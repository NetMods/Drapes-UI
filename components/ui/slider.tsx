import { useEffect, useRef, useState, useCallback } from "react"
import { Tooltip } from "./tooltip";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";

interface RangeSliderProps {
  label: string;
  value?: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  description: string | undefined;
  onReset: () => void;
}

export const RangeSlider = ({ label, min, max, step, onChange, value, description, onReset }: RangeSliderProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const sliderRef = useRef<HTMLDivElement | null>(null)
  const markerRef = useRef<HTMLDivElement | null>(null)
  const valueRef = useRef<HTMLDivElement | null>(null)

  const [internalValue, setInternalValue] = useState<number>(() => {
    let defaultValue = (min + max) / 2
    if (step !== undefined && step > 0) {
      defaultValue = Math.round(defaultValue / step) * step
    }
    return Math.max(min, Math.min(defaultValue, max))
  })

  const currentValue = value ?? internalValue

  const currentValueRef = useRef(currentValue)
  useEffect(() => {
    currentValueRef.current = currentValue
  }, [currentValue])

  const updatePosition = useCallback((val: number) => {
    const container = containerRef.current
    const slider = sliderRef.current
    const marker = markerRef.current
    if (!container || !slider || !marker) return

    const rect = container.getBoundingClientRect()
    const range = max - min
    if (range === 0) return

    let percentage = (val - min) / range
    percentage = Math.max(0, Math.min(1, percentage))
    const x = percentage * rect.width

    slider.style.width = `${x}px`

    marker.style.left = `${Math.max(x - marker.offsetWidth - 6, 6)}px`
  }, [min, max])

  useEffect(() => {
    updatePosition(currentValue)
  }, [currentValue])

  useEffect(() => {
    const container = containerRef.current
    const slider = sliderRef.current
    const marker = markerRef.current
    const valueEl = valueRef.current
    if (!container || !slider || !marker || !label || !valueEl) return

    let isDragging = false

    const checkOverlap = () => {
      const markerRect = marker.getBoundingClientRect()
      const valueRect = valueEl.getBoundingClientRect()
      const overlapsValue = !(
        markerRect.right < valueRect.left ||
        markerRect.left > valueRect.right
      )
      marker.style.opacity = overlapsValue ? "0" : "1"
    }

    const handleMouseDown = (event: MouseEvent) => {
      event.preventDefault()
      isDragging = true
      document.body.style.userSelect = "none"
    }

    const handleMouseUp = () => {
      isDragging = false
      document.body.style.userSelect = ""
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging) return
      const rect = container.getBoundingClientRect()
      let x = Math.max(0, Math.min(event.clientX - rect.left, rect.width))
      slider.style.width = `${x}px`
      marker.style.left = `${Math.max(x - marker.offsetWidth - 6, 6)}px`
      checkOverlap()

      const range = max - min
      if (range === 0) return
      let newPercentage = x / rect.width
      let newVal = min + newPercentage * range
      if (step !== undefined && step > 0) {
        newVal = Math.round(newVal / step) * step
      }
      newVal = Math.max(min, Math.min(newVal, max))
      setInternalValue(newVal)
      onChange(newVal)
    }

    const handleTouchStart = (event: TouchEvent) => {
      event.preventDefault()
      isDragging = true
      document.body.style.userSelect = "none"
    }

    const handleTouchEnd = () => {
      isDragging = false
      document.body.style.userSelect = ""
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!isDragging) return
      const touch = event.touches[0]
      const rect = container.getBoundingClientRect()
      let x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width))
      slider.style.width = `${x}px`
      marker.style.left = `${Math.max(x - marker.offsetWidth - 6, 6)}px`
      checkOverlap()

      const range = max - min
      if (range === 0) return
      let newPercentage = x / rect.width
      let newVal = min + newPercentage * range
      if (step !== undefined && step > 0) {
        newVal = Math.round(newVal / step) * step
      }
      newVal = Math.max(min, Math.min(newVal, max))
      setInternalValue(newVal)
      onChange(newVal)
    }

    container.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("mousemove", handleMouseMove)
    container.addEventListener("touchstart", handleTouchStart)
    window.addEventListener("touchend", handleTouchEnd)
    window.addEventListener("touchmove", handleTouchMove)

    const resizeObserver = new ResizeObserver(() => {
      updatePosition(currentValueRef.current)
    })
    resizeObserver.observe(container)

    checkOverlap()

    return () => {
      container.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("mousemove", handleMouseMove)
      container.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchend", handleTouchEnd)
      window.removeEventListener("touchmove", handleTouchMove)
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <div>
      <div className="flex justify-between items-center z-10 text-base-content/80 text-xs font-mono mb-2 pr-2" >
        <span className="flex justify-center items-center gap-1">
          {label}
          <Tooltip description={description} />
        </span>
        <button
          onClick={onReset}
          className="text-base-content/60 hover:text-base-content transition-colors"
          aria-label="Reset color"
        >
          <ArrowCounterClockwiseIcon size={15} weight="bold" />
        </button>
      </div>
      <div
        className="flex group h-10 w-full bg-base-100/10 border border-base-content/10 justify-end px-3 
        items-center text-base-content/70 rounded-lg select-none relative overflow-hidden max-w-full"
        ref={containerRef}
      >
        <div
          className="h-10 bg-base-content/20 w-0 absolute left-0 rounded-r-lg"
          ref={sliderRef}
        />
        <div
          className="absolute h-5 bg-base-content/50 rounded-full group-hover:bg-base-content/80 transitiona-all ease-linear"
          style={{ width: "2px" }}
          ref={markerRef}
        />
        <span className="hidden z-10 pointer-events-none text-base-content/80 text-xs font-mono"> {label} </span>
        <div
          className="group-hover:text-base-content font-mono text-[0.8rem] z-10 flex flex-col items-center justify-center transitiona-all ease-linear"
          ref={valueRef}
        >
          {Math.round(currentValue)}
        </div>
      </div>
    </div>
  )
}
