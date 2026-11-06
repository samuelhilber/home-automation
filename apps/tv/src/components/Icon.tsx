export default function Icon({ name }: { name: string }) {
  return (
    <svg className="icon">
      <use href={`#i-${name}`} />
    </svg>
  )
}
