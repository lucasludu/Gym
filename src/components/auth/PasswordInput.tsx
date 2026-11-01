import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';

import { useTheme } from '../../theme';
import { IconButton, Input, type InputProps } from '../ui';

/** Password field with a show/hide button. */
export function PasswordInput(props: Omit<InputProps, 'secureTextEntry' | 'accessory'>) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  return (
    <Input
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="password"
      textContentType="password"
      {...props}
      secureTextEntry={!visible}
      accessory={
        <IconButton
          accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          icon={
            <MaterialCommunityIcons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={colors.textMuted}
            />
          }
          onPress={() => setVisible((v) => !v)}
        />
      }
    />
  );
}
