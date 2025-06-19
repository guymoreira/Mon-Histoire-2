const { JSDOM } = require('jsdom');

describe('adapters index loader', () => {
  beforeEach(() => {
    jest.resetModules();
    const dom = new JSDOM('', { url: 'http://localhost' });
    global.window = dom.window;
    global.document = dom.window.document;
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
  });

  test('profiles-adapter is requested', () => {
    const sources = [];
    const originalAppendChild = document.head.appendChild.bind(document.head);
    document.head.appendChild = (el) => {
      if (el.src) sources.push(el.src);
      return originalAppendChild(el);
    };

    require('../js/adapters/index.js');

    expect(sources).toContain('js/adapters/profiles-adapter.js');
  });
});
