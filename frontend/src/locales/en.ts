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
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    visualHelpers: "Visual helpers",
    highlightCrosshairs: "Highlight crosshairs & box",
    highlightSame: "Highlight same numbers",
    showErrors: "Show error clashes (red)",
    godMode: "God mode: mark wrong numbers (red)",
    notesMode: "Notes",
    startNewGame: "Start new game",
    copied: "Copied",
    copyLink: "Copy link",
    room: "Room",
    roomFull: "This room is full.",
    invalidRoom: "This link does not lead to a game. Start a new one from the home page.",
    serverFull: "The server has too many games running right now. Try again in a few minutes.",
    tooFast: "Too many games were started in a short time. Wait a moment and try again.",
    backHome: "Back to the home page"
  },
  loader: {
    waking: "The server is waking up",
    wakingDetails: "To keep this game free and ad-free, it runs on a free hosting plan. The server goes to sleep after 15 minutes without visitors and takes about a minute to start again. Thanks for waiting!",
    failed: "We can't reach the server",
    failedDetails: "It is taking longer than usual. We keep trying in the background.",
    retry: "Try again",
    ready: "The server is ready!",
    join: "Join the game"
  },
  emotes: {
    title: "Reactions"
  },
  minigames: {
    pick: "Pick a game",
    garden: {
      name: "Garden",
      water: "Water",
      plantSeed: "Plant a new seed",
      flowers: "Flowers grown",
      seed: "A tiny seed. Give it some water.",
      sprout: "Something is sprouting!",
      leaves: "Look at those leaves.",
      bloom: "It bloomed! Take a moment to enjoy it."
    },
    blob: {
      name: "Blob",
      poke: "Poke the blob",
      idle: "The blob is waiting. Poke it or send it a reaction!",
      happy: "The blob is delighted!",
      surprised: "Whoa!",
      sad: "The blob is a bit sad.",
      thinking: "The blob is thinking about it..."
    }
  }
};

export type Translations = typeof en;