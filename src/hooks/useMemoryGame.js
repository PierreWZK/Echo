import { useEffect, useReducer, useRef, useState } from 'react'
import { SYMBOLS } from '../lib/deck.js'
import { gameReducer, initGame } from '../lib/game.js'
import { playArpeggio, playMatch, playMiss, playNote } from '../lib/audio.js'

// Toute la mécanique d'une partie : état, chronomètre, sons et fin de partie.
// Utilisé par le memory libre et par le défi du jour.
//   options : { level, mode, seed }
//   muted   : son coupé ou non
//   onWin   : appelé une fois, avec l'état final, quand toutes les paires sont trouvées
export function useMemoryGame(options, { muted, onWin }) {
  const [game, dispatch] = useReducer(gameReducer, options, initGame)
  const [now, setNow] = useState(() => Date.now())
  const lastWin = useRef(null)
  const onWinRef = useRef(onWin)

  // Toujours la dernière version du callback, sans relancer les effets
  useEffect(() => {
    onWinRef.current = onWin
  })

  const { deck, flipped, status } = game

  // Chronomètre : se met à jour tant que la partie est en cours
  useEffect(() => {
    if (status !== 'playing') return
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [status])

  // Deux cartes retournées : on laisse le temps de les voir, puis on compare
  useEffect(() => {
    if (flipped.length !== 2) return
    const [a, b] = flipped.map(i => deck[i])
    const match = a.symbol === b.symbol

    const timer = setTimeout(() => {
      if (!muted) {
        if (match) playMatch(SYMBOLS[a.symbol].freq)
        else playMiss()
      }
      dispatch({ type: 'resolve', now: Date.now() })
    }, match ? 450 : 1000)

    return () => clearTimeout(timer)
  }, [flipped, deck, muted])

  // Fin de partie : petite fanfare, puis on prévient la page
  useEffect(() => {
    if (status !== 'won' || lastWin.current === game.endedAt) return
    lastWin.current = game.endedAt

    if (!muted) {
      const notes = [...new Set(deck.map(c => c.symbol))].sort((x, y) => x - y)
      playArpeggio(notes.map(s => SYMBOLS[s].freq))
    }
    onWinRef.current?.(game)
  }, [status, game, deck, muted])

  function flip(index) {
    const card = deck[index]
    if (status === 'won' || flipped.length >= 2 || flipped.includes(index) || card.matched) return
    if (!muted) playNote(SYMBOLS[card.symbol].freq)
    dispatch({ type: 'flip', index, now: Date.now() })
  }

  function restart(changes = {}) {
    dispatch({ type: 'reset', level: game.level, mode: game.mode, seed: game.seed, ...changes })
  }

  const elapsed = game.startedAt ? (game.endedAt ?? now) - game.startedAt : 0

  return { game, elapsed, flip, restart }
}
