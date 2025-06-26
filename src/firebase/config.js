// Mock Firebase configuration for demo purposes
// In a real app, this would connect to actual Firebase services

// Mock Firestore
const firestore = {
  collection: () => ({
    doc: () => ({
      collection: () => ({
        doc: () => ({
          get: () => Promise.resolve({
            exists: () => true,
            data: () => ({}),
            id: 'mock-doc-id'
          }),
          set: () => Promise.resolve(),
          update: () => Promise.resolve(),
          delete: () => Promise.resolve()
        }),
        add: () => Promise.resolve({ id: 'mock-doc-id' }),
        get: () => Promise.resolve({
          empty: false,
          docs: [],
          forEach: (callback) => {}
        }),
        where: () => ({
          get: () => Promise.resolve({
            empty: false,
            docs: [],
            forEach: (callback) => {}
          }),
          orderBy: () => ({
            get: () => Promise.resolve({
              empty: false,
              docs: [],
              forEach: (callback) => {}
            })
          })
        }),
        orderBy: () => ({
          get: () => Promise.resolve({
            empty: false,
            docs: [],
            forEach: (callback) => {}
          })
        })
      }),
      get: () => Promise.resolve({
        exists: () => true,
        data: () => ({}),
        id: 'mock-doc-id'
      }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve()
    }),
    add: () => Promise.resolve({ id: 'mock-doc-id' }),
    get: () => Promise.resolve({
      empty: false,
      docs: [],
      forEach: (callback) => {}
    }),
    where: () => ({
      get: () => Promise.resolve({
        empty: false,
        docs: [],
        forEach: (callback) => {}
      }),
      orderBy: () => ({
        get: () => Promise.resolve({
          empty: false,
          docs: [],
          forEach: (callback) => {}
        })
      })
    }),
    orderBy: () => ({
      get: () => Promise.resolve({
        empty: false,
        docs: [],
        forEach: (callback) => {}
      })
    })
  })
};

// Mock Realtime Database
const database = {
  ref: () => ({
    on: () => {},
    once: () => Promise.resolve({
      exists: () => false,
      forEach: () => {}
    }),
    push: () => Promise.resolve(),
    set: () => Promise.resolve()
  })
};

// Mock Storage
const storage = {
  ref: () => ({
    child: () => ({
      put: () => Promise.resolve({
        ref: {
          getDownloadURL: () => Promise.resolve('https://example.com/image.jpg')
        }
      })
    })
  })
};

// Mock Analytics
const analytics = {
  logEvent: () => {}
};

console.log("Firebase mock initialized");

export { firestore, database, storage, analytics };