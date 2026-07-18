import { describe, it, expect } from 'vitest';
import { generateSudoku, countSolutions } from './generator';
import { isValid } from './validator';

describe('Sudoku Generator Engine', () => {
    it('should generate a grid with the exact specified dimensions', () => {
        const board = generateSudoku('easy', 9);
        
        expect(board.size).toBe(9);
        expect(board.boxSize).toBe(3);
        expect(board.solution.length).toBe(9);
        expect(board.solution[0].length).toBe(9);
    });

    it('should generate a mathematically valid solution with no empty cells', () => {
        const { solution, size, boxSize } = generateSudoku('medium', 9);


        const hasZeros = solution.some(row => row.includes(0));
        expect(hasZeros).toBe(false);


        let isBoardValid = true;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const value = solution[r][c];
                
                
                solution[r][c] = 0; 
                if (!isValid(solution, r, c, value, size, boxSize)) {
                    isBoardValid = false;
                }
                solution[r][c] = value; 
            }
        }
        expect(isBoardValid).toBe(true);
    });

    it('should punch holes based on difficulty level (easy = 50% clues)', () => {
        const { initial, size } = generateSudoku('easy', 9);
        const targetClues = Math.floor(size * size * 0.5); 

        const actualClues = initial.reduce((acc, row) => 
            acc + row.filter(cell => cell !== 0).length, 0
        );

        expect(actualClues).toBe(targetClues);
    });

    it('should guarantee exactly one mathematically valid solution for the initial grid', () => {   
        const { initial, size, boxSize } = generateSudoku('hard', 9);
        
        const gridCopy = initial.map(row => [...row]);
        const solutions = countSolutions(gridCopy, size, boxSize);

        expect(solutions).toBe(1);
    });
});