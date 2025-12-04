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

// Cheat code pour tester (ajoute de l'argent)
app.get('/cheat/:username/:amount', (req, res) => {
    const { username, amount } = req.params;
    db.db.run("UPDATE users SET balance = balance + ? WHERE username = ?", [amount, username], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Joueur introuvable" });
        res.json({ success: true, message: `💰 ${amount}$ ajoutés au compte de ${username} !` });
    });
});

// --- CONSTANTES & VARIABLES JEU ---
let rooms = {};
const SUITS = ['♥', '♦', '♠', '♣'];
const VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

// --- CONFIGURATION SLOTS (MODIFIÉE POUR ~35% WIN RATE) ---
// Total des poids = 1+2+4+8+15+70 = 100
// Probabilité Cerise = (70/100)^3 = 0.343 = 34.3%
const SLOT_SYMBOLS = [
    { id: '7', char: 'seven', weight: 1, payout: 100 },
    { id: 'D', char: 'diamond', weight: 2, payout: 50 },
    { id: 'B', char: 'bell', weight: 4, payout: 20 },
    { id: 'G', char: 'grapes', weight: 8, payout: 10 },
    { id: 'L', char: 'lemon', weight: 15, payout: 5 },
    { id: 'C', char: 'cherry', weight: 70, payout: 2 }
];
const SLOT_TOTAL_WEIGHT = SLOT_SYMBOLS.reduce((acc, s) => acc + s.weight, 0);

function spinReel() {
    let rand = Math.random() * SLOT_TOTAL_WEIGHT;
    for (let s of SLOT_SYMBOLS) {
        if (rand < s.weight) return s;
        rand -= s.weight;
    }
    return SLOT_SYMBOLS[SLOT_SYMBOLS.length - 1];
}

