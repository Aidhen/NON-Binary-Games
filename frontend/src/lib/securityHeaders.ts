/**
 * What the backend is allowed to be: the page opens an HTTP connection to it (long polling and the wake-up
 * request) and a WebSocket, and the browser treats the two as different origins.
 */
const backendOrigins = (socketUrl: string): string => {
  const { protocol, origin, host } = new URL(socketUrl);
  if (protocol === 'https:') return `${origin} wss://${host}`;
  if (protocol === 'http:') return `${origin} ws://${host}`;
  throw new Error(`The backend URL must use http or https: ${socketUrl}`);
};

/**
 * Content-Security-Policy of the pages. Next.js writes small inline scripts and styles into every page, and
 * a policy without them needs a nonce on each request (which means rendering every page on demand), so
 * `'unsafe-inline'` stays. What the policy does close: nothing from another site can be loaded or sent data,
 * the game cannot be put in a frame, and plugins and a changed `<base>` are out.
 */
export const buildContentSecurityPolicy = (socketUrl: string, isDevelopment: boolean): string => [
  "default-src 'self'",
  // The development server rebuilds modules with eval.
  `script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${backendOrigins(socketUrl)}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

export const securityHeaders = (socketUrl: string, isDevelopment: boolean) => [
  { key: 'Content-Security-Policy', value: buildContentSecurityPolicy(socketUrl, isDevelopment) },
  // The address of a game is what lets people in: it must not travel to other sites in a Referer header.
  { key: 'Referrer-Policy', value: 'no-referrer' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
];
