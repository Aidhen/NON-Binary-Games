export const en = {
  sudoku: {
    title: "(NON) Binary Games",
    subtitle: "Sudoku Engine",
    loading: "Loading engine...",
    cleared: "Puzzle cleared!",
    compliment: "Excellent logical skills.",
    playAgain: "Play again",
    mode: "Mode",
    settings: "Settings",
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
    cleared: "Field cleared!",
    compliment: "Every safe cell is open, and nobody had to guess.",
    lost: "A mine!",
    lostHint: "You chose to lose when a mine is opened. Try again?",
    rules: "How it works",
    ruleNumbers: "A number says how many mines touch that cell, the ones across the corners too.",
    ruleSafe: "Open every cell that is not a mine. The first one is always safe, and you never have to guess.",
    ruleFlags: "Put a flag where you know there is a mine: switch the flag mode on, then tap.",
    ruleMineMarks: "If you open a mine, it is only marked for everybody and the game goes on.",
    ruleMineLoses: "If you open a mine, the game is lost for everybody.",
    flagMode: "Flags",
    explosive: "Lose when a mine is opened",
    explosiveLocked: "It can change before the first cell is opened, or with a new game.",
    cell: "Row {row}, column {column}: {state}",
    closed: "closed",
    flagged: "flag",
    mine: "mine",
    empty: "no mines around"
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
      panda: { name: "Panda", gender: "m" },
      fox: { name: "Fox", gender: "m" },
      otter: { name: "Otter", gender: "m" },
      owl: { name: "Owl", gender: "m" },
      frog: { name: "Frog", gender: "m" },
      koala: { name: "Koala", gender: "m" },
      hedgehog: { name: "Hedgehog", gender: "m" },
      penguin: { name: "Penguin", gender: "m" },
      rabbit: { name: "Rabbit", gender: "m" },
      turtle: { name: "Turtle", gender: "m" },
      octopus: { name: "Octopus", gender: "m" },
      dolphin: { name: "Dolphin", gender: "m" }
    }
  },
  lobby: {
    yourRoom: "Your room",
    invite: "Send the link to whoever you want at the table.",
    title: "Pick a box",
    hint: "Everybody picks one. A box opens when more than half of the room wants it.",
    games: "Games",
    open: "Open the box",
    takeBack: "Take my vote back",
    progress: "{count} of {total} want {game}",
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
  emotes: {
    title: "Reactions",
    more: "More reactions"
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
    github: "GitHub",
    social: "Instagram, X and TikTok: coming soon"
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
    emotesText: "Quick reactions that float over the table, to say something without typing.",
    gamesTitle: "The games on the table",
    gamesHint: "Pick a game to see what it looks like and how to play."
  },
  gamesPage: {
    preview: "Preview",
    howToPlay: "How to play",
    soonText: "More games on the way",
    noTimer: "No timer",
    levels: "5 levels",
    sizes: "From 6×6 to 12×12",
    sudoku: {
      tagline: "The classic, in company",
      description: "Fill the grid together: every row, column and box holds the numbers from 1 to 9 once.",
      rule1: "Every row, every column and every 3×3 box holds the numbers from 1 to 9, with no repeats.",
      rule2: "Five difficulty levels, all solvable by logic alone: you never have to guess.",
      rule3: "Notes are shared, and colored after whoever wrote them.",
      rule4: "When you are ready, the whole room can start a new game.",
      fact: "Shared notes"
    },
    takuzu: {
      tagline: "Zeros and ones in balance",
      description: "A grid to fill with 0s and 1s, following three simple rules.",
      rule5: "Five levels, from 6×6 to 12×12, always solvable without guessing."
    },
    flowerField: {
      tagline: "A meadow to explore together",
      description: "Open every cell that does not hide a mine, using the numbers to work out where the mines are.",
      fact1: "Flags in your color",
      fact2: "First cell always safe"
    },
    wordSearch: {
      tagline: "Hidden words, found together",
      description: "Find the words hidden in the grid. Every word you find is marked in your color.",
      rule3: "Five levels, from 6×6 to 12×12, with more directions as they grow.",
      rule4: "Words in English or Italian: the room can switch between the two.",
      fact: "English and Italian"
    }
  },
  rooms: {
    title: "Rooms",
    lead: "Today every room is private and shared with a link. Public rooms are in the works.",
    todayTitle: "How they work today",
    privateTitle: "Private, always",
    privateText: "A room exists only for those who have the link. Its code is not shown in the page.",
    noAccountTitle: "No account",
    noAccountText: "You get a made-up name, like Red Panda, and a color of your own.",
    togetherTitle: "Decided together",
    togetherText: "Boxes are voted: a game opens when more than half of the room wants it.",
    wip: "Work in progress",
    publicTitle: "Public rooms",
    publicText: "The idea: open tables to sit at without an invitation, for when you feel like playing and nobody is a link away. There is no date yet: stable rooms and smoother reconnections come first.",
    publicAsk: "Would you like them? Any doubts about safety or moderation?",
    publicAskLink: "Tell me in the feedback"
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
    about3: "From there came the idea: simple games, side by side, where connection counts and competition does not."
  },
  feedback: {
    title: "Feedback",
    lead: "The site is in alpha: tell me what does not work, what is missing or what you liked.",
    wip: "Work in progress",
    wipText: "This form is not active yet: it cannot be filled in or sent. It will open soon.",
    kind: "What is it about?",
    kindBug: "Something is wrong",
    kindIdea: "I have an idea",
    kindOther: "Something else",
    about: "It concerns",
    aboutAll: "The whole site",
    aboutRooms: "Rooms and invitations",
    headline: "In one line",
    headlinePlaceholder: "E.g. Notes disappear when I come back",
    details: "Tell me more",
    detailsPlaceholder: "What you were doing, what you expected and what happened.",
    contact: "A contact, if you want an answer",
    optional: "optional",
    contactPlaceholder: "name@example.com",
    send: "Send feedback",
    afterTitle: "What will happen next",
    after1Title: "It reaches the developer",
    after1Text: "The message becomes a private report: it is not public.",
    after2Title: "It gets read",
    after2Text: "Every report is read. There is not always a direct answer.",
    after3Title: "It ends up in the diary",
    after3Text: "If it becomes a change, you find it among the news."
  }
};

export type Translations = typeof en;