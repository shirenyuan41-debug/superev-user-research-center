import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      account: string;
      name: string;
      role: string;
    };
    lastActivityAt?: number;
  }
}
