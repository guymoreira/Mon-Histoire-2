const { JSDOM } = require('jsdom');

describe('profiles adapter export', () => {
  beforeEach(() => {
    jest.resetModules();
    const dom = new JSDOM('<!DOCTYPE html><div id="logout-modal"></div><div id="logout-profiles-list"></div><div id="logout-profile-name"></div>', { url: 'http://localhost' });
    global.window = dom.window;
    global.document = dom.window.document;
    global.firebase = { auth: () => ({ currentUser: null }) };
    global.MonHistoire = {};
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.firebase;
    delete global.MonHistoire;
  });

  test('defines ouvrirLogoutModal', () => {
    require('../js/adapters/profiles-adapter.js');
    expect(typeof window.MonHistoire.ouvrirLogoutModal).toBe('function');
  });
});
