import type { IncomingHttpHeaders, IncomingMessage } from "node:http";
import { isIPv4, isIPv6 } from "node:net";
import { createKeyedRateLimiter } from "./rateLimiter";
import type { GameServer } from "./event";

/**
 * Largest message the server accepts. The biggest one a client sends (a room id of 64 characters) is
 * about a hundred bytes: this is only room for the framing. Without a limit a client sends megabytes.
 */
export const MAX_MESSAGE_BYTES = 4096;

/**
 * How long a connection can stay open without joining (Socket.IO waits 45 seconds by default). A browser
 * joins within the same second: a connection that does not is only holding a place.
 */
export const CONNECT_TIMEOUT_MS = 10_000;

/**
 * Limits on connections. They exist because every other limit counts events per connection: a client that
 * opens many connections would get a full allowance on each one.
 * Per address the numbers are generous: a family or a café shares one address.
 * They only apply where the address is known. Without it one machine could use up the limit of the whole
 * server and lock everybody out, which is worse than the memory it would otherwise use.
 */
export const connectionLimit = {
  /** Connections open at the same time on the whole server. */
  maxTotal: 300,
  /** Connections open at the same time from one address. */
  maxPerAddress: 20,
  /** New connections from one address (a page load is one, a dropped connection that comes back is another). */
  newPerAddress: { max: 30, windowMs: 60 * 1000 },
};

/** Where a request comes from, or undefined when it is not known. It reads the request, so it also works before a connection exists. */
export type AddressOf = (req: IncomingMessage) => string | undefined;

const MAX_ADDRESS_LENGTH = 64;

/**
 * The key the limits count an address under, or undefined when the text is not an address.
 * - IPv4: the address itself.
 * - IPv6: its /64 prefix. A home network is given a whole /64, so one client can use any address in it:
 *   counted one by one, each would get a full allowance.
 * - IPv4 written as IPv6 (`::ffff:a.b.c.d`, what Node reports on a dual-stack port): the IPv4, so that the
 *   same client has one key however it arrives.
 */
