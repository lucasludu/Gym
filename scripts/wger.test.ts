import { exerciseSchema, type Exercise } from '../src/domain/exercise';
import page from './__fixtures__/exerciseinfo-page.json';
import {
  WGER_COMMUNITY_AUTHOR,
  inferTrackingType,
  mapEquipment,
  mapWgerExercise,
  mergeExercises,
  pickMainImage,
  stripHtml,
  type WgerImage,
} from './wger';

const fixture = (id: number) => {
  const raw = page.results.find((e) => e.id === id);
  if (raw === undefined) throw new Error(`Fixture ${id} not found`);
  return raw;
};

const mapOk = (raw: unknown): Exercise => {
  const result = mapWgerExercise(raw);
  if (!result.ok) throw new Error(`Expected ok, got ${result.reason}`);
  return result.exercise;
};

describe('stripHtml', () => {
  it('returns plain text unchanged', () => {
    expect(stripHtml('Push the bar up.')).toBe('Push the bar up.');
  });

  it('puts each paragraph on its own line', () => {
    expect(stripHtml('<p>First.</p>\n<p>Second.</p>')).toBe('First.\nSecond.');
  });

  it('numbers ordered list items', () => {
    expect(stripHtml('<ol>\n<li>Stand.</li>\n<li>Lift.</li>\n</ol>')).toBe('1. Stand.\n2. Lift.');
  });

  it('prefixes unordered list items with a dash', () => {
    expect(stripHtml('<ul><li>Wide grip</li><li>Close grip</li></ul>')).toBe(
      '- Wide grip\n- Close grip',
    );
  });

  it('numbers each ordered list from 1', () => {
    expect(stripHtml('<ol><li>A</li></ol><p>Then:</p><ol><li>B</li><li>C</li></ol>')).toBe(
      '1. A\nThen:\n1. B\n2. C',
    );
  });

  it('removes inline tags and keeps their text', () => {
    expect(stripHtml('<p>Use a <em>spotter</em> and <strong>breathe</strong>.</p>')).toBe(
      'Use a spotter and breathe.',
    );
  });

  it('turns <br> into line breaks', () => {
    expect(stripHtml('Line one<br>Line two<br/>Line three<br />')).toBe(
      'Line one\nLine two\nLine three',
    );
  });

  it('decodes HTML entities', () => {
    expect(stripHtml('Sets&nbsp;&amp;&nbsp;reps &lt;3 &quot;ok&quot; it&#39;s &#233;&#xE9;')).toBe(
      'Sets & reps <3 "ok" it\'s éé',
    );
  });

  it('collapses whitespace and drops empty lines', () => {
    expect(stripHtml('  <p>  Too   many    spaces </p>\n\n\n<p></p><p>End</p>  ')).toBe(
      'Too many spaces\nEnd',
    );
  });

  it('returns an empty string for empty input or only tags', () => {
    expect(stripHtml('')).toBe('');
    expect(stripHtml('<p></p>\n<p>&nbsp;</p>')).toBe('');
  });

  it('cleans a real wger description', () => {
    const description = fixture(73).translations.find((t) => t.language === 4)?.description ?? '';
    const text = stripHtml(description);
    expect(text).not.toMatch(/<|>|&[a-z]+;/);
    expect(text).toContain('ayudante (spotter)');
    expect(text).toContain('- Agarre ancho: musculatura externa del pecho.');
  });
});

describe('pickMainImage', () => {
  const image = (patch: Partial<WgerImage>): WgerImage => ({
    image: 'https://wger.de/media/exercise-images/1/a.png',
    is_main: false,
    is_ai_generated: false,
    license: 2,
    license_author: 'Someone',
    ...patch,
  });

  it('returns null without images', () => {
    expect(pickMainImage([])).toBeNull();
  });

  it('prefers the main image', () => {
    const main = image({ image: 'https://x/main.png', is_main: true });
    expect(pickMainImage([image({}), main])).toBe(main);
  });

  it('uses the first image when none is main', () => {
    const first = image({ image: 'https://x/first.png' });
    expect(pickMainImage([first, image({ image: 'https://x/second.png' })])).toBe(first);
  });

  it('prefers a non-AI image over an AI main image', () => {
    const real = image({ image: 'https://x/real.png' });
    expect(pickMainImage([image({ is_main: true, is_ai_generated: true }), real])).toBe(real);
  });

  it('prefers the non-AI main image over other non-AI images', () => {
    const realMain = image({ image: 'https://x/real-main.png', is_main: true });
    expect(
      pickMainImage([
        image({ is_ai_generated: true }),
        image({ image: 'https://x/r.png' }),
        realMain,
      ]),
    ).toBe(realMain);
  });

  it('falls back to the AI main image when all images are AI', () => {
    const aiMain = image({ image: 'https://x/ai-main.png', is_main: true, is_ai_generated: true });
    expect(pickMainImage([image({ is_ai_generated: true }), aiMain])).toBe(aiMain);
  });

  it('falls back to the first AI image when all are AI and none is main', () => {
    const first = image({ image: 'https://x/ai-1.png', is_ai_generated: true });
    expect(pickMainImage([first, image({ is_ai_generated: true })])).toBe(first);
  });
});

