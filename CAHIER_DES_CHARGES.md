# Jour 2/30 — Écho, le memory qui se joue aussi à l'oreille

> Stack : **React 19** et **Vite**, **Web Audio** · hébergement **Coolify** (build Nixpacks, dossier `dist/` publié), sous-domaine `echo.projectp.fr`.
> Rédigé après la livraison, à partir du code : ce document décrit ce qui a été construit et sert de référence pour les évolutions.

## 1. L'idée

Un memory où chaque paire a **une forme, une couleur et une note de musique**. Les couleurs suivent la hauteur des notes (rouge pour les graves, violet pour les aiguës) : on mémorise avec les yeux… ou seulement avec les oreilles, en mode **Écoute**.

Autour du memory, trois autres jeux réutilisent les mêmes cartes et les mêmes sons : un **défi du jour**, un **duel contre l'ordinateur** et une **séquence** à rejouer.

## 2. MVP — ce qui doit fonctionner

1. Une **page d'accueil** qui présente les quatre jeux.
2. Le **memory** : 3 niveaux, 2 modes, score, chronomètre et records.
3. Le **défi du jour** : la même grille pour tout le monde, une tentative, un résultat à partager.
4. Le **duel** contre trois adversaires de niveaux différents.
5. La **séquence** de notes à rejouer.
6. Aucun fichier audio : tous les sons sont synthétisés.

### Périmètre volontairement limité

- Pas de compte ni de serveur : records et réglages restent dans le navigateur (`localStorage`).
- Pas de bibliothèque de routage ni d'état global : l'ancre de l'adresse et des reducers suffisent.

## 3. Cahier des charges fonctionnel

### A. 🎵 Memory musical

- **Niveaux** : Facile (6 paires), Moyen (8), Difficile (12).
- **Modes** : Classique (forme, couleur et son) et **Écoute** (les cartes ne montrent rien, seul le son guide).
- **Score** : 100 points par paire, multipliés par la série en cours ; **« Oubli »** −30 quand on rate une carte déjà vue ; bonus de temps à la fin (10 points par seconde gagnée sur un temps idéal de 6 s par paire).
- Chronomètre, coups, précision, **meilleur résultat** par niveau et par mode.

### B. 📅 Défi du jour

- Grille tirée par un générateur pseudo-aléatoire initialisé avec la date : **la même pour tout le monde**.
- **Une seule tentative** par jour, une **série 🔥** des jours d'affilée, un compte à rebours jusqu'à minuit.
- **Partage** façon Wordle : 🟩 paire, 🟨 raté, 🟥 oubli.

### C. 🐟🦉🐘 Duel contre l'ordinateur

- Chacun son tour ; une paire trouvée permet de rejouer.
- Trois adversaires, définis par leur mémoire : nombre de cartes retenues et probabilité de remarquer une carte.

| Adversaire | Cartes retenues | Attention |
| --- | --- | --- |
| Poisson rouge | 3 | 60 % |
| Hibou | 5 | 80 % |
| Éléphant | 24 | 97 % |

- L'ordinateur hésite, vise une carte avant de la retourner et commente ses coups. Bilan gardé contre chaque adversaire.

### D. 🎹 Séquence

- Une suite de notes à rejouer sur des pads ; elle **s'allonge et accélère** à chaque manche.
- 4, 6 ou 9 pads, mode Écoute, un joker « Réécouter », touches 1 à 9, record par niveau.

### E. Interface attendue

- Navigation par ancre : `#/jouer`, `#/defi`, `#/duel`, `#/sequence`.
- Bouton pour couper le son, mémorisé.
- Fenêtre de fin de partie avec le détail du score.

## 4. Cahier des charges technique

### Architecture

```
src/
├── pages/        Landing, Game, Daily, Duel, Sequence
├── components/   Card, Board, Stats, GameHeader, EndModal, DailyResult, Shape
├── hooks/        useMemoryGame (une partie), useMuted
└── lib/          Règles sans affichage : deck, game, daily, duel, sequence, audio, storage
```

- La logique de jeu est dans `lib/`, en fonctions pures et en reducers (`gameReducer`, `duelReducer`) : l'affichage ne fait que lire l'état.
- Tirages reproductibles (`seededRandom`) pour le défi du jour.
- Sons : oscillateurs Web Audio (notes, arpèges de réussite, son d'erreur).
- Qualité : ESLint (`npm run lint`).

### Mise en ligne

Coolify construit le site (`npm run build`) et publie `dist/` à chaque push sur `master`. Les chemins sont relatifs (`base: './'`). L'aperçu du lien vient des balises Open Graph et de `public/og.png`.

## 5. Critères de réussite

- [x] Une partie se termine toujours, avec un score qui suit les règles de la section 3.A.
- [x] Le mode Écoute se joue sans rien voir.
- [x] Deux personnes ont la même grille au défi du jour, et ne peuvent le jouer qu'une fois.
- [x] L'Éléphant gagne nettement plus souvent que le Poisson rouge.
- [x] Aucun fichier audio n'est chargé.

## 6. Pistes d'évolution

- Tests unitaires des règles de `lib/` (score, duel, séquence).
- Duel à deux joueurs sur le même écran.

## 7. Définition du « terminé »

Les critères de la section 5 sont remplis, `npm run lint` passe, le site est en ligne sur `echo.projectp.fr` et le README est à jour.
