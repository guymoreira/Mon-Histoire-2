const { JSDOM } = require('jsdom');

// Helper to setup global window and MonHistoire before requiring the module
function setupEnvironment() {
  const dom = new JSDOM('', { url: 'http://localhost' });
  global.window = dom.window;
  global.document = dom.window.document;
  global.MonHistoire = {};
  global.console = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

describe('core storage module', () => {
  beforeEach(() => {
    jest.resetModules();
    setupEnvironment();
    require('../js/core/storage.js');
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.MonHistoire;
    delete global.console;
  });

  test('init initializes in offline mode when firebase is absent', () => {
    const storage = window.MonHistoire.core.storage;
    storage.init();
    expect(console.warn).toHaveBeenCalledWith("Firebase n'est pas disponible, initialisation du module Storage en mode déconnecté");
    expect(console.log).toHaveBeenCalledWith('Module Storage initialisé en mode déconnecté');
  });

  test('calling init twice warns about already initialized', () => {
    const storage = window.MonHistoire.core.storage;
    storage.init();
    console.warn.mockClear();
    storage.init();
    expect(console.warn).toHaveBeenCalledWith('Module Storage déjà initialisé');
  });
});
