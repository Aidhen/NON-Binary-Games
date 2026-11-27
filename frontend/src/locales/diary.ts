/**
 * The entries of the Diary page. This is the only file to edit to add one: see docs/DIARY.md for the rules
 * (what to write, when, and what never to promise). The page sorts the entries by date, newest first.
 */
export const DIARY_TYPES = ['upcoming', 'released', 'behind-the-scenes'] as const;
export type DiaryType = (typeof DIARY_TYPES)[number];

export interface DiaryText {
  /** Shown on the closed entry. About 50 characters at most. */
  title: string;
  /** One line under the title, about 80 characters at most. */
  summary: string;
  /** What appears when the entry opens. One string per paragraph. */
  body: readonly string[];
}

export interface DiaryEntry {
  /** Lowercase words and hyphens, never reused: it names the entry in the page. */
  id: string;
  type: DiaryType;
  /** ISO date (YYYY-MM-DD). For an upcoming entry, the day it was written: never a promise of when. */
  date: string;
  /** Only for released entries: the version that carries the change. */
  version?: string;
  en: DiaryText;
  it: DiaryText;
}

export const DIARY: readonly DiaryEntry[] = [
  {
    id: 'tarot-memory',
    type: 'upcoming',
    date: '2026-11-20',
    en: {
      title: 'A Memory game with tarot cards',
      summary: 'A new game, with cards inspired by the tarot.',
      body: ['The next game: a Memory where the pairs to find are tarot cards, drawn in the style of the site.'],
    },
    it: {
      title: 'Un Memory con i tarocchi',
      summary: 'Un nuovo gioco, con carte ispirate ai tarocchi.',
      body: [
        'Il prossimo gioco: un Memory in cui le coppie da ritrovare sono carte dei tarocchi, disegnate nello stile del sito.',
      ],
    },
  },
  {
    id: 'bees-and-phone-layout',
    type: 'released',
    date: '2026-11-27',
    version: '0.9.0-alpha',
    en: {
      title: 'Bees, blooms and a roomier phone layout',
      summary: 'A gentler Flower Field, a clearer table, a screen that fits.',
      body: [
        'In the Flower Field the mines are gone: now a sleepy bee is hiding under some cells, and waking it up is the only way to lose. When the field is cleared the flowers bloom on their own, with nothing left on top of them, and closed cells now look like grass while opened ones are bare soil.',
        'At the table you can now see who wants which game, by name, and the button says which box it opens. If someone asks to go back to the table, you see who and can follow or keep playing. On a phone, the board and the keypad now fit on the first screen.',
      ],
    },
    it: {
      title: 'Api, fioriture e un telefono con più spazio',
      summary: 'Un Campo fiorito più gentile, un tavolo più chiaro, uno schermo che basta.',
      body: [
        'Nel Campo fiorito le mine non ci sono più: ora sotto alcune celle dorme un\'ape, e svegliarla è l\'unico modo di perdere. Quando il campo è libero i fiori sbocciano da soli, senza niente sopra, e le celle chiuse ora sembrano erba mentre quelle aperte sono terra.',
        'Al tavolo ora vedi chi vuole quale gioco, con il nome, e il pulsante dice quale scatola apre. Se qualcuno chiede di tornare al tavolo vedi chi è e puoi seguirlo o continuare a giocare. Sul telefono, griglia e tastierino ora stanno nella prima schermata.',
      ],
    },
  },
  {
    id: 'feedback-form',
    type: 'released',
    date: '2026-11-27',
    version: '0.8.0-alpha',
    en: {
      title: 'You can now send feedback!',
      summary: 'A multiple choice form, quick and easy.',
      body: ['On the Feedback page you can tell me if something is wrong or what you think of a game, by picking from the answers. There is no free text and I cannot reply in private (for now), but every now and then I will post polls about new features :)'],
    },
    it: {
      title: 'Ora si possono mandare feedback!',
      summary: 'Un modulo a scelte multiple, facile e veloce.',
      body: ['Nella pagina Feedback puoi dirmi se qualcosa non va o cosa ne pensi di un gioco, scegliendo tra le varie risposte. Non c\'è testo libero e non potrò rispondere in privato (per ora), ma ogni tanto pubblicherò dei sondaggi per nuove feature :)'],
    },
  },
  {
    id: 'smoother-reconnections',
    type: 'released',
    date: '2026-11-21',
    version: '0.7.0-alpha',
    en: {
      title: 'Smoother reconnections',
      summary: 'A short drop no longer takes you out of the room.',
      body: [
        'When the connection drops, the room keeps your place for a little while: the others do not see you leave, and your vote stays. The game says it is reconnecting, and a board that cannot be made now says so instead of doing nothing.',
      ],
    },
    it: {
      title: 'Riconnessioni più fluide',
      summary: 'Un calo breve non ti fa più uscire dalla stanza.',
      body: [
        'Quando la connessione cade, la stanza ti tiene il posto per un po\': gli altri non ti vedono uscire e il tuo voto resta. Il gioco dice che si sta ricollegando, e una griglia che non riesce a venire ora lo dice, invece di non fare niente.',
      ],
    },
  },
  {
    id: 'keyboard-play',
    type: 'released',
    date: '2026-11-21',
    version: '0.7.0-alpha',
    en: {
      title: 'Playing with the keyboard',
      summary: 'Arrow keys to move around the grid, in every game.',
      body: [
        'One Tab reaches the grid, the arrow keys move around it, and the keys of each game play: the numbers and N for notes in the Sudoku, 0 and 1 in the Takuzu, Enter and F in the Flower Field. The answer of the Sudoku now stays on the server, as in the other games.',
      ],
    },
    it: {
      title: 'Giocare da tastiera',
      summary: 'Frecce per muoversi nella griglia, in tutti i giochi.',
      body: [
        'Un Tab porta alla griglia, le frecce ci si muovono, e i tasti di ogni gioco giocano: i numeri e N per le note nel Sudoku, 0 e 1 nel Takuzu, Invio e F nel Campo fiorito. La soluzione del Sudoku ora resta sul server, come negli altri giochi.',
      ],
    },
  },
  {
    id: 'a-home-and-drawn-emotes',
    type: 'released',
    date: '2026-11-21',
    version: '0.6.0-alpha',
    en: {
      title: 'A home, and emotes with a face',
      summary: 'The site now has a front door, and the reactions are drawn.',
      body: [
        'The site now has a home with the games and their rules, this diary, a note on privacy, and the Rooms and Feedback pages, still being built. The reactions are tiles with a face, and the game boards are made of tiles too, in the same style as the logo.',
        'During a game the site steps aside and leaves room for the board, and a button takes everyone back to the table when more than half of the room wants it. The emotes on the home can be tried out, the Sudoku has its rules at hand like the other games, the Non-Binary theme has clearer colors, and a cleared Flower Field bursts into bloom.',
      ],
    },
    it: {
      title: 'Una home, e le emote con la faccia',
      summary: 'Il sito ha una porta d\'ingresso, e le reazioni sono disegnate.',
      body: [
        'Ora il sito ha una home con i giochi e le loro regole, questo diario, una nota sulla privacy e le pagine Stanze e Feedback, ancora in costruzione. Le reazioni sono tessere con la faccia, e anche le griglie dei giochi sono fatte di tessere, nello stesso stile del logo.',
        'In partita il sito si fa da parte e lascia spazio alla griglia, e un pulsante riporta tutti al tavolo quando lo vuole più di metà della stanza. Le emote della home si possono provare, il Sudoku ha le sue regole a portata di mano come gli altri giochi, il tema Non-Binary ha colori più leggibili, e un Campo fiorito finito si riempie di fiori.',
      ],
    },
  },
  {
    id: 'the-table-and-three-more-games',
    type: 'released',
    date: '2026-11-15',
    version: '0.5.0-alpha',
    en: {
      title: 'The table, and three more games',
      summary: 'Rooms start at a table with boxes, with Takuzu, Flower Field and Word Search.',
      body: ['Every game is a box on the table, and it opens when more than half of the room wants it. Takuzu, Flower Field and Word Search join the Sudoku, and in Word Search every word stays marked in the color of whoever found it, in English or in Italian. Every player gets a name and a color.'],
    },
    it: {
      title: 'Il tavolo, e tre giochi in più',
      summary: 'Le stanze partono da un tavolo con le scatole, con Takuzu, Flower Field e Crucipuzzle.',
      body: ['Ogni gioco è una scatola sul tavolo, e si apre quando la vuole più di metà della stanza. Al Sudoku si aggiungono Takuzu, Flower Field e Crucipuzzle, dove ogni parola resta segnata nel colore di chi l\'ha trovata, in italiano o in inglese. Ogni persona riceve un nome e un colore.'],
    },
  },
  {
    id: 'rooms-with-a-link',
    type: 'released',
    date: '2026-11-04',
    version: '0.2.0-alpha',
    en: {
      title: 'Rooms you share with a link',
      summary: 'The Sudoku goes online, with notes and the first emotes.',
      body: [
        'A room has its own address: send it, and whoever opens it plays with you. Shared notes, a win screen and the first reactions came with it.',
      ],
    },
    it: {
      title: 'Stanze da condividere con un link',
      summary: 'Il Sudoku va online, con le note e le prime emote.',
      body: [
        'Una stanza ha il suo indirizzo: mandalo, e chi lo apre gioca con te. Insieme sono arrivate le note condivise, la schermata di vittoria e le prime reazioni.',
      ],
    },
  },
  {
    id: 'how-it-is-made',
    type: 'behind-the-scenes',
    date: '2026-11-20',
    en: {
      title: 'How it is made',
      summary: 'Who works on it, and what the artificial intelligence does.',
      body: [
        'There are two of us behind (non)BinaryGames: me and my partner. I take care of the technical side and of the repository; my partner helps me with the decisions, about the look and everything else. Then there is an artificial intelligence (Claude), which I work with like a colleague.',
        'The ideas and the choices are ours: which games to make, the rules they must follow (never guessing, no race), what the site should look like, what must stay safe for the people who play. I decide what goes into the code, I review every change, and I run the tests and try the game before every version.',
        'Claude writes much of the code following my directions, helps me put the drawings and the translations down, and points out the weak spots. The parts I want to learn from I write myself: this project is also where I practise.',
        'I do not hide it, because I think it is right to know. Behind every choice there is a person, and the time I put into it is real.',
      ],
    },
    it: {
      title: 'Come è fatto',
      summary: 'Chi ci lavora, e cosa fa l\'intelligenza artificiale.',
      body: [
        'Dietro (non)BinaryGames siamo in due: io e la mia persona. Io curo la parte tecnica e il repository; la mia persona mi aiuta nelle decisioni, estetiche e non. Poi c\'è un\'intelligenza artificiale (Claude), con cui lavoro come con una collega.',
        'Le idee e le scelte sono nostre: quali giochi fare, le regole che devono rispettare (mai tirare a indovinare, nessuna gara), come deve essere il sito, cosa deve restare sicuro per chi gioca. Decido io cosa entra nel codice, rivedo ogni modifica, lancio i test e provo il gioco prima di ogni versione.',
        'Claude scrive gran parte del codice seguendo le mie indicazioni, mi aiuta a mettere giù i disegni e le traduzioni, e mi segnala i punti deboli. Le parti da cui voglio imparare le scrivo io: questo progetto è anche la mia palestra.',
        'Non lo nascondo perché credo sia giusto saperlo. Dietro ogni scelta c\'è una persona, e il tempo che ci metto è vero.',
      ],
    },
  },
  {
    id: 'why-you-wait',
    type: 'behind-the-scenes',
    date: '2026-11-20',
    en: {
      title: 'Why you sometimes wait',
      summary: 'The free server falls asleep, and for now that is fine.',
      body: [
        'The game runs on a free server that falls asleep when nobody is playing. The first person who arrives wakes it up, and it takes about a minute: in the meantime you can look around the site, and the table is already there.',
        'For now I have no money to invest in the project, and I do not want to put ads on it to pay for it.',
        'The idea, later on, is to grow a small, kind community and, with the donations of whoever wants to give, to make the service better for everyone who plays.',
      ],
    },
    it: {
      title: 'Perché a volte si aspetta',
      summary: 'Il server gratuito si addormenta, e per ora va bene così.',
      body: [
        'Il gioco gira su un server gratuito che si addormenta quando nessuno gioca. La prima persona che arriva lo sveglia, e ci vuole circa un minuto: intanto puoi girare per il sito, e il tavolo è già lì.',
        'Per ora non ho soldi da investire nel progetto, e non voglio metterci la pubblicità per pagarlo.',
        'L\'idea, più avanti, è far crescere una piccola community carina e, con le donazioni di chi vorrà, migliorare il servizio per tutte le persone che giocano.',
      ],
    },
  },
  {
    id: 'no-guessing',
    type: 'behind-the-scenes',
    date: '2026-11-20',
    en: {
      title: 'Puzzles that never ask you to guess',
      summary: 'The reason I started this project.',
      body: [
        'It is one of the reasons I started. The apps I had tried did not always make sudokus you could solve by reasoning: at some point you had to try a number and hope.',
        'That made me too sad: I love reasoning and getting there by following the rules of the game. So here every puzzle has one solution and can always be solved by deduction, and the same goes for the other games.',
      ],
    },
    it: {
      title: 'Puzzle che non chiedono di indovinare',
      summary: 'Il motivo per cui ho iniziato questo progetto.',
      body: [
        'È uno dei motivi per cui ho iniziato. Le app che avevo provato non generavano sempre sudoku risolvibili ragionando: a un certo punto bisognava provare un numero e sperare.',
        'Mi dispiaceva troppo: a me piace ragionare e farcela seguendo le regole del gioco. Così qui ogni puzzle ha una sola soluzione e si risolve sempre per deduzione, e lo stesso vale per gli altri giochi.',
      ],
    },
  },
  {
    id: 'together-no-race',
    type: 'behind-the-scenes',
    date: '2026-11-20',
    en: {
      title: 'Together, with no race',
      summary: 'No scores to beat: everyone plays on the same side.',
      body: [
        'Here too I wanted something different from the alternatives I had found. There is no leaderboard and nobody wins over the others: everyone plays on the same side, and the board is finished together, at your own pace.',
      ],
    },
    it: {
      title: 'Insieme, senza gara',
      summary: 'Niente punteggi da battere: si gioca dalla stessa parte.',
      body: [
        'Anche qui volevo qualcosa di diverso dalle alternative che avevo trovato. Non c\'è una classifica e nessuno vince sugli altri: si gioca dalla stessa parte, e la griglia si finisce insieme, con i propri tempi.',
      ],
    },
  },
  {
    id: 'animal-names-and-colors',
    type: 'behind-the-scenes',
    date: '2026-11-20',
    en: {
      title: 'Animal names and colors',
      summary: 'How you are recognized in a room, without an account.',
      body: [
        'When you enter a room you get an animal name, like Red Panda, and a color, both drawn at random. At the table you can pick another color: it is the color of your notes, your words and your cursor. No account is needed: your browser remembers you, so if the connection drops you keep your name and color.',
      ],
    },
    it: {
      title: 'Nomi di animali e colori',
      summary: 'Come ti riconosci in una stanza, senza account.',
      body: [
        'Quando entri in una stanza ricevi un nome di animale, come Panda Rosso, e un colore, entrambi sorteggiati a caso. Al tavolo puoi sceglierne un altro: è il colore delle tue note, delle tue parole e del tuo cursore. Non serve un account: il browser si ricorda di te, così se la connessione cade tieni nome e colore.',
      ],
    },
  },
  {
    id: 'why-the-license-changed',
    type: 'behind-the-scenes',
    date: '2026-11-20',
    en: {
      title: 'Why I changed the license',
      summary: 'Free to use, but not to resell.',
      body: [
        'The project was born to be calm and noncommercial, and I am putting a lot of time and care into it.',
        'With the old license anyone could take everything and resell it. Now the code stays open: it can be read, used and changed, but not to make money from it. Seeing it resold would ruin the idea it was born from.',
      ],
    },
    it: {
      title: 'Perché ho cambiato licenza',
      summary: 'Libero da usare, ma non da rivendere.',
      body: [
        'Il progetto è nato per essere tranquillo e non commerciale, e ci sto mettendo tanto tempo e tanto impegno.',
        'Con la licenza di prima chiunque poteva prendere tutto e rivenderlo. Ora il codice resta aperto: si può leggere, usare e modificare, ma non per guadagnarci. Vederlo rivenduto rovinerebbe l\'idea per cui è nato.',
      ],
    },
  },
  {
    id: 'how-the-emotes-were-drawn',
    type: 'behind-the-scenes',
    date: '2026-11-16',
    en: {
      title: 'How the emotes were drawn',
      summary: 'From plain emoji to tiles with a face.',
      body: [
        'The logo is two tiles leaning on each other. The emotes started from there: the same tile, the same outline, a different face for each feeling.',
        'The idea and the style are mine; to put the drawings down I worked with an artificial intelligence (Claude).',
      ],
    },
    it: {
      title: 'Come sono nate le emote',
      summary: 'Dalle emoji alle tessere con la faccia.',
      body: [
        'Il logo è fatto di due tessere appoggiate l\'una all\'altra. Le emote sono partite da lì: la stessa tessera, lo stesso contorno, una faccia diversa per ogni stato d\'animo.',
        'L\'idea e lo stile sono miei; per mettere giù i disegni ho lavorato con un\'intelligenza artificiale (Claude).',
      ],
    },
  },
];
