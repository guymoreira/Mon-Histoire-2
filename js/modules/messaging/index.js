// js/modules/messaging/index.js
// Entry point wrapper delegating to js/features/messaging

window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.messaging = MonHistoire.modules.messaging || {};

(function() {
  const getFeature = () => MonHistoire.features && MonHistoire.features.messaging;
  const mod = MonHistoire.modules.messaging;

  mod.init = function(...args) {
    const f = getFeature();
    if (f && typeof f.init === 'function') {
      return f.init(...args);
    }
  };

  mod.getOrCreateConversation = function(...args) {
    const f = getFeature();
    if (f && typeof f.getOrCreateConversation === 'function') {
      return f.getOrCreateConversation(...args);
    }
    if (mod.storage && mod.storage.getOrCreateConversation) {
      return mod.storage.getOrCreateConversation(...args);
    }
  };

  mod.sendMessage = function(...args) {
    const f = getFeature();
    if (f && typeof f.sendMessage === 'function') {
      return f.sendMessage(...args);
    }
    if (mod.storage && mod.storage.sendMessage) {
      return mod.storage.sendMessage(...args);
    }
  };

  mod.listenToMessages = function(...args) {
    const f = getFeature();
    if (f && typeof f.listenToMessages === 'function') {
      return f.listenToMessages(...args);
    }
    if (mod.realtime && mod.realtime.listenToMessages) {
      return mod.realtime.listenToMessages(...args);
    }
  };

  mod.markAsRead = function(...args) {
    const f = getFeature();
    if (f && typeof f.markAsRead === 'function') {
      return f.markAsRead(...args);
    }
    if (mod.storage && mod.storage.markAsRead) {
      return mod.storage.markAsRead(...args);
    }
  };

  mod.hasUnreadMessages = function(...args) {
    const f = getFeature();
    if (f && typeof f.hasUnreadMessages === 'function') {
      return f.hasUnreadMessages(...args);
    }
    if (mod.storage && mod.storage.hasUnreadMessages) {
      return mod.storage.hasUnreadMessages(...args);
    }
  };

  mod.markConversationRead = function(...args) {
    const f = getFeature();
    if (f && typeof f.markConversationRead === 'function') {
      return f.markConversationRead(...args);
    }
    if (mod.notifications && mod.notifications.markConversationRead) {
      return mod.notifications.markConversationRead(...args);
    }
  };
})();
