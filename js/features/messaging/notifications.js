// js/features/messaging/notifications.js
// Gestion des notifications de messages

window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.messaging = MonHistoire.features.messaging || {};

MonHistoire.features.messaging.notifications = (function() {
  let unreadByConversation = {};
  let unreadByProfile = {};

  function init() {
    console.log('Module notifications messaging initialisé');

    // Écouteurs d'événements
    if (MonHistoire.events && typeof MonHistoire.events.on === 'function') {
      MonHistoire.events.on('profilChange', recalculerMessagesNonLus);
      MonHistoire.events.on('authStateChange', user => {
        if (user) {
          recalculerMessagesNonLus();
        } else {
          unreadByConversation = {};
          unreadByProfile = {};
          mettreAJourBadgeMessages();
          mettreAJourBadgeConversations();
        }
      });
      MonHistoire.events.on('messageCreated', recalculerMessagesNonLus);
      MonHistoire.events.on('messageReceived', recalculerMessagesNonLus);
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

      unreadByConversation = {};
      unreadByProfile = {};

      const convSnap = await firebase.firestore()
        .collection('conversations')
        .where('participants', 'array-contains', selfKey)
        .get();

      for (const doc of convSnap.docs) {
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
      mettreAJourBadgeMessages();
      mettreAJourBadgeConversations();
      if (MonHistoire.events && typeof MonHistoire.events.emit === 'function') {
        MonHistoire.events.emit('messageNotificationUpdate', {
          byConversation: unreadByConversation,
          byProfile: unreadByProfile
        });
      }
    } catch (e) {
      console.error('Erreur lors du recalcul des messages non lus', e);
    }
  }

  function mettreAJourBadgeMessages() {
    const total = Object.values(unreadByProfile).reduce((a, b) => a + b, 0);
    const btn = document.getElementById('my-messages-button');
    if (!btn) return;
    let badge = btn.querySelector('.notification-indicator') || btn.querySelector('.ui-notification-badge');
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
