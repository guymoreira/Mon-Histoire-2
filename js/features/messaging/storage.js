// js/features/messaging/storage.js
// Gestion du stockage des conversations et messages

window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.messaging = MonHistoire.features.messaging || {};

MonHistoire.features.messaging.storage = {
  init() {
    console.log("Module de stockage des messages initialisé");
  },

  /**
   * Récupère ou crée une conversation pour les participants donnés
   * @param {string[]} participants - IDs des utilisateurs participants
   * @returns {Promise<firebase.firestore.DocumentReference>}
   */
  async getOrCreateConversation(participants) {
    const hash = participants.slice().sort().join("_");
    const convRef = firebase.firestore().collection("conversations");
    const existing = await convRef.where("participantsHash", "==", hash).limit(1).get();

    if (!existing.empty) {
      return existing.docs[0].ref;
    }

    const docRef = await convRef.add({
      participants: participants,
      participantsHash: hash,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    return docRef;
  },

  /**
   * Envoie un message dans une conversation
   * @param {string} conversationId - ID de la conversation
   * @param {string} contenu - texte du message
   */
  async sendMessage(conversationId, contenu) {
    const user = firebase.auth().currentUser;
    if (!user) {
      MonHistoire.showMessageModal && MonHistoire.showMessageModal("Tu dois être connecté pour envoyer un message.");
      return false;
    }

    const messageData = {
      senderId: user.uid,
      content: contenu,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      readBy: [user.uid],
      deviceId: MonHistoire.generateDeviceId(),
      version: 1
    };

    if (!MonHistoire.state.isConnected) {
      if (typeof MonHistoire.addToOfflineQueue === 'function') {
        MonHistoire.addToOfflineQueue('sendMessage', { conversationId, messageData });
        return true;
      }
    }

    await firebase.firestore()
      .collection('conversations').doc(conversationId)
      .collection('messages').add(messageData);

    await firebase.firestore().collection('conversations').doc(conversationId).update({
      lastMessage: contenu,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return true;
  },

  /** Traite l'envoi d'un message qui était en file d'attente hors ligne */
  async processOfflineMessage(data) {
    try {
      const { conversationId, messageData } = data;
      await firebase.firestore()
        .collection('conversations').doc(conversationId)
        .collection('messages').add({ ...messageData, processedOffline: true });
      await firebase.firestore().collection('conversations').doc(conversationId).update({
        lastMessage: messageData.content,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (e) {
      console.error("Erreur lors du traitement du message hors ligne", e);
      return false;
    }
  },

  async markAsRead(conversationId, messageId, userId) {
    const ref = firebase.firestore().collection('conversations')
      .doc(conversationId).collection('messages').doc(messageId);
    await ref.update({
      readBy: firebase.firestore.FieldValue.arrayUnion(userId)
    });
  },

  async hasUnreadMessages(conversationId, userId) {
    const snap = await firebase.firestore()
      .collection('conversations').doc(conversationId)
      .collection('messages').get();
    return snap.docs.some(d => !(d.data().readBy || []).includes(userId));
  }
};
