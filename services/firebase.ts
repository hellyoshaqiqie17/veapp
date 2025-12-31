import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  initializeAuth,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
// @ts-ignore - getReactNativePersistence exists in RN bundle
import { getReactNativePersistence } from 'firebase/auth';
import { child, equalTo, get, getDatabase, onValue, orderByChild, push, query, ref, remove, set, update } from 'firebase/database';
import { addDoc, collection, getDocs, getFirestore, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB9qUzLViR5uALw9Qf_xzJpd20acoV0FEs",
  authDomain: "velinked-web.firebaseapp.com",
  databaseURL: "https://velinked-web-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "velinked-web",
  storageBucket: "velinked-web.appspot.com",
  messagingSenderId: "844821073092",
  appId: "1:844821073092:web:f243c25668079240ec0d91",
  measurementId: "G-CLGQ4RWWTX"
};

// Initialize Firebase App (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const db = getFirestore(app);
const rtdb = getDatabase(app);

// Initialize Auth with AsyncStorage persistence (prevent duplicate initialization)
let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error: any) {
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    throw error;
  }
}

export {
  addDoc, auth, child, collection, createUserWithEmailAndPassword, db, equalTo, get, getDocs,
  GoogleAuthProvider, onAuthStateChanged, onSnapshot, onValue, orderByChild, push, query, ref, remove, rtdb,
  set, signInWithCredential, signInWithEmailAndPassword, signOut, update, User
};

