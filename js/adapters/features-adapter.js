// js/adapters/features-adapter.js
// Adaptateur pour rediriger les appels de l'ancien namespace (MonHistoire.features)
// vers le nouveau namespace (MonHistoire.modules.features et autres)

(function() {
  window.MonHistoire = window.MonHistoire || {};
  MonHistoire.features = MonHistoire.features || {};

  if (MonHistoire.modules?.features?.audio) {
    MonHistoire.features.audio = MonHistoire.modules.features.audio;
    console.log("[Adapter] Adaptateur audio initialisé avec succès");
  } else {
    console.warn("[Adapter] Module audio manquant dans MonHistoire.modules.features");
  }

  if (MonHistoire.modules?.core?.cookies) {
    MonHistoire.features.cookies = MonHistoire.modules.core.cookies;
    console.log("[Adapter] Adaptateur cookies initialisé avec succès");
  } else {
    console.warn("[Adapter] Module cookies manquant dans MonHistoire.modules.core");
  }

  if (MonHistoire.modules?.stories?.export) {
    MonHistoire.features.export = MonHistoire.modules.stories.export;
    console.log("[Adapter] Adaptateur export initialisé avec succès");
  } else {
    console.warn("[Adapter] Module export manquant dans MonHistoire.modules.stories");
  }

  if (MonHistoire.modules?.sharing) {
    MonHistoire.features.sharing = MonHistoire.modules.sharing;
    console.log("[Adapter] Adaptateur sharing initialisé avec succès");
  } else {
    console.warn("[Adapter] Module sharing manquant dans MonHistoire.modules");
  }

  console.log("[Adapter] Adaptateur de fonctionnalités initialisé avec succès");
})();
