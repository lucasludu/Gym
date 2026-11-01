import { Text } from '../ui/Text';

export interface ImageAttributionProps {
  author: string | null;
  license: string | null;
}

const clean = (value: string | null): string | null => {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
};

/** "Imagen: {author} · {license}", required by the image licenses. Nothing without an author. */
export function ImageAttribution({ author, license }: ImageAttributionProps) {
  const who = clean(author);
  if (who === null) return null;
  const what = clean(license);
  return (
    <Text variant="caption" color="textMuted">
      {what === null ? `Imagen: ${who}` : `Imagen: ${who} · ${what}`}
    </Text>
  );
}
