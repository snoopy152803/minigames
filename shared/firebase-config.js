// ---------------------------------------------------------------------------
// Fill this in with YOUR Firebase project's config once you've created one.
//
// How to get these values:
//   1. Go to https://console.firebase.google.com and create a project.
//   2. In Project settings > General > Your apps, add a "Web app".
//   3. Firebase shows you a config object — copy those values in below,
//      INCLUDING databaseURL (Realtime Database needs it; Firestore configs
//      you find in older tutorials often omit it — if yours doesn't show
//      one, open the Realtime Database page in the console and copy the
//      URL shown at the top, e.g. "https://your-project-default-rtdb
//      .firebaseio.com").
//   4. In the console, enable Authentication > Sign-in method > Email/Password.
//   5. In the console, create a Realtime Database (you've done this).
//   6. Set Realtime Database security rules so only your admin account(s)
//      can write the shared puzzle data (anyone can read it, since the
//      games need to). In the console: Realtime Database > Rules:
//
//        {
//          "rules": {
//            "puzzles": {
//              ".read": true,
//              ".write": "auth != null && auth.token.email === 'you@example.com'"
//            }
//          }
//        }
//
//      For more than one admin, use something like:
//        "auth != null && (auth.token.email === 'you@example.com' || auth.token.email === 'other@example.com')"
//
//      (ADMIN_EMAILS below only hides the admin.html UI from non-admins —
//      it does NOT stop someone from writing to the database directly,
//      since this file is public. The rule above is the actual security
//      boundary.)
//
// Until you fill this in (apiKey stays "REPLACE_ME"), the site works fine as
// a local demo: login/signup and the shared admin-edited puzzle are simply
// disabled, and every game falls back to the word lists bundled in data/.
// ---------------------------------------------------------------------------
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyBUFaGvFjPe4Hjop2mb0kd2_clQiU3rAdE",
  authDomain: "doggyminigames.firebaseapp.com",
  databaseURL: "https://doggyminigames-default-rtdb.firebaseio.com",
  projectId: "doggyminigames",
  storageBucket: "doggyminigames.firebasestorage.app",
  messagingSenderId: "863450519470",
  appId: "1:863450519470:web:4c2955ef0113d6beba1a3f"
};

// List the email address(es) allowed to use admin.html. This is only a
// convenience for hiding the UI — the *real* enforcement has to happen in
// your Realtime Database security rules (see comments above), since anyone
// can read this file.
window.ADMIN_EMAILS = [
  // "you@example.com"
];
