// js/features/sharing/index.js
// Point d'entrée pour le module de partage d'histoires

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};
MonHistoire.features.sharing = MonHistoire.features.sharing || {};

/**
 * Initialisation du module de partage
 * Ce fichier est responsable de charger tous les sous-modules et de les attacher au module principal
 */
(function() {
  // Référence au module principal
  const sharingModule = MonHistoire.features.sharing;
  
  // Compteur de tentatives pour l'initialisation des écouteurs
  let eventInitAttempts = 0;
  const MAX_EVENT_INIT_ATTEMPTS = 5;
  
  try {
    
    // Initialiser les variables de notification si elles n'existent pas
    sharingModule.notificationsNonLues = sharingModule.notificationsNonLues || {};
    sharingModule.notificationsTraitees = sharingModule.notificationsTraitees || new Set();
    
    // Attacher les sous-modules au module principal
    // Cela permet d'y accéder via MonHistoire.features.sharing.nomDuModule
    
    // 1. Module de notifications
    if (MonHistoire.features.sharing.notifications) {
      sharingModule.notifications = MonHistoire.features.sharing.notifications;
      console.log("Module de notifications attaché");
    } else {
      console.warn("Module de notifications non disponible");
    }
    
    // 2. Module de stockage
    if (MonHistoire.features.sharing.storage) {
      sharingModule.storage = MonHistoire.features.sharing.storage;
      console.log("Module de stockage attaché");
    } else {
      console.warn("Module de stockage non disponible");
    }
    
    // 3. Module d'interface utilisateur
    if (MonHistoire.features.sharing.ui) {
      sharingModule.ui = MonHistoire.features.sharing.ui;
      console.log("Module d'interface utilisateur attaché");
    } else {
      console.warn("Module d'interface utilisateur non disponible");
    }
    
    // 4. Module de gestion des écouteurs en temps réel
    if (MonHistoire.features.sharing.realtime) {
      sharingModule.realtime = MonHistoire.features.sharing.realtime;
      console.log("Module de gestion des écouteurs en temps réel attaché");
    } else {
      console.warn("Module de gestion des écouteurs en temps réel non disponible");
    }
  } catch (error) {
    console.error("Erreur lors de l'initialisation des sous-modules:", error);
  }
  
  /**
   * Initialisation des écouteurs d'événements pour le partage
   */
  function initEventListeners() {
    try {
      // Vérifier que le système d'événements est disponible
      if (!MonHistoire.events || typeof MonHistoire.events.on !== 'function') {
        if (MonHistoire.common && typeof MonHistoire.common.waitForEvents === 'function') {
          // Utiliser la fonction utilitaire pour attendre que MonHistoire.events soit disponible
          MonHistoire.common.waitForEvents(() => {
            // Écouteur pour le changement de profil
            MonHistoire.events.on("profilChange", function(profilActif) {
              try {
                console.log("Changement de profil détecté:", profilActif ? profilActif.type : "inconnu");
                
                // Attendre un court instant pour s'assurer que le changement de profil est bien pris en compte
                setTimeout(function() {
                  try {
                    // Réinitialiser les écouteurs de notifications
                    if (sharingModule.realtime) {
                      if (typeof sharingModule.realtime.configurerEcouteurNotificationsRealtime === 'function') {
                        sharingModule.realtime.configurerEcouteurNotificationsRealtime();
                      }
                      if (typeof sharingModule.realtime.configurerEcouteurHistoiresPartagees === 'function') {
                        sharingModule.realtime.configurerEcouteurHistoiresPartagees();
                      }
                    }
                    
                    // Vérifier s'il y a des histoires partagées pour ce profil
                    const user = firebase.auth().currentUser;
                    if (user && sharingModule.storage && typeof sharingModule.storage.verifierHistoiresPartageesProfilActif === 'function') {
                      sharingModule.storage.verifierHistoiresPartageesProfilActif(user)
                        .then(function() {
                          // Mettre à jour l'indicateur de notification
                          if (sharingModule.notifications) {
                            if (typeof sharingModule.notifications.mettreAJourIndicateurNotification === 'function') {
                              sharingModule.notifications.mettreAJourIndicateurNotification();
                            }
                            if (typeof sharingModule.notifications.mettreAJourIndicateurNotificationProfilsListe === 'function') {
                              sharingModule.notifications.mettreAJourIndicateurNotificationProfilsListe();
                            }
                          } else if (typeof sharingModule.mettreAJourIndicateurNotification === 'function') {
                            // Utiliser la fonction exposée au module principal si disponible
                            sharingModule.mettreAJourIndicateurNotification();
                          }
                        })
                        .catch(function(error) {
                          console.error("Erreur lors de la vérification des histoires partagées:", error);
                        });
                    }
                  } catch (innerError) {
                    console.error("Erreur lors du traitement du changement de profil:", innerError);
                  }
                }, 1000);
              } catch (error) {
                console.error("Erreur dans l'écouteur de changement de profil:", error);
              }
            });
            
            // Écouteur pour le traitement des opérations hors ligne
            MonHistoire.events.on("processOfflineQueue", function(operations) {
              try {
                if (!operations || !operations.length) return;
                
                // Traiter les opérations de partage d'histoire
                const partageOperations = operations.filter(function(op) { return op.type === "partageHistoire"; });
                if (partageOperations.length > 0) {
                  console.log(`Traitement de ${partageOperations.length} opérations de partage hors ligne`);
                  
                  // Traiter chaque opération de partage
                  partageOperations.forEach(function(op) {
                    if (sharingModule.storage && typeof sharingModule.storage.processOfflinePartage === 'function') {
                      sharingModule.storage.processOfflinePartage(op.data)
                        .then(function(success) {
                          if (success) {
                            // Marquer l'opération comme traitée
                            if (typeof MonHistoire.markOfflineOperationProcessed === 'function') {
                              MonHistoire.markOfflineOperationProcessed(op.id);
                            } else if (typeof MonHistoire.markOfflineQueueItemProcessed === 'function') {
                              // Nom alternatif possible de la fonction
                              MonHistoire.markOfflineQueueItemProcessed(op.id);
                            } else {
                              console.warn("Fonction de marquage des opérations hors ligne non disponible");
                            }
                          }
                        })
                        .catch(function(error) {
                          console.error("Erreur lors du traitement du partage hors ligne:", error);
                        });
                    } else {
                      console.warn("Module de stockage non disponible pour traiter les opérations hors ligne");
                    }
                  });
                }
              } catch (error) {
                console.error("Erreur dans l'écouteur de traitement des opérations hors ligne:", error);
              }
            });
          }, MAX_EVENT_INIT_ATTEMPTS);
        } else {
          // Fallback si MonHistoire.common n'est pas disponible
          if (eventInitAttempts < MAX_EVENT_INIT_ATTEMPTS) {
            eventInitAttempts++;
            setTimeout(initEventListeners, 200);
          } else {
            console.error("Système d'événements non disponible");
          }
        }
        return;
      }
      
      // Écouteur pour le changement de profil
      MonHistoire.events.on("profilChange", function(profilActif) {
        try {
          console.log("Changement de profil détecté:", profilActif ? profilActif.type : "inconnu");
          
          // Attendre un court instant pour s'assurer que le changement de profil est bien pris en compte
          setTimeout(function() {
            try {
              // Réinitialiser les écouteurs de notifications
              if (sharingModule.realtime) {
                if (typeof sharingModule.realtime.configurerEcouteurNotificationsRealtime === 'function') {
                  sharingModule.realtime.configurerEcouteurNotificationsRealtime();
                }
                if (typeof sharingModule.realtime.configurerEcouteurHistoiresPartagees === 'function') {
                  sharingModule.realtime.configurerEcouteurHistoiresPartagees();
                }
              }
              
              // Vérifier s'il y a des histoires partagées pour ce profil
              const user = firebase.auth().currentUser;
              if (user && sharingModule.storage && typeof sharingModule.storage.verifierHistoiresPartageesProfilActif === 'function') {
                sharingModule.storage.verifierHistoiresPartageesProfilActif(user)
                  .then(function() {
                    // Mettre à jour l'indicateur de notification
                    if (sharingModule.notifications) {
                      if (typeof sharingModule.notifications.mettreAJourIndicateurNotification === 'function') {
                        sharingModule.notifications.mettreAJourIndicateurNotification();
                      }
                      if (typeof sharingModule.notifications.mettreAJourIndicateurNotificationProfilsListe === 'function') {
                        sharingModule.notifications.mettreAJourIndicateurNotificationProfilsListe();
                      }
                    } else if (typeof sharingModule.mettreAJourIndicateurNotification === 'function') {
                      // Utiliser la fonction exposée au module principal si disponible
                      sharingModule.mettreAJourIndicateurNotification();
                    }
                  })
                  .catch(function(error) {
                    console.error("Erreur lors de la vérification des histoires partagées:", error);
                  });
              }
            } catch (innerError) {
              console.error("Erreur lors du traitement du changement de profil:", innerError);
            }
          }, 1000);
        } catch (error) {
          console.error("Erreur dans l'écouteur de changement de profil:", error);
        }
      });
      
      // Écouteur pour le traitement des opérations hors ligne
      MonHistoire.events.on("processOfflineQueue", function(operations) {
        try {
          if (!operations || !operations.length) return;
          
          // Traiter les opérations de partage d'histoire
          const partageOperations = operations.filter(function(op) { return op.type === "partageHistoire"; });
          if (partageOperations.length > 0) {
            console.log(`Traitement de ${partageOperations.length} opérations de partage hors ligne`);
            
            // Traiter chaque opération de partage
            partageOperations.forEach(function(op) {
              if (sharingModule.storage && typeof sharingModule.storage.processOfflinePartage === 'function') {
                sharingModule.storage.processOfflinePartage(op.data)
                  .then(function(success) {
                    if (success) {
                      // Marquer l'opération comme traitée
                      if (typeof MonHistoire.markOfflineOperationProcessed === 'function') {
                        MonHistoire.markOfflineOperationProcessed(op.id);
                      } else if (typeof MonHistoire.markOfflineQueueItemProcessed === 'function') {
                        // Nom alternatif possible de la fonction
                        MonHistoire.markOfflineQueueItemProcessed(op.id);
                      } else {
                        console.warn("Fonction de marquage des opérations hors ligne non disponible");
                      }
                    }
                  })
                  .catch(function(error) {
                    console.error("Erreur lors du traitement du partage hors ligne:", error);
                  });
              } else {
                console.warn("Module de stockage non disponible pour traiter les opérations hors ligne");
              }
            });
          }
        } catch (error) {
          console.error("Erreur dans l'écouteur de traitement des opérations hors ligne:", error);
        }
      });
      
      // Écouteur pour la connexion/déconnexion
      if (firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged(function(user) {
          try {
            if (user) {
              console.log("Utilisateur connecté, initialisation du compteur de notifications");
              // Initialiser le compteur de notifications
              initNotificationsCounter(user);
            } else {
              console.log("Utilisateur déconnecté, réinitialisation du compteur de notifications");
              // Réinitialiser le compteur de notifications
              sharingModule.notificationsNonLues = {};
              
              // Mettre à jour l'interface utilisateur
              if (typeof sharingModule.mettreAJourIndicateurNotification === 'function') {
                sharingModule.mettreAJourIndicateurNotification();
              }
            }
          } catch (error) {
            console.error("Erreur dans l'écouteur d'authentification:", error);
          }
        });
      } else {
        console.error("Firebase Auth non disponible");
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation des écouteurs d'événements:", error);
    }
  }
  
  /**
   * Initialise le compteur de notifications non lues
   * @param {Object} user - L'utilisateur Firebase actuel
   */
  function initNotificationsCounter(user) {
    try {
      // Si l'utilisateur n'est pas fourni, utiliser l'utilisateur actuel
      if (!user && firebase && firebase.auth) {
        user = firebase.auth().currentUser;
      }
      
      if (!user) {
        console.log("Impossible d'initialiser le compteur de notifications: utilisateur non connecté");
        return;
      }
      
      // Initialiser le compteur de notifications
      if (sharingModule.notifications && typeof sharingModule.notifications.initialiserCompteurNotifications === 'function') {
        sharingModule.notifications.initialiserCompteurNotifications(user)
          .then(function() {
            // Mettre à jour l'indicateur de notification
            if (typeof sharingModule.notifications.mettreAJourIndicateurNotification === 'function') {
              sharingModule.notifications.mettreAJourIndicateurNotification();
            }
            if (typeof sharingModule.notifications.mettreAJourIndicateurNotificationProfilsListe === 'function') {
              sharingModule.notifications.mettreAJourIndicateurNotificationProfilsListe();
            }
          })
          .catch(function(error) {
            console.error("Erreur lors de l'initialisation du compteur de notifications:", error);
          });
      } else if (typeof sharingModule.initialiserCompteurNotifications === 'function') {
        // Utiliser la fonction exposée au module principal si disponible
        sharingModule.initialiserCompteurNotifications(user)
          .then(function() {
            if (typeof sharingModule.mettreAJourIndicateurNotification === 'function') {
              sharingModule.mettreAJourIndicateurNotification();
            }
          })
          .catch(function(error) {
            console.error("Erreur lors de l'initialisation du compteur de notifications:", error);
          });
      } else {
        console.warn("Fonction d'initialisation du compteur de notifications non disponible");
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation du compteur de notifications:", error);
    }
  }

  // ===== API publique du module sharing =====

  /**
   * Initialise les sous-modules de partage
   */
  function init() {
    try {
      if (sharingModule.storage && typeof sharingModule.storage.init === 'function') {
        sharingModule.storage.init();
      }
      if (sharingModule.ui && typeof sharingModule.ui.init === 'function') {
        sharingModule.ui.init();
      }
      if (sharingModule.notifications && typeof sharingModule.notifications.init === 'function') {
        sharingModule.notifications.init();
      }
      if (sharingModule.realtime && typeof sharingModule.realtime.init === 'function') {
        sharingModule.realtime.init();
      }
    } catch (error) {
      console.error("Erreur lors de l'initialisation du module sharing:", error);
    }
  }

  /**
   * Vérifie s'il existe des histoires partagées pour le profil actif
   */
  function verifierHistoiresPartagees() {
    try {
      if (!firebase || !firebase.auth) return;
      const user = firebase.auth().currentUser;
      if (!user) return;

      if (sharingModule.storage && typeof sharingModule.storage.verifierHistoiresPartageesProfilActif === 'function') {
        sharingModule.storage.verifierHistoiresPartageesProfilActif(user)
          .then(function() {
            if (sharingModule.notifications) {
              if (typeof sharingModule.notifications.mettreAJourIndicateurNotification === 'function') {
                sharingModule.notifications.mettreAJourIndicateurNotification();
              }
              if (typeof sharingModule.notifications.mettreAJourIndicateurNotificationProfilsListe === 'function') {
                sharingModule.notifications.mettreAJourIndicateurNotificationProfilsListe();
              }
            }
          })
          .catch(function(error) {
            console.error("Erreur lors de la vérification des histoires partagées:", error);
          });
      }

      if (sharingModule.realtime && typeof sharingModule.realtime.configurerEcouteurHistoiresPartagees === 'function') {
        sharingModule.realtime.configurerEcouteurHistoiresPartagees();
      }
    } catch (error) {
      console.error("Erreur dans verifierHistoiresPartagees:", error);
    }
  }

  /**
   * Ouvre la modale de partage
   */
  function ouvrirModalePartage() {
    if (sharingModule.ui && typeof sharingModule.ui.ouvrirModalePartage === 'function') {
      return sharingModule.ui.ouvrirModalePartage();
    }
  }

  /**
   * Ferme la modale de partage
   */
  function fermerModalePartage() {
    if (sharingModule.ui && typeof sharingModule.ui.fermerModalePartage === 'function') {
      return sharingModule.ui.fermerModalePartage();
    }
  }

  /**
   * Partage l'histoire avec le profil sélectionné
   */
  function partagerHistoire(type, id, prenom) {
    if (sharingModule.storage && typeof sharingModule.storage.partagerHistoire === 'function') {
      return sharingModule.storage.partagerHistoire(type, id, prenom, sharingModule.histoireAPartager);
    }
    return Promise.resolve(false);
  }

  /**
   * Traite un partage hors ligne de la file d'attente
   */
  function processOfflinePartage(data) {
    if (sharingModule.storage && typeof sharingModule.storage.processOfflinePartage === 'function') {
      return sharingModule.storage.processOfflinePartage(data);
    }
    return Promise.resolve(false);
  }

  /**
   * Indique si l'application est connectée
   */
  function isConnected() {
    if (sharingModule.realtime && typeof sharingModule.realtime.isConnected === 'function') {
      return sharingModule.realtime.isConnected();
    }
    return navigator.onLine && MonHistoire.state.isConnected !== false;
  }

  /**
   * Initialise le compteur de notifications non lues
   */
  function initialiserCompteurNotifications(user) {
    if (sharingModule.notifications && typeof sharingModule.notifications.initialiserCompteurNotifications === 'function') {
      return sharingModule.notifications.initialiserCompteurNotifications(user);
    }
    return Promise.resolve();
  }

  /**
   * Met à jour l'indicateur de notification principal
   */
  function mettreAJourIndicateurNotification() {
    if (sharingModule.notifications && typeof sharingModule.notifications.mettreAJourIndicateurNotification === 'function') {
      return sharingModule.notifications.mettreAJourIndicateurNotification();
    }
  }

  // Exposer l'API
  sharingModule.init = init;
  sharingModule.verifierHistoiresPartagees = verifierHistoiresPartagees;
  sharingModule.ouvrirModalePartage = ouvrirModalePartage;
  sharingModule.fermerModalePartage = fermerModalePartage;
  sharingModule.partagerHistoire = partagerHistoire;
  sharingModule.processOfflinePartage = processOfflinePartage;
  sharingModule.isConnected = isConnected;
  sharingModule.initialiserCompteurNotifications = initialiserCompteurNotifications;
  sharingModule.mettreAJourIndicateurNotification = mettreAJourIndicateurNotification;
  
  try {
    // Initialiser les écouteurs d'événements
    initEventListeners();
    
    // Initialiser le compteur de notifications non lues
    // Attendre un court instant pour s'assurer que Firebase est prêt
    setTimeout(function() {
      initNotificationsCounter();
    }, 1000);
    
    // Initialiser le module principal
    if (typeof sharingModule.init === 'function') {
      // Attendre que le DOM soit chargé
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
          try {
            sharingModule.init();
          } catch (error) {
            console.error("Erreur lors de l'initialisation du module de partage:", error);
          }
        });
      } else {
        // Le DOM est déjà chargé
        try {
          sharingModule.init();
        } catch (error) {
          console.error("Erreur lors de l'initialisation du module de partage:", error);
        }
      }
    } else {
      console.warn("Fonction d'initialisation du module de partage non disponible");
    }
    
    console.log("Module de partage d'histoires chargé avec succès");
  } catch (error) {
    console.error("Erreur lors du chargement du module de partage d'histoires:", error);
  }
})();
