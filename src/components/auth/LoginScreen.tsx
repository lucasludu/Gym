import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';

import { loginFormSchema, type LoginFormInput, type LoginFormValues } from '../../domain/auth';
import { InvalidCredentialsError, useLogin } from '../../hooks/useLogin';
import { useTheme } from '../../theme';
import { Button, Input, getErrorMessage } from '../ui';
import { AuthScreenLayout } from './AuthScreenLayout';
import { DEMO_EMAIL, DEMO_PASSWORD, isDemoLoginEnabled } from './demo';
import { FormError } from './FormError';
import { PasswordInput } from './PasswordInput';

const loginErrorMessage = (error: unknown): string =>
  error instanceof InvalidCredentialsError
    ? 'Email o contraseña incorrectos.'
    : getErrorMessage(error).message;

export function LoginScreen() {
  const { spacing } = useTheme();
  const params = useLocalSearchParams<{ email?: string }>();
  const login = useLogin();
  const {
    control,
    handleSubmit,
    setFocus,
    setValue,
    formState: { isSubmitting },
  } = useForm<LoginFormInput, unknown, LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: typeof params.email === 'string' ? params.email : '', password: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const busy = isSubmitting || login.isPending;
  // Awaiting keeps isSubmitting true until the request ends: a second tap does nothing.
  const onSubmit = handleSubmit(async (values) => {
    await login.mutateAsync(values).catch(() => undefined);
  });

  const signInAsDemo = () => {
    setValue('email', DEMO_EMAIL);
    setValue('password', DEMO_PASSWORD);
    void onSubmit();
  };

  return (
    <AuthScreenLayout
      title="Ingresá a tu cuenta"
      subtitle="Reservá clases y registrá tus entrenamientos."
    >
      {login.isError && <FormError message={loginErrorMessage(login.error)} />}

      <View style={{ gap: spacing.md }}>
        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <Input
              ref={field.ref}
              label="Email"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => setFocus('password')}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field, fieldState }) => (
            <PasswordInput
              ref={field.ref}
              label="Contraseña"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              returnKeyType="done"
              onSubmitEditing={() => void onSubmit()}
            />
          )}
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Button label="Ingresar" loading={busy} onPress={() => void onSubmit()} />
        {isDemoLoginEnabled() && (
          <Button
            label="Probar con la cuenta demo"
            variant="secondary"
            disabled={busy}
            accessibilityHint="Ingresa como la socia de ejemplo"
            onPress={signInAsDemo}
          />
        )}
        <Button
          label="Crear cuenta"
          variant="ghost"
          disabled={busy}
          onPress={() => router.replace('/register')}
        />
      </View>
    </AuthScreenLayout>
  );
}
