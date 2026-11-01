import { useMutation, useQueryClient } from '@tanstack/react-query';

import { findUserByEmail } from '../api/users';
import type { LoginFormValues } from '../domain/auth';
import type { User } from '../domain/user';
import { sessionStore } from '../store/appSession';
import type { SessionStore } from '../store/session';
import { queryKeys } from './queryKeys';

/** The email/password pair does not match an account. */
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}

/**
 * Mock login: finds the user by email; the password is never sent (the real backend
 * will check it). On success saves the session and caches the profile.
 */
export function useLogin(store: SessionStore = sessionStore) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ email }: LoginFormValues): Promise<User> => {
      const user = await findUserByEmail(email);
      if (user === null) throw new InvalidCredentialsError();
      queryClient.setQueryData(queryKeys.user(user.id), user);
      await store.getState().signIn(user.id);
      return user;
    },
  });
}
