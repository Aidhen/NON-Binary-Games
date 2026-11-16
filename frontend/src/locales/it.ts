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
  flowerField: {
    cleared: "Campo fiorito!",
    compliment: "Ogni cella sicura è aperta, e nessuno ha dovuto tirare a caso.",
    lost: "Una mina!",
    lostHint: "Hai scelto di perdere quando si apre una mina. Riproviamo?",
    rules: "Come funziona",
    ruleNumbers: "Un numero dice quante mine toccano quella cella, anche in diagonale.",
    ruleSafe: "Apri tutte le celle che non sono mine. La prima è sempre sicura e non devi mai tirare a caso.",
    ruleFlags: "Metti una bandierina dove sai che c'è una mina: attiva la modalità bandierine e tocca.",
    ruleMineMarks: "Se apri una mina viene solo segnata per tutti e la partita continua.",
    ruleMineLoses: "Se apri una mina la partita è persa per tutti.",
    flagMode: "Bandierine",
    explosive: "Perdi quando si apre una mina",
    explosiveLocked: "Si può cambiare prima di aprire la prima cella, o con una nuova partita.",
    cell: "Riga {row}, colonna {column}: {state}",
    closed: "chiusa",
    flagged: "bandierina",
    mine: "mina",
    empty: "nessuna mina intorno"
  },
  wordSearch: {
    cleared: "Tutte le parole sono state trovate!",
    compliment: "Ogni parola era nascosta da qualche parte, e le avete trovate insieme.",
    rules: "Come funziona",
    ruleFind: "Trova nella griglia le parole dell'elenco. Corrono in linea retta, in una qualsiasi delle otto direzioni, anche al contrario.",
    ruleDrag: "Trascina dalla prima all'ultima lettera, oppure tocca la prima lettera e poi l'ultima. Tocca di nuovo la prima per annullare.",
    ruleKeyboard: "Con la tastiera: frecce per spostarti, Invio o Spazio per segnare la prima e l'ultima lettera, Esc per annullare.",
    words: "Parole da trovare",
    counter: "{found}/{total}",
    counterLabel: "{found} parole trovate su {total}",
    hidden: "Parola nascosta: {n} lettere",
    hiddenTitle: "Parola nascosta",
    revealed: "La parola nascosta era {word}",
    wordFound: "trovata",
    language: "Lingua delle parole",
    languageHint: "È la lingua delle parole del puzzle, non quella della pagina. Cambiarla avvia un nuovo puzzle per tutti.",
    cell: "{letter}, riga {row}, colonna {column}",
    cellStart: "{letter}, riga {row}, colonna {column}, prima lettera selezionata",
    cellFound: "{letter}, riga {row}, colonna {column}, parte di una parola trovata",
    cellHidden: "{letter}, riga {row}, colonna {column}, parte della parola nascosta",
    grid: "Griglia del crucipuzzle"
  },
  takuzu: {
    cleared: "Puzzle risolto!",
    compliment: "Ogni riga e ogni colonna è in equilibrio.",
    rules: "Come funziona",
    ruleBalance: "Ogni riga e colonna ha tanti 0 quanti 1.",
    rulePairs: "Mai più di due numeri uguali di fila.",
    ruleUnique: "Nessuna riga uguale a un'altra, e lo stesso per le colonne.",
    tapHint: "Tocca una cella per passare da vuota a 0, a 1 e di nuovo vuota.",
    showErrors: "Mostra conflitti (rosso)",
    cell: "Riga {row}, colonna {column}: {value}",
    empty: "vuota"
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
    takuzu: {
      title: "Takuzu"
    },
    flowerField: {
      title: "Campo fiorito"
    },
    wordSearch: {
      title: "Crucipuzzle"
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
    title: "Reazioni",
    more: "Altre reazioni"
  },
  nav: {
    label: "Principale",
    home: "(non)BinaryGames, home",
    rooms: "Stanze",
    diary: "Diario",
    feedback: "Feedback"
  },
  footer: {
    tagline: "Un progetto queer-owned, fatto per giocare insieme.",
    github: "GitHub",
    social: "Instagram, X e TikTok: in arrivo"
  },
  home: {
    badge: "Puzzle chill, per due o per tutta la compagnia",
    titleStart: "Giochiamo insieme,",
    titleAccent: "senza fretta",
    lead: "Giochi semplici da fare fianco a fianco, anche a distanza. Niente timer, niente punteggi: conta stare insieme, non vincere.",
    create: "Crea una stanza",
    discover: "Scopri i giochi",
    gotLink: "Ti hanno mandato un link? Aprilo e sei già al tavolo.",
    howTitle: "Come funziona",
    step1Title: "Crea una stanza",
    step1Text: "Un clic e sei al tavolo. Niente account, niente installazioni.",
    step2Title: "Manda il link",
    step2Text: "Copia l'indirizzo della stanza e mandalo a chi vuoi: chi lo apre si siede con te.",
    step3Title: "Scegliete la scatola",
    step3Text: "Ogni gioco è una scatola. Si apre quando più di metà della stanza la vuole.",
    emotesTitle: "Dillo con una faccina",
    emotesText: "Reazioni veloci che volano sopra il tavolo, per dire qualcosa senza scrivere.",
    gamesTitle: "I giochi sul tavolo",
    gamesHint: "Scegli un gioco per vedere com'è fatto e come si gioca."
  },
  gamesPage: {
    preview: "Anteprima",
    previewHint: "I contorni colorati mostrano dove stanno guardando gli altri giocatori.",
    howToPlay: "Come si gioca",
    soonText: "Altri giochi in arrivo",
    noTimer: "Niente timer",
    levels: "5 livelli",
    sizes: "Da 6×6 a 12×12",
    sudoku: {
      tagline: "Il classico, in compagnia",
      description: "Riempite la griglia insieme: ogni riga, colonna e riquadro contiene i numeri da 1 a 9 una volta sola.",
      rule1: "Ogni riga, ogni colonna e ogni riquadro 3×3 contiene i numeri da 1 a 9, senza ripetizioni.",
      rule2: "Cinque livelli di difficoltà, tutti risolvibili con la sola logica: non serve mai tirare a indovinare.",
      rule3: "Le note sono condivise e colorate come chi le ha scritte.",
      rule4: "Quando siete pronti, tutta la stanza può iniziare una nuova partita.",
      fact: "Note condivise"
    },
    takuzu: {
      tagline: "Zeri e uni in equilibrio",
      description: "Una griglia da riempire con 0 e 1, seguendo tre regole semplici.",
      rule5: "Cinque livelli, dalla griglia 6×6 alla 12×12, sempre risolvibili senza indovinare."
    },
    flowerField: {
      tagline: "Un prato da esplorare insieme",
      description: "Aprite tutte le celle che non nascondono una mina, usando i numeri per capire dove sono.",
      fact1: "Bandierine del tuo colore",
      fact2: "Prima cella sempre sicura"
    },
    wordSearch: {
      tagline: "Parole nascoste, trovate insieme",
      description: "Trovate le parole nascoste nella griglia. Ogni parola trovata resta segnata nel tuo colore.",
      rule3: "Cinque livelli, dalla griglia 6×6 alla 12×12, con più direzioni man mano che crescono.",
      rule4: "Parole in italiano o in inglese: la stanza può passare dall'una all'altra.",
      fact: "Italiano e inglese"
    }
  },
  rooms: {
    title: "Stanze",
    lead: "Oggi ogni stanza è privata e si condivide con un link. Le stanze pubbliche sono in lavorazione.",
    todayTitle: "Come funzionano oggi",
    privateTitle: "Private, sempre",
    privateText: "Una stanza esiste solo per chi ha il link. Il suo codice non compare nella pagina.",
    noAccountTitle: "Senza account",
    noAccountText: "Ricevi un nome di fantasia, come Panda Rosso, e un colore tutto tuo.",
    togetherTitle: "Si decide insieme",
    togetherText: "Le scatole si votano: un gioco si apre quando più di metà della stanza lo vuole.",
    wip: "Lavori in corso",
    publicTitle: "Stanze pubbliche",
    publicText: "L'idea: tavoli aperti a cui sedersi anche senza un invito, per quando hai voglia di giocare e non hai nessuno a portata di link. Non c'è ancora una data: prima vengono le stanze stabili e le riconnessioni.",
    publicAsk: "Ti piacerebbero? Hai dubbi su sicurezza o moderazione?",
    publicAskLink: "Scrivimelo nel feedback"
  },
  diary: {
    title: "Diario",
    lead: "Cosa sta arrivando, cosa è appena uscito e qualche pagina dietro le quinte.",
    filter: "Mostra",
    all: "Tutto",
    upcoming: "In arrivo",
    released: "Rilasciato",
    behindTheScenes: "Dietro le quinte",
    aboutTitle: "Chi c'è dietro",
    about1: "Ciao, sono Aidhen.",
    about2: "(non)BinaryGames è nato cercando un modo leggero per passare il tempo con una persona lontana. Non sempre si hanno le energie per qualcosa di impegnativo: un sudoku fatto insieme è bastato.",
    about3: "Da lì l'idea: giochi semplici, fianco a fianco, dove conta la connessione e non la competizione."
  },
  feedback: {
    title: "Feedback",
    lead: "Il sito è in alpha: dimmi cosa non funziona, cosa ti manca o cosa ti è piaciuto.",
    wip: "Lavori in corso",
    wipText: "Questo modulo non è ancora attivo: non si può compilare né inviare. Aprirà presto.",
    kind: "Di cosa si tratta?",
    kindBug: "Qualcosa non va",
    kindIdea: "Ho un'idea",
    kindOther: "Altro",
    about: "Riguarda",
    aboutAll: "Tutto il sito",
    aboutRooms: "Stanze e inviti",
    headline: "In una riga",
    headlinePlaceholder: "Es. Le note spariscono quando rientro",
    details: "Racconta",
    detailsPlaceholder: "Cosa stavi facendo, cosa ti aspettavi e cosa è successo.",
    contact: "Un contatto, se vuoi una risposta",
    optional: "facoltativo",
    contactPlaceholder: "nome@esempio.it",
    send: "Invia il feedback",
    afterTitle: "Cosa succederà dopo",
    after1Title: "Arriva a chi sviluppa",
    after1Text: "Il messaggio diventa una segnalazione privata: non è pubblico.",
    after2Title: "Viene letto",
    after2Text: "Ogni segnalazione viene letta. Non sempre c'è una risposta diretta.",
    after3Title: "Finisce nel diario",
    after3Text: "Se diventa una modifica, la trovi tra le novità."
  }
};