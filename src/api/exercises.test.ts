import { getExercise, getExercises } from './exercises';
import { mockApi } from './testing';

const exercise = {
  id: 'wger-73',
  name: 'Press de Banca',
  muscleGroup: 'chest',
  equipment: 'barbell',
  trackingType: 'weight_reps',
  instructions: 'Acostate en un banco plano.',
  imageUrl: 'https://wger.de/media/exercise-images/192/Bench-press-1.png',
  imageAuthor: 'Everkinetic',
  imageLicense: 'CC-BY-SA 3',
  source: 'wger',
  sourceId: '73',
};

let server: ReturnType<typeof mockApi>;
beforeEach(() => {
  server = mockApi();
});
afterEach(() => server.restore());

describe('getExercises', () => {
  it('fetches the catalog sorted by name', async () => {
    server.respond([exercise]);
    await expect(getExercises()).resolves.toEqual([exercise]);
    expect(server.lastCall.path).toBe('/exercises');
    expect(server.lastCall.query.get('_sort')).toBe('name');
  });

  it('rejects an exercise with an unknown tracking type', async () => {
    server.respond([{ ...exercise, trackingType: 'distance' }]);
    await expect(getExercises()).rejects.toMatchObject({ kind: 'invalid_response' });
  });
});

describe('getExercise', () => {
  it('fetches one exercise by id', async () => {
    server.respond(exercise);
    await expect(getExercise('wger-73')).resolves.toEqual(exercise);
    expect(server.lastCall.path).toBe('/exercises/wger-73');
  });
});
