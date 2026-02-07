// Firebase Configuration
// Replace these values with your own Firebase project credentials
// Get them from: Firebase Console > Project Settings > General > Your apps > SDK setup and configuration

const firebaseConfig = {
  apiKey: "AIzaSyByKbCRRMwKlKV0JUuuYjJPiysrID8NjRg",
  authDomain: "anhsweb-fa3f2.firebaseapp.com",
  projectId: "anhsweb-fa3f2",
  storageBucket: "anhsweb-fa3f2.firebasestorage.app",
  messagingSenderId: "56335212491",
  appId: "1:56335212491:web:c7117bf480a3ec8f85204e",
  measurementId: "G-PCNRQYVCM4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get database reference
const database = firebase.database();
const auth = firebase.auth();
