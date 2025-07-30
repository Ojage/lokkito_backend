import { UserProfile } from '../auth/auth.service'; // Or wherever your user type is defined

declare module 'express' {
  interface Request {
    user?: UserProfile; // or `any` if you don't have a user interface
  }
}
