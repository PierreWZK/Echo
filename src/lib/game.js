// Règles du jeu, sous forme de reducer : (état, action) → nouvel état.
// Les sons et les minuteries restent dans le composant ; ici, uniquement la logique.
import { createDeck, LEVELS, seededRandom } from './deck.js'

export const POINTS_PER_PAIR = 100
export const FORGET_PENALTY = 30
export const SECONDS_PER_PAIR = 6 // temps « idéal » par paire pour le bonus
export const BONUS_PER_SECOND = 10

// `seed` (optionnel) : texte qui fixe le mélange des cartes (défi du jour)
export function initGame({ level, mode, seed = null }) {
  return {
    level,
    mode,
    seed,
    deck: createDeck(LEVELS[level].pairs, seed ? seededRandom(seed) : Math.random),
    flipped: [], // index des cartes retournées ce tour-ci (0, 1 ou 2)
    seen: [], // id des cartes déjà vues lors des tours précédents
    moves: 0,
    score: 0,
    combo: 0,
    maxCombo: 0,
    forgets: 0,
    timeBonus: 0,
    status: 'idle', // idle → playing → won
    startedAt: null,
    endedAt: null,
    feedback: null, // message flottant : « +200 », « Oubli −30 »…
    history: [], // résultat de chaque coup : 'match', 'miss' ou 'forget'
  }
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'reset':
      return initGame(action)

    case 'flip': {
      const card = state.deck[action.index]
      if (
        state.status === 'won'
        || state.flipped.length >= 2
        || state.flipped.includes(action.index)
        || card.matched
      ) {
        return state
      }

      const flipped = [...state.flipped, action.index]
      return {
        ...state,
        status: 'playing',
        startedAt: state.startedAt ?? action.now,
        flipped,
        moves: flipped.length === 2 ? state.moves + 1 : state.moves,
        deck: state.deck.map((c, i) => (i === action.index ? { ...c, flips: c.flips + 1 } : c)),
      }
    }

    case 'resolve': {
      const [a, b] = state.flipped.map(i => state.deck[i])
      const seen = [...new Set([...state.seen, a.id, b.id])]

      // Paire trouvée : 100 points × combo
      if (a.symbol === b.symbol) {
        const combo = state.combo + 1
        const gain = POINTS_PER_PAIR * combo
        const deck = state.deck.map(c => (c.symbol === a.symbol ? { ...c, matched: true } : c))
        const won = deck.every(c => c.matched)

        let score = state.score + gain
        let timeBonus = 0
        if (won) {
          const seconds = (action.now - state.startedAt) / 1000
          const target = LEVELS[state.level].pairs * SECONDS_PER_PAIR
          timeBonus = Math.max(0, Math.round((target - seconds) * BONUS_PER_SECOND))
          score += timeBonus
        }

        return {
          ...state,
          deck,
          seen,
          flipped: [],
          history: [...state.history, 'match'],
          combo,
          maxCombo: Math.max(state.maxCombo, combo),
          score,
          timeBonus,
          status: won ? 'won' : state.status,
          endedAt: won ? action.now : null,
          feedback: {
            id: action.now,
            kind: 'good',
            text: `+${gain}`,
            detail: combo > 1 ? `Combo ×${combo}` : null,
          },
        }
      }

      // Paire ratée. Si l'une des deux cartes avait déjà été vue,
      // on aurait pu s'en souvenir : c'est un « oubli », pénalisé.
      const forgot = state.seen.includes(a.id) || state.seen.includes(b.id)
      return {
        ...state,
        seen,
        flipped: [],
        history: [...state.history, forgot ? 'forget' : 'miss'],
        combo: 0,
        forgets: forgot ? state.forgets + 1 : state.forgets,
        score: forgot ? Math.max(0, state.score - FORGET_PENALTY) : state.score,
        feedback: {
          id: action.now,
          kind: forgot ? 'bad' : 'neutral',
          text: forgot ? `Oubli −${FORGET_PENALTY}` : 'Raté',
          detail: null,
        },
      }
    }

    default:
      return state
  }
}
