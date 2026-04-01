import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCbBCJDeqaFsrGSxlbg5pzb6pZ2vrGJ87A",
  authDomain: "isba-1c8fa.firebaseapp.com",
  projectId: "isba-1c8fa",
  storageBucket: "isba-1c8fa.firebasestorage.app",
  messagingSenderId: "518945765838",
  appId: "1:518945765838:web:8016813df1e4861cbc139f",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
