// js/features/messaging/realtime.js
// Gestion des écouteurs en temps réel pour les messages

window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.messaging = MonHistoire.features.messaging || {};

MonHistoire.features.messaging.realtime = {
  init() {
    console.log('Module realtime messaging initialisé');
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
  }
};
