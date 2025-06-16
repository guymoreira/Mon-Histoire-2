// js/features/messaging/ui.js
// Interface utilisateur pour la messagerie

window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.messaging = MonHistoire.features.messaging || {};

MonHistoire.features.messaging.ui = (function() {
  let currentConversationId = null;
  let unsubscribe = null;

  function init() {
    console.log('Module UI messaging initialisé');

    document.getElementById('my-messages-button')?.addEventListener('click', openConversationsModal);
    document.getElementById('btn-fermer-messages')?.addEventListener('click', closeConversationsModal);
    document.getElementById('btn-fermer-conversation')?.addEventListener('click', closeConversation);
    document.getElementById('btn-envoyer-message')?.addEventListener('click', sendCurrentMessage);
    document.getElementById('btn-nouveau-message')?.addEventListener('click', startNewConversation);
  }

  async function openConversationsModal() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const list = document.getElementById('liste-conversations');
    if (!list) return;
    list.innerHTML = '';

    const snap = await firebase.firestore()
      .collection('conversations')
      .where('participants', 'array-contains', user.uid)
      .orderBy('updatedAt', 'desc')
      .get();

    snap.forEach(doc => {
      const data = doc.data();
      const other = (data.participants || []).find(p => p !== user.uid) || '';
      const prenom = other.split(':')[1] || other;

      const item = document.createElement('div');
      item.className = 'conversation-item';
      item.textContent = prenom + ' \u2013 ' + (data.lastMessage || '');

      messaging.storage.hasUnreadMessages(doc.id, user.uid).then(unread => {
        if (unread) item.classList.add('unread');
      });

      item.onclick = () => openConversation(doc.id, prenom);
      list.appendChild(item);
    });

    document.getElementById('modal-messages').classList.add('show');
  }

  function closeConversationsModal() {
    document.getElementById('modal-messages').classList.remove('show');
  }

  function closeConversation() {
    document.getElementById('modal-conversation').classList.remove('show');
    unsubscribe && unsubscribe();
    unsubscribe = null;
    currentConversationId = null;
  }

  function openConversation(id, prenom) {
    const container = document.getElementById('conversation-messages');
    if (!container) return;
    container.innerHTML = '';

    document.getElementById('conversation-contact').textContent = prenom;
    document.getElementById('modal-conversation').classList.add('show');

    currentConversationId = id;
    unsubscribe && unsubscribe();
    unsubscribe = messaging.listenToMessages(id, msgs => {
      container.innerHTML = '';
      msgs.forEach(m => {
        const div = document.createElement('div');
        div.className = 'message-bubble ' + (m.senderId === firebase.auth().currentUser.uid ? 'sent' : 'received');
        div.textContent = m.content;
        container.appendChild(div);
        if (!(m.readBy || []).includes(firebase.auth().currentUser.uid)) {
          messaging.markAsRead(id, m.id, firebase.auth().currentUser.uid);
        }
      });
      container.scrollTop = container.scrollHeight;
    });
  }

  async function startNewConversation() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    let destinataire = prompt('Identifiant du destinataire :');
    if (!destinataire) {
      MonHistoire.showMessageModal && MonHistoire.showMessageModal('Destinataire manquant.');
      return;
    }

    destinataire = destinataire.trim();
    if (!destinataire) {
      MonHistoire.showMessageModal && MonHistoire.showMessageModal('Destinataire manquant.');
      return;
    }

    try {
      const ref = await messaging.getOrCreateConversation([user.uid, destinataire]);
      closeConversationsModal();
      openConversation(ref.id, destinataire.split(':')[1] || destinataire);
    } catch (e) {
      console.error('Erreur lors de la création de la conversation', e);
      MonHistoire.showMessageModal && MonHistoire.showMessageModal("Erreur lors de la création de la conversation.");
    }
  }

  async function sendCurrentMessage() {
    const input = document.getElementById('input-message');
    if (!input || !currentConversationId) return;
    const text = input.value.trim();
    if (!text) return;
    await messaging.sendMessage(currentConversationId, text);
    input.value = '';
  }

  const messaging = MonHistoire.features.messaging;

  return {
    init,
    openConversationsModal,
    closeConversationsModal,
    startNewConversation,
    openConversation,
    closeConversation,
    sendCurrentMessage
  };
})();
