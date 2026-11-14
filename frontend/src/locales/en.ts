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
    title: "Reactions"
  }
};

export type Translations = typeof en;