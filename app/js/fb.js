// تحميل Firebase (النسخة الحديثة) من ملفات محلية داخل التطبيق.
// لا نستعمل نسخة compat لأنها تفتح صفحة مخفية من خوادم جوجل عند التشغيل، فيعلق التطبيق بدون إنترنت.
import { initializeApp } from '../vendor/fb/firebase-app.js';
import {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail,
  reauthenticateWithCredential, updatePassword, verifyBeforeUpdateEmail, signOut, EmailAuthProvider,
} from '../vendor/fb/firebase-auth.js';
import {
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, collection, onSnapshot, getDoc, setDoc, writeBatch, waitForPendingWrites,
} from '../vendor/fb/firebase-firestore.js';

window.__fbResolve({
  initializeApp,
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail,
  reauthenticateWithCredential, updatePassword, verifyBeforeUpdateEmail, signOut, EmailAuthProvider,
  initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, collection, onSnapshot, getDoc, setDoc, writeBatch, waitForPendingWrites,
});
