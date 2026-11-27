export const en = {
  sudoku: {
    cell: "Row {row}, column {column}: {value}",
    cellGiven: "Row {row}, column {column}: {value}, given",
    cellEmpty: "Row {row}, column {column}: empty",
    keyHint: "With the keyboard: the arrows to move, the numbers to write, N for notes, Delete to clear.",
    title: "(NON) Binary Games",
    subtitle: "Sudoku Engine",
    loading: "Setting up the board…",
    cleared: "Puzzle cleared!",
    compliment: "Excellent logical skills.",
    playAgain: "Play again",
    mode: "Mode",
    settings: "Settings",
    rules: "How it works",
    ruleNumbers: "Every row, every column and every 3×3 box holds the numbers from 1 to 9, with no repeats.",
    ruleNotes: "Notes are shared, and colored after whoever wrote them.",
    tapHint: "Tap a cell, then a number. With notes on, the number becomes a note.",
    closeSettings: "Close settings",
    newGame: "New game",
    beginner: "Beginner",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    expert: "Expert",
    visualHelpers: "Visual helpers",
    highlightCrosshairs: "Highlight crosshairs & box",
    highlightSame: "Highlight same numbers",
    showErrors: "Show error clashes (red)",
    godMode: "God mode: mark wrong numbers (red)",
    notesMode: "Notes",
    copied: "Copied",
    copyLink: "Copy link",
    room: "Room",
    roomFull: "This room is full.",
    invalidRoom: "This link does not lead to a game. Start a new one from the home page.",
    serverFull: "The server has too many games running right now. Try again in a few minutes.",
    tooFast: "Too many games were started in a short time. Wait a moment and try again.",
    backHome: "Back to the home page"
  },
  flowerField: {
    keyHint: "With the keyboard: the arrows to move, Enter to open a cell, F to put or take a flag.",
    cleared: "All in bloom!",
    compliment: "Great work!",
    lost: "A bee!",
    lostHint: "You chose to lose when a bee is woken up. Try again?",
    rules: "How it works",
    ruleNumbers: "A number says how many bees touch that cell, the ones across the corners too.",
    ruleSafe: "Open every cell that has no bee. The first one is always safe, and you never have to guess.",
    ruleFlags: "Put a flag where you know a bee is sleeping: switch the flag mode on, then tap.",
    ruleMineMarks: "If you wake a bee, it is only marked for everybody and the game goes on.",
    ruleMineLoses: "If you wake a bee, the game is lost for everybody.",
    flagMode: "Flags",
    explosive: "Lose when a bee is woken up",
    bloom: "Flowers that grow at the end",
    bloomHint: "Off, the flowers show up still: lighter for slower phones.",
    explosiveLocked: "It can change before the first cell is opened, or with a new game.",
    cell: "Row {row}, column {column}: {state}",
    closed: "closed",
    flagged: "flag",
    mine: "bee",
    empty: "no bees around"
  },
  wordSearch: {
    cleared: "All the words are found!",
    compliment: "Every word was hiding somewhere, and you found them together.",
    rules: "How it works",
    ruleFind: "Find the words of the list in the grid. They run in a straight line, in any of the eight directions, even backwards.",
    ruleDrag: "Drag from the first letter to the last, or tap the first letter and then the last. Tap the first again to cancel.",
    ruleKeyboard: "With the keyboard: arrow keys to move, Enter or Space to mark the first and the last letter, Escape to cancel.",
    words: "Words to find",
    counter: "{found}/{total}",
    counterLabel: "{found} of {total} words found",
    hidden: "Hidden word: {n} letters",
    hiddenTitle: "Hidden word",
    revealed: "The hidden word was {word}",
    wordFound: "found",
    language: "Language of the words",
    languageHint: "This is the language of the words in the puzzle, not of the page. Changing it starts a new puzzle for everybody.",
    cell: "{letter}, row {row}, column {column}",
    cellStart: "{letter}, row {row}, column {column}, first letter selected",
    cellFound: "{letter}, row {row}, column {column}, part of a word found",
    cellHidden: "{letter}, row {row}, column {column}, part of the hidden word",
    grid: "Word search grid"
  },
  takuzu: {
    keyHint: "With the keyboard: the arrows to move, 0 and 1 to write, Delete to clear.",
    cleared: "Puzzle cleared!",
    compliment: "Every row and column is in balance.",
    rules: "How it works",
    ruleBalance: "Each row and column has as many 0s as 1s.",
    rulePairs: "No more than two equal numbers side by side.",
    ruleUnique: "No two rows are the same, and no two columns.",
    tapHint: "Tap a cell to go from empty to 0, to 1 and back to empty.",
    showErrors: "Show clashes (red)",
    cell: "Row {row}, column {column}: {value}",
    empty: "empty"
  },
  players: {
    title: "Players in this room",
    you: "you",
    chooseColor: "Choose your color",
    colorTaken: "Taken by {name}",
    highlight: "Show where {name} is playing",
    joined: "{name} joined the room",
    left: "{name} left the room",
    someone: "Someone",
    nameFormat: "{color} {animal}",
    colors: {
      red: { m: "Red", f: "Red" },
      orange: { m: "Orange", f: "Orange" },
      green: { m: "Green", f: "Green" },
      teal: { m: "Teal", f: "Teal" },
      blue: { m: "Blue", f: "Blue" },
      purple: { m: "Purple", f: "Purple" },
      pink: { m: "Pink", f: "Pink" }
    },
    animals: {
      fox: { name: "Fox", gender: "m" },
      owl: { name: "Owl", gender: "m" },
      koala: { name: "Koala", gender: "m" },
      hedgehog: { name: "Hedgehog", gender: "m" },
      penguin: { name: "Penguin", gender: "m" },
      octopus: { name: "Octopus", gender: "m" }
    }
  },
  roomIcons: {
    lemon: "lemon",
    cherries: "cherries",
    mushroom: "mushroom",
    moon: "moon",
    star: "star",
    leaf: "leaf",
    teacup: "teacup",
    house: "house",
    cloud: "cloud",
    umbrella: "umbrella",
    icecream: "ice cream",
    acorn: "acorn",
    sailboat: "sailboat",
    donut: "donut",
    balloon: "balloon",
    gem: "gem"
  },
  lobby: {
    yourRoom: "Your room",
    invite: "Send the link to whoever you want at the table.",
    title: "Pick a box",
    hint: "Everybody picks one. A box opens when more than half of the room wants it.",
    games: "Games",
    open: "Open {game}",
    takeBack: "Take my vote back",
    reconnecting: "Connection lost, reconnecting… Your place in the room is kept for a little while.",
    connectionLost: "The server cannot be reached.",
    retry: "Try again",
    boardFailed: "The board could not be made. Nothing changed: try again.",
    backToTable: "Back to the table",
    stayHere: "I'd rather stay",
    backAsk: "{names} would like to go back to the table",
    goBack: "Go back",
    keepPlaying: "Keep playing",
    backProgress: "{count} of {total} want to go back to the table",
    wants: "{names} wants {game}",
    wantsPlural: "{names} want {game}",
    and: "and",
    split: "Votes are split: a box opens when more than half of the room picks it.",
    votes: "{count} of {total} votes",
    players: "{min}–{max} players",
    playersExact: "{count} players",
    connecting: "Setting the table…",
    soon: "Soon",
    unknownGame: "This room is playing a game this page does not know yet. Reload the page to get the latest version."
  },
  games: {
    sudoku: {
      title: "Sudoku"
    },
    takuzu: {
      title: "Takuzu"
    },
    flowerField: {
      title: "Flower Field"
    },
    wordSearch: {
      title: "Word Search"
    },
    mystery: {
      title: "Mystery box"
    }
  },
  loader: {
    waking: "The server is waking up",
    wakingDetails: "To keep this game free and ad-free, it runs on a free hosting plan. The server goes to sleep after 15 minutes without visitors and takes about a minute to start again. Thanks for waiting!",
    failed: "We can't reach the server",
    failedDetails: "It is taking longer than usual. We keep trying in the background.",
    retry: "Try again"
  },
  settings: {
    label: "Theme and language",
    theme: "Theme",
    language: "Language"
  },
  themes: {
    system: "System",
    light: "Light",
    dark: "Dark",
    retro: "Retro",
    oled: "OLED",
    "non-binary": "Non-binary"
  },
  emotes: {
    title: "Reactions",
    more: "More reactions",
    names: {
      "💜": "Purple heart",
      "🔥": "Fire",
      "😂": "Laughing",
      "😤": "Huffing",
      "👏": "Clapping",
      "😎": "Cool",
      "🤔": "Thinking",
      "😢": "Sad",
      "😴": "Sleepy",
      "❤️": "Red heart",
      "🎉": "Party",
      "🦆": "Duck",
      "🫪": "Distorted face",
      "🙏": "Thank you",
      "😓": "Phew",
      "😶‍🌫️": "Head in the clouds",
      "🤯": "Mind blown",
      "🫰": "Finger heart"
    }
  },
  nav: {
    label: "Main",
    home: "(non)BinaryGames, home",
    rooms: "Rooms",
    diary: "Diary",
    feedback: "Feedback"
  },
  footer: {
    tagline: "A queer-owned project, made to play together.",
    privacy: "Privacy",
    github: "GitHub"
  },
  home: {
    titleStart: "Take a break: play on your own or",
    titleAccent: "together",
    lead: "Unwind or put your logic to the test, on your own or working together with others. And remember: what counts is being together, not winning.",
    create: "Create a room",
    gotLink: "Did someone send you a link? Open it and you are already at the table.",
    howTitle: "How it works",
    step1Title: "Create a room",
    step1Text: "One click and you are at the table. No account, nothing to install.",
    step2Title: "Send the link",
    step2Text: "Copy the address of the room and send it to whoever you want: who opens it sits with you.",
    step3Title: "Pick the box",
    step3Text: "Every game is a box. It opens when more than half of the room wants it.",
    emotesTitle: "Say it with a face",
    emotesText: "Quick reactions that float over the table, to say something without typing. Tap one to try it.",
    gamesTitle: "The games on the table",
    gamesHint: "Pick a game to see what it looks like and how to play."
  },
  gamesPage: {
    preview: "Preview",
    howToPlay: "How to play",
    soonText: "More games on the way",
    sudoku: {
      tagline: "The classic, in company",
      description: "Fill the grid together: every row, column and box holds the numbers from 1 to 9 once.",
      rule2: "Five difficulty levels, all solvable by logic alone: you never have to guess.",
      rule4: "When you are ready, the whole room can start a new game."
    },
    takuzu: {
      tagline: "Zeros and ones in balance",
      description: "A grid to fill with 0s and 1s, following three simple rules.",
      rule5: "Five levels, from 6×6 to 12×12, always solvable without guessing."
    },
    flowerField: {
      tagline: "A meadow to explore together",
      description: "Open every cell that does not hide a bee, using the numbers to work out where the sleeping bees are."
    },
    wordSearch: {
      tagline: "Hidden words, found together",
      description: "Find the words hidden in the grid. Every word you find is marked in your color.",
      rule3: "Five levels, from 6×6 to 12×12, with more directions as they grow.",
      rule4: "Words in English or Italian: the room can switch between the two."
    }
  },
  rooms: {
    title: "Rooms",
    lead: "Today every room is private and shared with a link. Public rooms are in the works.",
    todayTitle: "How they work today",
    privateTitle: "Private, always",
    privateText: "A room exists only for those who have the link. Its code is not shown in the page.",
    noAccountTitle: "No account",
    noAccountText: "You get a made-up name, like Red Fox, and a color of your own.",
    togetherTitle: "Decided together",
    togetherText: "Boxes are voted: a game opens when more than half of the room wants it.",
    wip: "Work in progress",
    publicTitle: "Public rooms",
    publicText: "The idea: open tables to sit at without an invitation, for when you feel like playing and nobody is a link away. There is no date yet: stable rooms and smoother reconnections come first.",
    publicAsk: "Would you like them? Any doubts about safety or moderation?",
    publicAskLink: "Tell me in the feedback"
  },
  privacy: {
    title: "Privacy",
    lead: "What the site keeps, where and for how long. In short: very little.",
    browserTitle: "In your browser",
    browserText: "The site saves up to three things in your browser's localStorage: an anonymous code, made up at random, that lets you keep your name and color when you come back to a room, the theme you picked, and whether the flowers of the Flower Field grow at the end. No cookies, no statistics, no ads, no scripts from other sites: even the fonts come from the site itself. You can delete everything at any time from your browser settings.",
    serverTitle: "On the server",
    serverText: "Rooms live only in the memory of the server: the board, the moves, the notes, the animal names and the colors. An empty room disappears after ten minutes, and all of them disappear when the server restarts. Your IP address is only used to count open connections, to keep away whoever wants to overload the game: it stays in memory and does not end up in the logs of the game.",
    hostingTitle: "Who hosts the site",
    hostingText: "The site is hosted by Vercel, the server by Render, and the answers of the feedback form are kept on GitHub. To know how they handle data, read their privacy policies:",
    feedbackTitle: "The feedback form",
    feedbackText: "The form only sends the answers you choose from the lists: no free text, no contact, nothing about you. They are stored as issues in a private GitHub repository that only the developer can open, and they stay there to help improve the game: they say nothing about who sent them. Your IP address is used only in the memory of the server to limit how many reports can be sent, and it is never stored, written to the logs or sent to GitHub.",
    updated: "Last updated: 26 November 2026"
  },
  diary: {
    title: "Diary",
    lead: "What is coming, what just came out, and a few pages from behind the scenes.",
    filter: "Show",
    all: "Everything",
    upcoming: "Coming",
    released: "Released",
    behindTheScenes: "Behind the scenes",
    aboutTitle: "Who is behind it",
    about1: "Hi, I'm Aidhen.",
    about2: "(non)BinaryGames was born while looking for a light way to spend time with someone far away. We do not always have the energy for something demanding: a sudoku solved together was enough.",
    about3: "From there came the idea: simple games to play together, even from far away, where connection counts and competition does not."
  },
  feedback: {
    title: "Feedback",
    lead: "The site is in alpha: tell me what does not work, what is missing or what you think. A few taps, nothing to write.",
    kind: "What is it about?",
    kindBug: "Something is wrong",
    kindOpinion: "Tell me what you think",
    where: "Where?",
    wherePlaceholder: "Choose a place",
    what: "What happened?",
    device: "On which device?",
    frequency: "How often?",
    rating: "How do you like it?",
    wishes: "What would you like to see? Choose as many as you want.",
    emote: "An emote to go with it",
    optional: "optional",
    send: "Send feedback",
    sending: "Sending...",
    waking: "The server is waking up",
    wakingDetails: "It runs on a free hosting plan and takes about a minute to wake up. Keep this page open: your answers are sent as soon as it is ready.",
    sentTitle: "Thank you!",
    sentText: "Your answers have arrived and will be read. There is no private reply: you will not be written back.",
    sendAnother: "Send another",
    tooMany: "You have sent a few reports already. Please try again in a few minutes.",
    dayFull: "There have been many reports today and the form has stopped. Please try again tomorrow.",
    unavailable: "The feedback could not be sent right now. Your answers are still here: try again in a moment.",
    diaryNote: "Some requests may be built or answered in the Diary, among the news. There is no private reply: the form does not keep any contact.",
    afterTitle: "What will happen next",
    after1Title: "It lands in a private place",
    after1Text: "Your answers become a note in a private tracker that only the developer can open. They hold only the choices you made.",
    after2Title: "It gets read",
    after2Text: "Every report is read. There is no private reply.",
    after3Title: "It may end up in the Diary",
    after3Text: "If it becomes a change, or gets an answer, you find it among the news.",
    options: {
      where: {
        "sudoku": "Sudoku",
        "takuzu": "Takuzu",
        "flower-field": "Flower Field",
        "word-search": "Word Search",
        "table": "The table, where a game is chosen",
        "room-and-invite": "Rooms and invitations",
        "rest-of-site": "The rest of the site",
        "whole-site": "The whole site"
      },
      what: {
        "not-loading": "It does not load",
        "moves-not-shared": "Moves do not reach the others",
        "connection-drops": "The connection drops",
        "looks-wrong": "It looks wrong",
        "controls-not-responding": "The controls do not respond",
        "rules-or-win-wrong": "The rules or the win are wrong",
        "text-or-translation": "A text or a translation",
        "other": "Something else"
      },
      device: {
        "phone": "Phone",
        "tablet": "Tablet",
        "computer": "Computer"
      },
      frequency: {
        "once": "Once",
        "sometimes": "Sometimes",
        "always": "Every time"
      },
      rating: {
        "1": "I don't like it",
        "2": "So-so",
        "3": "I like it",
        "4": "I love it"
      },
      wish: {
        "more-games": "More games",
        "more-levels": "More levels",
        "more-languages": "More languages",
        "themes-and-colors": "Themes and colors",
        "public-rooms": "Public rooms",
        "fine-as-is": "Fine as it is"
      }
    }
  }
};

export type Translations = typeof en;