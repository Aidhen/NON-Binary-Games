import type { IncomingHttpHeaders } from "node:http";
import { createKeyedRateLimiter } from "./rateLimiter";
import type { GameServer, GameSocket } from "./event";

/**
 * Largest message the server accepts. The biggest one a client sends (a room id of 64 characters) is
 * about a hundred bytes: this is only room for the framing. Without a limit a client sends megabytes.
 */
export const MAX_MESSAGE_BYTES = 4096;

/**
 * Limits on connections. They exist because every other limit counts events per connection: a client that
 * opens many connections would get a full allowance on each one.
 * Per address the numbers are generous: a family or a café shares one address.
 */
export const connectionLimit = {
  /** Connections open at the same time on the whole server. */
  maxTotal: 300,
  /** Connections open at the same time from one address. */
  maxPerAddress: 20,
  /** New connections from one address (a page load is one, a dropped connection that comes back is another). */
  newPerAddress: { max: 30, windowMs: 60 * 1000 },
};

/** Where a connection comes from, or undefined when it is not known. */
export type AddressOf = (socket: GameSocket) => string | undefined;

const MAX_ADDRESS_LENGTH = 64;

/**
 * Behind a proxy the address of the connection is the proxy's. The proxy adds the real one to a header,
 * as the last entry of the list: the entries before it were written by the client and cannot be trusted.
 */
const lastEntry = (value: IncomingHttpHeaders[string]): string | undefined => {
  const entry = (Array.isArray(value) ? value.at(-1) : value)?.split(",").at(-1)?.trim();
  return entry && entry.length <= MAX_ADDRESS_LENGTH ? entry : undefined;
};

/**
 * How to find the address of a connection, from the environment:
 * - `CLIENT_IP_HEADER`: name of the header the hosting platform puts it in (production).
 * - `LIMIT_BY_PEER_ADDRESS=true`: the address of the connection itself (local development, or no proxy).
 * With neither, the limits per address are off: with every client behind the same proxy address they
 * would count everybody as one.
 */
export const addressResolverFromEnv = (env: NodeJS.ProcessEnv = process.env): AddressOf | undefined => {
  const header = env.CLIENT_IP_HEADER?.trim().toLowerCase();
  if (header) return (socket) => lastEntry(socket.handshake.headers[header]);
  if (env.LIMIT_BY_PEER_ADDRESS === "true") return (socket) => socket.handshake.address;
  return undefined;
};

/**
 * Refuses connections over the limits above. Addresses are only counted in memory while the connection
 * is open (and for the length of one window): they are never written to a log or stored.
 * The address is also left in `socket.data.address`, so that the budgets of rooms and restarts follow it.
 */
export const applyConnectionLimits = (io: GameServer, addressOf?: AddressOf) => {
  const allowNew = createKeyedRateLimiter(connectionLimit.newPerAddress.max, connectionLimit.newPerAddress.windowMs);
  const openPerAddress = new Map<string, number>();
  let total = 0;

  io.use((socket, next) => {
    const refuse = () => next(new Error("too-many-connections"));
    if (total >= connectionLimit.maxTotal) return refuse();

    const address = addressOf?.(socket);
    if (address !== undefined) {
      if (!allowNew(address) || (openPerAddress.get(address) ?? 0) >= connectionLimit.maxPerAddress) return refuse();
      socket.data.address = address;
    }
    next();
  });

  // Counted once the connection exists, so that a client that gives up half way leaves nothing behind.
  io.on("connection", (socket) => {
    const { address } = socket.data;
    total++;
    if (address !== undefined) openPerAddress.set(address, (openPerAddress.get(address) ?? 0) + 1);

    socket.on("disconnect", () => {
      total--;
      if (address === undefined) return;

      const open = (openPerAddress.get(address) ?? 1) - 1;
      if (open > 0) openPerAddress.set(address, open);
      else openPerAddress.delete(address);
    });
  });

  return { stats: () => ({ total, addresses: openPerAddress.size }) };
};
