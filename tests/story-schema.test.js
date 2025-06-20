const { JSDOM } = require('jsdom');

function createFirestoreMock() {
  const store = {};
  let counter = 0;
  function docRef(path, id) {
    return {
      id,
      path,
      set: jest.fn(data => { store[path] = { ...data }; return Promise.resolve(); }),
      update: jest.fn(update => { if (!store[path]) return Promise.reject(new Error('not found')); Object.assign(store[path], update); return Promise.resolve(); }),
      delete: jest.fn(() => { delete store[path]; return Promise.resolve(); }),
      get: jest.fn(() => Promise.resolve({ exists: !!store[path], data: () => store[path] }))
    };
  }
  function collectionRef(path) {
    return {
      path,
      doc(id) { if (!id) { id = `id${++counter}`; } return docRef(`${path}/${id}`, id); },
      collection(name) { return collectionRef(`${path}/${name}`); },
      orderBy() { return this; },
      where(field, op, value) { this._filters = this._filters || []; this._filters.push({field,value}); return this; },
      limit() { return this; },
      get() {
        const docs = Object.keys(store)
          .filter(p => p.startsWith(`${path}/`))
          .map(p => ({ id: p.split('/').pop(), data: () => store[p], ref: docRef(p, p.split('/').pop()) }))
          .filter(doc => (this._filters||[]).every(f => doc.data()[f.field] === f.value));
        return Promise.resolve({ empty: docs.length===0, size: docs.length, docs, forEach: fn => docs.forEach(fn) });
      }
    };
  }
  function queryGroup(name) {
    const q = {
      _filters: [],
      where(field, op, value) { this._filters.push({field,value}); return this; },
      limit() { return this; },
      get() {
        const docs = Object.keys(store)
          .filter(p => p.includes(`/${name}/`))
          .map(p => ({ id: p.split('/').pop(), data: () => store[p], ref: docRef(p, p.split('/').pop()) }))
          .filter(doc => this._filters.every(f => {
            if (f.field === '__name__') return doc.id === f.value;
            return doc.data()[f.field] === f.value;
          }));
        return Promise.resolve({ empty: docs.length===0, size: docs.length, docs, forEach: fn => docs.forEach(fn) });
      }
    };
    return q;
  }
  const firestore = {
    collection: name => collectionRef(name),
    collectionGroup: name => queryGroup(name),
    FieldPath: { documentId: () => '__name__' }
  };
  function firestoreFn() { return firestore; }
  Object.assign(firestoreFn, firestore);
  return { firestoreFn, store };
}

describe('story schema consistency', () => {
  let firestoreMock;
  beforeEach(() => {
    jest.resetModules();
    const dom = new JSDOM('', { url: 'http://localhost' });
    global.window = dom.window;
    global.document = dom.window.document;
    firestoreMock = createFirestoreMock();
    global.firebase = {
      auth: () => ({ currentUser: { uid: 'user1' } }),
      firestore: firestoreMock.firestoreFn,
      storage: () => ({ ref: () => ({}) })
    };
    global.MonHistoire = { core: {}, features: { sharing: {} }, state: {} };
    global.console = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
    require('../js/core/storage.js');
    require('../js/features/sharing/storage.js');
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.firebase;
    delete global.MonHistoire;
    delete global.console;
  });

  test('saved story is retrieved by core and sharing modules', async () => {
    const storage = window.MonHistoire.core.storage;
    storage.init();

    const storyId = await storage.saveStory({ profileId: 'p1', title: 'Titre', nouvelleHistoire: true });
    const story = await storage.getStory(storyId);
    expect(story.title).toBe('Titre');

    window.MonHistoire.state.profilActif = { type: 'enfant', id: 'p1' };
    window.MonHistoire.features.sharing.notificationsNonLues = {};
    await window.MonHistoire.features.sharing.storage.verifierHistoiresPartageesProfilActif({ uid: 'user1' });
    expect(window.MonHistoire.features.sharing.notificationsNonLues['p1']).toBe(1);
  });
});
