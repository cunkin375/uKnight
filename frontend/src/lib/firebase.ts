
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyC3OKoilMyGSfrzATJOje9vjg4OFDlPnqc",
    authDomain: "uknight-webcalling-prototype.firebaseapp.com",
    projectId: "uknight-webcalling-prototype",
    storageBucket: "uknight-webcalling-prototype.firebasestorage.app",
    messagingSenderId: "183062696521",
    // FIXME: The following keys were missing from the provided configuration:
    appId: "", // REQUIRED: Please add your appId here
    measurementId: "" // Optional
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
