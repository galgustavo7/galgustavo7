import type { JwtPayload } from './index';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
      requestId?: string;
    }
  }
}

export {};
