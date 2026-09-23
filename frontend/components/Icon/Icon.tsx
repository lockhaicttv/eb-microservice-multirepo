interface IconProps {
  name: string
  className?: string
  filled?: boolean
}

const Icon = ({ name, className = '', filled = false }: IconProps) => {
  const variant = filled ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 400"
  return (
    <span
      aria-hidden='true'
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: variant }}
    >
      {name}
    </span>
  )
}

export default Icon
