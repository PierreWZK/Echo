import { useEffect, useReducer, useRef, useState } from 'react'
import Board from '../components/Board.jsx'
import GameHeader from '../components/GameHeader.jsx'
import { useMuted } from '../hooks/useMuted.js'
import { LEVELS, SYMBOLS } from '../lib/deck.js'
import { BOTS, chooseCard, createMemory, duelOutcome, duelReducer, initDuel } from '../lib/duel.js'
import { playArpeggio, playMatch, playMiss, playNote } from '../lib/audio.js'
import { getDuelStats, saveDuelOutcome } from '../lib/storage.js'

const random = (min, max) => min + Math.random() * (max - min)

// Ce que dit l'ordinateur selon la situation
const LINES = {
  start: ['À toi de commencer !'],
  think: ['Hmm, voyons voir…', 'Laisse-moi réfléchir…', 'Où est-ce que j\'avais vu ça…'],
  pair: ['Je sais exactement où elles sont 😏', 'Celle-là, je l\'ai vue passer !'],
  partner: ['Je me souviens de sa jumelle !', 'Attends… je sais !'],
  guess: ['Au hasard…', 'Allez, celle-ci !', 'On tente !'],
  botMatch: ['Et une paire pour moi 😎', 'Trop facile !', 'Je rejoue !'],
  botMiss: ['Zut ! À toi.', 'Raté… à ton tour.', 'Bon, je te laisse jouer.'],
  playerMatch: ['Bien vu ! Tu rejoues.', 'Pas mal… rejoue.', 'Hmpf. Rejoue.'],
  playerMiss: ['Raté ! À moi de jouer.', 'Merci pour l\'info 😇', 'Je note, je note…'],
}
const line = key => LINES[key][Math.floor(Math.random() * LINES[key].length)]

const OUTCOMES = {
  win: { title: 'Victoire !', sub: 'Tu as battu', className: 'is-win' },
  loss: { title: 'Défaite…', sub: 'Tu as perdu contre', className: 'is-loss' },
  draw: { title: 'Égalité', sub: 'Match nul contre', className: 'is-draw' },
}

