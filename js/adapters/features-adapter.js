// js/adapters/features-adapter.js
// Adaptateur pour rediriger les appels de l'ancien namespace (MonHistoire.features)
// vers le nouveau namespace (MonHistoire.modules.features et autres)

(function() {
  // S'assurer que les namespaces existent
  window.MonHistoire = window.MonHistoire || {};
  MonHistoire.features = MonHistoire.features || {};
  
  // Adapter pour le module audio
  if (MonHistoire.modules && MonHistoire.modules.features && MonHistoire.modules.features.audio) {
    MonHistoire.features.audio = {
      init: function() {
        console.log("[Adapter] Redirection de audio.init vers modules.features.audio.init");
        return MonHistoire.modules.features.audio.init();
      },
      
      playStory: function(story) {
        console.log("[Adapter] Redirection de audio.playStory vers modules.features.audio.playStory");
        return MonHistoire.modules.features.audio.playStory(story);
      },
      
      stopAudio: function() {
        console.log("[Adapter] Redirection de audio.stopAudio vers modules.features.audio.stopAudio");
        return MonHistoire.modules.features.audio.stopAudio();
      },
      
      pauseAudio: function() {
        console.log("[Adapter] Redirection de audio.pauseAudio vers modules.features.audio.pauseAudio");
        return MonHistoire.modules.features.audio.pauseAudio();
      },
      
      resumeAudio: function() {
        console.log("[Adapter] Redirection de audio.resumeAudio vers modules.features.audio.resumeAudio");
        return MonHistoire.modules.features.audio.resumeAudio();
      }
    };
    
    console.log("[Adapter] Adaptateur audio initialisé avec succès");
  } else {
    console.warn("[Adapter] Module audio manquant dans MonHistoire.modules.features");
  }
  
  // Adapter pour le module cookies
  if (MonHistoire.modules && MonHistoire.modules.core && MonHistoire.modules.core.cookies) {
    MonHistoire.features.cookies = {
      init: function() {
        console.log("[Adapter] Redirection de cookies.init vers modules.core.cookies.init");
        return MonHistoire.modules.core.cookies.init();
      },
      
      setCookie: function(name, value, days) {
        console.log("[Adapter] Redirection de cookies.setCookie vers modules.core.cookies.setCookie");
        return MonHistoire.modules.core.cookies.setCookie(name, value, days);
      },
      
      getCookie: function(name) {
        console.log("[Adapter] Redirection de cookies.getCookie vers modules.core.cookies.getCookie");
        return MonHistoire.modules.core.cookies.getCookie(name);
      },
      
      deleteCookie: function(name) {
        console.log("[Adapter] Redirection de cookies.deleteCookie vers modules.core.cookies.deleteCookie");
        return MonHistoire.modules.core.cookies.deleteCookie(name);
      },
      
      showCookieBanner: function() {
        console.log("[Adapter] Redirection de cookies.showCookieBanner vers modules.core.cookies.showBanner");
        return MonHistoire.modules.core.cookies.showBanner();
      },
      
      hideCookieBanner: function() {
        console.log("[Adapter] Redirection de cookies.hideCookieBanner vers modules.core.cookies.hideBanner");
        return MonHistoire.modules.core.cookies.hideBanner();
      },
      
      acceptCookies: function() {
        console.log("[Adapter] Redirection de cookies.acceptCookies vers modules.core.cookies.acceptAll");
        return MonHistoire.modules.core.cookies.acceptAll();
      },
      
      rejectCookies: function() {
        console.log("[Adapter] Redirection de cookies.rejectCookies vers modules.core.cookies.rejectAll");
        return MonHistoire.modules.core.cookies.rejectAll();
      }
    };
    
    console.log("[Adapter] Adaptateur cookies initialisé avec succès");
  } else {
    console.warn("[Adapter] Module cookies manquant dans MonHistoire.modules.core");
  }
  
  // Adapter pour le module export
  if (MonHistoire.modules && MonHistoire.modules.stories && MonHistoire.modules.stories.export) {
    MonHistoire.features.export = {
      init: function() {
        console.log("[Adapter] Redirection de export.init vers modules.stories.export.init");
        return MonHistoire.modules.stories.export.init();
      },
      
      exportStory: function(story, format) {
        console.log("[Adapter] Redirection de export.exportStory vers modules.stories.export.exportStory");
        return MonHistoire.modules.stories.export.exportStory(story, format);
      },
      
      exportToPDF: function(story) {
        console.log("[Adapter] Redirection de export.exportToPDF vers modules.stories.export.exportToPDF");
        return MonHistoire.modules.stories.export.exportToPDF(story);
      },
      
      exportToWord: function(story) {
        console.log("[Adapter] Redirection de export.exportToWord vers modules.stories.export.exportToWord");
        return MonHistoire.modules.stories.export.exportToWord(story);
      },
      
      exportToText: function(story) {
        console.log("[Adapter] Redirection de export.exportToText vers modules.stories.export.exportToText");
        return MonHistoire.modules.stories.export.exportToText(story);
      },
      
      exportToHTML: function(story) {
        console.log("[Adapter] Redirection de export.exportToHTML vers modules.stories.export.exportToHTML");
        return MonHistoire.modules.stories.export.exportToHTML(story);
      }
    };
    
    console.log("[Adapter] Adaptateur export initialisé avec succès");
  } else {
    console.warn("[Adapter] Module export manquant dans MonHistoire.modules.stories");
  }
  
  // Adapter pour le module sharing
  if (MonHistoire.modules && MonHistoire.modules.sharing) {
    MonHistoire.features.sharing = {
      init: function() {
        console.log("[Adapter] Redirection de sharing.init vers modules.sharing.init");
        return MonHistoire.modules.sharing.init();
      },
      
      shareStory: function(story) {
        console.log("[Adapter] Redirection de sharing.shareStory vers modules.sharing.shareStory");
        return MonHistoire.modules.sharing.shareStory(story);
      },
      
      getSharedStories: function() {
        console.log("[Adapter] Redirection de sharing.getSharedStories vers modules.sharing.getSharedStories");
        return MonHistoire.modules.sharing.getSharedStories();
      },
      
      unshareStory: function(storyId) {
        console.log("[Adapter] Redirection de sharing.unshareStory vers modules.sharing.unshareStory");
        return MonHistoire.modules.sharing.unshareStory(storyId);
      }
    };
    
    // Sous-modules de sharing
    MonHistoire.features.sharing.ui = MonHistoire.modules.sharing.ui || {};
    MonHistoire.features.sharing.storage = MonHistoire.modules.sharing.storage || {};
    MonHistoire.features.sharing.notifications = MonHistoire.modules.sharing.notifications || {};
    MonHistoire.features.sharing.realtime = MonHistoire.modules.sharing.realtime || {};
    
    console.log("[Adapter] Adaptateur sharing initialisé avec succès");
  } else {
    console.warn("[Adapter] Module sharing manquant dans MonHistoire.modules");
  }
  
  console.log("[Adapter] Adaptateur de fonctionnalités initialisé avec succès");
})();
