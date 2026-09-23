# Guide du formateur — QCM SSIAP 1

Tout se pilote depuis la **console formateur**, sans toucher au code.

- **Console** : `⟨URL du site⟩/admin.html` (ex. `https://qcm-ssiap1.pages.dev/admin.html`)
- **Mot de passe** : `afms-formateur` (à changer — voir DEPLOIEMENT.md)

---

## 1) Donner l'accès aux apprenants (lien valable 12 jours)

1. Ouvre la console → encart **« 🔑 Accès apprenants »**.
2. Clique **« Générer un lien d'accès »**.
3. **Copie le lien** et envoie-le aux apprenants (mail, groupe, QR code…).

- Chaque clic génère un **lien unique**, **valable 12 jours**.
- Sans lien valide, la page du quiz affiche « 🔒 Accès réservé ».
- Tu peux générer autant de liens que tu veux (par session, par groupe…).

## 2) Corriger / compléter les réponses

Dans la console, chaque question s'affiche avec ses propositions :

- **Clic sur une proposition** = la marquer (ou non) comme **bonne réponse**. Un QCM peut en avoir **plusieurs** : coche **toutes** les bonnes (badge « ✓ bonne »).
- **Double-clic sur le texte** d'une proposition = corriger l'orthographe.
- Champ **« Justification / correction »** = le texte affiché à l'élève après validation (argument réglementaire, mnémo…).
- **＋ Nouvelle question**, **Supprimer**, **recherche**, filtre **« ⚠ à revérifier »** (questions dont la justification contient « à revérifier »).
- Tout est **sauvegardé automatiquement** dans ton navigateur pendant que tu travailles.

## 3) Publier tes modifications

1. Clique **« Exporter answers.js »** → un fichier `answers.js` est téléchargé.
2. Dépose-le sur GitHub, dans le dossier **`app/`** du dépôt `qcm-ssiap1`
   (bouton **Add file → Upload files**, ou glisser-déposer, puis **Commit**).
3. **Cloudflare republie tout seul** en ~1 minute. Les apprenants voient la nouvelle version au rechargement.

> 💡 Le fichier `answers.js` contient **toute** ta validation : bonnes réponses, justifications,
> questions ajoutées et suppressions. C'est le **seul** fichier à redéposer.

## 4) Bon à savoir

- Le lien du quiz et celui de la console sont **volontairement séparés** : la console n'est liée nulle part depuis le quiz.
- Le mot de passe de la console est un verrou « anti-curieux ». La vraie protection reste ton compte GitHub (seul lui peut publier).
- **Ne mélange pas avec le TFP APS** : ce dépôt et ce site ne concernent que le **SSIAP 1**.
