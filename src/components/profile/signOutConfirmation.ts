/** Texts of the sign-out confirmation dialog. */
export function getSignOutConfirmation(hasWorkoutInProgress: boolean): {
  title: string;
  message: string | undefined;
} {
  return {
    title: '¿Cerrar sesión?',
    message: hasWorkoutInProgress
      ? 'Tenés un entrenamiento en curso. Si cerrás sesión, se va a perder.'
      : undefined,
  };
}
