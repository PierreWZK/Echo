import { useEffect, useRef, useState } from 'react'
import GameHeader from '../components/GameHeader.jsx'
import Shape from '../components/Shape.jsx'
import { useMuted } from '../hooks/useMuted.js'
import { MODES } from '../lib/deck.js'
import { noteDuration, padSymbols, randomPad, SEQ_LEVELS } from '../lib/sequence.js'
import { playMiss, playNote } from '../lib/audio.js'
import { getSequenceBest, saveSequenceBest } from '../lib/storage.js'

// Les étapes d'une partie :
//   idle → playing (l'ordinateur joue la séquence) → input (le joueur la rejoue)
//   → success (séquence réussie, on rallonge) → playing… ou over (erreur)
export default function Sequence() {
  const [muted, toggleMuted] = useMuted()
  const [level, setLevel] = useState('moyen')
  const [mode, setMode] = useState('classique')
  const [sequence, setSequence] = useState([])
  const [phase, setPhase] = useState('idle')
  const [inputIndex, setInputIndex] = useState(0)
  const [playIndex, setPlayIndex] = useState(-1) // note en cours de lecture
  const [lit, setLit] = useState(null) // pad allumé
  const [pulse, setPulse] = useState(null) // { pad, id } : onde d'écho sur le pad pressé
  const [joker, setJoker] = useState(true) // un « Réécouter » par partie
  const [result, setResult] = useState(null) // fin de partie
  const timers = useRef([])

  const pads = padSymbols(SEQ_LEVELS[level].pads)
  const best = getSequenceBest(level, mode)

  function schedule(fn, delay) {
    timers.current.push(setTimeout(fn, delay))
  }

  function clearTimers() {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  useEffect(() => clearTimers, [])

  // L'ordinateur joue la séquence, note par note
  function playback(seq) {
    clearTimers()
    setPhase('playing')
    setInputIndex(0)
    setPlayIndex(-1)
    const duration = noteDuration(seq.length)
    let t = 700

    seq.forEach((pad, i) => {
      schedule(() => {
        setLit(pad)
        setPlayIndex(i)
        if (!muted) playNote(pads[pad].freq, { duration: (duration / 1000) * 1.3 })
      }, t)
      schedule(() => setLit(null), t + duration * 0.7)
      t += duration
    })

    schedule(() => {
      setPhase('input')
      setPlayIndex(-1)
    }, t)
  }

  function start() {
    const first = [randomPad(pads.length)]
    setSequence(first)
    setResult(null)
    setJoker(true)
    playback(first)
  }

  function reset(changes) {
    clearTimers()
    if (changes.level) setLevel(changes.level)
    if (changes.mode) setMode(changes.mode)
    setSequence([])
    setPhase('idle')
    setResult(null)
    setLit(null)
  }

  function replay() {
    if (!joker || phase !== 'input') return
    setJoker(false)
    playback(sequence) // on recommence la saisie depuis le début
  }

  // Le joueur appuie sur un pad
  function press(pad) {
    if (phase !== 'input') return

    if (!muted) playNote(pads[pad].freq, { duration: 0.5 })
    setPulse({ pad, id: Date.now() })
    setLit(pad)
    schedule(() => setLit(l => (l === pad ? null : l)), 220)

    // Mauvaise note : fin de partie
    if (pad !== sequence[inputIndex]) {
      clearTimers()
      setLit(null)
      if (!muted) setTimeout(playMiss, 120)
      const length = sequence.length - 1 // séquences réussies
      const previous = getSequenceBest(level, mode)
      const isRecord = saveSequenceBest(level, mode, length)
      setPhase('over')
      setResult({ length, isRecord, previous, expected: sequence[inputIndex] })
      return
    }

    // Bonne note : séquence complète ? On ajoute une note et on rejoue
    const next = inputIndex + 1
    setInputIndex(next)
    if (next === sequence.length) {
      setPhase('success')
      schedule(() => {
        const longer = [...sequence, randomPad(pads.length)]
        setSequence(longer)
        playback(longer)
      }, 900)
    }
  }

  // Clavier : touches 1 à 9 pour les pads, Espace pour commencer
  const pressRef = useRef(press)
  const startRef = useRef(start)
  useEffect(() => {
    pressRef.current = press
    startRef.current = start
  })

  useEffect(() => {
    function onKey(e) {
      if (e.key >= '1' && e.key <= '9') {
        const pad = Number(e.key) - 1
        if (pad < SEQ_LEVELS[level].pads) pressRef.current(pad)
      }
      if (e.code === 'Space' && (phase === 'idle' || phase === 'over')) {
        e.preventDefault()
        startRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [level, phase])

  // En mode Écoute, les pads ne s'allument pas pendant la lecture : il faut écouter
  const showLit = mode === 'classique' || phase !== 'playing'

  const status = {
    idle: 'Appuyez sur Commencer pour écouter la première note.',
    playing: mode === 'ecoute' ? 'Écoutez bien… 👂' : 'Regardez et écoutez…',
    input: `À vous ! ${inputIndex} / ${sequence.length}`,
    success: 'Parfait ! Une note de plus…',
    over: 'Raté !',
  }[phase]

  return (
    <div className="game-page">
      <GameHeader active="#/sequence" muted={muted} onToggleMute={toggleMuted} />

      <main className="game">
        <div className="settings">
          <div className="segmented" role="group" aria-label="Niveau">
            {Object.entries(SEQ_LEVELS).map(([key, l]) => (
              <button key={key} type="button" className={key === level ? 'is-active' : ''}
                      onClick={() => reset({ level: key })}>
                {l.label} <small>{l.pads} pads</small>
              </button>
            ))}
          </div>
          <div className="segmented" role="group" aria-label="Mode">
            {Object.entries(MODES).map(([key, m]) => (
              <button key={key} type="button" className={key === mode ? 'is-active' : ''}
                      onClick={() => reset({ mode: key })} title={m.hint}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <dl className="stats">
          <div><dt>Manche</dt><dd>{sequence.length || '—'}</dd></div>
          <div><dt>Réussies</dt><dd>{Math.max(0, sequence.length - 1 + (phase === 'success' ? 1 : 0))}</dd></div>
          <div><dt>Record</dt><dd>{best ? best.length : '—'}</dd></div>
        </dl>

        <p className={`seq-status is-${phase}`} aria-live="polite">{status}</p>

        {/* Progression dans la séquence : un point par note */}
        <div className="seq-dots" aria-hidden="true">
          {sequence.map((_, i) => (
            <span key={i} className={
              (phase === 'playing' && i <= playIndex) || (phase !== 'playing' && i < inputIndex) || phase === 'success'
                ? 'is-on' : ''
            } />
          ))}
        </div>

        <div className={`pads cols-${SEQ_LEVELS[level].cols}${phase === 'input' ? ' is-ready' : ''}`}>
          {pads.map((symbol, i) => (
            <button
              key={`${level}-${i}`}
              type="button"
              className={`pad${showLit && lit === i ? ' is-lit' : ''}${result && result.expected === i ? ' is-expected' : ''}`}
              style={{ '--c': symbol.color }}
              onClick={() => press(i)}
              aria-label={`Pad ${i + 1}, note ${symbol.note}`}
              aria-disabled={phase !== 'input'}
            >
              <Shape shape={symbol.shape} className="pad-shape" />
              <span className="pad-note">{symbol.note}</span>
              <kbd className="pad-key">{i + 1}</kbd>
              {pulse?.pad === i && <span key={pulse.id} className="ripple" aria-hidden="true" />}
            </button>
          ))}
        </div>

        <div className="game-footer">
          {(phase === 'idle' || phase === 'over') && (
            <button type="button" className="btn btn-primary btn-lg" onClick={start}>
              {phase === 'idle' ? '▶ Commencer' : '↻ Rejouer'}
            </button>
          )}
          {(phase === 'input' || phase === 'playing') && (
            <button type="button" className="btn btn-ghost" onClick={replay} disabled={!joker || phase !== 'input'}>
              🔁 Réécouter {joker ? '(1 joker)' : '(utilisé)'}
            </button>
          )}
        </div>
        <p className="hint">Astuce : jouez avec les touches 1 à {SEQ_LEVELS[level].pads} du clavier.</p>
      </main>

      {phase === 'over' && result && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="seq-title">
          <div className="modal">
            {result.isRecord && <p className="record-badge">★ Nouveau record</p>}
            <h2 id="seq-title">Fin de la séquence</h2>
            <p className="modal-sub">{SEQ_LEVELS[level].label} · mode {MODES[mode].label}</p>

            <p className="modal-score">{result.length}</p>
            <p className="modal-score-detail">séquence{result.length > 1 ? 's' : ''} réussie{result.length > 1 ? 's' : ''}</p>

            <p className="seq-expected" style={{ '--c': pads[result.expected].color }}>
              La note attendue était
              <span><Shape shape={pads[result.expected].shape} className="seq-expected-shape" /> {pads[result.expected].note}</span>
              {' '}(pad {result.expected + 1})
            </p>

            {!result.isRecord && result.previous && (
              <p className="modal-best">Record à battre : {result.previous.length}</p>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn-primary" onClick={start} autoFocus>Rejouer</button>
              <button type="button" className="btn btn-ghost" onClick={() => setResult(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
