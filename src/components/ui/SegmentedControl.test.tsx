import { render, screen, userEvent } from '@testing-library/react-native';

import { SegmentedControl } from './SegmentedControl';

const OPTIONS = [
  { value: 'calendar', label: 'Calendario' },
  { value: 'mine', label: 'Mis reservas' },
] as const;

describe('SegmentedControl', () => {
  it('shows each option as a tab, with the selected one marked', async () => {
    await render(
      <SegmentedControl options={OPTIONS} value="calendar" onChange={() => undefined} />,
    );
    expect(screen.getByRole('tab', { name: 'Calendario' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Mis reservas' })).not.toBeSelected();
  });

  it('calls onChange with the value of the pressed option', async () => {
    const onChange = jest.fn();
    await render(<SegmentedControl options={OPTIONS} value="calendar" onChange={onChange} />);
    await userEvent.setup().press(screen.getByRole('tab', { name: 'Mis reservas' }));
    expect(onChange).toHaveBeenCalledWith('mine');
  });

  it('has touch areas of at least 44 px', async () => {
    await render(
      <SegmentedControl options={OPTIONS} value="calendar" onChange={() => undefined} />,
    );
    expect(screen.getByRole('tab', { name: 'Calendario' })).toHaveStyle({ minHeight: 44 });
  });
});
