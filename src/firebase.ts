import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace these values with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCSOCBgOnqgWEYPnJ9z0_vcf3TJVNAmDDA",
  authDomain: "creatorstack-bbcd0.firebaseapp.com",
  projectId: "creatorstack-bbcd0",
  storageBucket: "creatorstack-bbcd0.firebasestorage.app",
  messagingSenderId: "467070445325",
  appId: "1:467070445325:web:de1c8345c5f711215eb244",
  measurementId: "G-K0437TZLQ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
