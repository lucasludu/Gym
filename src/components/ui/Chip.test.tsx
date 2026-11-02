import { render, screen, userEvent } from '@testing-library/react-native';

import { Chip } from './Chip';

describe('Chip', () => {
  it('is a button with its label and selected state', async () => {
    await render(<Chip label="Yoga" selected onPress={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Yoga' })).toBeSelected();
  });

  it('is not selected by default', async () => {
    await render(<Chip label="Yoga" selected={false} onPress={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Yoga' })).not.toBeSelected();
  });

  it('calls onPress', async () => {
    const onPress = jest.fn();
    await render(<Chip label="Yoga" selected={false} onPress={onPress} />);
    await userEvent.setup().press(screen.getByRole('button', { name: 'Yoga' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has a touch area of at least 44 px', async () => {
    await render(<Chip label="Yoga" selected={false} onPress={() => undefined} />);
    expect(screen.getByRole('button')).toHaveStyle({ minHeight: 44 });
  });
});
