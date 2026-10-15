import { useState } from 'react'
import { getMuted, setMuted as saveMuted } from '../lib/storage.js'

// Son coupé ou non, mémorisé dans le navigateur
export function useMuted() {
  const [muted, setMuted] = useState(getMuted)

  function toggleMuted() {
    setMuted(m => {
      saveMuted(!m)
      return !m
    })
  }

  return [muted, toggleMuted]
}
