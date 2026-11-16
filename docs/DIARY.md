# Diary content guide

How to add and maintain the entries of the **Diary** page. Written for whoever updates the page, a person or an agent.

## Where things are

- Entries: `frontend/src/locales/diary.ts`. This is the only file to edit to add, change or remove one.
- The fixed "Who is behind it" box: the `diary.about1` to `diary.about3` strings in `frontend/src/locales/en.ts` and `it.ts`. It is edited by hand and is not part of the release routine.
- The page: `frontend/src/app/diary/page.tsx`. It sorts the entries by date (newest first), filters them by type and shows them closed. It needs no change to publish an entry.

## An entry

```ts
{
  id: 'word-search',
  type: 'released',            // 'upcoming' | 'released' | 'behind-the-scenes'
  date: '2026-11-15',          // ISO date
  version: '0.5.0-alpha',      // only for 'released'
  en: {
    title: 'Word Search, the fourth game',
    summary: 'Hidden words to find together.',
    body: ['First paragraph.', 'Second paragraph.'],
  },
  it: {
    title: 'Crucipuzzle, il quarto gioco',
    summary: 'Parole nascoste da trovare insieme.',
    body: ['Primo paragrafo.', 'Secondo paragrafo.'],
  },
}
```

| Field     | Required            | Notes                                                                 |
|-----------|---------------------|-----------------------------------------------------------------------|
| `id`      | yes                 | Lowercase words and hyphens, in English, never reused                 |
| `type`    | yes                 | Decides the label and the filter: Coming, Released, Behind the scenes |
| `date`    | yes                 | Sort key. For `upcoming`, the day the entry was written               |
| `version` | only for `released` | The version in `frontend/package.json` when the change shipped        |
| `title`   | yes                 | About 50 characters at most. Shown on the closed entry                |
| `summary` | yes                 | One line, about 80 characters at most. Shown on the closed entry      |
| `body`    | yes                 | One string per paragraph. Plain text: no Markdown, no HTML            |

Both languages are always filled in. Italian is written first; English is a faithful translation, not a rewrite.

## Writing rules

- **Length:** one or two short paragraphs for `upcoming` and `released`. A `behind-the-scenes` entry can have up to four.
- **Voice:** first person singular, warm and plain. No marketing words.
- **Audience:** players, not developers. Say what changes for them. No file names, PR numbers or library names.
- **Gender-neutral** language for players and for the people who work on the project.
- **Never promise:** no dates for upcoming work. If something has no date, do not mention one.
- **Nothing personal** about players, and nothing about a security problem that is not fixed yet.

## When to write what

| Event                                     | Action                                                                                                  |
|-------------------------------------------|---------------------------------------------------------------------------------------------------------|
| A feature is planned and worth announcing | Add an `upcoming` entry                                                                                 |
| An announced feature ships                | Change that entry: `type: 'released'`, the new `date`, add `version`, rewrite the text in the past tense. Do not add a second entry |
| An unannounced feature ships              | Add a `released` entry                                                                                  |
| A release with fixes only                 | One `released` entry for the whole release                                                              |
| A story, a decision, a lesson learned     | Add a `behind-the-scenes` entry                                                                         |
| An announced feature is dropped           | Remove the entry                                                                                        |

Keep at most **five `upcoming` entries** at a time, so that the page stays honest and short. A test fails beyond that.

## Checklist after a release

1. Read the merged PRs since the last `released` entry.
2. For each change players can see, update the matching `upcoming` entry or add a `released` one.
3. Skip internal work (refactors, tests, CI, dependencies) unless players notice the difference.
4. Fill in `it` first, then `en`.
5. Check that `version` is the released one.
6. Leave the "Who is behind it" strings and the existing `behind-the-scenes` entries as they are.
7. The tests next to the page (`frontend/src/app/diary/page.test.tsx`) check that every entry is complete: `npx vitest run frontend/src/app/diary`.
