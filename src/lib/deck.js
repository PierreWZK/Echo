// Les 12 symboles du jeu. Chaque paire a une forme, une couleur et une note.
// Les notes suivent une gamme pentatonique (do, ré, mi, sol, la) : elles sonnent
// toujours bien ensemble. Les couleurs suivent les notes : du rouge pour les
// graves jusqu'au violet pour les aiguës.
const NOTES = [
  { name: 'Do', freq: 261.63 },
  { name: 'Ré', freq: 293.66 },
  { name: 'Mi', freq: 329.63 },
  { name: 'Sol', freq: 392.0 },
  { name: 'La', freq: 440.0 },
  { name: 'Do', freq: 523.25 },
  { name: 'Ré', freq: 587.33 },
  { name: 'Mi', freq: 659.25 },
  { name: 'Sol', freq: 783.99 },
  { name: 'La', freq: 880.0 },
  { name: 'Do', freq: 1046.5 },
  { name: 'Ré', freq: 1174.66 },
]

const SHAPES = [
  'circle', 'square', 'triangle', 'diamond', 'star', 'hexagon',
  'ring', 'plus', 'heart', 'moon', 'drop', 'bolt',
]

const SHAPE_LABELS = {
  circle: 'cercle', square: 'carré', triangle: 'triangle', diamond: 'losange',
  star: 'étoile', hexagon: 'hexagone', ring: 'anneau', plus: 'croix',
  heart: 'cœur', moon: 'lune', drop: 'goutte', bolt: 'éclair',
}

export const SYMBOLS = NOTES.map((note, i) => ({
  id: i,
  shape: SHAPES[i],
  label: SHAPE_LABELS[SHAPES[i]],
  note: note.name,
  freq: note.freq,
  color: `hsl(${i * 25}, 85%, 62%)`, // 0° (rouge) → 275° (violet)
}))

export const LEVELS = {
  facile: { label: 'Facile', pairs: 6, cols: 4 },
  moyen: { label: 'Moyen', pairs: 8, cols: 4 },
  difficile: { label: 'Difficile', pairs: 12, cols: 6 },
}

export const MODES = {
  classique: { label: 'Classique', hint: 'Formes, couleurs et sons' },
  ecoute: { label: 'Écoute', hint: 'Uniquement le son' },
}

// Générateur pseudo-aléatoire initialisé avec un texte (mulberry32).
// Le même texte donne toujours la même suite de nombres : c'est ce qui permet
// au défi du jour d'avoir la même grille pour tout le monde.
export function seededRandom(text) {
  let seed = [...text].reduce((acc, ch) => Math.imul(acc ^ ch.charCodeAt(0), 2654435761), 1779033703)
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Mélange de Fisher-Yates : chaque ordre a la même probabilité
export function shuffle(list, rand = Math.random) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Crée un paquet mélangé : on tire `pairs` symboles au hasard, chacun en double
export function createDeck(pairs, rand = Math.random) {
  const chosen = shuffle(SYMBOLS, rand).slice(0, pairs)
  return shuffle([...chosen, ...chosen], rand).map((symbol, index) => ({
    id: index,
    symbol: symbol.id,
    matched: false,
    flips: 0, // nombre de fois où la carte a été retournée (relance l'animation d'écho)
  }))
}

export function formatTime(ms) {
  const total = Math.floor(ms / 1000)
  const minutes = String(Math.floor(total / 60)).padStart(2, '0')
  const seconds = String(total % 60).padStart(2, '0')
  return `${minutes}:${seconds}`
}
