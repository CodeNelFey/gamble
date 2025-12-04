import io from 'socket.io-client';
import {API_URL} from "../config.js";

// On récupère l'adresse depuis le fichier .env
const URL = API_URL;

console.log("Connexion au serveur :", URL); // Petit log pour vérifier

export const socket = io.connect(URL);