// --- UTILITAIRES ---
function createDeck() {
    let deck = [];
    for (let suit of SUITS) {
        for (let value of VALUES) {
            let color = (suit === '♥' || suit === '♦') ? 'RED' : 'BLACK';
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

    // Si c'est une Slot Machine, on ne lance pas de boucle classique
    if (room.type === 'SLOTS') return;

    if (room.timerInterval) clearInterval(room.timerInterval);
    room.gameState = 'PLAYING';
    room.deck = createDeck();
    room.round = 1;
    room.drawnCards = [];

    let activeCount = 0;

    room.players.forEach(p => {
        p.hasCashedOut = false; p.hasFinishedTurn = false; p.choice = null; p.hand = []; p.score = 0;
        if (p.isReady) {
            p.isAlive = true; p.isSpectator = false; p.winnings = p.betAmount;
            p.balance -= p.betAmount;
            db.updateBalance(p.dbId, -p.betAmount);
            activeCount++;
        } else {
            p.isAlive = false; p.isSpectator = true; p.winnings = 0;
        }
    });

    if (activeCount === 0) { autoResetLobby(roomId); return; }

    if (room.type === 'BLACKJACK') {
        room.players.forEach(p => {
            if (p.isAlive) {
                p.hand.push(room.deck.pop()); p.hand.push(room.deck.pop());
                p.score = calculateHand(p.hand);
                if (p.score === 21) { p.hasFinishedTurn = true; p.winnings = Math.floor(p.betAmount * 2.5); }
            }
        });
        room.drawnCards.push(room.deck.pop());
        checkBlackjackEndTurn(roomId);
        startRoundTimer(roomId, 30);
    } else {
        startRoundTimer(roomId, 30);
    }
    broadcastRoomList();
}

function startLobbyTimer(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    if (room.type === 'SLOTS') {
        room.gameState = 'PLAYING';
        return;
    }

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
    if (activePlayers.every(p => p.hasFinishedTurn)) {
        clearInterval(room.timerInterval);
        resolveBlackjackRound(roomId);
    }
}

function resolveClassicRound(roomId) {
    const room = rooms[roomId];
    if (!room || room.isProcessing) return;
    room.isProcessing = true;
    const activePlayers = room.players.filter(p => p.isAlive && !p.hasCashedOut && !p.isSpectator);
    const someonePlayed = activePlayers.some(p => p.choice !== null);
    if (!someonePlayed && activePlayers.length > 0) {
        io.to(roomId).emit('force_disconnect', "AFK Detecté.");
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

function resolveBlackjackRound(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    let dealerScore = calculateHand(room.drawnCards);
    while (dealerScore < 17) {
        const card = room.deck.pop();
        room.drawnCards.push(card);
        dealerScore = calculateHand(room.drawnCards);
    }
    room.players.forEach(p => {
        if (!p.isAlive || p.isSpectator) return;
        if (p.score > 21) { p.winnings = 0; }
        else if (dealerScore > 21) { p.winnings = p.betAmount * 2; }
        else if (p.score > dealerScore) { p.winnings = p.betAmount * 2; }
        else if (p.score === dealerScore) { p.winnings = p.betAmount; }
        else { p.winnings = 0; }
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
    if (room.type !== 'SLOTS') {
        setTimeout(() => { autoResetLobby(roomId); }, 5000);
    }
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
    broadcastRoomList();
}

// --- SOCKET CONNECTION ---
io.on('connection', (socket) => {
    console.log(`Connexion: ${socket.id}`);
    socket.emit('room_list', getRoomList());

    socket.on('join_room', ({ roomId, username, dbId, currentBalance, gameType }) => {
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
                type: gameType || 'CLASSIC',
                slotsHistory: []
            };
            startLobbyTimer(roomId);
        }

        if (rooms[roomId].players.length >= 5) { socket.emit('error', 'Complet !'); return; }

        const room = rooms[roomId];
        const isLateJoiner = (room.gameState === 'PLAYING' || room.gameState === 'ENDED') && gameType !== 'SLOTS';
        const newPlayer = {
            id: socket.id, dbId: dbId, name: username, balance: currentBalance,
            betAmount: 0, isReady: false, isAlive: true, isSpectator: isLateJoiner,
            hasCashedOut: false, hasFinishedTurn: false,
            choice: null, winnings: 0, hand: [], score: 0
        };
        room.players.push(newPlayer);
        io.to(roomId).emit('update_room', _sanitizeRoom(room));
        broadcastRoomList();
    });

    socket.on('leave_room', (roomId) => {
        const room = rooms[roomId];
        if(room) {
            room.players = room.players.filter(p => p.id !== socket.id);
            if(room.players.length===0) { if(room.timerInterval) clearInterval(room.timerInterval); delete rooms[roomId]; }
            else io.to(roomId).emit('update_room', _sanitizeRoom(room));
            socket.leave(roomId);
            broadcastRoomList();
        }
    });

    socket.on('place_bet', ({ roomId, amount }) => {
        const room = rooms[roomId];
        if (!room) return;
        const player = room.players.find(p => p.id === socket.id);
        if(player) {
            db.getUser(player.dbId, (err, user) => {
                if (user && user.balance >= amount && amount > 0) {
                    player.betAmount = Number(amount);
                    player.isReady = true;
                    if (room.type === 'SLOTS') {
                        io.to(roomId).emit('update_room', _sanitizeRoom(room));
                    } else if (room.gameState === 'LOBBY') {
                        if (room.players.every(p => p.isReady)) startGame(roomId);
                        else io.to(roomId).emit('update_room', _sanitizeRoom(room));
                    }
                } else socket.emit('error', "Fonds insuffisants");
            });
        }
    });

    socket.on('make_choice', ({ roomId, choice }) => {
        const room = rooms[roomId];
        if (!room) return;
        const player = room.players.find(p => p.id === socket.id);
        if (!player) return;

        // --- LOGIQUE SLOTS ---
        if (room.type === 'SLOTS' && choice === 'SPIN') {
            db.getUser(player.dbId, (err, user) => {
                if (user && user.balance >= player.betAmount) {
                    player.balance -= player.betAmount;
                    db.updateBalance(player.dbId, -player.betAmount);

                    const r1 = spinReel();
                    const r2 = spinReel();
                    const r3 = spinReel();
                    const result = [r1, r2, r3];

                    let win = 0;
                    if (r1.id === r2.id && r2.id === r3.id) {
                        win = player.betAmount * r1.payout;
                    }

                    player.winnings = win;
                    player.hand = result;
                    player.hasFinishedTurn = true;

                    if (win > 0) {
                        player.balance += win;
                        db.updateBalance(player.dbId, win);
                    }

                    io.to(roomId).emit('update_room', _sanitizeRoom(room));

                    setTimeout(() => {
                        player.hasFinishedTurn = false;
                        player.hand = []; // Nettoyage
                        player.winnings = 0;
                        io.to(roomId).emit('update_room', _sanitizeRoom(room));
                    }, 2000);

                } else {
                    socket.emit('error', "Pas assez d'argent pour lancer !");
                }
            });
            return;
        }

        // --- LOGIQUE CLASSIQUE & BLACKJACK ---
        if (room.gameState !== 'PLAYING') return;

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
                    if (player.score >= 21) {
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

    socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => { console.log(`✅ SERVEUR OK SUR LE PORT ${PORT}`); });