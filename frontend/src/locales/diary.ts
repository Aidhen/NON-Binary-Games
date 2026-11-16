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
    id: 'smoother-reconnections',
    type: 'upcoming',
    date: '2026-11-16',
    en: {
      title: 'Smoother reconnections',
      summary: 'Coming back to a room after the connection drops.',
      body: ['When the connection drops, coming back to the room should feel natural: same seat at the table, same game, without noticing.'],
    },
    it: {
      title: 'Riconnessioni più fluide',
      summary: 'Tornare in una stanza dopo un calo di connessione.',
      body: ['Se la connessione cade, rientrare nella stanza dovrebbe essere naturale: stesso posto al tavolo, stessa partita, senza accorgersene.'],
    },
  },
  {
    id: 'keyboard-play',
    type: 'upcoming',
    date: '2026-11-16',
    en: {
      title: 'Playing with the keyboard',
      summary: 'Arrow keys to move around the grid.',
      body: ['Moving around the grid with the arrow keys, and better support for screen readers, so that more people can play.'],
    },
    it: {
      title: 'Giocare da tastiera',
      summary: 'Frecce per muoversi nella griglia.',
      body: ['Muoversi nella griglia con le frecce e un supporto migliore per i lettori di schermo, per far giocare più persone.'],
    },
  },
  {
    id: 'feedback-form',
    type: 'upcoming',
    date: '2026-11-16',
    en: {
      title: 'A way to send feedback',
      summary: 'The form is drawn, and still switched off.',
      body: ['The Feedback page shows the form as it will be. It cannot be sent yet: it will open once it is connected.'],
    },
    it: {
      title: 'Un modo per mandare feedback',
      summary: 'Il modulo è disegnato, ma ancora spento.',
      body: ['La pagina Feedback mostra il modulo come sarà. Non si può ancora inviare: aprirà quando sarà collegato.'],
    },
  },
  {
    id: 'a-home-and-drawn-emotes',
    type: 'released',
    date: '2026-11-16',
    version: '0.6.0-alpha',
    en: {
      title: 'A home, and emotes with a face',
      summary: 'The site now has a front door, and the reactions are drawn.',
      body: [
        'Opening the site used to drop you straight into a room. Now there is a home that says what this place is, a page with the games and their rules, and this diary.',
        'The reactions are no longer plain emoji: each one is a little tile with a face, in the same style as the logo.',
      ],
    },
    it: {
      title: 'Una home, e le emote con la faccia',
      summary: 'Il sito ha una porta d\'ingresso, e le reazioni sono disegnate.',
      body: [
        'Aprire il sito portava dritti in una stanza. Ora c\'è una home che spiega cos\'è questo posto, una pagina con i giochi e le loro regole, e questo diario.',
        'Le reazioni non sono più semplici emoji: ognuna è una tessera con la faccia, nello stesso stile del logo.',
      ],
    },
  },
  {
    id: 'word-search',
    type: 'released',
    date: '2026-11-15',
    version: '0.5.0-alpha',
    en: {
      title: 'Word Search, the fourth game',
      summary: 'Hidden words to find together.',
      body: [
        'Drag along a line or tap the first and the last letter. Every word stays marked in the color of whoever found it.',
        'The words can be in English or in Italian, and the room can switch between the two. The emote bar also got a second side.',
      ],
    },
    it: {
      title: 'Crucipuzzle, il quarto gioco',
      summary: 'Parole nascoste da trovare insieme.',
      body: [
        'Trascina lungo una linea o tocca la prima e l\'ultima lettera. Ogni parola resta segnata nel colore di chi l\'ha trovata.',
        'Le parole possono essere in italiano o in inglese, e la stanza può passare dall\'una all\'altra. Anche la barra delle emote ha guadagnato un secondo lato.',
      ],
    },
  },
  {
    id: 'the-table-and-two-more-games',
    type: 'released',
    date: '2026-11-15',
    version: '0.3.0-alpha',
    en: {
      title: 'The table, Takuzu and Flower Field',
      summary: 'Rooms start at a table with boxes, and two more games arrive.',
      body: [
        'Every game is a box. Each player picks one, and the box opens when more than half of the room wants it.',
        'Two new boxes joined the Sudoku: Takuzu and Flower Field. Every puzzle has five levels and can be solved without guessing, and every player gets a name and a color of their own.',
      ],
    },
    it: {
      title: 'Il tavolo, Takuzu e Flower Field',
      summary: 'Le stanze partono da un tavolo con le scatole, e arrivano due giochi.',
      body: [
        'Ogni gioco è una scatola. Ciascuno sceglie la sua, e la scatola si apre quando più di metà della stanza la vuole.',
        'Al Sudoku si sono aggiunte due scatole: Takuzu e Flower Field. Ogni puzzle ha cinque livelli e si risolve senza indovinare, e ogni persona riceve un nome e un colore tutti suoi.',
      ],
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
      body: ['A room has its own address: send it, and whoever opens it plays with you. Shared notes, a win screen and the first reactions came with it.'],
    },
    it: {
      title: 'Stanze da condividere con un link',
      summary: 'Il Sudoku va online, con le note e le prime emote.',
      body: ['Una stanza ha il suo indirizzo: mandalo, e chi lo apre gioca con te. Insieme sono arrivate le note condivise, la schermata di vittoria e le prime reazioni.'],
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
        'The first sketches went back and forth with an artist, who corrected them one by one: fewer tears, rounder eyes, clouds that look like clouds. The duck stayed a duck.',
      ],
    },
    it: {
      title: 'Come sono nate le emote',
      summary: 'Dalle emoji alle tessere con la faccia.',
      body: [
        'Il logo è fatto di due tessere appoggiate l\'una all\'altra. Le emote sono partite da lì: la stessa tessera, lo stesso contorno, una faccia diversa per ogni stato d\'animo.',
        'Le prime bozze sono andate avanti e indietro con una persona che disegna, che le ha corrette una per una: meno lacrime, occhi più tondi, nuvole che sembrano nuvole. La papera è rimasta una papera.',
      ],
    },
  },
];
