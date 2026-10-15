import { formatTime, LEVELS } from '../lib/deck.js'

// Statistiques en direct de la partie. `extra` : case supplémentaire (record, série…)
export default function Stats({ game, elapsed, extra }) {
  const pairsFound = game.deck.filter(c => c.matched).length / 2

  return (
    <dl className="stats">
      <div><dt>Temps</dt><dd>{formatTime(elapsed)}</dd></div>
      <div><dt>Coups</dt><dd>{game.moves}</dd></div>
      <div><dt>Paires</dt><dd>{pairsFound}/{LEVELS[game.level].pairs}</dd></div>
      <div className="stat-score">
        <dt>Score</dt>
        <dd>
          {game.score}
          {game.combo > 1 && <span className="combo">×{game.combo}</span>}
        </dd>
        {game.feedback && (
          <span key={game.feedback.id} className={`feedback is-${game.feedback.kind}`}>
            {game.feedback.text}
            {game.feedback.detail && <small>{game.feedback.detail}</small>}
          </span>
        )}
      </div>
      {extra && <div><dt>{extra.label}</dt><dd>{extra.value}</dd></div>}
    </dl>
  )
}
