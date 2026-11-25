interface StepsProps {
  label: string
  steps: string[]
  current: number
}

export function Steps({ label, steps, current }: StepsProps) {
  return (
    <ol className="steps" aria-label={label}>
      {steps.map((step, index) => (
        <li
          key={step}
          className={index === current ? 'is-current' : undefined}
          aria-current={index === current ? 'step' : undefined}
        >
          {step}
        </li>
      ))}
    </ol>
  )
}
