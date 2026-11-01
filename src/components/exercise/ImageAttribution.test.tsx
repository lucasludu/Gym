import { render, screen } from '@testing-library/react-native';

import { ImageAttribution } from './ImageAttribution';

describe('ImageAttribution', () => {
  it('shows author and license', async () => {
    await render(<ImageAttribution author="Jane Doe" license="CC-BY-SA 4.0" />);
    expect(screen.getByText('Imagen: Jane Doe · CC-BY-SA 4.0')).toBeOnTheScreen();
  });

  it('shows only the author when there is no license', async () => {
    await render(<ImageAttribution author="Comunidad de wger" license={null} />);
    expect(screen.getByText('Imagen: Comunidad de wger')).toBeOnTheScreen();
  });

  it.each([null, '', '   '])('renders nothing when the author is %p', async (author) => {
    await render(<ImageAttribution author={author} license="CC0" />);
    expect(screen.queryByText(/Imagen/)).toBeNull();
  });

  it('trims author and license', async () => {
    await render(<ImageAttribution author="  Jane  " license=" CC0 " />);
    expect(screen.getByText('Imagen: Jane · CC0')).toBeOnTheScreen();
  });

  it('ignores a blank license', async () => {
    await render(<ImageAttribution author="Jane" license="  " />);
    expect(screen.getByText('Imagen: Jane')).toBeOnTheScreen();
  });
});
