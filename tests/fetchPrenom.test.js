const { JSDOM } = require('jsdom');

// Mock firebase globally
beforeAll(() => {
  global.firebase = {
    firestore: jest.fn(),
    auth: jest.fn()
  };
});

afterAll(() => {
  // Clean up global firebase between test runs
  delete global.firebase;
});

describe('fetchPrenom placeholder test', () => {
  test('sample', () => {
    expect(typeof global.firebase).toBe('object');
  });
});
