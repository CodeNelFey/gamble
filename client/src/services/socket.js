import io from 'socket.io-client';

// On récupère l'adresse depuis le fichier .env
const URL = import.meta.env.VITE_SERVER_URL || "http://82.67.145.215:3001";

console.log("Connexion au serveur :", URL); // Petit log pour vérifier

export const socket = io.connect(URL);