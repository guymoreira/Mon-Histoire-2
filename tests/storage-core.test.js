const { JSDOM } = require('jsdom');

describe('legacy storage API', () => {
  beforeEach(() => {
    jest.resetModules();
    const dom = new JSDOM('', { url: 'http://localhost' });
    global.window = dom.window;
    global.document = dom.window.document;
    global.console = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
    global.firebase = {
      auth: () => ({ currentUser: { uid: 'user1' } }),
      firestore: () => ({
        collection: jest.fn(() => ({
          doc: jest.fn(() => ({
            collection: jest.fn(() => ({
              doc: jest.fn(() => ({
                get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) }))
              }))
            }))
          }))
        }))
      })
    };
    global.MonHistoire = { core: {}, state: { profilActif: { type: 'parent' } } };
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.console;
    delete global.firebase;
    delete global.MonHistoire;
  });

  test('getHistoireById exists and returns a promise', () => {
    require('../js/core/storage.js');
    const result = window.MonHistoire.core.storage.getHistoireById('abc');
    expect(typeof result.then).toBe('function');
  });
});
