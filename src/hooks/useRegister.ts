import { useMutation, useQueryClient } from '@tanstack/react-query';

import { createUser, findUserByEmail } from '../api/users';
import type { RegisterFormValues } from '../domain/auth';
import type { User } from '../domain/user';
import { sessionStore } from '../store/appSession';
import type { SessionStore } from '../store/session';
import { queryKeys } from './queryKeys';

/** There is already an account with that email. */
export class EmailTakenError extends Error {
  constructor(readonly email: string) {
    super('Email already registered');
    this.name = 'EmailTakenError';
  }
}

/**
 * Creates only the User (no membership: the gym assigns it at the front desk) and
 * signs in. json-server does not enforce unique emails, so it checks first.
 * The password is never sent in the mock.
 */
export function useRegister(store: SessionStore = sessionStore) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ firstName, lastName, email }: RegisterFormValues): Promise<User> => {
      if ((await findUserByEmail(email)) !== null) throw new EmailTakenError(email);
      const user = await createUser({ firstName, lastName, email }, new Date());
      queryClient.setQueryData(queryKeys.user(user.id), user);
      await store.getState().signIn(user.id);
      return user;
    },
  });
}
