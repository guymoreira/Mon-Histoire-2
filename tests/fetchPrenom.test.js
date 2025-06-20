const { JSDOM } = require('jsdom');

function createFirestoreMock() {
  const parentGet = jest.fn().mockResolvedValue({ exists: true, data: () => ({ prenom: 'Parent' }) });
  const childGet = jest.fn().mockResolvedValue({ exists: true, data: () => ({ prenom: 'Enfant' }) });
  const childDoc = { get: childGet };
  const childCollection = { doc: jest.fn(() => childDoc) };
  const userDoc = { get: parentGet, collection: jest.fn(() => childCollection) };
  const usersCollection = { doc: jest.fn(() => userDoc) };
  const firestore = { collection: jest.fn(() => usersCollection) };
  const firestoreFn = jest.fn(() => firestore);
  Object.assign(firestoreFn, firestore);
  return { firestoreFn, parentGet, childGet, userDoc, usersCollection, childCollection };
}

describe('fetchPrenom', () => {
  let firestoreMock;
  let fetchPrenom;

  beforeEach(() => {
    jest.resetModules();
    const dom = new JSDOM('', { url: 'http://localhost' });
    global.window = dom.window;
    global.document = dom.window.document;
    firestoreMock = createFirestoreMock();
    global.firebase = { firestore: firestoreMock.firestoreFn };
    global.MonHistoire = { features: { messaging: {} } };
    require('../js/features/messaging/ui.js');
    fetchPrenom = window.MonHistoire.features.messaging.ui.fetchPrenom;
  });

  afterEach(() => {
    delete global.window;
    delete global.document;
    delete global.firebase;
    delete global.MonHistoire;
  });

  test('retrieves parent prenom and caches result', async () => {
    const prenom = await fetchPrenom('uid1:parent');
    expect(prenom).toBe('Parent');
    expect(firestoreMock.usersCollection.doc).toHaveBeenCalledWith('uid1');
    expect(firestoreMock.parentGet).toHaveBeenCalledTimes(1);

    firestoreMock.parentGet.mockClear();
    const cached = await fetchPrenom('uid1:parent');
    expect(cached).toBe('Parent');
    expect(firestoreMock.parentGet).not.toHaveBeenCalled();
  });

  test('retrieves child prenom', async () => {
    const prenom = await fetchPrenom('uid1:child1');
    expect(prenom).toBe('Enfant');
    expect(firestoreMock.usersCollection.doc).toHaveBeenCalledWith('uid1');
    expect(firestoreMock.userDoc.collection).toHaveBeenCalledWith('profils_enfant');
    expect(firestoreMock.childCollection.doc).toHaveBeenCalledWith('child1');
    expect(firestoreMock.childGet).toHaveBeenCalled();
  });
});
