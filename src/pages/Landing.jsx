import { useEffect, useRef, useState } from 'react'
import Shape from '../components/Shape.jsx'
import { formatTime, LEVELS, MODES, SYMBOLS } from '../lib/deck.js'
import { playNote } from '../lib/audio.js'
import { FORGET_PENALTY, POINTS_PER_PAIR } from '../lib/game.js'
import { getAllBest, getAllSequenceBest, getDailyResult } from '../lib/storage.js'
import { challengeNumber, dayKey, getStreak } from '../lib/daily.js'
import { BOTS } from '../lib/duel.js'

// Cartes du visuel d'accueil : elles se retournent toutes seules, chacune à son rythme
const HERO_CARDS = [0, 4, 8, 2, 6, 10, 3, 7]

export default function Landing() {
  const [playing, setPlaying] = useState(null) // index de la note jouée dans la démo
  const timers = useRef([])
  const records = getAllBest()
  const today = dayKey()
  const todayResult = getDailyResult(today)
  const streak = getStreak()
  const bestSequence = Math.max(0, ...Object.values(getAllSequenceBest()).map(r => r.length))

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Joue les 12 notes l'une après l'autre en allumant chaque symbole
  function playScale() {
    timers.current.forEach(clearTimeout)
    timers.current = SYMBOLS.map((symbol, i) => setTimeout(() => {
      setPlaying(i)
      playNote(symbol.freq, { duration: 0.5 })
    }, i * 180))
    timers.current.push(setTimeout(() => setPlaying(null), SYMBOLS.length * 180 + 300))
  }

  // Défilement vers la liste des jeux, sans changer l'adresse (sinon le routeur remonterait en haut)
  function scrollToGames(e) {
    e.preventDefault()
    document.getElementById('jeux').scrollIntoView({ behavior: 'smooth' })
  }

  function playOne(i) {
    setPlaying(i)
    playNote(SYMBOLS[i].freq)
    timers.current.push(setTimeout(() => setPlaying(p => (p === i ? null : p)), 400))
  }

  return (
    <div className="landing">
      <header className="nav container">
        <a href="#/" className="logo"><span className="logo-mark" aria-hidden="true" />Écho</a>
        <nav className="nav-links">
          <a href="#/defi" className="nav-link">Défi du jour</a>
          <a href="#/duel" className="nav-link">Duel</a>
          <a href="#/sequence" className="nav-link">Séquence</a>
          <a href="#/jouer" className="btn btn-ghost">Jouer</a>
        </nav>
      </header>

      {/* Hero */}
      <section className="hero container">
        <div className="hero-text">
          <p className="eyebrow">Jeu de mémoire</p>
          <h1>Le memory qui se joue <span className="gradient-text">aussi à l'oreille.</span></h1>
          <p className="lead">
            Dans Écho, chaque paire a une forme, une couleur et une note de musique.
            Retrouvez-les avec les yeux… ou seulement avec les oreilles.
          </p>
          <div className="hero-actions">
            <a href="#jeux" className="btn btn-primary btn-lg" onClick={scrollToGames}>Choisir un jeu →</a>
            <button type="button" className="btn btn-ghost btn-lg" onClick={playScale}>🔊 Écouter les notes</button>
          </div>
        </div>

        <div className="hero-board" aria-hidden="true">
          {HERO_CARDS.map((s, i) => (
            <div key={i} className="hero-card" style={{ '--c': SYMBOLS[s].color, '--d': `${i * 0.7}s` }}>
              <div className="hero-card-inner">
                <div className="hero-card-face hero-card-back" />
                <div className="hero-card-face hero-card-front"><Shape shape={SYMBOLS[s].shape} /></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Les jeux */}
      <section id="jeux" className="section container">
        <h2>Quatre façons de jouer</h2>
        <div className="games">
          <a href="#/jouer" className="game-card">
            <span className="game-card-icon">🎵</span>
            <h3>Memory musical</h3>
            <p>Trois niveaux, deux modes, et votre record à battre. Le jeu de base, à votre rythme.</p>
            <span className="game-card-link">Jouer →</span>
          </a>

          <a href="#/defi" className="game-card game-card-daily">
            <span className="game-card-icon">📅</span>
            <h3>Défi du jour <small>n°{challengeNumber(today)}</small></h3>
            <p>La même grille pour tout le monde, une seule tentative. Partagez votre score.</p>
            {streak > 0 && <p className="daily-streak">🔥 Série : {streak} jour{streak > 1 ? 's' : ''}</p>}
            <span className="game-card-link">
              {todayResult ? `✓ Fait · ${todayResult.score} pts · voir mon résultat →` : 'Relever le défi →'}
            </span>
          </a>

          <a href="#/duel" className="game-card">
            <span className="game-card-icon">{BOTS.poisson.emoji}{BOTS.hibou.emoji}{BOTS.elephant.emoji}</span>
            <h3>Duel</h3>
            <p>Chacun son tour contre l'ordinateur. Du poisson rouge à l'éléphant : à vous de choisir sa mémoire.</p>
            <span className="game-card-link">Défier l'ordinateur →</span>
          </a>

          <a href="#/sequence" className="game-card">
            <span className="game-card-icon">🎹</span>
            <h3>Séquence</h3>
            <p>Écoutez une suite de notes et rejouez-la. Une note de plus à chaque manche : jusqu'où irez-vous ?</p>
            {bestSequence > 0 && <p className="daily-streak">🏅 Record : {bestSequence} séquences</p>}
            <span className="game-card-link">Tester sa mémoire →</span>
          </a>
        </div>
      </section>

      {/* Le principe : la gamme interactive */}
      <section className="section container">
        <h2>Une couleur pour chaque note</h2>
        <p className="section-lead">
          Les notes graves sont rouges ; plus la note monte, plus la couleur avance dans l'arc-en-ciel.
          Vos yeux et vos oreilles retiennent la même information. Cliquez pour écouter.
        </p>
        <div className="scale">
          {SYMBOLS.map((symbol, i) => (
            <button
              key={symbol.id}
              type="button"
              className={`scale-key${playing === i ? ' is-playing' : ''}`}
              style={{ '--c': symbol.color, '--h': `${30 + i * 6}%` }}
              onClick={() => playOne(i)}
              aria-label={`Note ${symbol.note}`}
            >
              <Shape shape={symbol.shape} className="scale-shape" />
              <span>{symbol.note}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Les règles */}
      <section className="section container">
        <h2>Comment marquer des points</h2>
        <div className="features">
          <article className="feature">
            <span className="feature-icon">✦</span>
            <h3>Combos</h3>
            <p>Chaque paire rapporte {POINTS_PER_PAIR} points, multipliés par votre série : la 3ᵉ paire d'affilée vaut ×3.</p>
          </article>
          <article className="feature">
            <span className="feature-icon">◐</span>
            <h3>Oublis</h3>
            <p>Rater une carte que vous aviez déjà vue coûte {FORGET_PENALTY} points. Le jeu récompense la mémoire, pas la chance.</p>
          </article>
          <article className="feature">
            <span className="feature-icon">⏱</span>
            <h3>Bonus de temps</h3>
            <p>Finissez vite : chaque seconde gagnée sur le temps de référence ajoute des points à la fin.</p>
          </article>
          <article className="feature">
            <span className="feature-icon">★</span>
            <h3>Records</h3>
            <p>Votre meilleur score est gardé pour chaque niveau et chaque mode, directement dans votre navigateur.</p>
          </article>
        </div>
      </section>

      {/* Les modes */}
      <section className="section container">
        <h2>Deux façons de jouer</h2>
        <div className="modes">
          <article className="mode-card">
            <div className="mode-visual">
              {[1, 5, 9].map(s => (
                <span key={s} style={{ color: SYMBOLS[s].color }}><Shape shape={SYMBOLS[s].shape} /></span>
              ))}
            </div>
            <h3>{MODES.classique.label}</h3>
            <p>Formes, couleurs et sons : tous vos sens travaillent ensemble. Idéal pour commencer.</p>
          </article>
          <article className="mode-card mode-card-dark">
            <div className="mode-visual">
              {[0, 1, 2].map(i => (
                <span key={i} className="sound-bars"><i /><i /><i /><i /></span>
              ))}
            </div>
            <h3>{MODES.ecoute.label}</h3>
            <p>Les cartes ne montrent rien. Seule la note vous guide. Un vrai défi pour l'oreille.</p>
          </article>
        </div>
      </section>

      {/* Records enregistrés */}
      <section className="section container">
        <h2>Vos records</h2>
        <div className="records">
          {Object.entries(LEVELS).map(([levelKey, l]) => Object.entries(MODES).map(([modeKey, m]) => {
            const record = records[`${levelKey}-${modeKey}`]
            return (
              <div key={`${levelKey}-${modeKey}`} className={`record${record ? '' : ' is-empty'}`}>
                <span className="record-label">{l.label} · {m.label}</span>
                <strong>{record ? record.score : '—'}</strong>
                <span className="record-time">{record ? formatTime(record.time) : 'Pas encore joué'}</span>
              </div>
            )
          }))}
        </div>
      </section>

      <section className="cta container">
        <h2>Prêt à tendre l'oreille ?</h2>
        <a href="#/jouer" className="btn btn-primary btn-lg">Lancer une partie →</a>
      </section>

      <footer className="footer container">
        <span>Écho · Jour 02 du défi 30 jours, 30 projets</span>
        <span>Fait avec React · <a href="https://github.com/PierreWZK/Echo" target="_blank" rel="noopener">Code sur GitHub ↗</a></span>
      </footer>
    </div>
  )
}
