// ---------------------------------------------------------------------------
// Fill this in with YOUR Firebase project's config once you've created one.
//
// How to get these values:
//   1. Go to https://console.firebase.google.com and create a project.
//   2. In Project settings > General > Your apps, add a "Web app".
//   3. Firebase shows you a config object — copy those values in below.
//   4. In the console, enable Authentication > Sign-in method > Email/Password.
//   5. In the console, create a Firestore database (production mode is fine).
//   6. Set Firestore security rules so only your admin account(s) can write
//      the shared puzzle data (anyone can read it, since the games need to):
//
//        rules_version = '2';
//        service cloud.firestore {
//          match /databases/{database}/documents {
//            match /puzzles/{game} {
//              allow read: if true;
//              allow write: if request.auth != null
//                && request.auth.token.email in ["you@example.com"];
//            }
//          }
//        }
//
//      (ADMIN_EMAILS below only hides the admin.html UI from non-admins —
//      it does NOT stop someone from writing to Firestore directly, since
//      this file is public. The rule above is the actual security boundary.)
//
// Until you fill this in (apiKey stays "REPLACE_ME"), the site works fine as
// a local demo: login/signup and the shared admin-edited puzzle are simply
// disabled, and every game falls back to the word lists bundled in data/.
// ---------------------------------------------------------------------------
window.FIREBASE_CONFIG = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME"
};

// List the email address(es) allowed to use admin.html. This is only a
// convenience for hiding the UI — the *real* enforcement has to happen in
// your Firestore security rules (see admin.html comments), since anyone can
// read this file.
window.ADMIN_EMAILS = [
  // "you@example.com"
];
