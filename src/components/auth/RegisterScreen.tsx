import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Controller, useForm, type Control } from 'react-hook-form';
import { View } from 'react-native';

import {
  PASSWORD_RULE_MESSAGE,
  registerFormSchema,
  type RegisterFormInput,
  type RegisterFormValues,
} from '../../domain/auth';
import { EmailTakenError, useRegister } from '../../hooks/useRegister';
import { useTheme } from '../../theme';
import { Button, Input, getErrorMessage, type InputProps } from '../ui';
import { AuthScreenLayout } from './AuthScreenLayout';
import { FormError } from './FormError';
import { PasswordInput } from './PasswordInput';

type FieldName = keyof RegisterFormInput;

interface FieldProps extends Omit<InputProps, 'value' | 'onChangeText' | 'error' | 'ref'> {
  control: Control<RegisterFormInput, unknown, RegisterFormValues>;
  name: FieldName;
  password?: boolean;
}

function Field({ control, name, password = false, ...inputProps }: FieldProps) {
  const Component = password ? PasswordInput : Input;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Component
          {...inputProps}
          ref={field.ref}
          value={field.value}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export function RegisterScreen() {
  const { spacing } = useTheme();
  const register = useRegister();
  const {
    control,
    handleSubmit,
    setError,
    setFocus,
    getValues,
    formState: { isSubmitting, errors },
  } = useForm<RegisterFormInput, unknown, RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' },
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  const busy = isSubmitting || register.isPending;
  const onSubmit = handleSubmit(async (values) => {
    try {
      await register.mutateAsync(values);
    } catch (error) {
      if (error instanceof EmailTakenError) {
        setError('email', { type: 'taken', message: 'Ya existe una cuenta con ese email.' });
      }
    }
  });

  const emailTaken = errors.email?.type === 'taken';
  const connectionError =
    register.isError && !(register.error instanceof EmailTakenError)
      ? getErrorMessage(register.error).message
      : null;
  const next = (name: FieldName) => () => setFocus(name);

  return (
    <AuthScreenLayout title="Creá tu cuenta" subtitle="Con tu cuenta vas a poder reservar clases.">
      {connectionError !== null && <FormError message={connectionError} />}

      <View style={{ gap: spacing.md }}>
        <Field
          control={control}
          name="firstName"
          label="Nombre"
          autoComplete="given-name"
          textContentType="givenName"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={next('lastName')}
        />
        <Field
          control={control}
          name="lastName"
          label="Apellido"
          autoComplete="family-name"
          textContentType="familyName"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={next('email')}
        />
        <Field
          control={control}
          name="email"
          label="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={next('password')}
        />
        {emailTaken && (
          <Button
            label="Ingresar"
            accessibilityLabel="Ingresar con ese email"
            variant="ghost"
            onPress={() =>
              router.replace({ pathname: '/login', params: { email: getValues('email').trim() } })
            }
          />
        )}
        <Field
          control={control}
          name="password"
          password
          label="Contraseña"
          hint={PASSWORD_RULE_MESSAGE}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={next('confirmPassword')}
        />
        <Field
          control={control}
          name="confirmPassword"
          password
          label="Repetir contraseña"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={() => void onSubmit()}
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <Button label="Crear cuenta" loading={busy} onPress={() => void onSubmit()} />
        <Button
          label="Ya tengo cuenta"
          variant="ghost"
          disabled={busy}
          onPress={() => router.replace('/login')}
        />
      </View>
    </AuthScreenLayout>
  );
}
