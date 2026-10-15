// En-tête des pages de jeu : logo, navigation entre les jeux et bouton du son
const LINKS = [
  { href: '#/jouer', label: 'Memory' },
  { href: '#/defi', label: 'Défi du jour' },
  { href: '#/duel', label: 'Duel' },
  { href: '#/sequence', label: 'Séquence' },
]

export default function GameHeader({ active, muted, onToggleMute }) {
  return (
    <header className="game-header">
      <a href="#/" className="logo"><span className="logo-mark" aria-hidden="true" />Écho</a>

      <nav className="game-nav" aria-label="Jeux">
        {LINKS.map(link => (
          <a key={link.href} href={link.href} className={link.href === active ? 'is-active' : ''}
             aria-current={link.href === active ? 'page' : undefined}>
            {link.label}
          </a>
        ))}
      </nav>

      <button type="button" className="icon-btn" onClick={onToggleMute} aria-pressed={muted}
              title={muted ? 'Activer le son' : 'Couper le son'}>
        {muted ? '🔇' : '🔊'}
      </button>
    </header>
  )
}
