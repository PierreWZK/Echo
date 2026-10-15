import { useState } from 'react'
import Board from '../components/Board.jsx'
import DailyResult from '../components/DailyResult.jsx'
import GameHeader from '../components/GameHeader.jsx'
import Stats from '../components/Stats.jsx'
import { useMemoryGame } from '../hooks/useMemoryGame.js'
import { useMuted } from '../hooks/useMuted.js'
import { challengeNumber, DAILY, dailySeed, dayKey, getStreak } from '../lib/daily.js'
import { getDailyResult, saveDailyResult } from '../lib/storage.js'

// Défi du jour : une seule grille par jour, la même pour tout le monde, une seule tentative
export default function Daily() {
  const [day] = useState(dayKey) // figé à l'ouverture de la page, même si minuit passe pendant la partie
  const number = challengeNumber(day)
  const [muted, toggleMuted] = useMuted()
  const [result, setResult] = useState(() => getDailyResult(day))

  const { game, elapsed, flip } = useMemoryGame(
    { level: DAILY.level, mode: DAILY.mode, seed: dailySeed(day) },
    {
      muted,
      onWin: final => {
        const saved = {
          score: final.score,
          time: final.endedAt - final.startedAt,
          moves: final.moves,
          maxCombo: final.maxCombo,
          forgets: final.forgets,
          history: final.history,
        }
        saveDailyResult(day, saved)
        // On laisse le temps de voir la dernière paire avant d'afficher le résultat
        setTimeout(() => setResult(saved), 1400)
      },
    },
  )

  const date = new Date(`${day}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })

  return (
    <div className="game-page">
      <GameHeader active="#/defi" muted={muted} onToggleMute={toggleMuted} />

      <main className="game">
        <div className="daily-head">
          <p className="eyebrow">Défi n°{number} · {date}</p>
          <h1>Défi du jour</h1>
          {!result && (
            <p className="daily-rules">
              La même grille pour tout le monde, <strong>une seule tentative</strong>.
              Faites le meilleur score, puis partagez-le.
            </p>
          )}
        </div>

        {result ? (
          <DailyResult result={result} number={number} streak={getStreak()} />
        ) : (
          <>
            <Stats game={game} elapsed={elapsed} extra={{ label: 'Série', value: `🔥 ${getStreak()}` }} />
            <Board game={game} onFlip={flip} />
            <div className="game-footer">
              {game.status === 'idle' && <p className="hint">Retournez une carte pour lancer le chrono. Bonne chance !</p>}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
