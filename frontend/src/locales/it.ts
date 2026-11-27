import { Translations } from './en';

export const it: Translations = {
  sudoku: {
    cell: "Riga {row}, colonna {column}: {value}",
    cellGiven: "Riga {row}, colonna {column}: {value}, di partenza",
    cellEmpty: "Riga {row}, colonna {column}: vuota",
    keyHint: "Da tastiera: le frecce per muoverti, i numeri per scrivere, N per le note, Canc per cancellare.",
    title: "(NON) Binary Games",
    subtitle: "Motore Sudoku",
    loading: "Preparo la griglia…",
    cleared: "Puzzle risolto!",
    compliment: "Eccellenti abilità logiche.",
    playAgain: "Gioca ancora",
    mode: "Modalità",
    settings: "Impostazioni",
    rules: "Come funziona",
    ruleNumbers: "Ogni riga, ogni colonna e ogni riquadro 3×3 contiene i numeri da 1 a 9, senza ripetizioni.",
    ruleNotes: "Le note sono condivise e colorate come chi le ha scritte.",
    tapHint: "Tocca una cella, poi un numero. Con le note attive, il numero diventa una nota.",
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
    keyHint: "Da tastiera: le frecce per muoverti, Invio per aprire una cella, F per mettere o togliere una bandierina.",
    cleared: "Tutto fiorito!",
    compliment: "Ottimo lavoro!",
    lost: "Un'ape!",
    lostHint: "Hai scelto di perdere quando si sveglia un'ape. Riproviamo?",
    rules: "Come funziona",
    ruleNumbers: "Un numero dice quante api toccano quella cella, anche in diagonale.",
    ruleSafe: "Apri tutte le celle senza un'ape. La prima è sempre sicura e non devi mai tirare a caso.",
    ruleFlags: "Metti una bandierina dove sai che dorme un'ape: attiva la modalità bandierine e tocca.",
    ruleMineMarks: "Se svegli un'ape viene solo segnata per tutti e la partita continua.",
    ruleMineLoses: "Se svegli un'ape la partita è persa per tutti.",
    flagMode: "Bandierine",
    explosive: "Perdi quando si sveglia un'ape",
    bloom: "Fiori che crescono alla fine",
    bloomHint: "Spenti, i fiori compaiono fermi: più leggero per i telefoni meno veloci.",
    explosiveLocked: "Si può cambiare prima di aprire la prima cella, o con una nuova partita.",
    cell: "Riga {row}, colonna {column}: {state}",
    closed: "chiusa",
    flagged: "bandierina",
    mine: "ape",
    empty: "nessuna ape intorno"
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
    keyHint: "Da tastiera: le frecce per muoverti, 0 e 1 per scrivere, Canc per cancellare.",
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
    open: "Apri {game}",
    takeBack: "Ritiro il mio voto",
    reconnecting: "Connessione persa, ci stiamo ricollegando… Il tuo posto nella stanza resta per un po’.",
    connectionLost: "Il server non risponde.",
    retry: "Riprova",
    boardFailed: "La griglia non è venuta. Non è cambiato niente: riprova.",
    backToTable: "Torna al tavolo",
    stayHere: "Preferisco restare",
    backAsk: "{names} vorrebbe tornare al tavolo",
    goBack: "Torna al tavolo",
    keepPlaying: "Continua a giocare",
    backProgress: "{count} su {total} vogliono tornare al tavolo",
    wants: "{names} vuole {game}",
    wantsPlural: "{names} vogliono {game}",
    and: "e",
    split: "I voti sono divisi: una scatola si apre quando più di metà della stanza la sceglie.",
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
  settings: {
    label: "Tema e lingua",
    theme: "Tema",
    language: "Lingua"
  },
  themes: {
    system: "Sistema",
    light: "Chiaro",
    dark: "Scuro",
    retro: "Retrò",
    oled: "OLED",
    "non-binary": "Non binario"
  },
  emotes: {
    title: "Reazioni",
    more: "Altre reazioni",
    names: {
      "💜": "Cuore viola",
      "🔥": "Fuoco",
      "😂": "Risata",
      "😤": "Sbuffo",
      "👏": "Applauso",
      "😎": "Occhiali da sole",
      "🤔": "Pensieroso",
      "😢": "Triste",
      "😴": "Sonno",
      "❤️": "Cuore rosso",
      "🎉": "Festa",
      "🦆": "Papera",
      "🫪": "Faccia stravolta",
      "🙏": "Grazie",
      "😓": "Uff",
      "😶‍🌫️": "Testa tra le nuvole",
      "🤯": "Testa che esplode",
      "🫰": "Cuoricino con le dita"
    }
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
    privacy: "Privacy",
    github: "GitHub"
  },
  home: {
    titleStart: "Prenditi una pausa: gioca in solitaria o",
    titleAccent: "in compagnia",
    lead: "Rilassati o metti alla prova la tua logica, in solitaria o collaborando con altre persone. Mi raccomando, conta stare insieme, non vincere.",
    create: "Crea una stanza",
    gotLink: "Ti hanno mandato un link? Aprilo e sei già al tavolo.",
    howTitle: "Come funziona",
    step1Title: "Crea una stanza",
    step1Text: "Un clic e sei al tavolo. Niente account, niente installazioni.",
    step2Title: "Manda il link",
    step2Text: "Copia l'indirizzo della stanza e mandalo a chi vuoi: chi lo apre si siede con te.",
    step3Title: "Scegliete la scatola",
    step3Text: "Ogni gioco è una scatola. Si apre quando più di metà della stanza la vuole.",
    emotesTitle: "Dillo con una faccina",
    emotesText: "Reazioni veloci che volano sopra il tavolo, per dire qualcosa senza scrivere. Toccane una per provarla.",
    gamesTitle: "I giochi sul tavolo",
    gamesHint: "Scegli un gioco per vedere com'è fatto e come si gioca."
  },
  gamesPage: {
    preview: "Anteprima",
    howToPlay: "Come si gioca",
    soonText: "Altri giochi in arrivo",
    sudoku: {
      tagline: "Il classico, in compagnia",
      description: "Riempite la griglia insieme: ogni riga, colonna e riquadro contiene i numeri da 1 a 9 una volta sola.",
      rule2: "Cinque livelli di difficoltà, tutti risolvibili con la sola logica: non serve mai tirare a indovinare.",
      rule4: "Quando siete pronti, tutta la stanza può iniziare una nuova partita."
    },
    takuzu: {
      tagline: "Zeri e uni in equilibrio",
      description: "Una griglia da riempire con 0 e 1, seguendo tre regole semplici.",
      rule5: "Cinque livelli, dalla griglia 6×6 alla 12×12, sempre risolvibili senza indovinare."
    },
    flowerField: {
      tagline: "Un prato da esplorare insieme",
      description: "Aprite tutte le celle che non nascondono un'ape, usando i numeri per capire dove dormono le api."
    },
    wordSearch: {
      tagline: "Parole nascoste, trovate insieme",
      description: "Trovate le parole nascoste nella griglia. Ogni parola trovata resta segnata nel tuo colore.",
      rule3: "Cinque livelli, dalla griglia 6×6 alla 12×12, con più direzioni man mano che crescono.",
      rule4: "Parole in italiano o in inglese: la stanza può passare dall'una all'altra."
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
  privacy: {
    title: "Privacy",
    lead: "Cosa tiene il sito, dove e per quanto. In breve: pochissimo.",
    browserTitle: "Nel tuo browser",
    browserText: "Il sito salva al massimo tre cose nel localStorage del browser: un codice anonimo, generato a caso, che ti fa tenere nome e colore quando rientri in una stanza, il tema che hai scelto e se i fiori del Campo fiorito crescono alla fine. Niente cookie, niente statistiche, niente pubblicità, niente script di altri siti: anche i font arrivano dal sito stesso. Puoi cancellare tutto quando vuoi dalle impostazioni del browser.",
    serverTitle: "Sul server",
    serverText: "Le stanze vivono solo nella memoria del server: la griglia, le mosse, le note, i nomi di animale e i colori. Una stanza vuota sparisce dopo dieci minuti, e tutte spariscono quando il server si riavvia. L'indirizzo IP serve solo a contare le connessioni aperte, per tenere lontano chi vuole sovraccaricare il gioco: resta in memoria e non finisce nei log del gioco.",
    hostingTitle: "Chi ospita il sito",
    hostingText: "Il sito è ospitato da Vercel, il server da Render e le risposte del modulo di feedback sono conservate su GitHub. Per sapere come trattano i dati, leggi le loro privacy policy:",
    feedbackTitle: "Il modulo di feedback",
    feedbackText: "Il modulo invia solo le risposte che scegli da elenchi: niente testo libero, niente contatti, niente che riguardi te. Vengono salvate come segnalazioni in un repository privato su GitHub che può aprire solo chi sviluppa, e restano lì per aiutare a migliorare il gioco: non dicono niente di chi le ha mandate. L'indirizzo IP viene usato solo nella memoria del server per limitare quante segnalazioni si possono inviare, e non viene mai salvato, scritto nei log né inviato a GitHub.",
    updated: "Ultimo aggiornamento: 26 novembre 2026"
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
    about3: "Da lì l'idea: giochi semplici da fare insieme, anche a distanza, dove conta la connessione e non la competizione."
  },
  feedback: {
    title: "Feedback",
    lead: "Il sito è in alpha: dimmi cosa non funziona, cosa ti manca o cosa ne pensi. Bastano pochi tocchi, non c'è niente da scrivere.",
    kind: "Di cosa si tratta?",
    kindBug: "Qualcosa non va",
    kindOpinion: "Dimmi cosa ne pensi",
    where: "Dove?",
    wherePlaceholder: "Scegli un posto",
    what: "Cosa è successo?",
    device: "Su che dispositivo?",
    frequency: "Quanto spesso?",
    rating: "Ti piace?",
    wishes: "Cosa vorresti vedere? Scegline quanti vuoi.",
    emote: "Una emote per accompagnarlo",
    optional: "facoltativo",
    send: "Invia il feedback",
    sending: "Invio...",
    waking: "Il server si sta svegliando",
    wakingDetails: "Gira su un hosting gratuito e ci mette circa un minuto a svegliarsi. Tieni aperta questa pagina: le risposte partono appena è pronto.",
    sentTitle: "Grazie!",
    sentText: "Le tue risposte sono arrivate e verranno lette. Non c'è una risposta privata: nessuno ti scriverà.",
    sendAnother: "Inviane un altro",
    tooMany: "Hai già inviato qualche segnalazione da poco. Riprova tra qualche minuto.",
    dayFull: "Per oggi sono arrivate tante segnalazioni e il modulo si è fermato. Riprova domani.",
    unavailable: "Non è stato possibile inviare il feedback in questo momento. Le risposte sono ancora qui: riprova tra poco.",
    diaryNote: "Alcune richieste potrebbero essere realizzate o ricevere risposta nel Diario, tra le novità. Non c'è una risposta privata: il modulo non conserva nessun contatto.",
    afterTitle: "Cosa succederà dopo",
    after1Title: "Arriva in un posto privato",
    after1Text: "Le risposte diventano una nota in un tracker privato che può aprire solo chi sviluppa. Contengono solo le scelte che hai fatto.",
    after2Title: "Viene letto",
    after2Text: "Ogni segnalazione viene letta. Non c'è una risposta privata.",
    after3Title: "Può finire nel diario",
    after3Text: "Se diventa una modifica, o riceve una risposta, la trovi tra le novità.",
    options: {
      where: {
        "sudoku": "Sudoku",
        "takuzu": "Takuzu",
        "flower-field": "Campo fiorito",
        "word-search": "Crucipuzzle",
        "table": "Il tavolo, dove si sceglie il gioco",
        "room-and-invite": "Stanze e inviti",
        "rest-of-site": "Il resto del sito",
        "whole-site": "Tutto il sito"
      },
      what: {
        "not-loading": "Non si carica",
        "moves-not-shared": "Le mosse non arrivano agli altri",
        "connection-drops": "La connessione cade",
        "looks-wrong": "Si vede male",
        "controls-not-responding": "I comandi non rispondono",
        "rules-or-win-wrong": "Le regole o la vittoria sono sbagliate",
        "text-or-translation": "Un testo o una traduzione",
        "other": "Altro"
      },
      device: {
        "phone": "Telefono",
        "tablet": "Tablet",
        "computer": "Computer"
      },
      frequency: {
        "once": "Una volta",
        "sometimes": "A volte",
        "always": "Ogni volta"
      },
      rating: {
        "1": "Non mi piace",
        "2": "Così così",
        "3": "Mi piace",
        "4": "Lo adoro"
      },
      wish: {
        "more-games": "Più giochi",
        "more-levels": "Più livelli",
        "more-languages": "Più lingue",
        "themes-and-colors": "Temi e colori",
        "public-rooms": "Stanze pubbliche",
        "fine-as-is": "Va bene così"
      }
    }
  }
};