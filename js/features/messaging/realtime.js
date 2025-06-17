// js/features/messaging/realtime.js
// Gestion des écouteurs en temps réel pour les messages

window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.messaging = MonHistoire.features.messaging || {};

MonHistoire.features.messaging.realtime = {
  unreadListeners: [],

  init() {
    console.log('Module realtime messaging initialisé');

    if (MonHistoire.events && typeof MonHistoire.events.on === 'function') {
      MonHistoire.events.on('authStateChange', user => {
        if (user) {
          this.listenToUnreadMessages();
        } else {
          this.detachUnreadListeners();
        }
      });

      MonHistoire.events.on('profilChange', () => {
        this.detachUnreadListeners();
        if (firebase.auth().currentUser) {
          this.listenToUnreadMessages();
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

  listenToUnreadMessages() {
    this.detachUnreadListeners();

    const user = firebase.auth().currentUser;
    if (!user) return [];

    const profil = (MonHistoire.state && MonHistoire.state.profilActif) ||
      (localStorage.getItem('profilActif') ? JSON.parse(localStorage.getItem('profilActif')) : { type: 'parent' });
    const selfKey = `${user.uid}:${profil.type === 'parent' ? 'parent' : profil.id}`;

    const callback = () => {
      if (MonHistoire.features && MonHistoire.features.messaging &&
          MonHistoire.features.messaging.notifications &&
          typeof MonHistoire.features.messaging.notifications.recalculerMessagesNonLus === 'function') {
        MonHistoire.features.messaging.notifications.recalculerMessagesNonLus();
      }
    };

    const convRef1 = firebase.firestore().collection('conversations')
      .where('participants', 'array-contains', selfKey);
    const convRef2 = firebase.firestore().collection('conversations')
      .where('participants', 'array-contains', user.uid);

    const unsub1 = convRef1.onSnapshot(callback);
    const unsub2 = convRef2.onSnapshot(callback);

    this.unreadListeners = [unsub1, unsub2];
    return this.unreadListeners;
  },

  detachUnreadListeners() {
    if (Array.isArray(this.unreadListeners)) {
      this.unreadListeners.forEach(unsub => {
        if (typeof unsub === 'function') {
          try { unsub(); } catch (e) { console.warn('Erreur lors du détachement d\'un écouteur de messages', e); }
        }
      });
    }
    this.unreadListeners = [];
  }
};
