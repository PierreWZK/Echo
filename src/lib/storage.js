// Sauvegarde dans le navigateur (localStorage) : meilleurs résultats et réglage du son.
// Tout est entouré de try/catch : en navigation privée, le stockage peut être refusé.

const BEST_KEY = 'echo-memory:best'
const MUTED_KEY = 'echo-memory:muted'
const DAILY_KEY = 'echo-memory:daily'

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value === null ? fallback : JSON.parse(value)
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // stockage indisponible : le jeu fonctionne quand même, sans sauvegarde
  }
}

// Un record par combinaison niveau + mode, ex. "moyen-ecoute"
export function getAllBest() {
  return read(BEST_KEY, {})
}

export function getBest(level, mode) {
  return getAllBest()[`${level}-${mode}`] || null
}

// Enregistre le résultat s'il bat le record (meilleur score, puis meilleur temps).
// Renvoie true si c'est un nouveau record.
export function saveIfBest(level, mode, result) {
  const all = getAllBest()
  const key = `${level}-${mode}`
  const best = all[key]

  const isBetter = !best
    || result.score > best.score
    || (result.score === best.score && result.time < best.time)

  if (isBetter) {
    all[key] = { ...result, date: new Date().toISOString() }
    write(BEST_KEY, all)
  }
  return isBetter
}

export function getMuted() {
  return read(MUTED_KEY, false)
}

export function setMuted(muted) {
  write(MUTED_KEY, muted)
}

// ---------- Défi du jour ----------

// Résultats des défis, rangés par date : { "2026-10-15": { score, time, … } }
export function getDailyResults() {
  return read(DAILY_KEY, {})
}

export function getDailyResult(day) {
  return getDailyResults()[day] || null
}

export function saveDailyResult(day, result) {
  const all = getDailyResults()
  all[day] = { ...result, date: new Date().toISOString() }
  write(DAILY_KEY, all)
}

// ---------- Duel ----------

// Bilan contre chaque adversaire : { hibou: { win, loss, draw }, … }
const DUEL_KEY = 'echo-memory:duel'

export function getDuelStats() {
  return read(DUEL_KEY, {})
}

export function saveDuelOutcome(bot, outcome) {
  const all = getDuelStats()
  const stats = all[bot] || { win: 0, loss: 0, draw: 0 }
  stats[outcome] += 1
  all[bot] = stats
  write(DUEL_KEY, all)
  return stats
}

// ---------- Séquence ----------

// Plus longue séquence réussie, par niveau et mode : { "moyen-classique": { length, date } }
const SEQUENCE_KEY = 'echo-memory:sequence'

export function getSequenceBest(level, mode) {
  return read(SEQUENCE_KEY, {})[`${level}-${mode}`] || null
}

export function getAllSequenceBest() {
  return read(SEQUENCE_KEY, {})
}

// Enregistre la longueur si elle bat le record. Renvoie true si c'est un nouveau record.
export function saveSequenceBest(level, mode, length) {
  const all = read(SEQUENCE_KEY, {})
  const key = `${level}-${mode}`
  if (length <= 0 || (all[key] && all[key].length >= length)) return false
  all[key] = { length, date: new Date().toISOString() }
  write(SEQUENCE_KEY, all)
  return true
}
