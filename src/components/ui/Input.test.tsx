import { render, screen, userEvent } from '@testing-library/react-native';
import { createRef, useState, type ComponentRef } from 'react';
import type { TextInput } from 'react-native';

import { MIN_TOUCH_TARGET, lightColors } from '../../theme';
import { Input } from './Input';

describe('Input', () => {
  it('shows its label and uses it as accessible name', async () => {
    await render(<Input label="Email" value="" onChangeText={jest.fn()} />);
    expect(screen.getByText('Email')).toBeOnTheScreen();
    expect(screen.getByLabelText('Email')).toBeOnTheScreen();
  });

  it('reports what the user types', async () => {
    const onChange = jest.fn();
    function Controlled() {
      const [value, setValue] = useState('');
      return (
        <Input
          label="Email"
          value={value}
          onChangeText={(text) => {
            setValue(text);
            onChange(text);
          }}
        />
      );
    }
    await render(<Controlled />);
    await userEvent.setup().type(screen.getByLabelText('Email'), 'ana');
    expect(onChange).toHaveBeenLastCalledWith('ana');
    expect(screen.getByDisplayValue('ana')).toBeOnTheScreen();
  });

  it('shows the current value', async () => {
    await render(<Input label="Email" value="ana@example.com" onChangeText={jest.fn()} />);
    expect(screen.getByDisplayValue('ana@example.com')).toBeOnTheScreen();
  });

  it('shows a hint when there is no error', async () => {
    await render(
      <Input label="Contraseña" hint="Mínimo 8 caracteres" value="" onChangeText={jest.fn()} />,
    );
    expect(screen.getByText('Mínimo 8 caracteres')).toBeOnTheScreen();
  });

  describe('with an error', () => {
    it('shows the error instead of the hint', async () => {
      await render(
        <Input
          label="Email"
          hint="Usá el mail del gimnasio"
          error="Ingresá un email válido"
          value="x"
          onChangeText={jest.fn()}
        />,
      );
      expect(screen.getByText('Ingresá un email válido')).toBeOnTheScreen();
      expect(screen.queryByText('Usá el mail del gimnasio')).toBeNull();
    });

    it('announces the error to screen readers', async () => {
      await render(
        <Input label="Email" error="Ingresá un email válido" value="x" onChangeText={jest.fn()} />,
      );
      expect(screen.getByText('Ingresá un email válido').props.accessibilityLiveRegion).toBe(
        'polite',
      );
      expect(screen.getByLabelText('Email').props.accessibilityHint).toBe(
        'Ingresá un email válido',
      );
    });

    it('marks the field border with the danger color', async () => {
      await render(<Input label="Email" error="Error" value="x" onChangeText={jest.fn()} />);
      expect(screen.getByLabelText('Email')).toHaveStyle({ borderColor: lightColors.danger });
    });
  });

  it('does not accept input when disabled', async () => {
    await render(<Input label="Email" value="" editable={false} onChangeText={jest.fn()} />);
    expect(screen.getByLabelText('Email')).toBeDisabled();
  });

  it('has a touch area of at least 44 px', async () => {
    await render(<Input label="Email" value="" onChangeText={jest.fn()} />);
    expect(screen.getByLabelText('Email')).toHaveStyle({ minHeight: MIN_TOUCH_TARGET });
  });

  it('forwards the ref to the TextInput (for React Hook Form focus)', async () => {
    const ref = createRef<ComponentRef<typeof TextInput>>();
    await render(<Input ref={ref} label="Email" value="" onChangeText={jest.fn()} />);
    expect(ref.current).not.toBeNull();
  });

  it('passes TextInput props through', async () => {
    await render(
      <Input
        label="Email"
        value=""
        onChangeText={jest.fn()}
        keyboardType="email-address"
        autoCapitalize="none"
      />,
    );
    expect(screen.getByLabelText('Email').props.keyboardType).toBe('email-address');
  });
});
