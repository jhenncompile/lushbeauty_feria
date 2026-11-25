interface ServiceRowProps {
  index: string
  title: string
  description?: string
  duration?: string
  price: string
}

export function ServiceRow({ index, title, description, duration, price }: ServiceRowProps) {
  return (
    <div className="lb-row">
      <span className="lb-row__index">{index}</span>
      <div className="lb-row__main">
        <div className="lb-row__title">{title}</div>
        {description ? <div className="lb-row__desc">{description}</div> : null}
      </div>
      <div className="lb-row__side">
        {duration ? <div className="lb-row__duration">{duration}</div> : null}
        <div className="lb-row__price">{price}</div>
      </div>
    </div>
  )
}
