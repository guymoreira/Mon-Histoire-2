// js/features/audio.js
// Gestion de la lecture audio des histoires

// S'assurer que les objets nécessaires existent
window.MonHistoire = window.MonHistoire || {};
MonHistoire.features = MonHistoire.features || {};

// Module de lecture audio
MonHistoire.features.audio = {
  // Initialisation du module
  init() {
    // Initialise la synthèse vocale si disponible
    if ('speechSynthesis' in window) {
      MonHistoire.state.syntheseVocale = window.speechSynthesis;
    }
  },
  
  // Démarre la lecture audio de l'histoire
  demarrerLectureAudio() {
    // Vérifie si la synthèse vocale est disponible
    if (!MonHistoire.state.syntheseVocale) {
      MonHistoire.showMessageModal("La synthèse vocale n'est pas disponible sur ton appareil.");
      return;
    }
    
    // Si une lecture est déjà en cours, on l'arrête
    if (MonHistoire.state.lectureAudioEnCours) {
      this.arreterLectureAudio();
      return;
    }
    
    // Récupère l'histoire affichée
    const histoire = MonHistoire.features.stories.display.getHistoireAffichee();
    
    // Prépare le texte à lire
    let texteComplet = "";
    
    // Si l'histoire a un contenu HTML, on l'utilise pour extraire le texte
    if (histoire.contenu) {
      // Crée un élément temporaire pour parser le contenu HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = histoire.contenu;
      
      // Ajoute d'abord le titre
      texteComplet = histoire.titre + ". ";
      
      // Récupère tous les titres et paragraphes
      const elements = tempDiv.querySelectorAll('h3, p');
      
      // Parcourt les éléments
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        texteComplet += element.textContent + ". ";
      }
    } else {
      // Utilise les champs individuels
      texteComplet = [
        histoire.titre,
        "Chapitre 1",
        histoire.chapitre1,
        "Chapitre 2",
        histoire.chapitre2,
        "Chapitre 3",
        histoire.chapitre3,
        "Chapitre 4",
        histoire.chapitre4,
        "Chapitre 5",
        histoire.chapitre5
      ].filter(Boolean).join(". ");
    }
    
    // Crée un nouvel objet SpeechSynthesisUtterance
    const utterance = new SpeechSynthesisUtterance(texteComplet);
    
    // Définit la langue (français)
    utterance.lang = "fr-FR";
    
    // Définit la voix (si disponible)
    const voix = this.trouverVoixFrancaise();
    if (voix) {
      utterance.voice = voix;
    }
    
    // Définit le débit de parole (un peu plus lent pour les enfants)
    utterance.rate = 0.9;
    
    // Définit le volume
    utterance.volume = 1.0;
    
    // Gestionnaire d'événement pour la fin de la lecture
    utterance.onend = () => {
      this.finLectureAudio();
    };
    
    // Gestionnaire d'événement pour les erreurs
    utterance.onerror = (event) => {
      console.error("Erreur lors de la lecture audio:", event);
      this.finLectureAudio();
      MonHistoire.showMessageModal("Erreur lors de la lecture audio.");
    };
    
    // Démarre la lecture
    MonHistoire.state.syntheseVocale.speak(utterance);
    
    // Met à jour l'état
    MonHistoire.state.lectureAudioEnCours = true;
    MonHistoire.state.pauseAudio = false;
    
    // Met à jour l'interface
    this.mettreAJourInterfaceLectureAudio();
    
    // Log l'activité
    if (MonHistoire.core && MonHistoire.core.auth && firebase.auth().currentUser) {
      MonHistoire.core.auth.logActivite("lecture_audio", { 
        histoire_id: histoire.id,
        titre: histoire.titre
      });
    }
  },
  
  // Arrête la lecture audio
  arreterLectureAudio() {
    if (!MonHistoire.state.syntheseVocale) return;
    
    // Annule toutes les lectures en cours
    MonHistoire.state.syntheseVocale.cancel();
    
    // Met à jour l'état
    this.finLectureAudio();
  },
  
  // Met à jour l'état à la fin de la lecture
  finLectureAudio() {
    MonHistoire.state.lectureAudioEnCours = false;
    MonHistoire.state.pauseAudio = false;
    
    // Met à jour l'interface
    this.mettreAJourInterfaceLectureAudio();
  },
  
  // Met en pause ou reprend la lecture audio
  togglePauseLectureAudio() {
    if (!MonHistoire.state.syntheseVocale || !MonHistoire.state.lectureAudioEnCours) return;
    
    if (MonHistoire.state.pauseAudio) {
      // Reprend la lecture
      MonHistoire.state.syntheseVocale.resume();
      MonHistoire.state.pauseAudio = false;
    } else {
      // Met en pause la lecture
      MonHistoire.state.syntheseVocale.pause();
      MonHistoire.state.pauseAudio = true;
    }
    
    // Met à jour l'interface
    this.mettreAJourInterfaceLectureAudio();
  },
  
  // Met à jour l'interface de lecture audio
  mettreAJourInterfaceLectureAudio() {
    const btnAudio = document.getElementById("btn-audio");
    if (!btnAudio) return;
    
    if (MonHistoire.state.lectureAudioEnCours) {
      if (MonHistoire.state.pauseAudio) {
        // Lecture en pause
        btnAudio.innerHTML = "▶️";
        btnAudio.title = "Reprendre la lecture";
      } else {
        // Lecture en cours
        btnAudio.innerHTML = "⏸️";
        btnAudio.title = "Mettre en pause";
      }
    } else {
      // Pas de lecture en cours
      btnAudio.innerHTML = "🔊";
      btnAudio.title = "Lire l'histoire";
    }
  },
  
  // Trouve une voix française pour la synthèse vocale
  trouverVoixFrancaise() {
    if (!MonHistoire.state.syntheseVocale) return null;
    
    const voix = MonHistoire.state.syntheseVocale.getVoices();
    
    // Cherche d'abord une voix française féminine
    let voixFrancaiseFeminine = voix.find(v => 
      v.lang.includes("fr") && v.name.toLowerCase().includes("female")
    );
    
    if (voixFrancaiseFeminine) return voixFrancaiseFeminine;
    
    // Sinon, cherche une voix française quelconque
    let voixFrancaise = voix.find(v => v.lang.includes("fr"));
    
    if (voixFrancaise) return voixFrancaise;
    
    // Si aucune voix française n'est trouvée, retourne null
    return null;
  },
  
  // Gère le clic sur le bouton audio
  gererClicBoutonAudio() {
    if (MonHistoire.state.lectureAudioEnCours) {
      if (MonHistoire.state.pauseAudio) {
        this.togglePauseLectureAudio();
      } else {
        this.arreterLectureAudio();
      }
    } else {
      this.demarrerLectureAudio();
    }
  }
};

// Exporter pour utilisation dans d'autres modules
window.MonHistoire = MonHistoire;
