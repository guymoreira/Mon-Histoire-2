// js/features/messaging/realtime.js
// Gestion des écouteurs en temps réel pour les messages

window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.messaging = MonHistoire.features.messaging || {};

MonHistoire.features.messaging.realtime = {
  _unsubs: [],
  _messageUnsubs: {},

  init() {
    console.log('Module realtime messaging initialisé');
    if (MonHistoire.events && typeof MonHistoire.events.on === 'function') {
      MonHistoire.events.on('profilChange', () => this.listenToUnreadMessages());
      MonHistoire.events.on('authStateChange', user => {
        if (user) {
          this.listenToUnreadMessages();
        } else {
          this._cleanup();
        }
      });
    }

    if (firebase.auth().currentUser) {
      this.listenToUnreadMessages();
    }
  },

  /**
   * Écoute les messages d'une conversation en temps réel
   * @param {string} conversationId
   * @param {function(Object[]):void} callback
   * @returns {function} fonction pour détacher l'écouteur
   */
  listenToMessages(conversationId, callback) {
    const ref = firebase.firestore()
      .collection('conversations').doc(conversationId)
      .collection('messages')
      .orderBy('createdAt');
    const unsub = ref.onSnapshot(snap => {
      const messages = [];
      snap.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
      callback(messages);
    });
    return unsub;
  },

  _cleanup() {
    this._unsubs.forEach(u => u && u());
    this._unsubs = [];
    Object.values(this._messageUnsubs).forEach(u => u && u());
    this._messageUnsubs = {};
  },

  /**
   * Écoute en temps réel les messages non lus de toutes les conversations
   * de l'utilisateur/profil actif et émet un événement lorsqu'un nouveau
   * message est détecté.
   */
  listenToUnreadMessages() {
    this._cleanup();

    const user = firebase.auth().currentUser;
    if (!user) return;

    const profil = (MonHistoire.state && MonHistoire.state.profilActif) ||
      (localStorage.getItem('profilActif') ? JSON.parse(localStorage.getItem('profilActif')) : { type: 'parent' });
    const selfKey = `${user.uid}:${profil.type === 'parent' ? 'parent' : profil.id}`;

    const convRef = firebase.firestore().collection('conversations');
    const queries = [
      convRef.where('participants', 'array-contains', selfKey),
      convRef.where('participants', 'array-contains', user.uid)
    ];

    const handleConv = snap => {
      snap.docChanges().forEach(change => {
        const id = change.doc.id;
        if (change.type === 'removed' && this._messageUnsubs[id]) {
          this._messageUnsubs[id]();
          delete this._messageUnsubs[id];
        } else if (!this._messageUnsubs[id]) {
          this._attachMessageListener(id, selfKey);
        }
      });
    };

    queries.forEach(q => {
      this._unsubs.push(q.onSnapshot(handleConv));
    });
  },

  _attachMessageListener(conversationId, selfKey) {
    const ref = firebase.firestore()
      .collection('conversations').doc(conversationId)
      .collection('messages')
      .orderBy('createdAt');

    let initialized = false;
    const unsub = ref.onSnapshot(snap => {
      if (!initialized) {
        initialized = true;
        return;
      }
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const readBy = data.readBy || [];
          if (!(readBy.includes(selfKey) || readBy.includes(selfKey.split(':')[0]))) {
            if (MonHistoire.events && typeof MonHistoire.events.emit === 'function') {
              MonHistoire.events.emit('messageReceived', {
                conversationId,
                message: { id: change.doc.id, ...data }
              });
            }
          }
        }
      });
    });

    this._messageUnsubs[conversationId] = unsub;
    this._unsubs.push(unsub);
  }
};
