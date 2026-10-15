import { useEffect, useState } from 'react'
import { formatTime, LEVELS } from '../lib/deck.js'
import { DAILY, buildShareText, formatCountdown, historyLines, msUntilMidnight } from '../lib/daily.js'

// Résultat du défi du jour : score, grille d'emojis, partage et compte à rebours
export default function DailyResult({ result, number, streak }) {
  const [countdown, setCountdown] = useState(msUntilMidnight)
  const [shareLabel, setShareLabel] = useState('Partager mon résultat')

  useEffect(() => {
    const timer = setInterval(() => setCountdown(msUntilMidnight()), 1000)
    return () => clearInterval(timer)
  }, [])

  async function share() {
    const text = buildShareText(result, number)
    try {
      // Sur téléphone : le menu de partage du système. Sinon : copie dans le presse-papier.
      if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
        await navigator.share({ text })
        return
      }
      await navigator.clipboard.writeText(text)
      setShareLabel('Copié ! Collez-le où vous voulez')
    } catch {
      setShareLabel('Impossible de partager')
    }
    setTimeout(() => setShareLabel('Partager mon résultat'), 2500)
  }

  const accuracy = Math.round((LEVELS[DAILY.level].pairs / result.moves) * 100)

  return (
    <div className="daily-result">
      <p className="daily-result-label">Défi n°{number} terminé</p>
      <p className="modal-score">{result.score}</p>
      <p className="modal-score-detail">points</p>

      <div className="emoji-grid" aria-label="Vos coups, un par case">
        {historyLines(result.history).map((line, i) => <div key={i}>{line}</div>)}
      </div>
      <p className="emoji-legend">🟩 paire trouvée · 🟨 raté · 🟥 oubli</p>

      <dl className="modal-stats">
        <div><dt>Temps</dt><dd>{formatTime(result.time)}</dd></div>
        <div><dt>Coups</dt><dd>{result.moves}</dd></div>
        <div><dt>Précision</dt><dd>{accuracy} %</dd></div>
        <div><dt>Meilleur combo</dt><dd>×{result.maxCombo}</dd></div>
        <div><dt>Série</dt><dd>🔥 {streak} jour{streak > 1 ? 's' : ''}</dd></div>
      </dl>

      <button type="button" className="btn btn-primary btn-lg share-btn" onClick={share}>{shareLabel}</button>

      <p className="countdown">
        Prochain défi dans <strong>{formatCountdown(countdown)}</strong>
      </p>
      <a href="#/jouer" className="btn btn-ghost">En attendant, jouer en mode libre →</a>
    </div>
  )
}
