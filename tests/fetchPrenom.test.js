let fetchPrenom;

beforeAll(() => {
  global.window = { MonHistoire: { features: { messaging: {} } } };
  ({ fetchPrenom } = require('../js/features/messaging/ui'));
});

afterAll(() => {
  delete global.window;
  jest.resetModules();
});

describe('fetchPrenom', () => {
  test('returns "Inconnu" when the Firestore call throws', async () => {
    const dummyDoc = {
      collection: jest.fn(() => dummyDoc),
      doc: jest.fn(() => dummyDoc),
      get: jest.fn(() => Promise.reject(new Error('fail')))
    };
    global.firebase = { firestore: jest.fn(() => dummyDoc) };

    const result = await fetchPrenom('uid:parent');
    expect(result).toBe('Inconnu');
  });
});