describe('mapEquipment', () => {
  it.each([
    [[1], 'barbell'], // Barbell
    [[2], 'barbell'], // SZ-Bar
    [[3], 'dumbbell'],
    [[10], 'kettlebell'],
    [[12], 'cable'], // Cable machine
    [[7], 'bodyweight'], // none (bodyweight exercise)
    [[6], 'bodyweight'], // Pull-up bar
    [[8], 'other'], // Bench
    [[9], 'other'], // Incline bench
    [[4], 'other'], // Gym mat
    [[5], 'other'], // Swiss Ball
    [[11], 'other'], // Resistance band
  ] as const)('maps wger equipment %p to %p', (ids, expected) => {
    expect(mapEquipment([...ids], ['Some exercise']).equipment).toBe(expected);
  });

  it('maps an empty list to other (unknown, not bodyweight)', () => {
    expect(mapEquipment([], ['Burpees']).equipment).toBe('other');
  });

  it('picks the weighted equipment when there are several', () => {
    expect(mapEquipment([8, 1], ['Bench press']).equipment).toBe('barbell'); // Bench + Barbell
    expect(mapEquipment([4, 5, 3], ['Crunch']).equipment).toBe('dumbbell');
    expect(mapEquipment([8, 12], ['Row']).equipment).toBe('cable');
  });

  it('prefers other over bodyweight when both appear', () => {
    expect(mapEquipment([6, 11], ['Assisted pull-up']).equipment).toBe('other');
  });

  it.each(['Press de Pecho en Máquina', 'Aducción en maquina', 'Rowing Machine'])(
    'maps to machine when the name says so (%s)',
    (name) => {
      expect(mapEquipment([], [name]).equipment).toBe('machine');
    },
  );

  it('does not match machine inside other words', () => {
    expect(mapEquipment([], ['Machinegun drill']).equipment).toBe('other');
  });

  it('maps unknown equipment ids to other and reports them', () => {
    expect(mapEquipment([99], ['Something'])).toEqual({ equipment: 'other', unmappedIds: [99] });
  });

  it('reports no unmapped ids for known equipment', () => {
    expect(mapEquipment([1, 8], ['Bench press']).unmappedIds).toEqual([]);
  });
});

describe('inferTrackingType', () => {
  const base = {
    sourceId: '1',
    names: ['Some exercise'],
    equipment: 'other',
    isCardio: false,
  } as const;

  it.each(['barbell', 'dumbbell', 'machine', 'cable', 'kettlebell'] as const)(
    'returns weight_reps for %s',
    (equipment) => {
      expect(inferTrackingType({ ...base, equipment })).toBe('weight_reps');
    },
  );

  it.each(['bodyweight', 'other'] as const)('returns reps for %s', (equipment) => {
    expect(inferTrackingType({ ...base, equipment })).toBe('reps');
  });

  it.each([
    'Plank',
    'Plancha de antebrazo',
    'Hollow Hold',
    'Sostenimiento Lateral Isométrico',
    'Isometric squat',
    'Sentadilla isometrica',
    'PLANK',
  ])('returns time when the name contains a time keyword (%s)', (name) => {
    expect(inferTrackingType({ ...base, names: [name] })).toBe('time');
  });

  it('checks every name (Spanish and English)', () => {
    expect(inferTrackingType({ ...base, names: ['Plancha frontal', 'Front Plank'] })).toBe('time');
    expect(inferTrackingType({ ...base, names: ['Ejercicio X', 'Front Plank'] })).toBe('time');
  });

  it('does not match keywords inside other words', () => {
    expect(inferTrackingType({ ...base, names: ['Threshold run'] })).toBe('reps');
  });

  it('lets the name win over the equipment: a bodyweight plank is time', () => {
    expect(inferTrackingType({ ...base, names: ['Plank'], equipment: 'bodyweight' })).toBe('time');
  });

  it('lets the name win over weighted equipment', () => {
    expect(
      inferTrackingType({ ...base, names: ['Bench Press Isometric'], equipment: 'barbell' }),
    ).toBe('time');
  });

  it('returns time for cardio exercises', () => {
    expect(inferTrackingType({ ...base, names: ['Cycling'], isCardio: true })).toBe('time');
  });

  it('lets cardio win over equipment', () => {
    expect(
      inferTrackingType({
        ...base,
        names: ['Rowing Machine'],
        equipment: 'machine',
        isCardio: true,
      }),
    ).toBe('time');
  });

  it('lets the exception list win over every other rule', () => {
    // wger 1489 "Plank Jacks" is dynamic: counted in reps despite its name.
    expect(inferTrackingType({ ...base, sourceId: '1489', names: ['Plank Jacks'] })).toBe('reps');
    // wger 1022 "Single Arm Plank to Row" is a weighted row.
    expect(
      inferTrackingType({
        ...base,
        sourceId: '1022',
        names: ['Plank to Row'],
        equipment: 'kettlebell',
      }),
    ).toBe('weight_reps');
    // wger 1373 "box jumps" is cardio but counted in reps.
    expect(
      inferTrackingType({ ...base, sourceId: '1373', names: ['box jumps'], isCardio: true }),
    ).toBe('reps');
  });
});

