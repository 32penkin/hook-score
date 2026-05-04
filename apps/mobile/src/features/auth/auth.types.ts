export type AuthMode = 'login' | 'register';

export type AuthUser = {
  id: string;
  email: string | null;
  name: string;
};

export type AuthState = {
  hasSession: boolean;
  user: AuthUser | null;
};

export type RegistrationResult = AuthState & {
  requiresEmailConfirmation: boolean;
};
