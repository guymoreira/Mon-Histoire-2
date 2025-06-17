// js/features/messaging/ui.js
// Interface utilisateur pour la messagerie

window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.messaging = MonHistoire.features.messaging || {};

MonHistoire.features.messaging.ui = (function() {
  let currentConversationId = null;
  let unsubscribe = null;
  const prenomCache = new Map();

  async function fetchPrenom(key) {
    if (prenomCache.has(key)) {
      return prenomCache.get(key);
    }
    const [uid, part] = key.split(':');
    if (!uid || !part) return key;
    try {
      let prenom;
      if (part === 'parent') {
        const snap = await firebase.firestore().collection('users').doc(uid).get();
        prenom = snap.exists && snap.data().prenom ? snap.data().prenom : 'Parent';
      } else {
        const snap = await firebase.firestore()
          .collection('users')
          .doc(uid)
          .collection('profils_enfant')
          .doc(part)
          .get();
        prenom = snap.exists && snap.data().prenom ? snap.data().prenom : part;
      }
      prenomCache.set(key, prenom);
      return prenom;
    } catch (e) {
      console.error('Erreur lors de la récupération du prénom', e);
      // Use a placeholder when fetching the name fails
      prenomCache.set(key, 'Inconnu');
      return 'Inconnu';
    }
  }

  function init() {
    console.log('Module UI messaging initialisé');

    document.getElementById('my-messages-button')?.addEventListener('click', openConversationsModal);
    document.getElementById('btn-fermer-messages')?.addEventListener('click', closeConversationsModal);
    document.getElementById('btn-fermer-conversation')?.addEventListener('click', closeConversation);
    document.getElementById('btn-envoyer-message')?.addEventListener('click', sendCurrentMessage);
    document.getElementById('btn-nouveau-message')?.addEventListener('click', startNewConversation);
    document.getElementById('btn-fermer-nouveau-message')?.addEventListener('click', closeNewMessageModal);

    // Met à jour les badges lorsqu'un événement de notification est émis
    if (MonHistoire.events && typeof MonHistoire.events.on === 'function') {
      MonHistoire.events.on('messageNotificationUpdate', () => {
        messaging.notifications.mettreAJourBadgeMessages();
        messaging.notifications.mettreAJourBadgeConversations();
      });
    }
  }

  async function openConversationsModal() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    const profil = (MonHistoire.state && MonHistoire.state.profilActif) ||
      (localStorage.getItem('profilActif') ? JSON.parse(localStorage.getItem('profilActif')) : { type: 'parent' });
    const selfKey = `${user.uid}:${profil.type === 'parent' ? 'parent' : profil.id}`;

    const list = document.getElementById('liste-conversations');
    if (!list) return;
    list.innerHTML = '';

    const convRef = firebase.firestore().collection('conversations');
    const docsMap = {};
    const snapNew = await convRef.where('participants', 'array-contains', selfKey)
      .orderBy('updatedAt', 'desc').get();
    snapNew.forEach(d => docsMap[d.id] = d);
    const snapOld = await convRef.where('participants', 'array-contains', user.uid)
      .orderBy('updatedAt', 'desc').get();
    snapOld.forEach(d => { if (!docsMap[d.id]) docsMap[d.id] = d; });
    const docs = Object.values(docsMap).sort((a,b) => {
      const at = a.data().updatedAt ? a.data().updatedAt.toMillis() : 0;
      const bt = b.data().updatedAt ? b.data().updatedAt.toMillis() : 0;
      return bt - at;
    });

    docs.forEach(doc => {
      const data = doc.data();
      const other = (data.participants || []).find(p => p !== selfKey && p !== user.uid) || '';

      const item = document.createElement('div');
      item.className = 'conversation-item';
      item.dataset.conversationId = doc.id;
      item.innerHTML = '<strong class="conversation-name">...</strong>';
      list.appendChild(item);

      fetchPrenom(other).then(prenom => {
        const nameEl = item.querySelector('strong.conversation-name');
        if (nameEl) nameEl.textContent = prenom;
        item.onclick = () => openConversation(doc.id, prenom);
      }).catch(() => {
        const prenom = 'Inconnu';
        const nameEl = item.querySelector('strong.conversation-name');
        if (nameEl) nameEl.textContent = prenom;
        item.onclick = () => openConversation(doc.id, prenom);
      });
    });

    messaging.notifications.mettreAJourBadgeConversations();

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

    const user = firebase.auth().currentUser;
    const profil = (MonHistoire.state && MonHistoire.state.profilActif) ||
      (localStorage.getItem('profilActif') ? JSON.parse(localStorage.getItem('profilActif')) : { type: 'parent' });
    const selfKey = `${user.uid}:${profil.type === 'parent' ? 'parent' : profil.id}`;

    currentConversationId = id;
    unsubscribe && unsubscribe();
    unsubscribe = messaging.listenToMessages(id, msgs => {
      container.innerHTML = '';
      msgs.forEach(m => {
        const div = document.createElement('div');
        const isSent = m.senderId === selfKey || m.senderId === user.uid;
        div.className = 'message-bubble ' + (isSent ? 'sent' : 'received');
        div.textContent = m.content;
        container.appendChild(div);
        if (!(m.readBy || []).includes(selfKey) && !(m.readBy || []).includes(user.uid)) {
          messaging.markAsRead(id, m.id, selfKey);
        }
      });
      container.scrollTop = container.scrollHeight;
    });
    messaging.notifications.markConversationRead(id);
  }

  async function startNewConversation() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const profil = (MonHistoire.state && MonHistoire.state.profilActif) ||
      (localStorage.getItem('profilActif') ? JSON.parse(localStorage.getItem('profilActif')) : { type: 'parent' });

    const list = document.getElementById('liste-profils-message');
    if (!list) return;
    list.innerHTML = '';

    try {
      const docParent = await firebase.firestore().collection('users').doc(user.uid).get();
      const prenomParent = docParent.exists && docParent.data().prenom ? docParent.data().prenom : 'Parent';

      const enfantsSnap = await firebase.firestore()
        .collection('users')
        .doc(user.uid)
        .collection('profils_enfant')
        .get();

      if (profil.type === 'enfant') {
        const btnParent = document.createElement('button');
        btnParent.className = 'ui-button ui-button--primary';
        btnParent.textContent = prenomParent;
        btnParent.style.marginBottom = '0.75em';
        btnParent.addEventListener('click', () => chooseRecipient('parent', null, prenomParent));
        list.appendChild(btnParent);
      }

      let hasRecipient = false;
      enfantsSnap.forEach(doc => {
        if (profil.type === 'enfant' && doc.id === profil.id) return;
        const data = doc.data();
        const btn = document.createElement('button');
        btn.className = 'ui-button ui-button--primary';
        btn.textContent = data.prenom;
        btn.style.marginBottom = '0.75em';
        btn.addEventListener('click', () => chooseRecipient('enfant', doc.id, data.prenom));
        list.appendChild(btn);
        hasRecipient = true;
      });

      if (!hasRecipient && profil.type === 'parent') {
        list.innerHTML = "<p style='text-align:center;'>Aucun profil disponible.</p>";
      }

      document.getElementById('modal-nouveau-message').classList.add('show');
    } catch (e) {
      console.error('Erreur lors du chargement des profils', e);
      MonHistoire.showMessageModal && MonHistoire.showMessageModal('Erreur lors du chargement des profils.');
    }
  }

  async function chooseRecipient(type, id, prenom) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    const profil = (MonHistoire.state && MonHistoire.state.profilActif) ||
      (localStorage.getItem('profilActif') ? JSON.parse(localStorage.getItem('profilActif')) : { type: 'parent' });
    const selfKey = `${user.uid}:${profil.type === 'parent' ? 'parent' : profil.id}`;
    const otherKey = type === 'parent' ? `${user.uid}:parent` : `${user.uid}:${id}`;

    try {
      const ref = await messaging.getOrCreateConversation([selfKey, otherKey]);
      closeNewMessageModal();
      closeConversationsModal();
      openConversation(ref.id, prenom);
    } catch (e) {
      console.error('Erreur lors de la création de la conversation', e);
      MonHistoire.showMessageModal && MonHistoire.showMessageModal("Erreur lors de la création de la conversation.");
    }
  }

  function closeNewMessageModal() {
    document.getElementById('modal-nouveau-message')?.classList.remove('show');
  }

  async function sendCurrentMessage() {
    const input = document.getElementById('input-message');
    if (!input || !currentConversationId) return;
    const text = input.value.trim();
    if (!text) return;
    await messaging.sendMessage(currentConversationId, text);
    messaging.notifications.markConversationRead(currentConversationId);
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
