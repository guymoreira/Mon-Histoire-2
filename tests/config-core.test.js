const { JSDOM } = require('jsdom');

describe('core config module', () => {
  let initFirebaseMock;

  beforeEach(() => {
    jest.resetModules();
    const dom = new JSDOM('', { url: 'http://localhost' });
    global.window = dom.window;
    global.document = dom.window.document;
    global.MonHistoire = { config: { initFirebase: jest.fn() }, modules: { core: {} } };
    global.console = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
    initFirebaseMock = global.MonHistoire.config.initFirebase;
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.MonHistoire;
    delete global.console;
  });

  test('initFirebase remains defined after loading core config', () => {
    require('../js/config.js');
    expect(typeof window.MonHistoire.config.initFirebase).toBe('function');
    expect(window.MonHistoire.config.initFirebase).toBe(initFirebaseMock);
  });
});
