// Les 12 formes du jeu, dessinées en SVG (couleur = currentColor)
const PATHS = {
  circle: <circle cx="50" cy="50" r="34" />,
  square: <rect x="18" y="18" width="64" height="64" rx="10" />,
  triangle: <path d="M50 12 L90 84 H10 Z" />,
  diamond: <path d="M50 8 L92 50 L50 92 L8 50 Z" />,
  star: <polygon points="50,8 61,38 93,38 67,57 77,88 50,69 23,88 33,57 7,38 39,38" />,
  hexagon: <polygon points="50,8 87,29 87,71 50,92 13,71 13,29" />,
  ring: <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="14" />,
  plus: <path d="M38 12h24v26h26v24H62v26H38V62H12V38h26z" />,
  heart: <path d="M50 88C20 66 8 50 8 33 8 19 19 10 31 10c9 0 15 5 19 12 4-7 10-12 19-12 12 0 23 9 23 23 0 17-12 33-42 55Z" />,
  moon: <path d="M64 8a42 42 0 1 0 28 58A34 34 0 0 1 64 8Z" />,
  drop: <path d="M50 6S18 46 18 64a32 32 0 0 0 64 0C82 46 50 6 50 6Z" />,
  bolt: <path d="M58 4 L16 56 H46 L38 96 L84 40 H54 Z" />,
}

export default function Shape({ shape, className }) {
  return (
    <svg viewBox="0 0 100 100" fill="currentColor" className={className} aria-hidden="true">
      {PATHS[shape]}
    </svg>
  )
}
