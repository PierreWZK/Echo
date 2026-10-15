import { useState } from 'react'
import Board from '../components/Board.jsx'
import EndModal from '../components/EndModal.jsx'
import GameHeader from '../components/GameHeader.jsx'
import Stats from '../components/Stats.jsx'
import { useMemoryGame } from '../hooks/useMemoryGame.js'
import { useMuted } from '../hooks/useMuted.js'
import { LEVELS, MODES } from '../lib/deck.js'
import { getBest, saveIfBest } from '../lib/storage.js'

// Memory libre : on choisit le niveau et le mode, on rejoue autant qu'on veut
export default function Game() {
  const [muted, toggleMuted] = useMuted()
  const [result, setResult] = useState(null) // { isRecord, best } en fin de partie
  const [modalOpen, setModalOpen] = useState(false)

  const { game, elapsed, flip, restart } = useMemoryGame(
    { level: 'facile', mode: 'classique' },
    {
      muted,
      onWin: final => {
        const previousBest = getBest(final.level, final.mode)
        const time = final.endedAt - final.startedAt
        const isRecord = saveIfBest(final.level, final.mode, { score: final.score, time, moves: final.moves })
        setResult({ isRecord, best: previousBest })
        setModalOpen(true)
      },
    },
  )

  const { level, mode, status } = game
  const best = getBest(level, mode)

  function newGame(changes) {
    setModalOpen(false)
    setResult(null)
    restart(changes)
  }

  return (
    <div className="game-page">
      <GameHeader active="#/jouer" muted={muted} onToggleMute={toggleMuted} />

      <main className="game">
        {/* Réglages : niveau et mode (changer relance une partie) */}
        <div className="settings">
          <div className="segmented" role="group" aria-label="Niveau">
            {Object.entries(LEVELS).map(([key, l]) => (
              <button key={key} type="button" className={key === level ? 'is-active' : ''}
                      onClick={() => newGame({ level: key })}>
                {l.label} <small>{l.pairs} paires</small>
              </button>
            ))}
          </div>
          <div className="segmented" role="group" aria-label="Mode">
            {Object.entries(MODES).map(([key, m]) => (
              <button key={key} type="button" className={key === mode ? 'is-active' : ''}
                      onClick={() => newGame({ mode: key })} title={m.hint}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {mode === 'ecoute' && (
          <p className="mode-hint">Mode Écoute : les cartes ne montrent rien. Retrouvez les paires à l'oreille 🎧</p>
        )}

        <Stats game={game} elapsed={elapsed} extra={{ label: 'Record', value: best ? best.score : '—' }} />

        <Board game={game} onFlip={flip} />

        <div className="game-footer">
          {status === 'idle' && <p className="hint">Retournez une carte pour lancer le chrono.</p>}
          {status !== 'idle' && (
            <button type="button" className="btn btn-ghost" onClick={() => newGame()}>↻ Nouvelle partie</button>
          )}
          {status === 'won' && !modalOpen && (
            <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>Voir le résultat</button>
          )}
        </div>
      </main>

      {modalOpen && result && (
        <EndModal
          game={game}
          time={elapsed}
          isRecord={result.isRecord}
          best={result.best}
          onReplay={() => newGame()}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
