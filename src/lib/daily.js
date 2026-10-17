// Défi du jour : une grille par jour, la même pour tout le monde.
import { formatTime } from './deck.js'
import { getDailyResults } from './storage.js'

export const DAILY = {
  level: 'moyen', // 8 paires
  mode: 'classique',
  firstDay: '2026-10-15', // défi n°1
  url: 'https://echo.projectp.fr/#/defi',
}

// Date du jour au format AAAA-MM-JJ (heure locale : le défi change à minuit)
export function dayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Nombre de jours entre deux dates AAAA-MM-JJ
function daysBetween(from, to) {
  const toUtc = key => {
    const [y, m, d] = key.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((toUtc(to) - toUtc(from)) / 86400000)
}

export function challengeNumber(day) {
  return daysBetween(DAILY.firstDay, day) + 1
}

// Le texte qui fixe le mélange : même date → même grille
export function dailySeed(day) {
  return `echo-defi-${day}`
}

// Série : nombre de jours de suite où le défi a été fait, jusqu'à aujourd'hui
// (ou jusqu'à hier, si celui d'aujourd'hui n'est pas encore fait)
export function getStreak(today = new Date()) {
  const results = getDailyResults()
  const date = new Date(today)
  if (!results[dayKey(date)]) date.setDate(date.getDate() - 1)

  let streak = 0
  while (results[dayKey(date)]) {
    streak++
    date.setDate(date.getDate() - 1)
  }
  return streak
}

export function msUntilMidnight(now = new Date()) {
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  return midnight - now
}

export function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

// Un emoji par coup : 🟩 paire trouvée · 🟨 raté · 🟥 oubli
export const HISTORY_EMOJI = { match: '🟩', miss: '🟨', forget: '🟥' }

export function historyLines(history, perLine = 8) {
  const emojis = history.map(h => HISTORY_EMOJI[h])
  const lines = []
  for (let i = 0; i < emojis.length; i += perLine) lines.push(emojis.slice(i, i + perLine).join(''))
  return lines
}

// Le texte à partager, à la manière de Wordle
export function buildShareText(result, number) {
  return [
    `Écho · Défi n°${number} 🧠`,
    ...historyLines(result.history),
    `${result.score} pts · ${formatTime(result.time)} · combo ×${result.maxCombo}`,
    DAILY.url,
  ].join('\n')
}
