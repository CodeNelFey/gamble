// server/index.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:5173", methods: ["GET", "POST"] }
});

// --- API AUTH ---
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
        if (err) return res.status(500).json({ error: "Erreur base de données" });
        res.json(rows);
    });
});

// --- JEU ---
let rooms = {};
const SUITS = ['♥', '♦', '♠', '♣'];
const VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

function createDeck() {
    let deck = [];
    for (let suit of SUITS) {
        for (let value of VALUES) {
            let color = (suit === '♥' || suit === '♦') ? 'RED' : 'BLACK';
            deck.push({ suit, value, color });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
}

function _sanitizeRoom(room) {
    const { timerInterval, ...cleanRoom } = room;
    return cleanRoom;
}

function broadcastRoomList() {
    const list = Object.values(rooms).map(r => ({
        id: r.id,
        players: r.players.length,
        status: r.gameState
    }));
    io.emit('room_list', list);
}

function handlePlayerLeave(socketId, roomId) {
    const room = rooms[roomId];
    if (!room) return;
    room.players = room.players.filter(p => p.id !== socketId);
    if (room.players.length === 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        delete rooms[roomId];
    } else {
        if (room.host === socketId) room.host = room.players[0].id;
        io.to(roomId).emit('update_room', _sanitizeRoom(room));
    }
    broadcastRoomList();
}

function startGame(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    if (room.timerInterval) clearInterval(room.timerInterval);

    room.gameState = 'PLAYING';
    room.deck = createDeck();
    room.round = 1;
    room.drawnCards = [];

    let activeCount = 0;
    room.players.forEach(p => {
        p.hasCashedOut = false;
        p.choice = null;
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
    startRoundTimer(roomId);
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
        if (room.players.length === 0) { clearInterval(room.timerInterval); delete rooms[roomId]; return; }
        if (room.timeLeft <= 0) {
            startGame(roomId);
        } else {
            io.to(roomId).emit('timer_update', room.timeLeft);
        }
    }, 1000);
}

function startRoundTimer(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    if (room.timerInterval) clearInterval(room.timerInterval);
    room.timeLeft = 30;
    io.to(roomId).emit('update_room', _sanitizeRoom(room));

    room.timerInterval = setInterval(() => {
        room.timeLeft -= 1;
        if (room.timeLeft <= 0) {
            clearInterval(room.timerInterval);
            resolveRound(roomId);
        } else {
            io.to(roomId).emit('timer_update', room.timeLeft);
        }
    }, 1000);
}

function autoResetLobby(roomId) {
    const room = rooms[roomId];
    if (!room) return;

    room.gameState = 'LOBBY';
    room.round = 0;
    room.drawnCards = [];
    room.timeLeft = 0;
    room.isProcessing = false;
    if (room.timerInterval) clearInterval(room.timerInterval);

    room.players.forEach(p => {
        p.isReady = false;
        p.isAlive = true;
        p.isSpectator = false;
        p.hasCashedOut = false;
        p.choice = null;
        p.winnings = 0;
    });

    setTimeout(() => {
        io.to(roomId).emit('update_room', _sanitizeRoom(room));
        startLobbyTimer(roomId);
    }, 500);
}

function resolveRound(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    if (room.isProcessing) return;
    room.isProcessing = true;

    // --- 1. VERIFICATION ANTI-AFK (Tout le monde a dormi ?) ---
    const activePlayers = room.players.filter(p => p.isAlive && !p.hasCashedOut && !p.isSpectator);

    // On vérifie si AU MOINS UNE personne a joué
    const someonePlayed = activePlayers.some(p => p.choice !== null);

    if (!someonePlayed && activePlayers.length > 0) {
        console.log(`[${roomId}] Aucun choix fait par les joueurs actifs. FERMETURE TABLE.`);

        // 1. On prévient tout le monde
        io.to(roomId).emit('force_disconnect', "Personne n'a joué. La table a été fermée.");

        // 2. On kick tout le monde des sockets
        io.in(roomId).socketsLeave(roomId);

        // 3. On détruit la table
        if (room.timerInterval) clearInterval(room.timerInterval);
        delete rooms[roomId];

        // 4. On met à jour le lobby général
        broadcastRoomList();
        return; // On arrête tout ici
    }

    // --- SUITE NORMALE DU JEU ---
    if (room.deck.length === 0) room.deck = createDeck();
    const card = room.deck.pop();
    room.drawnCards.push(card);

    room.players.forEach(player => {
        if (!player.isAlive || player.hasCashedOut || player.isSpectator) return;

        if (!player.choice) {
            player.isAlive = false;
            player.winnings = 0;
            return;
        }

        let survives = false;
        if (room.round === 1) { if (player.choice === card.color) survives = true; }
        else if (room.round === 2) {
            const prevCard = room.drawnCards[room.drawnCards.length - 2];
            if (player.choice === 'UPPER' && card.value > prevCard.value) survives = true;
            if (player.choice === 'LOWER' && card.value < prevCard.value) survives = true;
        }
        else if (room.round === 3) {
            const c1 = room.drawnCards[0].value;
            const c2 = room.drawnCards[1].value;
            const min = Math.min(c1, c2);
            const max = Math.max(c1, c2);
            if (player.choice === 'INSIDE' && card.value > min && card.value < max) survives = true;
            if (player.choice === 'OUTSIDE' && (card.value < min || card.value > max)) survives = true;
        }
        else if (room.round === 4) { if (player.choice === card.suit) survives = true; }

        if (!survives) {
            player.isAlive = false;
            player.winnings = 0;
        } else {
            let multiplier = 1;
            if (room.round === 1) multiplier = 1.5;
            if (room.round === 2) multiplier = 2;
            if (room.round === 3) multiplier = 5;
            if (room.round === 4) multiplier = 10;
            player.winnings = Math.floor(player.betAmount * multiplier);
        }
        player.choice = null;
    });

    // Re-calcul des survivants après résolution
    const survivors = room.players.filter(p => p.isAlive && !p.hasCashedOut && !p.isSpectator);

    if (survivors.length === 0 || room.round >= 4) {
        room.players.forEach(p => {
            if (p.isAlive && !p.hasCashedOut && !p.isSpectator) {
                p.hasCashedOut = true;
                p.balance += p.winnings;
                db.updateBalance(p.dbId, p.winnings);
            }
        });

        room.gameState = 'ENDED';
        clearInterval(room.timerInterval);
        io.to(roomId).emit('update_room', _sanitizeRoom(room));
        broadcastRoomList();
        setTimeout(() => { autoResetLobby(roomId); }, 5000);
    } else {
        room.round++;
        startRoundTimer(roomId);
        io.to(roomId).emit('update_room', _sanitizeRoom(room));
    }
    setTimeout(() => { room.isProcessing = false; }, 500);
}

io.on('connection', (socket) => {
    broadcastRoomList();

    socket.on('join_room', ({ roomId, username, dbId, currentBalance }) => {
        socket.rooms.forEach(r => { if(r !== socket.id) handlePlayerLeave(socket.id, r); });
        socket.join(roomId);

        if (!rooms[roomId]) {
            rooms[roomId] = {
                id: roomId, host: socket.id, gameState: 'LOBBY', round: 0, timeLeft: 0,
                deck: [], drawnCards: [], players: [], timerInterval: null, isProcessing: false
            };
            startLobbyTimer(roomId);
        }

        if (rooms[roomId].players.length >= 5) {
            socket.emit('error', 'Table complète !');
            return;
        }

        const room = rooms[roomId];
        const isLateJoiner = (room.gameState === 'PLAYING' || room.gameState === 'ENDED');
        let finalBalance = currentBalance;

        const newPlayer = {
            id: socket.id, dbId: dbId, name: username, balance: finalBalance,
            betAmount: 0, isReady: false, isAlive: !isLateJoiner, isSpectator: isLateJoiner,
            hasCashedOut: false, choice: null, winnings: 0
        };
        room.players.push(newPlayer);
        io.to(roomId).emit('update_room', _sanitizeRoom(room));
        broadcastRoomList();
    });

    socket.on('leave_room', (roomId) => {
        handlePlayerLeave(socket.id, roomId);
        socket.leave(roomId);
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
                        const allReady = room.players.every(p => p.isReady);
                        if (allReady && room.players.length > 0) {
                            startGame(roomId);
                        } else {
                            io.to(roomId).emit('update_room', _sanitizeRoom(room));
                        }
                    } else {
                        socket.emit('error', "Fonds insuffisants !");
                    }
                });
            }
        }
    });

    socket.on('make_choice', ({ roomId, choice }) => {
        const room = rooms[roomId];
        if (!room || room.gameState !== 'PLAYING') return;
        const player = room.players.find(p => p.id === socket.id);
        if (player && player.isAlive && !player.hasCashedOut && !player.isSpectator) {
            player.choice = choice;
            const activePlayers = room.players.filter(p => p.isAlive && !p.hasCashedOut && !p.isSpectator);
            if (activePlayers.every(p => p.choice !== null)) {
                clearInterval(room.timerInterval);
                room.timeLeft = 0;
                io.to(roomId).emit('timer_update', 0);
                resolveRound(roomId);
            } else {
                io.to(roomId).emit('update_room', _sanitizeRoom(room));
            }
        }
    });

    socket.on('cashout', (roomId) => {
        const room = rooms[roomId];
        if (!room) return;
        const player = room.players.find(p => p.id === socket.id);
        if (player && player.isAlive && !player.isSpectator) {
            player.hasCashedOut = true;

            player.balance += player.winnings;
            db.updateBalance(player.dbId, player.winnings);

            player.choice = null;
            const activePlayers = room.players.filter(p => p.isAlive && !p.hasCashedOut && !p.isSpectator);
            if (activePlayers.length === 0 || activePlayers.every(p => p.choice !== null)) {
                clearInterval(room.timerInterval);
                resolveRound(roomId);
            } else {
                io.to(roomId).emit('update_room', _sanitizeRoom(room));
            }
        }
    });

    socket.on('disconnect', () => {
        for (const roomId in rooms) {
            const room = rooms[roomId];
            const player = room.players.find(p => p.id === socket.id);
            if (player) { handlePlayerLeave(socket.id, roomId); break; }
        }
    });
});

server.listen(3001, () => { console.log('SERVEUR OK (PORT 3001) - ANTI-AFK ACTIF'); });