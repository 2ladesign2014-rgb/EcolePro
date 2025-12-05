# EcolePro - Plateforme de Gestion Scolaire Unifiée

**EcolePro** est une application web professionnelle (SPA) conçue pour la gestion complète d'établissements scolaires (Primaire, Secondaire, Supérieur). Elle intègre la gestion académique, financière, administrative et pédagogique dans une interface moderne et intuitive.

---

## 🚀 Fonctionnalités Principales

*   **Multi-Établissements** : Gestion centralisée de plusieurs écoles par un Super Admin.
*   **Vie Scolaire** : Inscriptions, transferts d'élèves, suivi des absences.
*   **Pédagogie** : Cahier de texte numérique, gestion des notes, bulletins scolaires (calculs automatiques, rangs, appréciations).
*   **Ressources Humaines** : Gestion des enseignants, contrats, paie et salaires.
*   **Finances** : Suivi des scolarités, reçus, dépenses, caisse cantine, rapports financiers (Devise FCFA).
*   **Emploi du Temps** : Planification des cours, gestion des salles et visualisation par classe/professeur.
*   **Bibliothèque & Cantine** : Gestion des stocks, prêts de livres et menus.
*   **Communication** : Messagerie interne et annonces.
*   **Intelligence Artificielle** : Assistant IA (Gemini) pour la génération de rapports et l'analyse de performance.

---

## 🛠️ Prérequis Techniques

Pour faire tourner l'application en local ou la déployer, vous avez besoin de :

*   **Node.js** (Version 16 ou supérieure)
*   **npm** ou **yarn**
*   Une clé API **Google Gemini** (pour les fonctionnalités IA)

---

## 📦 Installation et Configuration

### 1. Cloner le projet
Récupérez les fichiers sources dans votre dossier de travail.

### 2. Installer les dépendances
Ouvrez un terminal à la racine du projet et exécutez :

```bash
npm install
# ou
yarn install
```

### 3. Configuration des Variables d'Environnement
Créez un fichier `.env` à la racine du projet (copiez `.env.example` s'il existe) et ajoutez votre clé API :

```env
# Clé API pour l'Assistant IA (Google Gemini)
API_KEY=votre_clé_api_google_ici

# Port (Optionnel pour le développement local)
PORT=3000
```

> **Note** : Sans la clé API, le module "Assistant IA" affichera des erreurs, mais le reste de l'application fonctionnera.

---

## ▶️ Démarrage en Développement

Pour lancer l'application en mode local (Hot Reload) :

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173` (ou le port indiqué par Vite).

---

## 🚢 Déploiement en Production

L'application est une **Single Page Application (SPA)** statique. Elle peut être hébergée sur n'importe quel serveur web (Apache, Nginx, Vercel, Netlify, etc.).

### 1. Construction du Build
Générez les fichiers optimisés pour la production :

```bash
npm run build
```

Cette commande va créer un dossier `dist/` à la racine du projet contenant :
*   `index.html`
*   Les fichiers JS et CSS minifiés dans `assets/`

### 2. Hébergement
Copiez simplement le contenu du dossier `dist/` vers la racine publique de votre serveur web.

**Exemple pour Apache/Nginx :**
Assurez-vous de configurer votre serveur pour rediriger toutes les requêtes vers `index.html` (pour gérer le routage React côté client).

**Configuration Nginx type :**
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

---

## 🔐 Comptes de Démonstration

L'application est pré-configurée avec des données fictives. Utilisez les boutons **"Accès Rapide (Démo)"** sur l'écran de connexion ou les identifiants suivants :

*   **Super Admin** (Accès total + Config multi-écoles) : `admin@ecolepro.ci` / `admin`
*   **Admin Établissement** : `directrice@ecolepro.ci`
*   **Enseignant** : `prof@ecolepro.ci`
*   **Économe** : `compta@ecolepro.ci`

> **Sécurité** : Le code PIN par défaut pour accéder aux paramètres sensibles est **0000**.

---

## 📂 Structure du Projet

```
/
├── components/       # Composants React (Vues et éléments UI)
├── services/         # Logique métier (Simulateur DB, API IA)
├── types.ts          # Définitions TypeScript (Modèles de données)
├── constants.ts      # Données de test (Mock Data) et Config par défaut
├── App.tsx           # Routeur principal et Gestion d'état global
├── index.html        # Point d'entrée HTML
└── package.json      # Dépendances et scripts
```

---

© 2024 EcolePro Suite. Conçu pour l'excellence éducative.
