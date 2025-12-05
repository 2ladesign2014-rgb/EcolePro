# EcolePro - Plateforme de Gestion Scolaire

## 🏗️ Mise en place de la structure (Premier lancement)

Si vous venez de récupérer le projet et que les dossiers `frontend` et `backend` ne contiennent pas encore vos fichiers sources, exécutez cette commande à la racine :

```bash
npm run setup
```
*Cela exécutera le script `install_structure.js` qui déplacera automatiquement les fichiers React dans le dossier `frontend`.*

## 🚀 Installation & Démarrage

### 1. Installation des dépendances
Une fois la structure en place :

```bash
# Installer pour le frontend et le backend
npm run install:all
```

### 2. Démarrer l'application (Frontend)
```bash
npm run dev:frontend
```
L'application sera accessible sur `http://localhost:3000`.

### 3. Démarrer le serveur (Backend - Optionnel pour le moment)
```bash
npm run dev:backend
```
Le serveur API sera accessible sur `http://localhost:5000`.

---

## 📂 Structure du Projet

*   **/frontend** : Contient toute l'application React (Interface Utilisateur).
*   **/backend** : Contient le serveur Node.js/Express (API et Base de données future).
*   **install_structure.js** : Script utilitaire pour organiser les dossiers.

