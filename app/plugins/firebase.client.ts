import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:            "AIzaSyABpf3YcrqeaKoMzMImxgQT1V7ffK2ebEE",
  authDomain:        "daisen-seitai-blog.firebaseapp.com",
  projectId:         "daisen-seitai-blog",
  storageBucket:     "daisen-seitai-blog.firebasestorage.app",
  messagingSenderId: "865290283311",
  appId:             "1:865290283311:web:c789daca971efd414899da"
};

const app = initializeApp(firebaseConfig);

export const db      = getFirestore(app);
export const auth    = getAuth(app);
export const storage = getStorage(app);

export default defineNuxtPlugin(() => {
  return {
    provide: {
      db,
      auth,
      storage,
    }
  };
});