const fs = require('fs');
const path = require('path');

// Liste des fichiers et dossiers à déplacer dans 'frontend'
const filesToMove = [
    'components',
    'services',
    'App.tsx',
    'index.tsx',
    'index.html',
    'types.ts',
    'constants.ts',
    'metadata.json',
    'tsconfig.json',
    'tailwind.config.js',
    'postcss.config.js',
    '.env' // Le .env racine va au frontend
];

// Création du dossier frontend s'il n'existe pas
const frontendDir = path.join(__dirname, 'frontend');
if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir);
    console.log('Dossier frontend créé.');
}

// Déplacement des fichiers
filesToMove.forEach(file => {
    const oldPath = path.join(__dirname, file);
    const newPath = path.join(frontendDir, file);

    if (fs.existsSync(oldPath)) {
        try {
            fs.renameSync(oldPath, newPath);
            console.log(`Déplacé : ${file} -> frontend/${file}`);
        } catch (err) {
            console.error(`Erreur lors du déplacement de ${file}:`, err);
        }
    }
});

console.log('------------------------------------------------');
console.log('STRUCTURE DU PROJET MISE À JOUR AVEC SUCCÈS !');
console.log('------------------------------------------------');
console.log('Veuillez maintenant exécuter :');
console.log('1. cd frontend && npm install');
console.log('2. cd ../backend && npm install');
console.log('------------------------------------------------');
