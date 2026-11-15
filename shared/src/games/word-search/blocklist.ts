import type { WordLanguage } from './types';

/** ROT13: the words are kept scrambled so that nobody has to read them in the code, and are not found by searching it. It hides nothing from whoever decodes them on purpose. */
const decode = (scrambled: string): string[] => scrambled.replace(/[A-Z]/g, letter => String.fromCodePoint(((letter.codePointAt(0) ?? 65) - 65 + 13) % 26 + 65)).split(' ');

/**
 * Words the random filler letters must never spell, in any of the 8 directions: slurs, insults, sexual and violent
 * words. They are matched against the whole grid, whatever the language of the puzzle (see the generator), and
 * nobody sees this list: it only keeps the grid calm. 4 letters or more, so that short strings do not turn up by
 * chance all the time. One entry per language, as in `WORD_LANGUAGES`. To add a word, scramble it with ROT13 (`echo WORD | tr 'A-Za-z' 'N-ZA-Mn-za-m'`).
 */
export const BLOCKLIST: Record<WordLanguage, readonly string[]> = {
  en: [
    // slurs and insults
    ...decode('AVTTRE AVTTREF AVTTN AVTTNF SNTTBG SNTTBGF SNTF QLXR GENAAL GENAAVR FURZNYR YRFOB CRQB CNRQB ERGNEQ FCNM PEVCCYR FCVP PUVAX XVXR TBBX PBBA CNXV TLCFL UBZB ONFGNEQ'),
    ...decode('OVGPU JUBER FYHG FYHGF GJNG PHAG PHAGF CEVPX JNAXRE JNAX QBHPUR'),
    // sexual and crude
    ...decode('SHPX SHPXF SHPXRE FUVG FUVGF CVFF QVPX QVPXF PBPX PBPXF CHFFL CRAVF INTVAN NAHF GVGF CBEA CBEAB FRKL ENCR ENCVFG PHZF'),
    ...decode('OBBO OBBOF NFFUBYR QVYQB FCREZ FRZRA BETNFZ UBEAL'),
    // violence and hate
    ...decode('XVYY XVYYF ZHEQRE ANMV ANMVF UVGYRE UNGR'),
    // fascism
    ...decode('SNFPVFG SNFPVFGF SNFPVFZ ZHFFBYVAV FJNFGVXN'),
  ],
  it: [
    // slurs and insults
    ...decode('SEBPVB SEBPV PURPPN EVPPUVBAR ARTEB ARTEV MVATNEB GREEBAR ZBATBYB FCNFGVPB ONFGNEQB FGEBAMB FGEBAMN PBTYVBAR PBTYVBAV ARTEN EVGNEQNGB MVATNEV PURPPUR SEBPVN SEBPVBAR PHYNGGBAR FGEBAMR CRQBSVYB'),
    ...decode('CHGGNAN CHGGNAR GEBVN MBPPBYN ZVTABGGN'),
    // sexual and crude
    ...decode('PNMMB PNMMV ZREQN PHYB PHYV SVPN SVTN ZVAPUVN CVFRYYB FOBEEN OBPPUVAB FPBCNER INSSNAPHYB SBGGRER VAPHYNER CBEAB FGHCEB FRFFB GRGGN GRGGR FPBCNGN FRTN CVCCN PHYBAR'),
    // violence and hate
    ...decode('HPPVQV NZZNMMN ANMVFGN ANMVFGV UVGYRE'),
    // fascism
    ...decode('SNFPVFGN SNFPVFGV SNFPVFZB SNFPVB QHPR ZHFFBYVAV FINFGVPN'),
  ],
};
