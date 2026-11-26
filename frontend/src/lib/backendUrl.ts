/** Where the backend is: the socket, the wake-up request and the feedback form all talk to this address. */
export const backendUrl = (): string => process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";
