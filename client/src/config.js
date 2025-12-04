// Ce fichier centralise la configuration
// Il détermine automatiquement l'URL du serveur

// 1. On regarde si une URL est définie dans le .env
let apiUrl = import.meta.env.VITE_API_URL;

// 2. Si le .env est vide (cas Nginx proxy), on utilise l'origine actuelle
if (!apiUrl || apiUrl === "") {
    // Si tu es sur http://mon-site.com, l'API sera considérée comme étant sur la même base
    apiUrl = window.location.origin;
}

// 3. Nettoyage : On enlève le slash à la fin s'il y en a un pour éviter les erreurs //api
if (apiUrl.endsWith('/')) {
    apiUrl = apiUrl.slice(0, -1);
}

console.log("🔗 CONNECTION API VERS :", apiUrl);

export const API_URL = apiUrl;