import { useEffect, useState } from 'react'
import Landing from './pages/Landing.jsx'
import Game from './pages/Game.jsx'
import Daily from './pages/Daily.jsx'
import Duel from './pages/Duel.jsx'
import Sequence from './pages/Sequence.jsx'

// Navigation par l'ancre de l'URL : #/ (accueil), #/jouer (memory), #/defi (défi du jour)
// #/duel (duel contre l'ordinateur) et #/sequence (Écho Séquence).
// Pas besoin de bibliothèque de routage, et ça marche dans un sous-dossier
// sans configuration du serveur.
function getRoute() {
  return window.location.hash.replace(/^#/, '') || '/'
}

export default function App() {
  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    const onChange = () => {
      setRoute(getRoute())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  if (route === '/jouer') return <Game />
  if (route === '/defi') return <Daily />
  if (route === '/duel') return <Duel />
  if (route === '/sequence') return <Sequence />
  return <Landing />
}
