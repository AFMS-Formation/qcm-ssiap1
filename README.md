# QCM SSIAP 1 — Générateur de QCM d'entraînement

Application web qui génère des **QCM (Questionnaires à Choix Multiple)** d'entraînement au
**SSIAP 1** (Service de Sécurité Incendie et d'Assistance à Personnes — niveau 1), à partir
d'une banque de questions issue des supports de formation AFMS.

> Site statique, sans serveur ni base de données. Chaque visiteur génère **son propre QCM**
> (tirage aléatoire) directement dans son navigateur.

> ℹ️ **Ne pas confondre avec le TFP APS.** Ce dépôt ne contient **que** le SSIAP 1.
> Le QCU du TFP APS est un projet **séparé** (dépôt `qcu-afms`). Rien n'est partagé entre les deux :
> banque de questions, correction, lien d'accès et mise en ligne sont propres à chaque formation.

---

## 🔗 Liens

| | Lien | Pour qui |
|---|---|---|
| **Quiz** | https://qcm-ssiap1.pages.dev | Les candidats / apprenants (**accès via un lien** généré par le formateur) |
| **Console formateur** | https://qcm-ssiap1.pages.dev/admin.html | Le formateur (réponses + génération des liens d'accès) |

## ✨ Ce que fait l'app

- ☑️ **Une OU plusieurs bonnes réponses** par question : il faut cocher **toutes** les bonnes (scoring par égalité exacte).
- ⏱️ **60 secondes par question** (chronomètre), **pas de retour en arrière**.
- 🎛️ **Deux formats** : *Révision libre* (5 / 10 / 20 / 40 / Max) et *Examen blanc* (**30 questions** tirées au hasard).
- 🔀 Propositions **mélangées** à chaque tirage pour éviter le par-cœur.
- ✅ **Correction immédiate** après chaque validation : bonnes réponses en vert, erreurs en rouge, **justification réglementaire + moyen mnémotechnique**.
- 🔐 **Accès par lien signé** fourni par le formateur, **valable 12 jours** (unique à chaque génération).
- 📄 **Export PDF** du corrigé.

## 🗂️ Structure du dépôt

```
qcm-ssiap1/
├── app/                  ← LE SITE (dossier publié par Cloudflare Pages)
│   ├── index.html        ← le quiz (apprenants)
│   ├── admin.html        ← la console formateur (réponses + génération de liens)
│   ├── app.js            ← moteur du quiz (multi-réponses)
│   ├── admin.js          ← console formateur
│   ├── styles.css
│   ├── questions.js      ← la banque de questions
│   ├── answers.js        ← ⭐ LA CLÉ DE CORRECTION (bonnes réponses + justifications) — le fichier qu'on met à jour
│   ├── access.js         ← génération / vérification des liens d'accès signés
│   ├── access-config.js  ← réglages d'accès (activation, secret, durée = 12 jours)
│   ├── admin-config.js   ← mot de passe (haché) de la console formateur
│   ├── admin-setup.html  ← pour changer le mot de passe de la console
│   └── _headers          ← empêche le cache de figer les mises à jour
├── README.md
├── DEPLOIEMENT.md        ← 🚀 mise en ligne GitHub + Cloudflare (à faire une fois)
└── GUIDE_FORMATEUR.md    ← 🔄 quotidien du formateur (liens d'accès + mise à jour des réponses)
```

## 🔑 Accès apprenants (lien qui expire)

Le quiz est protégé : il faut un **lien signé** pour y entrer.
Le formateur génère ce lien depuis la console (`/admin.html` → « Générer un lien d'accès »).

- Chaque lien est **unique** et **valable 12 jours** (réglage dans `app/access-config.js` : `linkDays`).
- Sans lien valide, la page affiche « 🔒 Accès réservé ».
- Le secret de signature est **propre au SSIAP 1** : un lien du TFP APS ne fonctionne pas ici, et inversement.

## 🔄 Mettre à jour les questions / réponses

Tout se fait dans la **console formateur** (`admin.html`), sans toucher au code :
clic pour (dé)cocher les bonnes réponses, double-clic pour corriger un texte,
**＋ Nouvelle question**, **Supprimer**, recherche, champ **justification** affichée à l'élève.

👉 Procédure complète (édition → export → publication) : **[GUIDE_FORMATEUR.md](GUIDE_FORMATEUR.md)**

En résumé : *modifier dans la console → « Exporter answers.js » → déposer ce fichier sur GitHub
(dossier `app/`) → Cloudflare republie automatiquement en ~1 min.*

## 🚀 Déploiement (une seule fois)

GitHub + Cloudflare Pages, étapes détaillées : **[DEPLOIEMENT.md](DEPLOIEMENT.md)**

## 🧠 Comment ça marche (l'essentiel)

- **Pas de serveur.** L'app tourne dans le navigateur. La « base » des bonnes réponses est le
  fichier **`app/answers.js`** — c'est le **seul** fichier à mettre à jour pour changer une
  correction, ajouter ou supprimer une question.
- **Publier une mise à jour = remplacer `app/answers.js`** sur GitHub → Cloudflare redéploie tout seul.
- `answers.js` : `answer` est une **liste** d'index (0-based) car un QCM peut avoir **plusieurs** bonnes réponses.
  Il peut aussi contenir des questions ajoutées à la main et des suppressions (`{ "deleted": true }`).
- Les bonnes réponses sont dans un fichier public : visibles par qui inspecte le code source
  (normal pour un outil d'entraînement, où la correction est de toute façon affichée).

---

*Banque de questions SSIAP 1 — AFMS Formation. Justifications indicatives (arrêté du 2 mai 2005,
règlement de sécurité ERP du 25 juin 1980, arrêté IGH du 30 décembre 2011, CCH, Code du travail),
à valider par le formateur.*
