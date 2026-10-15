import Shape from './Shape.jsx'

// Une carte du jeu. Face visible : la forme colorée (mode Classique)
// ou une onde sonore neutre (mode Écoute, tant que la paire n'est pas trouvée).
export default function Card({ card, symbol, faceUp, mode, onFlip, targeted = false, ownerLabel = null }) {
  const hidden = mode === 'ecoute' && !card.matched
  const label = faceUp
    ? hidden ? 'Carte retournée, écoutez sa note' : `Carte ${symbol.label}, note ${symbol.note}`
    : 'Carte cachée'

  return (
    <button
      type="button"
      className={`card${faceUp ? ' is-up' : ''}${card.matched ? ' is-matched' : ''}${targeted ? ' is-targeted' : ''}${card.owner ? ` owner-${card.owner}` : ''}`}
      style={{ '--c': hidden ? 'var(--ink)' : symbol.color }}
      onClick={onFlip}
      aria-label={label}
      disabled={card.matched}
    >
      <span className="card-inner">
        <span className="card-face card-back" aria-hidden="true">
          <span className="card-back-mark" />
        </span>
        <span className="card-face card-front" aria-hidden="true">
          {hidden ? (
            <span className="sound-bars">
              <i /><i /><i /><i />
            </span>
          ) : (
            <Shape shape={symbol.shape} className="card-shape" />
          )}
          {!hidden && <span className="card-note">{symbol.note}</span>}
          {/* Duel : qui a trouvé la paire */}
          {ownerLabel && <span className="card-owner">{ownerLabel}</span>}
        </span>
      </span>

      {/* Onde d'écho : la clé change à chaque retournement pour relancer l'animation */}
      {faceUp && card.flips > 0 && <span key={card.flips} className="ripple" aria-hidden="true" />}
    </button>
  )
}
