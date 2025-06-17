// js/features/messaging/notifications.js
// Gestion des notifications de messages

window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.messaging = MonHistoire.features.messaging || {};

MonHistoire.features.messaging.notifications = (function() {
  let unreadByConversation = {};
  let unreadByProfile = {};

  function init() {
    if (MonHistoire.logger) {
      MonHistoire.logger.info('MESSAGING', 'Module notifications messaging initialisé');
    } else {
      console.log('Module notifications messaging initialisé');
    }

    // Écouteurs d'événements
    if (MonHistoire.events && typeof MonHistoire.events.on === 'function') {
      MonHistoire.events.on('profilChange', () => {
        MonHistoire.logger && MonHistoire.logger.debug('MESSAGING', 'Événement profilChange reçu');
        recalculerMessagesNonLus();
      });
      MonHistoire.events.on('authStateChange', user => {
        MonHistoire.logger && MonHistoire.logger.debug('MESSAGING', 'Événement authStateChange', { user: !!user });
        if (user) {
          recalculerMessagesNonLus();
        } else {
          unreadByConversation = {};
          unreadByProfile = {};
          mettreAJourBadgeMessages();
          mettreAJourBadgeConversations();
        }
      });
      MonHistoire.events.on('messageCreated', data => {
        MonHistoire.logger && MonHistoire.logger.debug('MESSAGING', 'Événement messageCreated', data);
        recalculerMessagesNonLus();
      });
      MonHistoire.events.on('messageReceived', data => {
        MonHistoire.logger && MonHistoire.logger.debug('MESSAGING', 'Événement messageReceived', data);
        recalculerMessagesNonLus();
      });
    }

    // Recalcul initial si l'utilisateur est déjà authentifié
    if (firebase.auth().currentUser) {
      recalculerMessagesNonLus();
    }
  }

  async function recalculerMessagesNonLus() {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;
      const profil = (MonHistoire.state && MonHistoire.state.profilActif) ||
        (localStorage.getItem('profilActif') ? JSON.parse(localStorage.getItem('profilActif')) : { type: 'parent' });
      const selfKey = `${user.uid}:${profil.type === 'parent' ? 'parent' : profil.id}`;

      MonHistoire.logger && MonHistoire.logger.debug('MESSAGING', 'Recalcul des messages non lus', { profil: profil.type, selfKey });

      unreadByConversation = {};
      unreadByProfile = {};

      const convRef = firebase.firestore().collection('conversations');
      const docsMap = {};
      const snapNew = await convRef.where('participants', 'array-contains', selfKey).get();
      snapNew.forEach(d => docsMap[d.id] = d);
      const snapOld = await convRef.where('participants', 'array-contains', user.uid).get();
      snapOld.forEach(d => { if (!docsMap[d.id]) docsMap[d.id] = d; });
      const convDocs = Object.values(docsMap);

      for (const doc of convDocs) {
        let count = 0;
        const messagesSnap = await doc.ref.collection('messages').get();
        messagesSnap.forEach(m => {
          const readBy = m.data().readBy || [];
          if (!(readBy.includes(selfKey) || readBy.includes(user.uid))) count++;
        });
        if (count > 0) {
          unreadByConversation[doc.id] = count;
          const other = (doc.data().participants || []).find(p => p !== selfKey && p !== user.uid) || doc.id;
          unreadByProfile[other] = (unreadByProfile[other] || 0) + count;
        }
      }
      MonHistoire.logger && MonHistoire.logger.debug('MESSAGING', 'Comptage terminé', {
        conversations: unreadByConversation,
        profiles: unreadByProfile
      });

      mettreAJourBadgeMessages();
      mettreAJourBadgeConversations();
      if (MonHistoire.events && typeof MonHistoire.events.emit === 'function') {
        MonHistoire.events.emit('messageNotificationUpdate', {
          byConversation: unreadByConversation,
          byProfile: unreadByProfile
        });
      }
    } catch (e) {
      if (MonHistoire.logger) {
        MonHistoire.logger.error('MESSAGING', 'Erreur lors du recalcul des messages non lus', e);
      } else {
        console.error('Erreur lors du recalcul des messages non lus', e);
      }
    }
  }

  function mettreAJourBadgeMessages() {
    const total = Object.values(unreadByProfile).reduce((a, b) => a + b, 0);
    const btn = document.getElementById('my-messages-button');
    if (!btn) return;
    let badge = btn.querySelector('.notification-indicator') || btn.querySelector('.ui-notification-badge');
    MonHistoire.logger && MonHistoire.logger.debug('MESSAGING', 'Mise à jour badge messages', { total });

    if (total > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'notification-indicator ui-notification-badge';
        btn.appendChild(badge);
      }
      badge.textContent = total > 9 ? '9+' : total.toString();
      badge.style.display = 'flex';
    } else if (badge) {
      badge.style.display = 'none';
    }
  }

  function mettreAJourBadgeConversations() {
    const items = document.querySelectorAll('.conversation-item');
    MonHistoire.logger && MonHistoire.logger.debug('MESSAGING', 'Mise à jour badges conversations', { conversations: unreadByConversation });
    items.forEach(item => {
      const convId = item.dataset.conversationId;
      const count = convId && unreadByConversation[convId] ? unreadByConversation[convId] : 0;
      let badge = item.querySelector('.notification-indicator') || item.querySelector('.ui-notification-badge');
      if (count > 0) {
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'notification-indicator ui-notification-badge';
          item.appendChild(badge);
        }
        badge.textContent = count > 9 ? '9+' : count.toString();
        badge.style.display = 'flex';
      } else if (badge) {
        badge.style.display = 'none';
      }
    });
  }

  function markConversationRead(conversationId) {
    if (unreadByConversation[conversationId]) {
      const count = unreadByConversation[conversationId];
      MonHistoire.logger && MonHistoire.logger.debug('MESSAGING', 'Conversation marquée comme lue', { conversationId, count });
      delete unreadByConversation[conversationId];
      // retirer du total par profil
      Object.keys(unreadByProfile).forEach(k => {
        unreadByProfile[k] -= count;
        if (unreadByProfile[k] <= 0) delete unreadByProfile[k];
      });
      mettreAJourBadgeMessages();
      mettreAJourBadgeConversations();
      if (MonHistoire.events && typeof MonHistoire.events.emit === 'function') {
        MonHistoire.events.emit('messageNotificationUpdate', {
          byConversation: unreadByConversation,
          byProfile: unreadByProfile
        });
      }
    }
  }

  return {
    init,
    recalculerMessagesNonLus,
    mettreAJourBadgeMessages,
    mettreAJourBadgeConversations,
    markConversationRead
  };
})();