describe('mapWgerExercise', () => {
  it('maps a Spanish exercise with images (wger 73, bench press)', () => {
    const exercise = mapOk(fixture(73));
    expect(exercise).toMatchObject({
      id: 'wger-73',
      name: 'Press de Banca',
      muscleGroup: 'chest',
      equipment: 'barbell',
      trackingType: 'weight_reps',
      imageUrl: 'https://wger.de/media/exercise-images/192/Bench-press-1.png',
      imageAuthor: 'Everkinetic',
      imageLicense: 'CC-BY-SA 3',
      source: 'wger',
      sourceId: '73',
    });
    expect(exercise.instructions).toMatch(/^Acuéstate en un banco plano\./);
  });

  it('takes name and instructions from the English translation when there is no Spanish one', () => {
    const exercise = mapOk(fixture(9));
    expect(exercise.name).toBe('2 Handed Kettlebell Swing');
    expect(exercise.instructions).toMatch(/^1\. Stand with your feet/);
    expect(exercise).toMatchObject({ equipment: 'kettlebell', trackingType: 'weight_reps' });
  });

  it('sets the image fields to null when there are no images', () => {
    expect(mapOk(fixture(498))).toMatchObject({
      imageUrl: null,
      imageAuthor: null,
      imageLicense: null,
    });
  });

  it('prefers a real image over an AI main image (wger 301)', () => {
    expect(mapOk(fixture(301))).toMatchObject({
      imageUrl: 'https://wger.de/media/exercise-images/128/Hyperextensions-1.png',
      imageAuthor: 'Everkinetic',
    });
  });

  it('uses the wger community as author when the image has none (wger 12)', () => {
    expect(mapOk(fixture(12))).toMatchObject({
      imageAuthor: WGER_COMMUNITY_AUTHOR,
      imageLicense: 'CC-BY-SA 4',
    });
    expect(WGER_COMMUNITY_AUTHOR).toBe('Comunidad de wger');
  });

  it('detects a machine exercise with no equipment listed (wger 12)', () => {
    expect(mapOk(fixture(12))).toMatchObject({
      name: 'Aducción de Cadera en Máquina',
      muscleGroup: 'legs',
      equipment: 'machine',
      trackingType: 'weight_reps',
    });
  });

  it('maps a plank to time (wger 458)', () => {
    expect(mapOk(fixture(458))).toMatchObject({
      name: 'Plancha de antebrazo',
      muscleGroup: 'core',
      equipment: 'bodyweight',
      trackingType: 'time',
    });
  });

  it('maps cardio to full_body and time (wger 177)', () => {
    expect(mapOk(fixture(177))).toMatchObject({
      name: 'Ciclismo',
      muscleGroup: 'full_body',
      trackingType: 'time',
    });
  });

  it('decodes entities in real instructions (wger 203)', () => {
    expect(mapOk(fixture(203)).instructions).not.toMatch(/&nbsp;/);
  });

  it('maps every fixture to a valid Exercise', () => {
    page.results.forEach((raw) => {
      expect(exerciseSchema.safeParse(mapOk(raw)).success).toBe(true);
    });
  });

  it('sets instructions to null when the description is empty', () => {
    const raw = fixture(9);
    const empty = {
      ...raw,
      translations: raw.translations.map((t) => ({ ...t, description: '<p>&nbsp;</p>' })),
    };
    expect(mapOk(empty).instructions).toBeNull();
  });

  it('trims the name', () => {
    const raw = fixture(9);
    const padded = {
      ...raw,
      translations: raw.translations.map((t) => ({ ...t, name: '  Swing  ' })),
    };
    expect(mapOk(padded).name).toBe('Swing');
  });

  it('discards an exercise without Spanish or English translation', () => {
    const raw = fixture(73);
    const germanOnly = { ...raw, translations: raw.translations.filter((t) => t.language === 1) };
    expect(mapWgerExercise(germanOnly)).toEqual({
      ok: false,
      sourceId: '73',
      reason: 'no_translation',
    });
  });

  it('discards when the chosen translation has an empty name', () => {
    const raw = fixture(9);
    const noName = { ...raw, translations: raw.translations.map((t) => ({ ...t, name: '   ' })) };
    expect(mapWgerExercise(noName)).toMatchObject({ ok: false, reason: 'no_translation' });
  });

  it('discards an exercise with an unmapped category', () => {
    expect(mapWgerExercise({ ...fixture(73), category: { id: 99, name: 'Yoga' } })).toEqual({
      ok: false,
      sourceId: '73',
      reason: 'unmapped_category',
    });
  });

  it('discards a response with an unexpected format', () => {
    expect(mapWgerExercise({ id: 5, foo: 'bar' })).toEqual({
      ok: false,
      sourceId: '5',
      reason: 'invalid_format',
    });
    expect(mapWgerExercise(null)).toEqual({ ok: false, sourceId: null, reason: 'invalid_format' });
  });

  it('reports unmapped equipment ids as warnings', () => {
    const result = mapWgerExercise({ ...fixture(73), equipment: [{ id: 99, name: 'Sled' }] });
    expect(result).toMatchObject({ ok: true, warnings: ['unmapped_equipment:99'] });
  });

  it('has no warnings for a fully mapped exercise', () => {
    expect(mapWgerExercise(fixture(73))).toMatchObject({ ok: true, warnings: [] });
  });

  it('sets the license to null when its id is unknown', () => {
    const raw = fixture(73);
    const result = mapWgerExercise({
      ...raw,
      images: raw.images.map((i) => ({ ...i, license: 99 })),
    });
    expect(result).toMatchObject({ ok: true, exercise: { imageLicense: null } });
  });
});

