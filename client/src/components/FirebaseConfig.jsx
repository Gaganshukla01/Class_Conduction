import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD6qXMEcaEM8uK8X8pl-QHvemAvRg7gGWU",
  authDomain: "warrentyassignment.firebaseapp.com",
  projectId: "warrentyassignment",
  storageBucket: "warrentyassignment.firebasestorage.app",
  messagingSenderId: "520307777730",
  appId: "1:520307777730:web:adff7aa9603b77b540db5b",
  measurementId: "G-Z324K5BBBE"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);