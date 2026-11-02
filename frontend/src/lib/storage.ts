// localStorage can throw or be empty (private mode, blocked site data): the app must work without it.
export const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Nothing to do: the value is only a per-browser convenience.
  }
};
