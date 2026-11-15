import { describe, expect, it } from 'vitest';
import * as shared from '../../index';

// The page downloads this package: the words the filler must never spell stay on the server (see `wordSearchBlocklist.ts` in the backend).
describe('@nbg/shared', () => {
  it('does not carry the list of forbidden words', () => {
    expect(Object.keys(shared).filter(name => /blocklist|forbidden/i.test(name))).toEqual([]);
  });
});
