import { z } from 'zod';
import { DIFFICULTIES } from './games/sudoku/types';

/**
 * Runtime schemas for every payload a client can send to the server.
 *
 * TypeScript types are erased at runtime, so the server cannot trust them:
 * anything coming from a socket is `unknown` until it has been parsed here.
 * The TypeScript payload types are derived from these schemas, so the
 * validation and the contract can never drift apart.
 */

export const difficultySchema = z.enum(DIFFICULTIES);

export const MAX_ROOM_ID_LENGTH = 64;

/** Room ids appear in URLs (/play/[roomId]), so keep them URL-safe and bounded. */
export const roomIdSchema = z
    .string()
    .max(MAX_ROOM_ID_LENGTH)
    .regex(/^[A-Za-z0-9_-]+$/);

const coordinateSchema = z.number().int().nonnegative();

/** Upper bounds depend on the board size, so they are checked by the server. */
export const cellUpdatePayloadSchema = z.object({
    r: coordinateSchema,
    c: coordinateSchema,
    v: z.number().int().nonnegative(),
});

export const toggleNotePayloadSchema = z.object({
    r: coordinateSchema,
    c: coordinateSchema,
    v: z.number().int().positive(),
});

/** `null` means "deselect"; row and column must be both set or both null. */
export const selectCellPayloadSchema = z
    .object({
        r: coordinateSchema.nullable(),
        c: coordinateSchema.nullable(),
    })
    .refine(({ r, c }) => (r === null) === (c === null));

export type CellUpdatePayload = z.infer<typeof cellUpdatePayloadSchema>;
export type ToggleNotePayload = z.infer<typeof toggleNotePayloadSchema>;
export type SelectCellPayload = z.infer<typeof selectCellPayloadSchema>;

/**
 * Argument lists of the client-to-server events, as tuples.
 * Socket.IO passes the arguments positionally, so each event is validated
 * as a whole argument list (extra or missing arguments are rejected).
 */
export const joinRoomArgsSchema = z.tuple([roomIdSchema, difficultySchema]);
export const cellUpdateArgsSchema = z.tuple([cellUpdatePayloadSchema]);
export const toggleNoteArgsSchema = z.tuple([toggleNotePayloadSchema]);
export const selectCellArgsSchema = z.tuple([selectCellPayloadSchema]);
export const restartGameArgsSchema = z.tuple([difficultySchema]);
