const { JSDOM } = require('jsdom');

describe('storage adapter', () => {
  beforeEach(() => {
    jest.resetModules();
    const dom = new JSDOM('', { url: 'http://localhost' });
    global.window = dom.window;
    global.document = dom.window.document;
    global.MonHistoire = { modules: { core: { storage: {} } } };
    global.console = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.MonHistoire;
    delete global.console;
  });

  test('getHistoireById forwards to modules.core.storage.getStory', () => {
    const mockGetStory = jest.fn().mockReturnValue('story');
    window.MonHistoire.modules.core.storage.getStory = mockGetStory;
    require('../js/adapters/storage-adapter.js');

    const result = window.MonHistoire.core.storage.getHistoireById('abc');
    expect(mockGetStory).toHaveBeenCalledWith('abc');
    expect(result).toBe('story');
  });
});
