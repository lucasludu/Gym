import { render, screen } from '@testing-library/react-native';

import HomeScreen from './index';

// Smoke test: verifies the Jest + jest-expo + RNTL setup works end to end.
test('renders the placeholder screen', async () => {
  await render(<HomeScreen />);

  expect(screen.getByText('Gym')).toBeOnTheScreen();
});
