// src/App.jsx
import { useState, useEffect } from 'react';
import { socket } from './services/socket';
import './App.css';

// Import Views & Components
import Navbar from './components/layout/NavBar.jsx';
import Auth from './components/layout/Auth';
import Lobby from './views/Lobby';
import Game from './views/Game';
import Blackjack from './views/Blackjack';
import Ranking from './views/Ranking';
import { IconRoulette } from './components/ui/Icons';

function App() {
    const [user, setUser] = useState(null);
    const [currentView, setCurrentView] = useState('CLASSIC');

    // États du Jeu
    const [inGame, setInGame] = useState(false);
    const [roomId, setRoomId] = useState("");
    const [betAmount, setBetAmount] = useState(100);
    const [roomData, setRoomData] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [roomsList, setRoomsList] = useState([]);

    // --- 1. PERSISTANCE (RESTORE SESSION) ---
    useEffect(() => {
        // Au chargement, on regarde si on a un utilisateur en mémoire
        const savedUser = localStorage.getItem('gamble_user');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
                // On met à jour ses infos depuis le serveur pour être sûr du solde
                fetchUserData(parsedUser.id);
            } catch (e) {
                console.error("Erreur lecture session");
                localStorage.removeItem('gamble_user');
            }
        }
    }, []);

    // Fonction pour rafraîchir le solde à la connexion auto
    const fetchUserData = async (dbId) => {
        // Cette fonction suppose que tu pourrais créer une route /user/:id sur ton serveur
        // Mais pour l'instant, on fait confiance au localStorage ou on attend le socket
        // Idéalement, on envoie un event socket pour dire "Je suis là, envoie mon solde"
    };

    // --- 2. SOCKET LISTENERS ---
    useEffect(() => {
        // Écouter la mise à jour de la salle
        socket.on("update_room", (data) => {
            setRoomData(data);
            if(data.timeLeft !== undefined) setTimeLeft(data.timeLeft);

            // Mise à jour du solde en temps réel si on joue
            if (user && data.players) {
                const me = data.players.find(p => p.dbId === user.id);
                if (me && me.balance !== undefined) {
                    const updatedUser = { ...user, balance: me.balance };
                    setUser(updatedUser);
                    // On met à jour le localStorage aussi pour le prochain refresh
                    localStorage.setItem('gamble_user', JSON.stringify(updatedUser));
                }
            }
        });

        socket.on("timer_update", (time) => setTimeLeft(time));

        // CORRECTION TABLES : On reçoit la liste
        socket.on("room_list", (list) => {
            console.log("Liste reçue :", list); // Debug
            setRoomsList(list);
        });

        socket.on("error", (msg) => { alert(msg); });

        socket.on("force_disconnect", (msg) => {
            alert(msg);
            setInGame(false);
            setRoomData(null);
            setRoomId("");
        });

        return () => {
            socket.off("update_room");
            socket.off("timer_update");
            socket.off("room_list");
            socket.off("error");
            socket.off("force_disconnect");
        };
    }, [user]);

    // --- ACTIONS ---
    const handleAuth = async (form, isRegistering) => {
        const endpoint = isRegistering ? '/register' : '/login';
        // Utilisation de la config .env
        const URL = import.meta.env.VITE_SERVER_URL
        try {
            const res = await fetch(`${URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            const data = await res.json();
            if (data.success) {
                const newUser = { id: data.id, username: data.username, balance: data.balance };
                setUser(newUser);
                // SAUVEGARDE DANS LE NAVIGATEUR
                localStorage.setItem('gamble_user', JSON.stringify(newUser));
            }
            else { alert(data.error); }
        } catch (err) { alert("Erreur connexion serveur"); }
    };

    const handleLogout = () => {
        setUser(null);
        setInGame(false);
        setRoomData(null);
        // NETTOYAGE DU NAVIGATEUR
        localStorage.removeItem('gamble_user');
    };

    const handleJoinRoom = (targetRoomId, type) => {
        const finalRoomId = targetRoomId || roomId;
        const finalType = type || (currentView === 'BLACKJACK' ? 'BLACKJACK' : 'CLASSIC');

        if (finalRoomId !== "") {
            socket.emit("join_room", {
                roomId: finalRoomId,
                username: user.username,
                dbId: user.id,
                currentBalance: user.balance,
                gameType: finalType
            });
            setInGame(true);
            setRoomId(finalRoomId);
        }
    };

    const handleLeaveRoom = () => {
        socket.emit("leave_room", roomId);
        setInGame(false);
        setRoomData(null);
        setRoomId("");
    };

    // --- RENDER ---
    const renderContent = () => {
        if (inGame) {
            if (!roomData) return <p style={{color:'white', marginTop:100}}>Chargement de la table...</p>;

            if (roomData.type === 'BLACKJACK') {
                return <Blackjack roomData={roomData} timeLeft={timeLeft} leaveRoom={handleLeaveRoom} betAmount={betAmount} setBetAmount={setBetAmount} />;
            } else {
                return <Game roomData={roomData} timeLeft={timeLeft} leaveRoom={handleLeaveRoom} betAmount={betAmount} setBetAmount={setBetAmount} />;
            }
        }

        switch (currentView) {
            case 'CLASSIC':
                return <Lobby roomsList={roomsList} onJoin={handleJoinRoom} gameType="CLASSIC" />;
            case 'BLACKJACK':
                return <Lobby roomsList={roomsList} onJoin={handleJoinRoom} gameType="BLACKJACK" />;
            case 'ROULETTE':
                return (
                    <div className="placeholder-view">
                        <IconRoulette style={{fontSize: '5rem', color: '#FFD700', marginBottom: 20}} />
                        <h2>Roulette System</h2>
                        <p>Bientôt disponible. Préparez vos jetons !</p>
                    </div>
                );
            case 'RANKING':
                return <Ranking user={user} />;
            default:
                return <Lobby roomsList={roomsList} onJoin={handleJoinRoom} gameType="CLASSIC" />;
        }
    };

    if (!user) return <Auth onAuth={handleAuth} />;

    return (
        <div className="App centered-layout">
            <Navbar
                user={user}
                currentView={currentView}
                changeView={(view) => {
                    if (!inGame) setCurrentView(view);
                    else if(confirm("Quitter la table pour voir le menu ?")) {
                        handleLeaveRoom();
                        setCurrentView(view);
                    }
                }}
                logout={handleLogout}
            />

            <div className="main-content">
                {renderContent()}
            </div>
        </div>
    );
}

export default App;