// Serveur HTTP simple pour servir les fichiers statiques
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// Types MIME pour les extensions de fichiers courantes
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain'
};

// Créer le serveur HTTP
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Gérer la requête pour la racine
  let filePath = req.url === '/' ? './index.html' : '.' + req.url;
  
  // Obtenir l'extension du fichier
  const extname = path.extname(filePath).toLowerCase();
  
  // Définir le type de contenu par défaut
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // Lire le fichier
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Fichier non trouvé
        fs.readFile('./404.html', (err, content) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        });
      } else {
        // Erreur serveur
        res.writeHead(500);
        res.end(`Erreur serveur: ${err.code}`);
      }
    } else {
      // Succès
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Appuyez sur Ctrl+C pour arrêter le serveur`);
});
