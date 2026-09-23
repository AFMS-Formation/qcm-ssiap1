# Mise en ligne — GitHub + Cloudflare Pages (à faire une seule fois)

Objectif : le QCM SSIAP 1 en ligne, avec des mises à jour possibles **par le formateur, sans code** :
il exporte `answers.js` depuis la console, le dépose sur GitHub, et **Cloudflare republie tout seul**.

> ⚠️ Projet **distinct** du TFP APS. Utilise un **dépôt GitHub dédié** (`qcm-ssiap1`) et un
> **projet Cloudflare Pages dédié** : aucune confusion possible entre les deux formations.

---

## Étape 1 — Mettre ce dossier sur GitHub

1. Crée un dépôt **`qcm-ssiap1`** (sur le même compte/organisation que `qcu-afms`, ou un autre — au choix).
2. Depuis le dossier `qcm-ssiap1/` :
   ```bash
   git init
   git add .
   git commit -m "QCM SSIAP 1 — version initiale"
   git branch -M main
   git remote add origin https://github.com/<COMPTE-OU-ORG>/qcm-ssiap1.git
   git push -u origin main
   ```

## Étape 2 — Brancher Cloudflare Pages

1. Sur **dash.cloudflare.com** → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Choisis le dépôt **`qcm-ssiap1`**.
3. Réglages de build :
   - **Framework preset** : *None*
   - **Build command** : *(laisser vide)*
   - **Build output directory** : **`app`**
4. **Save and Deploy**. Tu obtiens une URL, ex. `https://qcm-ssiap1.pages.dev`.
   - **Quiz (apprenants)** : `https://qcm-ssiap1.pages.dev` (accessible **uniquement avec un lien** généré par le formateur)
   - **Console formateur** : `https://qcm-ssiap1.pages.dev/admin.html`

> Le fichier `app/_headers` est lu automatiquement par Cloudflare Pages (empêche le cache de figer `answers.js`).

## Étape 3 — Préparer le formateur

1. Renseigne les liens dans **[GUIDE_FORMATEUR.md](GUIDE_FORMATEUR.md)** (console + fichier `answers.js` sur GitHub).
2. Donne-lui le mot de passe de la console et, si besoin, l'accès au dépôt GitHub
   (**Settings → Collaborators**).

À chaque dépôt d'un nouvel `answers.js` sur GitHub, Cloudflare Pages redéploie automatiquement.

---

## Mot de passe de la console formateur

`admin.html` est protégée par un **mot de passe** (verrou côté navigateur, haché SHA-256).
- **Par défaut : `afms-formateur`** — à **changer**.
- **Pour le changer** : ouvre `…/admin-setup.html`, tape le nouveau mot de passe, copie la ligne
  obtenue et remplace la ligne dans `app/admin-config.js`, puis republie (dépose le fichier sur GitHub).

## Accès apprenants (liens qui expirent)

- Réglé dans `app/access-config.js` : `enabled: true`, `linkDays: 12`, `secret: <propre au SSIAP 1>`.
- Le formateur génère les liens depuis la console (voir GUIDE_FORMATEUR.md). Chaque lien est **unique**
  et **valable 12 jours**.
- ⚠️ Ne **jamais** réutiliser le `secret` du TFP APS ici (il est déjà différent). Le changer invalide
  tous les liens déjà distribués.

## Note
- Les bonnes réponses sont dans un fichier public (`app/answers.js`) : visibles par qui inspecte le
  code source. Normal pour un outil d'entraînement.
