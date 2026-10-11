import { beforeEach, describe, expect, it, vi } from 'vitest';

const { ioMock } = vi.hoisted(() => ({
  ioMock: vi.fn(),
}));

vi.mock('socket.io-client', () => ({
  io: ioMock,
}));

describe('getSocket', () => {
  beforeEach(() => {
    vi.resetModules();
    ioMock.mockReset();
  });

  it('creates the socket with the expected configuration', async () => {
    const socketInstance = { id: 'test-socket' };
    ioMock.mockReturnValue(socketInstance);

    const { getSocket } = await import('./socket');
    const socket = getSocket();

    expect(ioMock).toHaveBeenCalledOnce();
    expect(ioMock).toHaveBeenCalledWith('http://localhost:4000', {
      autoConnect: false,
      reconnectionAttempts: 5,
    });
    expect(socket).toBe(socketInstance);
  });

  it('returns the same socket instance on repeated calls', async () => {
    const socketInstance = { id: 'test-socket' };
    ioMock.mockReturnValue(socketInstance);

    const { getSocket } = await import('./socket');

    const firstSocket = getSocket();
    const secondSocket = getSocket();

    expect(firstSocket).toBe(secondSocket);
    expect(ioMock).toHaveBeenCalledOnce();
  });
});