describe('mergeExercises', () => {
  const wger = (sourceId: string, name: string, id = `wger-${sourceId}`): Exercise => ({
    id,
    name,
    muscleGroup: 'chest',
    equipment: 'barbell',
    trackingType: 'weight_reps',
    instructions: null,
    imageUrl: null,
    imageAuthor: null,
    imageLicense: null,
    source: 'wger',
    sourceId,
  });

  const custom: Exercise = {
    ...wger('x', 'Ejercicio propio', 'custom-1'),
    source: 'custom',
    sourceId: null,
  };

  it('adds new exercises to an empty catalog', () => {
    expect(mergeExercises([], [wger('1', 'A'), wger('2', 'B')])).toEqual({
      exercises: [wger('1', 'A'), wger('2', 'B')],
      added: 2,
      updated: 0,
    });
  });

  it('updates exercises with the same sourceId instead of duplicating them', () => {
    const result = mergeExercises([wger('1', 'Old name')], [wger('1', 'New name')]);
    expect(result.exercises).toEqual([wger('1', 'New name')]);
    expect(result).toMatchObject({ added: 0, updated: 1 });
  });

  it('keeps the existing id when updating, so references do not break', () => {
    const result = mergeExercises([wger('1', 'Old', 'exercise-legacy')], [wger('1', 'New')]);
    expect(result.exercises).toEqual([wger('1', 'New', 'exercise-legacy')]);
  });

  it('is idempotent: importing the same data twice changes nothing', () => {
    const imported = [wger('1', 'A'), wger('2', 'B')];
    const first = mergeExercises([], imported);
    const second = mergeExercises(first.exercises, imported);
    expect(second.exercises).toEqual(first.exercises);
    expect(second).toMatchObject({ added: 0, updated: 2 });
  });

  it('never touches custom exercises', () => {
    const result = mergeExercises([custom, wger('1', 'Old')], [wger('1', 'New')]);
    expect(result.exercises).toEqual([custom, wger('1', 'New')]);
  });

  it('keeps wger exercises that are no longer in the import', () => {
    const result = mergeExercises([wger('1', 'A'), wger('2', 'B')], [wger('1', 'A')]);
    expect(result.exercises).toEqual([wger('1', 'A'), wger('2', 'B')]);
  });

  it('keeps the existing order and appends new exercises at the end', () => {
    const result = mergeExercises(
      [wger('2', 'B'), custom, wger('1', 'A')],
      [wger('1', 'A2'), wger('3', 'C'), wger('2', 'B2')],
    );
    expect(result.exercises.map((e) => e.name)).toEqual(['B2', 'Ejercicio propio', 'A2', 'C']);
    expect(result).toMatchObject({ added: 1, updated: 2 });
  });
});
