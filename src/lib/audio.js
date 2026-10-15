// Sons du jeu, synthétisés avec la Web Audio API (aucun fichier audio).

let ctx = null

// Le navigateur n'autorise le son qu'après une action de l'utilisateur :
// le contexte audio est donc créé au premier clic.
function getContext() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Joue une note avec une enveloppe douce (attaque rapide, extinction progressive)
export function playNote(freq, { delay = 0, duration = 0.7, type = 'triangle', volume = 0.2 } = {}) {
  const audio = getContext()
  const start = audio.currentTime + delay

  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = type
  osc.frequency.value = freq

  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  osc.connect(gain).connect(audio.destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

// Paire trouvée : la note, puis sa quinte et son octave (un petit accord)
export function playMatch(freq) {
  playNote(freq, { duration: 0.9 })
  playNote(freq * 1.5, { delay: 0.07, duration: 0.9, volume: 0.12 })
  playNote(freq * 2, { delay: 0.14, duration: 1.1, volume: 0.1 })
}

// Paire ratée : un son grave et bref
export function playMiss() {
  playNote(130, { type: 'sine', duration: 0.3, volume: 0.18 })
  playNote(123, { type: 'sine', delay: 0.08, duration: 0.3, volume: 0.14 })
}

// Victoire : arpège montant sur une liste de fréquences
export function playArpeggio(freqs, step = 0.09) {
  freqs.forEach((freq, i) => playNote(freq, { delay: i * step, duration: 0.8, volume: 0.15 }))
}
