const path = require('path');
// Charge les variables du fichier .env situé à la racine
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Configuration de Socket.IO avec les règles de sécurité du .env
const io = new Server(server, {
    cors: {
        origin: process.env.ALLOWED_ORIGIN || "*",
        methods: ["GET", "POST"]
    }
});

// --- API AUTHENTIFICATION & CLASSEMENT ---
app.post('/register', (req, res) => {
    const { username, password } = req.body;
    db.register(username, password, (err, id) => {
        if (err) return res.status(400).json({ error: "Pseudo déjà pris !" });
        res.json({ success: true, id, username, balance: 1000 });
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.login(username, password, (err, user) => {
        if (err) return res.status(500).json({ error: "Erreur serveur" });
        if (!user) return res.status(401).json({ error: "Pseudo ou mot de passe incorrect" });
        res.json({ success: true, id: user.id, username: user.username, balance: user.balance });
    });
});

app.get('/leaderboard', (req, res) => {
    db.getLeaderboard((err, rows) => {
        if (err) return res.status(500).json({ error: "Erreur DB" });
        res.json(rows);
    });
});

// --- CONSTANTES & VARIABLES JEU ---
let rooms = {};
const SUITS = ['♥', '♦', '♠', '♣'];
const VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

// Création de paquet (Adapté pour Blackjack : As = 1 ou 11, Figures = 10)
function createDeck() {
    let deck = [];
    for (let suit of SUITS) {
        for (let value of VALUES) {
            let color = (suit === '♥' || suit === '♦') ? 'RED' : 'BLACK';
            // bjValue: Figures (J,Q,K) valent 10, As vaut 11 (ajusté plus tard)
            let bjValue = value > 10 && value < 14 ? 10 : (value === 14 ? 11 : value);
            deck.push({ suit, value, color, bjValue });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
}

function _sanitizeRoom(room) {
    const { timerInterval, deck, ...cleanRoom } = room;
    return cleanRoom;
}

// --- GESTION LISTE DES SALLES ---
function getRoomList() {
    return Object.values(rooms).map(r => ({
        id: r.id,
        players: r.players.length,
        status: r.gameState,
        type: r.type
    }));
}

function broadcastRoomList() {
    io.emit('room_list', getRoomList());
}

// --- LOGIQUE BLACKJACK ---
function calculateHand(cards) {
    let score = 0;
    let aces = 0;
    cards.forEach(c => {
        score += c.bjValue;
        if (c.value === 14) aces++;
    });
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    return score;
}

// --- MOTEUR DE JEU ---

function startGame(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    if (room.timerInterval) clearInterval(room.timerInterval);

    room.gameState = 'PLAYING';
    room.deck = createDeck();
    room.round = 1;
    room.drawnCards = []; // Dealer cards (Blackjack) ou Cartes communes (Classic)

    let activeCount = 0;

    // Prélèvement des mises
    room.players.forEach(p => {
        p.hasCashedOut = false;
        p.hasFinishedTurn = false;
        p.choice = null;
        p.hand = [];
        p.score = 0;

        if (p.isReady) {
            p.isAlive = true;
            p.isSpectator = false;
            p.winnings = p.betAmount;
            p.balance -= p.betAmount;
            db.updateBalance(p.dbId, -p.betAmount);
            activeCount++;
        } else {
            p.isAlive = false;
            p.isSpectator = true;
            p.winnings = 0;
        }
    });

    if (activeCount === 0) { autoResetLobby(roomId); return; }

    // --- INIT BLACKJACK ---
    if (room.type === 'BLACKJACK') {
        room.players.forEach(p => {
            if (p.isAlive) {
                p.hand.push(room.deck.pop());
                p.hand.push(room.deck.pop());
                p.score = calculateHand(p.hand);

                // Blackjack Naturel
                if (p.score === 21) {
                    p.hasFinishedTurn = true;
                    p.winnings = Math.floor(p.betAmount * 2.5); // 3:2 payout
                }
            }
        });
        room.drawnCards.push(room.deck.pop()); // Dealer reçoit 1 carte

        checkBlackjackEndTurn(roomId);
        startRoundTimer(roomId, 30);
    } else {
        // --- INIT CLASSIC ---
        startRoundTimer(roomId, 30);
    }

    broadcastRoomList();
}

function startLobbyTimer(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    if (room.timerInterval) clearInterval(room.timerInterval);
    room.timeLeft = 30;
    io.to(roomId).emit('update_room', _sanitizeRoom(room));

    room.timerInterval = setInterval(() => {
        room.timeLeft -= 1;
        if (room.players.length === 0) {
            clearInterval(room.timerInterval);
            delete rooms[roomId];
            broadcastRoomList();
            return;
        }
        if (room.timeLeft <= 0) { startGame(roomId); }
        else { io.to(roomId).emit('timer_update', room.timeLeft); }
    }, 1000);
}

function startRoundTimer(roomId, duration = 30) {
    const room = rooms[roomId];
    if (!room) return;
    if (room.timerInterval) clearInterval(room.timerInterval);
    room.timeLeft = duration;
    io.to(roomId).emit('update_room', _sanitizeRoom(room));

    room.timerInterval = setInterval(() => {
        room.timeLeft -= 1;
        if (room.timeLeft <= 0) {
            clearInterval(room.timerInterval);
            if (room.type === 'BLACKJACK') resolveBlackjackRound(roomId);
            else resolveClassicRound(roomId);
        } else {
            io.to(roomId).emit('timer_update', room.timeLeft);
        }
    }, 1000);
}

function checkBlackjackEndTurn(roomId) {
    const room = rooms[roomId];
    if(!room) return;
    const activePlayers = room.players.filter(p => p.isAlive && !p.isSpectator);
    // Si tout le monde a fini son tour
    if (activePlayers.every(p => p.hasFinishedTurn)) {
        clearInterval(room.timerInterval);
        resolveBlackjackRound(roomId);
    }
}

// --- RÉSOLUTION CLASSIC ---
function resolveClassicRound(roomId) {
    const room = rooms[roomId];
    if (!room || room.isProcessing) return;
    room.isProcessing = true;

    // ANTI-AFK
    const activePlayers = room.players.filter(p => p.isAlive && !p.hasCashedOut && !p.isSpectator);
    const someonePlayed = activePlayers.some(p => p.choice !== null);
    if (!someonePlayed && activePlayers.length > 0) {
        io.to(roomId).emit('force_disconnect', "AFK Detecté. Table fermée.");
        io.in(roomId).socketsLeave(roomId);
        delete rooms[roomId];
        broadcastRoomList();
        return;
    }

    if (room.deck.length === 0) room.deck = createDeck();
    const card = room.deck.pop();
    room.drawnCards.push(card);

    room.players.forEach(p => {
        if (!p.isAlive || p.hasCashedOut || p.isSpectator) return;
        if (!p.choice) { p.isAlive = false; p.winnings = 0; return; }

        let survives = false;
        if (room.round === 1) { if (p.choice === card.color) survives = true; }
        else if (room.round === 2) {
            const prev = room.drawnCards[room.drawnCards.length - 2];
            if ((p.choice === 'UPPER' && card.value > prev.value) || (p.choice === 'LOWER' && card.value < prev.value)) survives = true;
        }
        else if (room.round === 3) {
            const c1 = room.drawnCards[0].value; const c2 = room.drawnCards[1].value;
            const min = Math.min(c1, c2); const max = Math.max(c1, c2);
            if ((p.choice === 'INSIDE' && card.value > min && card.value < max) || (p.choice === 'OUTSIDE' && (card.value < min || card.value > max))) survives = true;
        }
        else if (room.round === 4) { if (p.choice === card.suit) survives = true; }

        if (!survives) { p.isAlive = false; p.winnings = 0; }
        else {
            let mult = 1;
            if (room.round === 1) mult = 1.5; else if (room.round === 2) mult = 2; else if (room.round === 3) mult = 5; else if (room.round === 4) mult = 10;
            p.winnings = Math.floor(p.betAmount * mult);
        }
        p.choice = null;
    });

    const survivors = room.players.filter(p => p.isAlive && !p.hasCashedOut && !p.isSpectator);
    if (survivors.length === 0 || room.round >= 4) { endGame(roomId); }
    else {
        room.round++;
        startRoundTimer(roomId);
        io.to(roomId).emit('update_room', _sanitizeRoom(room));
    }
    setTimeout(() => { room.isProcessing = false; }, 500);
}

// --- RÉSOLUTION BLACKJACK ---
function resolveBlackjackRound(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    // Dealer joue
    let dealerScore = calculateHand(room.drawnCards);
    while (dealerScore < 17) {
        const card = room.deck.pop();
        room.drawnCards.push(card);
        dealerScore = calculateHand(room.drawnCards);
    }

    room.players.forEach(p => {
        if (!p.isAlive || p.isSpectator) return;

        if (p.score > 21) {
            p.winnings = 0;
        } else if (dealerScore > 21) {
            p.winnings = p.betAmount * 2;
        } else if (p.score > dealerScore) {
            p.winnings = p.betAmount * 2;
        } else if (p.score === dealerScore) {
            p.winnings = p.betAmount; // Push
        } else {
            p.winnings = 0;
        }
    });

    endGame(roomId);
}

function endGame(roomId) {
    const room = rooms[roomId];
    room.players.forEach(p => {
        if ((p.isAlive && !p.isSpectator && room.type === 'CLASSIC') || (room.type === 'BLACKJACK' && p.winnings > 0)) {
            if (!p.hasCashedOut) {
                p.hasCashedOut = true;
                p.balance += p.winnings;
                db.updateBalance(p.dbId, p.winnings);
            }
        }
    });
    room.gameState = 'ENDED';
    if (room.timerInterval) clearInterval(room.timerInterval);
    io.to(roomId).emit('update_room', _sanitizeRoom(room));
    broadcastRoomList(); // Update status
    setTimeout(() => { autoResetLobby(roomId); }, 5000);
}

function autoResetLobby(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    room.gameState = 'LOBBY'; room.round = 0; room.drawnCards = []; room.timeLeft = 0; room.isProcessing = false;
    room.players.forEach(p => {
        p.isReady = false; p.isAlive = true; p.isSpectator = false;
        p.hasCashedOut = false; p.hasFinishedTurn = false;
        p.choice = null; p.winnings = 0; p.hand = []; p.score = 0;
    });
    startLobbyTimer(roomId);
    broadcastRoomList(); // Update status
}

// --- SOCKET CONNECTION ---
io.on('connection', (socket) => {
    console.log(`Nouvelle connexion : ${socket.id}`);

    // Envoi immédiat de la liste au nouveau venu
    socket.emit('room_list', getRoomList());

    socket.on('join_room', ({ roomId, username, dbId, currentBalance, gameType }) => {
        // Nettoyage si le joueur était ailleurs
        socket.rooms.forEach(r => { if(r !== socket.id) {
            const oldRoom = rooms[r];
            if(oldRoom) {
                oldRoom.players = oldRoom.players.filter(p => p.id !== socket.id);
                if(oldRoom.players.length === 0) delete rooms[r];
                else io.to(r).emit('update_room', _sanitizeRoom(oldRoom));
            }
        }});

        socket.join(roomId);

        if (!rooms[roomId]) {
            rooms[roomId] = {
                id: roomId, host: socket.id, gameState: 'LOBBY', round: 0, timeLeft: 0,
                deck: [], drawnCards: [], players: [], timerInterval: null, isProcessing: false,
                type: gameType || 'CLASSIC'
            };
            startLobbyTimer(roomId);
        }

        if (rooms[roomId].players.length >= 5) { socket.emit('error', 'Complet !'); return; }

        const room = rooms[roomId];
        const isLateJoiner = (room.gameState === 'PLAYING' || room.gameState === 'ENDED');
        const newPlayer = {
            id: socket.id, dbId: dbId, name: username, balance: currentBalance,
            betAmount: 0, isReady: false, isAlive: !isLateJoiner, isSpectator: isLateJoiner,
            hasCashedOut: false, hasFinishedTurn: false,
            choice: null, winnings: 0, hand: [], score: 0
        };
        room.players.push(newPlayer);
        io.to(roomId).emit('update_room', _sanitizeRoom(room));
        broadcastRoomList(); // Broadcast global
    });

    socket.on('leave_room', (roomId) => {
        const room = rooms[roomId];
        if(room) {
            room.players = room.players.filter(p => p.id !== socket.id);
            if(room.players.length===0) { clearInterval(room.timerInterval); delete rooms[roomId]; }
            else io.to(roomId).emit('update_room', _sanitizeRoom(room));
            socket.leave(roomId);
            broadcastRoomList();
        }
    });

    socket.on('place_bet', ({ roomId, amount }) => {
        const room = rooms[roomId];
        if(room && room.gameState === 'LOBBY') {
            const player = room.players.find(p => p.id === socket.id);
            if(player) {
                db.getUser(player.dbId, (err, user) => {
                    if (user && user.balance >= amount && amount > 0) {
                        player.betAmount = Number(amount);
                        player.isReady = true;
                        if (room.players.every(p => p.isReady)) startGame(roomId);
                        else io.to(roomId).emit('update_room', _sanitizeRoom(room));
                    } else socket.emit('error', "Fonds insuffisants");
                });
            }
        }
    });

    socket.on('make_choice', ({ roomId, choice }) => {
        const room = rooms[roomId];
        if (!room || room.gameState !== 'PLAYING') return;
        const player = room.players.find(p => p.id === socket.id);

        if (player && player.isAlive && !player.hasCashedOut && !player.isSpectator) {

            if (room.type === 'CLASSIC') {
                player.choice = choice;
                const active = room.players.filter(p => p.isAlive && !p.hasCashedOut && !p.isSpectator);
                if (active.every(p => p.choice !== null)) {
                    clearInterval(room.timerInterval);
                    resolveClassicRound(roomId);
                }
            }
            else if (room.type === 'BLACKJACK') {
                if (choice === 'HIT') {
                    const card = room.deck.pop();
                    player.hand.push(card);
                    player.score = calculateHand(player.hand);
                    if (player.score > 21 || player.score === 21) {
                        player.hasFinishedTurn = true;
                        if(player.score > 21) player.winnings = 0;
                    }
                }
                else if (choice === 'STAND') {
                    player.hasFinishedTurn = true;
                }
                io.to(roomId).emit('update_room', _sanitizeRoom(room));
                checkBlackjackEndTurn(roomId);
            }
        }
    });

    socket.on('cashout', (roomId) => {
        const room = rooms[roomId];
        if(room && room.type === 'CLASSIC') {
            const player = room.players.find(p => p.id === socket.id);
            if (player && player.isAlive) {
                player.hasCashedOut = true;
                player.balance += player.winnings;
                db.updateBalance(player.dbId, player.winnings);
                player.choice = null;
                const active = room.players.filter(p => p.isAlive && !p.hasCashedOut && !p.isSpectator);
                if (active.length === 0 || active.every(p => p.choice !== null)) {
                    clearInterval(room.timerInterval);
                    resolveClassicRound(roomId);
                } else io.to(roomId).emit('update_room', _sanitizeRoom(room));
            }
        }
    });

    socket.on('disconnect', () => {
        // Gestion de la déconnexion automatique via join_room
    });
});

// Utilisation du PORT défini dans le .env
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`✅ SERVEUR LANCÉ SUR LE PORT ${PORT}`);
});