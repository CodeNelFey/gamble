import io from 'socket.io-client';

// On récupère l'adresse depuis le fichier .env
const URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";

console.log("Connexion au serveur :", URL); // Petit log pour vérifier

export const socket = io.connect(URL);