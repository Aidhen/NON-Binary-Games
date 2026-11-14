import { Translations } from './en';

export const it: Translations = {
  sudoku: {
    title: "(NON) Binary Games",
    subtitle: "Motore Sudoku",
    loading: "Caricamento motore...",
    cleared: "Puzzle risolto!",
    compliment: "Eccellenti abilità logiche.",
    playAgain: "Gioca ancora",
    mode: "Modalità",
    settings: "Impostazioni",
    closeSettings: "Chiudi",
    newGame: "Nuova partita",
    beginner: "Principiante",
    easy: "Facile",
    medium: "Medio",
    hard: "Difficile",
    expert: "Esperto",
    visualHelpers: "Aiuti visivi",
    highlightCrosshairs: "Evidenzia croce e quadrante",
    highlightSame: "Evidenzia numeri uguali",
    showErrors: "Mostra errori (rosso)",
    godMode: "Modalità god: segna i numeri sbagliati (rosso)",
    notesMode: "Note",
    copied: "Copiato",
    copyLink: "Copia link",
    room: "Stanza",
    roomFull: "Questa stanza è piena.",
    invalidRoom: "Questo link non porta a una partita. Inizia una nuova partita dalla home.",
    serverFull: "Ci sono troppe partite in corso al momento. Riprova tra qualche minuto.",
    tooFast: "Sono state avviate troppe partite in poco tempo. Aspetta un attimo e riprova.",
    backHome: "Torna alla home"
  },
  players: {
    title: "Giocatori in questa stanza",
    you: "tu",
    chooseColor: "Scegli il tuo colore",
    colorTaken: "Scelto da {name}",
    highlight: "Mostra dove sta giocando {name}",
    joined: "{name} è nella stanza",
    left: "{name} ha lasciato la stanza",
    someone: "Qualcuno",
    nameFormat: "{animal} {color}",
    colors: {
      red: { m: "Rosso", f: "Rossa" },
      orange: { m: "Arancione", f: "Arancione" },
      green: { m: "Verde", f: "Verde" },
      teal: { m: "Turchese", f: "Turchese" },
      blue: { m: "Blu", f: "Blu" },
      purple: { m: "Viola", f: "Viola" },
      pink: { m: "Rosa", f: "Rosa" }
    },
    animals: {
      panda: { name: "Panda", gender: "m" },
      fox: { name: "Volpe", gender: "f" },
      otter: { name: "Lontra", gender: "f" },
      owl: { name: "Gufo", gender: "m" },
      frog: { name: "Rana", gender: "f" },
      koala: { name: "Koala", gender: "m" },
      hedgehog: { name: "Riccio", gender: "m" },
      penguin: { name: "Pinguino", gender: "m" },
      rabbit: { name: "Coniglio", gender: "m" },
      turtle: { name: "Tartaruga", gender: "f" },
      octopus: { name: "Polpo", gender: "m" },
      dolphin: { name: "Delfino", gender: "m" }
    }
  },
  lobby: {
    yourRoom: "La tua stanza",
    invite: "Manda il link a chi vuoi al tavolo.",
    title: "Scegli una scatola",
    hint: "Ognuno ne sceglie una. La scatola si apre quando la vuole più di metà della stanza.",
    games: "Giochi",
    open: "Apri la scatola",
    takeBack: "Ritiro il mio voto",
    progress: "{count} su {total} vogliono {game}",
    votes: "{count} voti su {total}",
    players: "{min}–{max} giocatori",
    playersExact: "{count} giocatori",
    connecting: "Apparecchio il tavolo…",
    soon: "Presto",
    unknownGame: "In questa stanza si gioca a un gioco che questa pagina non conosce ancora. Ricarica la pagina per avere l'ultima versione."
  },
  games: {
    sudoku: {
      title: "Sudoku"
    },
    mystery: {
      title: "Scatola misteriosa"
    }
  },
  loader: {
    waking: "Il server si sta svegliando",
    wakingDetails: "Per tenere il gioco gratuito e senza pubblicità, gira su un hosting gratuito. Il server va a dormire dopo 15 minuti senza visitatori e ci mette circa un minuto a ripartire. Grazie per l'attesa!",
    failed: "Non riusciamo a raggiungere il server",
    failedDetails: "Ci sta mettendo più del solito. Continuiamo a riprovare in background.",
    retry: "Riprova"
  },
  emotes: {
    title: "Reazioni"
  }
};