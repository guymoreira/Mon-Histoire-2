// js/modules/features/cookies.js
// Re-export core cookies module for backward compatibility

window.MonHistoire = window.MonHistoire || {};
MonHistoire.modules = MonHistoire.modules || {};
MonHistoire.modules.core = MonHistoire.modules.core || {};
MonHistoire.modules.features = MonHistoire.modules.features || {};

MonHistoire.modules.features.cookies = MonHistoire.modules.core.cookies;
