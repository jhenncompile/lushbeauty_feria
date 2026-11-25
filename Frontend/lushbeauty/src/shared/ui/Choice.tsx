import type { ReactNode } from 'react'

interface ChoiceProps {
  pressed: boolean
  onSelect: () => void
  children: ReactNode
}

export function Choice({ pressed, onSelect, children }: ChoiceProps) {
  return (
    <button type="button" className="choice" aria-pressed={pressed} onClick={onSelect}>
      {children}
    </button>
  )
}
