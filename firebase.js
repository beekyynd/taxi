import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';

// enter your firebase craedentials here

const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  databaseURL: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
  measurementId: ""
};


if (!firebase.apps.length) {
 firebase.initializeApp(firebaseConfig);
}

export { auth, firebaseConfig };