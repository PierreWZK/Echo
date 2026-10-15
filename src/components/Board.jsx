import Card from './Card.jsx'
import { LEVELS, SYMBOLS } from '../lib/deck.js'

// Le plateau de cartes.
//   targeted   : index de la carte que l'ordinateur s'apprête à retourner (duel)
//   locked     : plateau bloqué (tour de l'ordinateur)
//   ownerLabel : fonction qui donne le badge d'une paire trouvée (duel)
export default function Board({ game, onFlip, targeted = null, locked = false, ownerLabel }) {
  return (
    <div className={`board cols-${LEVELS[game.level].cols}${locked ? ' is-locked' : ''}`}>
      {game.deck.map((card, index) => (
        <Card
          key={card.id}
          card={card}
          symbol={SYMBOLS[card.symbol]}
          faceUp={card.matched || game.flipped.includes(index)}
          mode={game.mode ?? 'classique'}
          onFlip={() => onFlip(index)}
          targeted={targeted === index}
          ownerLabel={card.matched && ownerLabel ? ownerLabel(card.owner) : null}
        />
      ))}
    </div>
  )
}
