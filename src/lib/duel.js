// Duel contre l'ordinateur : règles du tour par tour et mémoire de l'adversaire.
import { createDeck, LEVELS } from './deck.js'

// Les adversaires. Leur force vient de leur mémoire :
//   capacity : nombre de cartes qu'ils peuvent retenir en même temps
//   notice   : probabilité de remarquer (et donc retenir) une carte retournée
export const BOTS = {
  poisson: {
    name: 'Poisson rouge',
    emoji: '🐟',
    description: 'Retient 2 ou 3 cartes, et encore…',
    capacity: 3,
    notice: 0.6,
  },
  hibou: {
    name: 'Hibou',
    emoji: '🦉',
    description: 'Observe bien, mais sa mémoire a ses limites.',
    capacity: 5,
    notice: 0.8,
  },
  elephant: {
    name: 'Éléphant',
    emoji: '🐘',
    description: "N'oublie (presque) jamais rien.",
    capacity: 24,
    notice: 0.97,
  },
}

// ---------- Règles du duel ----------

export function initDuel({ level, bot }) {
  return {
    level,
    bot,
    deck: createDeck(LEVELS[level].pairs).map(card => ({ ...card, owner: null })),
    flipped: [],
    turn: 'player', // 'player' ou 'bot'
    scores: { player: 0, bot: 0 },
    moves: { player: 0, bot: 0 },
    status: 'playing', // playing → over
    lastResult: null, // { by, match } : résultat du dernier coup, pour les commentaires
  }
}

export function duelReducer(state, action) {
  switch (action.type) {
    case 'reset':
      return initDuel(action)

    case 'flip': {
      const card = state.deck[action.index]
      if (
        state.status !== 'playing'
        || action.by !== state.turn
        || state.flipped.length >= 2
        || state.flipped.includes(action.index)
        || card.matched
      ) {
        return state
      }
      return {
        ...state,
        flipped: [...state.flipped, action.index],
        deck: state.deck.map((c, i) => (i === action.index ? { ...c, flips: c.flips + 1 } : c)),
      }
    }

    case 'resolve': {
      const [a, b] = state.flipped.map(i => state.deck[i])
      const by = state.turn
      const moves = { ...state.moves, [by]: state.moves[by] + 1 }

      // Paire trouvée : elle revient au joueur, qui rejoue
      if (a.symbol === b.symbol) {
        const deck = state.deck.map(c => (c.symbol === a.symbol ? { ...c, matched: true, owner: by } : c))
        const scores = { ...state.scores, [by]: state.scores[by] + 1 }
        return {
          ...state,
          deck,
          scores,
          moves,
          flipped: [],
          status: deck.every(c => c.matched) ? 'over' : 'playing',
          lastResult: { by, match: true },
        }
      }

      // Raté : la main passe à l'autre
      return {
        ...state,
        moves,
        flipped: [],
        turn: by === 'player' ? 'bot' : 'player',
        lastResult: { by, match: false },
      }
    }

    default:
      return state
  }
}

export function duelOutcome(scores) {
  if (scores.player > scores.bot) return 'win'
  if (scores.player < scores.bot) return 'loss'
  return 'draw'
}

// ---------- Mémoire de l'ordinateur ----------

// Les cartes dont l'ordinateur se souvient, de la plus récente à la plus ancienne.
// Quand la mémoire est pleine, la plus ancienne est oubliée.
export function createMemory({ capacity, notice }, rand = Math.random) {
  let entries = [] // { index, symbol }

  return {
    // Une carte vient d'être retournée (par n'importe qui)
    observe(index, symbol) {
      if (rand() > notice) return // pas remarquée
      entries = [{ index, symbol }, ...entries.filter(e => e.index !== index)].slice(0, capacity)
    },
    // Une paire a été trouvée : inutile de s'en souvenir
    forget(indexes) {
      entries = entries.filter(e => !indexes.includes(e.index))
    },
    entries: () => entries,
  }
}

// Choisit la prochaine carte à retourner. Renvoie { index, reason }.
//   reason : 'pair' (connaît une paire), 'partner' (connaît la jumelle),
//            'guess' (au hasard)
export function chooseCard(state, memory, rand = Math.random) {
  const { deck, flipped } = state
  const available = deck
    .map((card, index) => index)
    .filter(i => !deck[i].matched && !flipped.includes(i))
  const known = memory.entries().filter(e => available.includes(e.index) || flipped.includes(e.index))
  const knownIndexes = new Set(known.map(e => e.index))
  const pick = list => list[Math.floor(rand() * list.length)]

  // Ne pas retourner une carte qu'on connaît déjà sans savoir où est sa jumelle
  const unknown = available.filter(i => !knownIndexes.has(i))

  if (flipped.length === 0) {
    // Une paire complète en mémoire ? On commence par elle.
    for (const entry of known) {
      const twin = known.find(e => e.symbol === entry.symbol && e.index !== entry.index)
      if (twin) return { index: entry.index, reason: 'pair' }
    }
    return { index: pick(unknown.length ? unknown : available), reason: 'guess' }
  }

  // Deuxième carte : la jumelle de la première est-elle en mémoire ?
  const first = deck[flipped[0]]
  const twin = known.find(e => e.symbol === first.symbol && e.index !== flipped[0] && available.includes(e.index))
  if (twin) return { index: twin.index, reason: 'partner' }

  return { index: pick(unknown.length ? unknown : available), reason: 'guess' }
}
