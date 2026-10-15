// Écho Séquence : mémoriser une suite de notes qui s'allonge à chaque manche.
import { SYMBOLS } from './deck.js'

export const SEQ_LEVELS = {
  facile: { label: 'Facile', pads: 4, cols: 2 },
  moyen: { label: 'Moyen', pads: 6, cols: 3 },
  difficile: { label: 'Difficile', pads: 9, cols: 3 },
}

// Les pads utilisent des notes réparties sur toute la gamme (du grave à l'aigu),
// pour qu'elles soient faciles à distinguer à l'oreille.
export function padSymbols(count) {
  return Array.from({ length: count }, (_, i) => SYMBOLS[Math.round((i * (SYMBOLS.length - 1)) / (count - 1))])
}

// Durée d'une note pendant la lecture : la séquence accélère en s'allongeant
export function noteDuration(length) {
  return Math.max(300, 680 - length * 28)
}

export function randomPad(count) {
  return Math.floor(Math.random() * count)
}