export default function Duel() {
  const [muted, toggleMuted] = useMuted()
  const [state, dispatch] = useReducer(duelReducer, { level: 'moyen', bot: 'hibou' }, initDuel)
  const [targeted, setTargeted] = useState(null) // carte que l'ordinateur va retourner
  const [message, setMessage] = useState(line('start'))
  const [result, setResult] = useState(null) // { outcome, stats } en fin de partie
  const memory = useRef(createMemory(BOTS.hibou))
  const savedGame = useRef(null)

  const bot = BOTS[state.bot]
  const { deck, flipped, turn, status } = state

  // Retourne une carte (joueur ou ordinateur) : son, état, et l'ordinateur la mémorise peut-être
  function flipCard(index, by) {
    if (!muted) playNote(SYMBOLS[deck[index].symbol].freq)
    memory.current.observe(index, deck[index].symbol)
    dispatch({ type: 'flip', index, by })
  }

  function onPlayerFlip(index) {
    if (turn !== 'player' || flipped.length >= 2 || deck[index].matched || flipped.includes(index)) return
    flipCard(index, 'player')
  }

  // Deux cartes retournées : on compare après un court délai
  useEffect(() => {
    if (flipped.length !== 2) return
    const [a, b] = flipped.map(i => deck[i])
    const match = a.symbol === b.symbol

    const timer = setTimeout(() => {
      if (!muted) {
        if (match) playMatch(SYMBOLS[a.symbol].freq)
        else playMiss()
      }
      if (match) memory.current.forget(flipped)
      setMessage(line(turn === 'bot' ? (match ? 'botMatch' : 'botMiss') : (match ? 'playerMatch' : 'playerMiss')))
      dispatch({ type: 'resolve' })
    }, match ? 500 : 1100)

    return () => clearTimeout(timer)
  }, [flipped, deck, turn, muted])

  // Tour de l'ordinateur : il réfléchit, vise une carte, puis la retourne
  useEffect(() => {
    if (turn !== 'bot' || status !== 'playing' || flipped.length >= 2) return

    const { index, reason } = chooseCard(state, memory.current)
    const first = flipped.length === 0
    const think = first ? random(900, 1500) : reason === 'partner' ? random(400, 700) : random(700, 1100)

    const timers = [
      setTimeout(() => {
        setMessage(line(first ? (reason === 'pair' ? 'pair' : 'think') : reason === 'partner' ? 'partner' : 'guess'))
        setTargeted(index)
      }, think * 0.4),
      setTimeout(() => {
        setTargeted(null)
        flipCard(index, 'bot')
      }, think),
    ]
    return () => timers.forEach(clearTimeout)
    // flipCard dépend de l'état courant : l'effet est relancé à chaque changement d'état
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  // Fin de partie : on enregistre le résultat une seule fois
  useEffect(() => {
    if (status !== 'over' || savedGame.current === state) return
    savedGame.current = state

    const outcome = duelOutcome(state.scores)
    const stats = saveDuelOutcome(state.bot, outcome)
    setResult({ outcome, stats })

    if (!muted) {
      const notes = [...new Set(deck.map(c => c.symbol))].sort((x, y) => x - y).map(s => SYMBOLS[s].freq)
      playArpeggio(outcome === 'loss' ? notes.reverse() : notes)
    }
  }, [status, state, deck, muted])

  function newDuel(changes = {}) {
    const next = { level: state.level, bot: state.bot, ...changes }
    memory.current = createMemory(BOTS[next.bot])
    setTargeted(null)
    setResult(null)
    setMessage(line('start'))
    dispatch({ type: 'reset', ...next })
  }

  const duelStats = getDuelStats()
  const ownerLabel = owner => (owner === 'bot' ? bot.emoji : 'Toi')

  return (
    <div className="game-page">
      <GameHeader active="#/duel" muted={muted} onToggleMute={toggleMuted} />

      <main className="game">
        {/* Choix de l'adversaire */}
        <div className="opponents" role="group" aria-label="Adversaire">
          {Object.entries(BOTS).map(([key, b]) => {
            const s = duelStats[key]
            return (
              <button key={key} type="button" className={`opponent${key === state.bot ? ' is-active' : ''}`}
                      onClick={() => newDuel({ bot: key })}>
                <span className="opponent-emoji">{b.emoji}</span>
                <span className="opponent-name">{b.name}</span>
                <span className="opponent-desc">{b.description}</span>
                <span className="opponent-stats">
                  {s ? `${s.win} V · ${s.loss} D · ${s.draw} N` : 'Jamais affronté'}
                </span>
              </button>
            )
          })}
        </div>

        <div className="segmented" role="group" aria-label="Taille du plateau">
          {Object.entries(LEVELS).map(([key, l]) => (
            <button key={key} type="button" className={key === state.level ? 'is-active' : ''}
                    onClick={() => newDuel({ level: key })}>
              {l.pairs} paires
            </button>
          ))}
        </div>

        {/* Tableau des scores : le joueur dont c'est le tour est mis en avant */}
        <div className="scoreboard">
          <div className={`side${turn === 'player' && status === 'playing' ? ' is-turn' : ''}`}>
            <span className="side-name">Toi</span>
            <span className="side-score">{state.scores.player}</span>
          </div>
          <span className="versus">vs</span>
          <div className={`side side-bot${turn === 'bot' && status === 'playing' ? ' is-turn' : ''}`}>
            <span className="side-name">{bot.emoji} {bot.name}</span>
            <span className="side-score">{state.scores.bot}</span>
          </div>
        </div>

        <p className={`bot-bubble${turn === 'bot' ? ' is-bot' : ''}`} aria-live="polite">
          <span className="bot-bubble-emoji">{bot.emoji}</span> {message}
        </p>

        <Board game={state} onFlip={onPlayerFlip} targeted={targeted} locked={turn === 'bot'} ownerLabel={ownerLabel} />

        <div className="game-footer">
          <button type="button" className="btn btn-ghost" onClick={() => newDuel()}>↻ Nouveau duel</button>
        </div>
      </main>

      {result && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="duel-title">
          <div className={`modal duel-modal ${OUTCOMES[result.outcome].className}`}>
            <p className="duel-modal-emoji">{result.outcome === 'win' ? '🏆' : result.outcome === 'loss' ? bot.emoji : '🤝'}</p>
            <h2 id="duel-title">{OUTCOMES[result.outcome].title}</h2>
            <p className="modal-sub">{OUTCOMES[result.outcome].sub} {bot.name.toLowerCase()}</p>

            <p className="modal-score">{state.scores.player} – {state.scores.bot}</p>
            <p className="modal-score-detail">paires</p>

            <dl className="modal-stats">
              <div><dt>Victoires</dt><dd>{result.stats.win}</dd></div>
              <div><dt>Défaites</dt><dd>{result.stats.loss}</dd></div>
              <div><dt>Nuls</dt><dd>{result.stats.draw}</dd></div>
            </dl>

            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={() => newDuel()} autoFocus>Revanche</button>
              <button type="button" className="btn btn-ghost" onClick={() => setResult(null)}>Changer d'adversaire</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