export const normaliseAddress = (value: string | undefined): string | undefined => {
  // The zone id (`fe80::1%eth0`) names a network interface of this machine, it is not part of the address.
  const address = value?.split("%")[0].toLowerCase();
  if (!address) return undefined;
  if (isIPv4(address)) return address;
  if (!isIPv6(address)) return undefined;

  // The last 32 bits can be written as an IPv4: turned into two groups like the others.
  let text = address;
  if (text.includes(".")) {
    const at = text.lastIndexOf(":") + 1;
    const [a, b, c, d] = text.slice(at).split(".").map(Number);
    text = `${text.slice(0, at)}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }

  // `::` stands for as many groups of zeros as are missing to make eight.
  const [head, tail] = text.split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const written = tail === undefined ? left : [...left, ...new Array<string>(8 - left.length - right.length).fill("0"), ...right];
  const groups = written.map((group) => Number.parseInt(group, 16));

  if (groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff) {
    return `${groups[6] >> 8}.${groups[6] & 0xff}.${groups[7] >> 8}.${groups[7] & 0xff}`;
  }
  return `${groups.slice(0, 4).map((group) => group.toString(16)).join(":")}::/64`;
};

/**
 * Behind a proxy the address of the connection is the proxy's. The proxy adds the real one to a header,
 * as the last entry of the list: the entries before it were written by the client and cannot be trusted.
 */
const lastEntry = (value: IncomingHttpHeaders[string]): string | undefined => {
  const entry = (Array.isArray(value) ? value.at(-1) : value)?.split(",").at(-1)?.trim();
  return entry && entry.length <= MAX_ADDRESS_LENGTH ? entry : undefined;
};

const peerAddress = (req: IncomingMessage): string | undefined => {
  const peer = req.socket.remoteAddress;
  return normaliseAddress(peer) ?? peer;
};

/**
 * How to find the address of a request, from the environment:
 * - `CLIENT_IP_HEADER`: name of the header the hosting platform puts it in (production).
 * - `LIMIT_BY_PEER_ADDRESS=true`: the address of the connection itself (local development, or no proxy).
 * With neither, the limits per address are off: with every client behind the same proxy address they
 * would count everybody as one. A header that is missing or is not an address falls back to the address
 * of the connection, so that sending a bad header is not a way out of the limits.
 * What comes out is the key of `normaliseAddress`, not the address as it was written.
 */
export const addressResolverFromEnv = (env: NodeJS.ProcessEnv = process.env): AddressOf | undefined => {
  const header = env.CLIENT_IP_HEADER?.trim().toLowerCase();
  if (header) return (req) => normaliseAddress(lastEntry(req.headers[header])) ?? peerAddress(req);
  if (env.LIMIT_BY_PEER_ADDRESS === "true") return peerAddress;
  return undefined;
};

/** The part of an Engine.IO session that is used here: the request that opened it, and the moment it ends. */
type EngineSession = { request: IncomingMessage; once: (event: "close", listener: () => void) => void };

/**
 * Decides which requests can open a connection, and counts the ones that are open.
 *
 * It works one layer below Socket.IO, on the request that opens the Engine.IO session (`allowRequest`):
 * a client can open a session and never send the Socket.IO CONNECT, and a check made at that point
 * (`io.use`) would never see it. The same request is the only place to read the Origin of a WebSocket:
 * the `cors` option only adds headers to HTTP responses, and a WebSocket is not subject to CORS.
 *
 * Addresses are only counted in memory while the connection is open (and for the length of one window):
 * they are never written to a log or stored.
 * The address is also left in `socket.data.address`, so that the budgets of rooms and restarts follow it.
 */
export const createConnectionGuard = (allowedOrigin: string, addressOf?: AddressOf) => {
  const allowNew = createKeyedRateLimiter(connectionLimit.newPerAddress.max, connectionLimit.newPerAddress.windowMs);
  const openPerAddress = new Map<string, number>();
  // From the request to the session it opens. Weak: a refused request leaves nothing behind.
  const addressOfRequest = new WeakMap<IncomingMessage, string>();
  let total = 0;

  /** Engine.IO only asks for the request that opens a session: the ones that follow carry its id. */
  const allowRequest = (req: IncomingMessage, decide: (error: string | null | undefined, allowed: boolean) => void) => {
    // A browser always sends the Origin on a WebSocket and on a request to another origin, and a page cannot change it.
    if (req.headers.origin !== allowedOrigin) return decide("origin-not-allowed", false);

    const address = addressOf?.(req);
    if (address === undefined) return decide(null, true);

    if (total >= connectionLimit.maxTotal || !allowNew(address) || (openPerAddress.get(address) ?? 0) >= connectionLimit.maxPerAddress) {
      return decide("too-many-connections", false);
    }
    addressOfRequest.set(req, address);
    decide(null, true);
  };

  /** Counts the sessions of this server. Each one is counted here and nowhere else, whatever it does afterwards. */
  const track = (io: GameServer) => {
    // Counted once the session exists, so that a request that fails half way leaves nothing behind.
    io.engine.on("connection", (session: EngineSession) => {
      const address = addressOfRequest.get(session.request);
      total++;
      if (address !== undefined) openPerAddress.set(address, (openPerAddress.get(address) ?? 0) + 1);

      session.once("close", () => {
        total--;
        if (address === undefined) return;

        const open = (openPerAddress.get(address) ?? 1) - 1;
        if (open > 0) openPerAddress.set(address, open);
        else openPerAddress.delete(address);
      });
    });

    io.use((socket, next) => {
      socket.data.address = addressOfRequest.get(socket.request);
      next();
    });
  };

  return { allowRequest, track, stats: () => ({ total, addresses: openPerAddress.size }) };
};
