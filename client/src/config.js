let apiUrl = import.meta.env.VITE_API_URL;
console.log(import.meta.env);
if (!apiUrl) {
    apiUrl = "http://localhost:3001";
}

if (apiUrl.endsWith('/')) {
    apiUrl = apiUrl.slice(0, -1);
}

console.log("🔗 CONNECTION API VERS :", apiUrl);

export const API_URL = apiUrl;