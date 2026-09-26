import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Client, { Socket as ClientSocket } from 'socket.io-client';
import { setupSocketHandlers, rooms } from './event';
import type { ClientToServerEvents, ServerToClientEvents } from '@nbg/shared';

describe('Socket Events Security & Bounds Checking', () => {
  let io: Server<ClientToServerEvents, ServerToClientEvents>;
  let clientSocket: ClientSocket<ServerToClientEvents, ClientToServerEvents>;
  let serverSocket: any;
  
  const port = 4001;
  const testRoomId = 'security-test-room';

  beforeAll(() => {
    return new Promise<void>((resolve) => {
      const httpServer = createServer();
      io = new Server(httpServer);
      setupSocketHandlers(io);
      
      httpServer.listen(port, () => {
        clientSocket = Client(`http://localhost:${port}`);
        
        io.on('connection', (socket) => {
          serverSocket = socket;
        });

        clientSocket.on('connect', resolve);
      });
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.disconnect();
  });

  beforeEach(() => {
    rooms.clear();
  });

  it('should initialize room state on join-room', async () => {
    return new Promise<void>((resolve) => {
      clientSocket.emit('join-room', testRoomId, 'easy');
      
      clientSocket.on('game-started', (payload) => {
        expect(rooms.has(testRoomId)).toBe(true);
        expect(payload.board).toBeDefined();
        expect(payload.notesGrid).toEqual({});
        resolve();
      });
    });
  });

  describe('toggle-note malicious inputs', () => {
    beforeEach(async () => {
      clientSocket.emit('join-room', testRoomId, 'easy');
      await new Promise(r => setTimeout(r, 50));
    });

    it('should reject out-of-bounds negative coordinates', async () => {
      clientSocket.emit('toggle-note', testRoomId, { r: -1, c: 5, v: 3 });
      await new Promise(r => setTimeout(r, 50));
      
      const room = rooms.get(testRoomId);
      expect(room?.notesGrid['-1-5']).toBeUndefined();
    });

    it('should reject out-of-bounds positive coordinates (>= boardSize)', async () => {
      const room = rooms.get(testRoomId)!;
      const size = room.board.size;
      
      clientSocket.emit('toggle-note', testRoomId, { r: size, c: 0, v: 3 });
      await new Promise(r => setTimeout(r, 50));
      
      expect(room.notesGrid[`${size}-0`]).toBeUndefined();
    });

    it('should reject invalid values (v < 1 or v > boardSize)', async () => {
      const room = rooms.get(testRoomId)!;
      const size = room.board.size;

      clientSocket.emit('toggle-note', testRoomId, { r: 0, c: 0, v: 0 });
      clientSocket.emit('toggle-note', testRoomId, { r: 0, c: 0, v: size + 1 });
      
      await new Promise(r => setTimeout(r, 50));
      expect(room.notesGrid['0-0']).toBeUndefined();
    });

    it('should reject non-integer payload injection', async () => {
      const room = rooms.get(testRoomId)!;
      
      clientSocket.emit('toggle-note', testRoomId, { r: 1.5, c: 2, v: 3 } as any);
      clientSocket.emit('toggle-note', testRoomId, { r: 1, c: 2, v: "3" } as any);
      
      await new Promise(r => setTimeout(r, 50));
      
      expect(room.notesGrid['1.5-2']).toBeUndefined();
      expect(room.notesGrid['1-2']).toBeUndefined();
    });

    it('should accept valid notes and handle O(1) state mutation correctly', async () => {
      const room = rooms.get(testRoomId)!;
      
      clientSocket.emit('toggle-note', testRoomId, { r: 2, c: 3, v: 5 });
      await new Promise(r => setTimeout(r, 50));

      expect(room.notesGrid['2-3']).toBeDefined();
      expect(room.notesGrid['2-3'][5]).toBe(clientSocket.id);

      clientSocket.emit('toggle-note', testRoomId, { r: 2, c: 3, v: 5 });
      await new Promise(r => setTimeout(r, 50));

      expect(room.notesGrid['2-3']).toBeUndefined();
    });
  });
});