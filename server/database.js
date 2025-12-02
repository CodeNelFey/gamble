// server/database.js
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// On force le chemin absolu pour être sûr de l'endroit où le fichier se crée
const dbPath = path.resolve(__dirname, 'gamble.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('ERREUR DE CONNEXION DB:', err.message);
    } else {
        console.log(`✅ Connecté à la base de données SQLite : ${dbPath}`);
    }
});

// Création de la table Users si elle n'existe pas
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
                                                 id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                 username TEXT UNIQUE,
                                                 password TEXT,
                                                 balance INTEGER DEFAULT 1000
            )`, (err) => {
        if (err) console.error("Erreur création table:", err);
        else {
            // --- VÉRIFICATION AU DÉMARRAGE ---
            console.log("--- LISTE DES JOUEURS EN BASE ---");
            db.all("SELECT id, username, balance FROM users", [], (err, rows) => {
                if (err) console.error(err);
                if (!rows || rows.length === 0) {
                    console.log("Aucun joueur enregistré pour le moment.");
                } else {
                    console.table(rows); // Affiche un joli tableau dans le terminal
                }
                console.log("----------------------------------");
            });
        }
    });
});

// Inscription avec logs détaillés
function register(username, password, callback) {
    const hash = bcrypt.hashSync(password, 10);
    db.run(`INSERT INTO users (username, password, balance) VALUES (?, ?, 1000)`,
        [username, hash],
        function(err) {
            if (err) {
                console.error("❌ Erreur insert DB:", err.message);
                callback(err, null);
            } else {
                console.log(`🆕 Joueur créé : ${username} (ID: ${this.lastID})`);
                callback(null, this.lastID);
            }
        }
    );
}

// Connexion
function login(username, password, callback) {
    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err) return callback(err);
        if (!row) return callback(null, false);

        const isValid = bcrypt.compareSync(password, row.password);
        if (isValid) {
            console.log(`🔑 Connexion réussie : ${username}`);
            callback(null, row);
        } else {
            console.log(`⛔ Mot de passe incorrect pour : ${username}`);
            callback(null, false);
        }
    });
}

function getUser(id, callback) {
    db.get(`SELECT id, username, balance FROM users WHERE id = ?`, [id], callback);
}

function updateBalance(id, amount) {
    db.run(`UPDATE users SET balance = balance + ? WHERE id = ?`, [amount, id], function(err) {
        if (err) console.error("Erreur update balance:", err);
        else console.log(`💰 Solde mis à jour pour ID ${id} : ${amount > 0 ? '+' : ''}${amount}$`);
    });
}

function getLeaderboard(callback) {
    // Récupère les 10 joueurs les plus riches, triés par solde décroissant
    db.all(`SELECT username, balance FROM users ORDER BY balance DESC LIMIT 10`, [], callback);
}

module.exports = { db, register, login, getUser, updateBalance, getLeaderboard };