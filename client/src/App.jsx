import { useState, useEffect } from 'react';
import { socket } from './services/socket';
import './App.css';

// Import Views & Components
import Navbar from './components/layout/Navbar';
import Auth from './components/layout/Auth';
import Lobby from './views/Lobby';
import Game from './views/Game';
import Blackjack from './views/Blackjack';
import Slots from './views/Slots';
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
        const savedUser = localStorage.getItem('gamble_user');
        if (savedUser) {
            try {
                const parsedUser = JSON.parse(savedUser);
                setUser(parsedUser);
            } catch (e) {
                console.error("Erreur lecture session");
                localStorage.removeItem('gamble_user');
            }
        }
    }, []);

    // --- 2. SOCKET LISTENERS ---
    useEffect(() => {
        socket.on("update_room", (data) => {
            setRoomData(data);
            if(data.timeLeft !== undefined) setTimeLeft(data.timeLeft);

            if (user && data.players) {
                const me = data.players.find(p => p.dbId === user.id);
                if (me && me.balance !== undefined) {
                    const updatedUser = { ...user, balance: me.balance };
                    setUser(updatedUser);
                    localStorage.setItem('gamble_user', JSON.stringify(updatedUser));
                }
            }
        });

        socket.on("timer_update", (time) => setTimeLeft(time));
        socket.on("room_list", (list) => setRoomsList(list));
        socket.on("error", (msg) => { alert(msg); });

        socket.on("force_disconnect", (msg) => {
            alert(msg);
            handleLeaveRoom();
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
        const URL = import.meta.env.VITE_SERVER_URL || "http://82.67.145.215:3001";
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
                localStorage.setItem('gamble_user', JSON.stringify(newUser));
            }
            else { alert(data.error); }
        } catch (err) { alert("Erreur connexion serveur"); }
    };

    const handleLogout = () => {
        setUser(null);
        handleLeaveRoom();
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
        if (roomId) socket.emit("leave_room", roomId);
        setInGame(false);
        setRoomData(null);
        setRoomId("");
        if (currentView === 'SLOTS') setCurrentView('CLASSIC');
    };

    // --- NAVIGATION (AUTO-JOIN POUR SLOTS) ---
    const handleChangeView = (view) => {
        if (inGame) handleLeaveRoom();

        if (view === 'SLOTS') {
            const soloRoomId = `slot_${user.id}_${Date.now()}`;
            setCurrentView('SLOTS');
            socket.emit("join_room", {
                roomId: soloRoomId,
                username: user.username,
                dbId: user.id,
                currentBalance: user.balance,
                gameType: 'SLOTS'
            });
            setInGame(true);
            setRoomId(soloRoomId);
        } else {
            setCurrentView(view);
        }
    };

    // --- RENDER ---
    const renderContent = () => {
        if (inGame) {
            if (!roomData) return <p style={{color:'white', marginTop:100}}>Chargement de la table...</p>;

            if (roomData.type === 'BLACKJACK') {
                return <Blackjack roomData={roomData} timeLeft={timeLeft} leaveRoom={handleLeaveRoom} betAmount={betAmount} setBetAmount={setBetAmount} />;
            } else if (roomData.type === 'SLOTS') {
                return <Slots roomData={roomData} leaveRoom={handleLeaveRoom} betAmount={betAmount} setBetAmount={setBetAmount} />;
            } else {
                return <Game roomData={roomData} timeLeft={timeLeft} leaveRoom={handleLeaveRoom} betAmount={betAmount} setBetAmount={setBetAmount} />;
            }
        }

        switch (currentView) {
            case 'CLASSIC':
                return <Lobby roomsList={roomsList} onJoin={handleJoinRoom} gameType="CLASSIC" />;
            case 'BLACKJACK':
                return <Lobby roomsList={roomsList} onJoin={handleJoinRoom} gameType="BLACKJACK" />;
            case 'SLOTS':
                return <p style={{color:'white', marginTop:50}}>Chargement machine à sous...</p>;
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
                changeView={handleChangeView}
                logout={handleLogout}
            />

            <div className="main-content">
                {renderContent()}
            </div>
        </div>
    );
}

export default App;