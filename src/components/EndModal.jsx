import { formatTime, LEVELS, MODES } from '../lib/deck.js'

// Fenêtre de fin de partie : score détaillé, statistiques et record
export default function EndModal({ game, time, isRecord, best, onReplay, onClose }) {
  const pairs = LEVELS[game.level].pairs
  const accuracy = Math.round((pairs / game.moves) * 100)

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="end-title">
      <div className="modal">
        {isRecord && <p className="record-badge">★ Nouveau record</p>}
        <h2 id="end-title">Bravo !</h2>
        <p className="modal-sub">
          {LEVELS[game.level].label} · mode {MODES[game.mode].label}
        </p>

        <p className="modal-score">{game.score}</p>
        <p className="modal-score-detail">
          points{game.timeBonus > 0 && <>, dont <strong>+{game.timeBonus}</strong> de bonus temps</>}
        </p>

        <dl className="modal-stats">
          <div><dt>Temps</dt><dd>{formatTime(time)}</dd></div>
          <div><dt>Coups</dt><dd>{game.moves}</dd></div>
          <div><dt>Précision</dt><dd>{accuracy} %</dd></div>
          <div><dt>Meilleur combo</dt><dd>×{game.maxCombo}</dd></div>
          <div><dt>Oublis</dt><dd>{game.forgets}</dd></div>
        </dl>

        {!isRecord && best && (
          <p className="modal-best">Record à battre : {best.score} points en {formatTime(best.time)}</p>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onReplay} autoFocus>Rejouer</button>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Changer de niveau</button>
        </div>
      </div>
    </div>
  )
}
