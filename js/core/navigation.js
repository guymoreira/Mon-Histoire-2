// js/core/navigation.js
// Gestion de la navigation entre les écrans

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.core = MonHistoire.core || {};

// Module de navigation
MonHistoire.core.navigation = {
  // Initialisation du module
  init() {
    // Écoute les changements de profil pour mettre à jour l'affichage du footer
    if (MonHistoire.events) {
      MonHistoire.events.on('profilChange', () => {
        this.mettreAJourFooter();
      });
    }
  },
  
  // Met à jour l'affichage du footer en fonction du profil actif
  mettreAJourFooter() {
    // Vérifie si on est sur l'écran d'accueil
    if (MonHistoire.state.currentScreen === "accueil") {
      const footer = document.querySelector('footer');
      if (footer) {
        // Vérifie si le profil actif est un enfant
        if (MonHistoire.state && MonHistoire.state.profilActif && MonHistoire.state.profilActif.type === "enfant") {
          footer.style.display = 'none'; // Masque le footer pour les profils enfants
        } else {
          footer.style.display = 'block'; // Affiche le footer pour les profils parents
        }
      }
    }
  },
  
  // Affiche un écran, mémorise l'historique et gère le bouton "Sauvegarder"
  showScreen(screen) {
    if (screen === MonHistoire.state.currentScreen) return;
    
    // Arrête la lecture audio si elle est en cours
    if (MonHistoire.state.lectureAudioEnCours && 
        MonHistoire.features && 
        MonHistoire.features.audio) {
      MonHistoire.features.audio.arreterLectureAudio();
    }
    
    // Mémorise l'écran précédent
    MonHistoire.state.previousScreen = MonHistoire.state.currentScreen;
    
    // Cas spécial pour l'écran d'accueil - correction du décalage
    const isAccueil = screen === "accueil";
    // On traite tous les écrans de la même façon pour éviter le décalage
    const comingFromAnyScreen = MonHistoire.state.currentScreen !== null;
    
    // Masque tous les écrans actifs avec une transition fluide
    const activeScreens = document.querySelectorAll('.screen.active');
    
    // Si on a un écran actif, on le fait disparaître avec une animation
    if (activeScreens.length > 0) {
      // Traitement spécial pour l'écran d'accueil
      if (isAccueil && comingFromAnyScreen) {
        // Transition plus rapide pour éviter le décalage
        activeScreens.forEach(el => {
          el.classList.remove('active');
        });
        
        // Affiche immédiatement l'écran d'accueil
        const newScreen = document.getElementById(screen);
        if (newScreen) {
          // Réinitialise les styles qui pourraient causer le décalage
          newScreen.style.transform = "none";
          newScreen.style.opacity = "1";
          newScreen.classList.add('active');
        }
        
        // Met à jour l'écran courant
        MonHistoire.state.currentScreen = screen;
        
        // Gère les cas spéciaux immédiatement
        this.handleSpecialScreenCases(screen);
      } else {
        // Animation standard pour les autres transitions
        activeScreens.forEach(el => {
          // Ajoute une classe pour l'animation de sortie
          el.classList.add('fade-out');
          
          // Après l'animation, retire les classes
          setTimeout(() => {
            el.classList.remove('active', 'fade-out');
          }, 250); // Durée de l'animation de sortie
        });
        
        // Attend un peu avant d'afficher le nouvel écran pour une transition fluide
        setTimeout(() => {
          // Affiche le nouvel écran avec une animation d'entrée
          const newScreen = document.getElementById(screen);
          if (newScreen) {
            newScreen.classList.add('active', 'fade-in');
            
            // Retire la classe d'animation après qu'elle soit terminée
            setTimeout(() => {
              newScreen.classList.remove('fade-in');
            }, 300); // Durée de l'animation d'entrée
          }
          
          // Met à jour l'écran courant
          MonHistoire.state.currentScreen = screen;
          
          // Gère les cas spéciaux après l'animation
          this.handleSpecialScreenCases(screen);
        }, 150); // Délai entre la sortie et l'entrée
      }
    } else {
      // Si aucun écran actif, affiche directement le nouvel écran
      const newScreen = document.getElementById(screen);
      if (newScreen) {
        // Pour l'écran d'accueil, s'assure qu'il n'y a pas de décalage
        if (isAccueil) {
          newScreen.style.transform = "none";
          newScreen.style.opacity = "1";
          newScreen.classList.add('active');
        } else {
          newScreen.classList.add('active', 'fade-in');
          
          // Retire la classe d'animation après qu'elle soit terminée
          setTimeout(() => {
            newScreen.classList.remove('fade-in');
          }, 300);
        }
      }
      
      // Met à jour l'écran courant
      MonHistoire.state.currentScreen = screen;
      
      // Gère les cas spéciaux immédiatement
      this.handleSpecialScreenCases(screen);
    }
  },
  
  // Gère les cas spéciaux pour certains écrans
  handleSpecialScreenCases(screen) {
    // Cas spécial Résultat : affiche ou cache le bouton "Sauvegarder"
    if (screen === "resultat") {
      const btn = document.getElementById("btn-sauvegarde");
      // Affiche le bouton sauvegarde uniquement si connecté ET si on vient du formulaire de création
      if (firebase.auth().currentUser && MonHistoire.state.resultatSource === "formulaire") {
        btn.style.display = "inline-block";
      } else {
        btn.style.display = "none";
      }
    }

    // Cas particulier : si c'est Mes Histoires, on rafraîchit la liste
    if (screen === "mes-histoires") {
      if (MonHistoire.features && 
          MonHistoire.features.stories && 
          MonHistoire.features.stories.management) {
        MonHistoire.features.stories.management.afficherHistoiresSauvegardees();
      }
      
      // Affiche le bouton Accueil seulement si tu viens de "resultat"
      const btnAccueil = document.getElementById("btn-accueil-mes-histoires");
      const group = document.getElementById("mes-histoires-actions");
      
      if (MonHistoire.state.previousScreen === "resultat") {
        btnAccueil.style.display = "inline-block";
        group.classList.remove('single');
      } else {
        btnAccueil.style.display = "none";
        group.classList.add('single');
      }
    }
    
    // Cas spécial pour l'écran d'accueil - correction du décalage
    if (screen === "accueil") {
      // Récupère l'écran d'accueil
      const accueilScreen = document.getElementById("accueil");
      if (accueilScreen) {
        // Force le rafraîchissement du layout pour éviter le décalage
        accueilScreen.style.transform = "translateZ(0)";
        
        // Réinitialise après un court délai
        setTimeout(() => {
          accueilScreen.style.transform = "none";
        }, 50);
      }
      
      // Affiche le footer uniquement sur la page d'accueil ET si c'est un profil parent
      const footer = document.querySelector('footer');
      if (footer) {
        // Vérifie si le profil actif est un enfant
        if (MonHistoire.state && MonHistoire.state.profilActif && MonHistoire.state.profilActif.type === "enfant") {
          footer.style.display = 'none'; // Masque le footer pour les profils enfants
        } else {
          footer.style.display = 'block'; // Affiche le footer pour les profils parents
        }
      }
    } else {
      // Masque le footer sur les autres pages
      const footer = document.querySelector('footer');
      if (footer) {
        footer.style.display = 'none';
      }
    }
    
    // Émet un événement pour informer les autres modules
    MonHistoire.events.emit('screenChanged', { 
      screen: screen, 
      previousScreen: MonHistoire.state.previousScreen 
    });
  },
  
  // Bouton "Retour" : revient à l'écran précédent (ou accueil par défaut)
  goBack() {
    this.showScreen(MonHistoire.state.previousScreen || "accueil");
  },
  
  // Retour depuis l'écran résultat
  retourDepuisResultat() {
    if (MonHistoire.state.resultatSource === "mes-histoires") {
      this.showScreen("mes-histoires");
    } else {
      this.showScreen("formulaire");
    }
  }
};

// Exporter pour utilisation dans d'autres modules
window.MonHistoire = MonHistoire;
