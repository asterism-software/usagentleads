"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"

interface Option {
  value: string
  label: string
}

interface CustomSelectProps {
  value: string
  options: Option[]
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  "aria-label"?: string
  minWidth?: number
  menuPlacement?: "top" | "bottom"
}

export function CustomSelect({
  value,
  options,
  onChange,
  placeholder = "Select...",
  className = "",
  "aria-label": ariaLabel,
  minWidth = 160,
  menuPlacement = "bottom",
}: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    if (open) {
      document.addEventListener("keydown", handleKey)
      return () => document.removeEventListener("keydown", handleKey)
    }
  }, [open])

  return (
    <div ref={ref} className={`relative ${className}`} style={minWidth ? { minWidth } : undefined}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-expanded={open}
        className={`flex items-center justify-between gap-2 w-full bg-white border text-[15px] px-4 py-2.5 rounded-lg shadow-sm transition-all duration-150 outline-none ${
          open
            ? "border-accent ring-2 ring-accent/20"
            : "border-border hover:border-border-strong"
        }`}
      >
        <span className={selected ? "text-ink" : "text-muted"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`text-muted transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-50 w-full overflow-hidden rounded-xl border border-border bg-white shadow-lg ${
            menuPlacement === "top"
              ? "bottom-full mb-1.5 animate-slide-up"
              : "top-full mt-1.5 animate-slide-down"
          }`}
        >
          <div className="max-h-[280px] overflow-y-auto py-1">
            {options.map((option) => {
              const isActive = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={`flex items-center justify-between w-full px-3.5 py-2 text-[14px] transition-colors ${
                    isActive
                      ? "bg-accent-light text-accent font-medium"
                      : "text-body hover:bg-subtle hover:text-ink"
                  }`}
                >
                  <span>{option.label}</span>
                  {isActive && <Check size={14} className="text-accent shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
