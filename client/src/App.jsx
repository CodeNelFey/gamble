// src/App.jsx
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io.connect("http://localhost:3001");

// --- ICONS ---
const IconUser = () => <svg viewBox="0 0 24 24" className="icon"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>;
const IconWallet = () => <svg viewBox="0 0 24 24" className="icon"><path fill="currentColor" d="M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>;
const IconLogout = () => <svg viewBox="0 0 24 24" className="icon"><path fill="currentColor" d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 0 0-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>;
const IconTrophy = () => <svg viewBox="0 0 24 24" className="icon"><path fill="currentColor" d="M20.2 6.51l-2.73 8.2c-.38 1.14-1.28 2-2.38 2.29l-1.09.28v2.47H16c.55 0 1 .45 1 1s-.45 1-1 1H8c-.55 0-1-.45-1-1s.45-1 1-1h2v-2.47l-1.09-.28c-1.1-.29-2-.1.15-2.38-2.29L3.8 6.51c-.39-1.16.26-2.41 1.44-2.79l.52-.16c1.19-.38 2.45.27 2.84 1.43l1.86 5.58c.18.54.77.83 1.31.65.54-.18.83-.77.65-1.31l-1.86-5.58c-.68-2.05-2.89-3.18-4.94-2.5-2.05.68-3.18 2.89-2.5 4.94L5.85 15c.66 1.98 2.25 3.51 4.25 4.02V21H9v2h6v-2h-1.1v-1.98c2-.51 3.59-2.04 4.25-4.02l2.73-8.19c.68-2.05-.45-4.26-2.5-4.94l-.52-.16c-2.05-.68-4.26.45-4.94 2.5z"/></svg>;
const IconCards = () => <svg viewBox="0 0 24 24" className="icon"><path fill="currentColor" d="M21.9 8.89l-1.05-4.37c-.22-.9-1.14-1.48-2.03-1.26l-3.21.77c-.9.22-1.48 1.14-1.26 2.03l1.05 4.37L21.9 8.89zM5.56 5.25L2.12 6.8c-.85.38-1.22 1.39-.84 2.24l2.84 6.31 4.54-2.04-2.84-6.31c-.39-.85-1.41-1.22-2.26-.85zM13 3.5h8v15h-8z"/></svg>;
const IconRoulette = () => <svg viewBox="0 0 24 24" className="icon"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IconSkull = () => <svg viewBox="0 0 24 24" className="icon"><path fill="currentColor" d="M12 2c-4.42 0-8 3.58-8 8 0 2.76 1.4 5.18 3.53 6.53L7 19h10l-.53-2.47C18.6 15.18 20 12.76 20 10c0-4.42-3.58-8-8-8zm0 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm-4-3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm8 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>;
const IconCheck = () => <svg viewBox="0 0 24 24" className="icon"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>;
const IconDoor = () => <svg viewBox="0 0 24 24" className="icon"><path fill="currentColor" d="M19 19h-6V5h6c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2zM3 5v14h9V5H3zm2 2h2v2H5V7z"/></svg>;

const SuitHeart = () => <svg viewBox="0 0 24 24" className="suit-icon red"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>;
const SuitDiamond = () => <svg viewBox="0 0 24 24" className="suit-icon red"><path fill="currentColor" d="M19 12l-7 10-7-10 7-10z"/></svg>;
const SuitClub = () => <svg viewBox="0 0 24 24" className="suit-icon black"><path fill="currentColor" d="M19.43 12.98c.04-.32.07-.64.07-.98 0-2.21-1.79-4-4-4-1.43 0-2.68.76-3.38 1.88.23-.79.38-1.63.38-2.5C12.5 5.03 10.49 3 8 3S3.5 5.03 3.5 7.5c0 1.83 1.07 3.4 2.62 4.15C4.24 12.22 3 13.97 3 16c0 2.21 1.79 4 4 4 .91 0 1.75-.3 2.45-.81C10.15 20.35 11.49 21 13 21h2v-2h-2c-1.66 0-3-1.34-3-3 0-1.66 1.34-3 3-3 1.66 0 3 1.34 3 3h2c0-2.76-2.24-5-5-5 .2-.65.5-1.25.9-1.78.36.19.76.28 1.1.28 1.38 0 2.5-1.12 2.5-2.5-.03-.01-.06-.01-.07-.02z"/></svg>;
const SuitSpade = () => <svg viewBox="0 0 24 24" className="suit-icon black"><path fill="currentColor" d="M12 2C9 7 4 9 4 14c0 2.21 1.79 4 4 4 1.25 0 2.43-.59 3.2-1.52.77.93 1.95 1.52 3.2 1.52 2.21 0 4-1.79 4-4 0-5-5-7-8-12zM7 21v-2c-1.1 0-2 .9-2 2h2zm10 0v-2c1.1 0 2 .9 2 2h-2z"/></svg>;

function App() {
    const [user, setUser] = useState(null);
    const [currentView, setCurrentView] = useState('GAME');
    const [leaderboard, setLeaderboard] = useState([]);
    const [isRegistering, setIsRegistering] = useState(false);
    const [authForm, setAuthForm] = useState({ username: "", password: "" });

    const [inGame, setInGame] = useState(false);
    const [roomId, setRoomId] = useState("");
    const [betAmount, setBetAmount] = useState(100);
    const [roomData, setRoomData] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [roomsList, setRoomsList] = useState([]);

    useEffect(() => {
        socket.on("update_room", (data) => {
            setRoomData(data);
            if(data.timeLeft !== undefined) setTimeLeft(data.timeLeft);
            if (user && data.players) {
                const me = data.players.find(p => p.dbId === user.id);
                if (me && me.balance !== undefined) setUser(prev => ({ ...prev, balance: me.balance }));
            }
        });
        socket.on("timer_update", (time) => setTimeLeft(time));
        socket.on("room_list", (list) => setRoomsList(list));
        socket.on("error", (msg) => { alert(msg); });
        socket.on("force_disconnect", (msg) => { alert(msg); setInGame(false); setRoomData(null); setRoomId(""); });

        return () => { socket.off("update_room"); socket.off("timer_update"); socket.off("room_list"); socket.off("error"); socket.off("force_disconnect"); };
    }, [user]);

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch('http://localhost:3001/leaderboard');
            const data = await res.json();
            setLeaderboard(data);
        } catch (e) { console.error("Erreur ranking"); }
    };

    const changeView = (view) => {
        setCurrentView(view);
        if (view === 'RANKING') fetchLeaderboard();
    };

    const handleAuth = async () => {
        const endpoint = isRegistering ? '/register' : '/login';
        try {
            const res = await fetch(`http://localhost:3001${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(authForm)
            });
            const data = await res.json();
            if (data.success) { setUser({ id: data.id, username: data.username, balance: data.balance }); }
            else { alert(data.error); }
        } catch (err) { alert("Erreur connexion serveur"); }
    };

    const joinRoom = (targetRoomId) => {
        const finalRoomId = targetRoomId || roomId;
        if (finalRoomId !== "") {
            socket.emit("join_room", { roomId: finalRoomId, username: user.username, dbId: user.id, currentBalance: user.balance });
            setInGame(true); setRoomId(finalRoomId);
            changeView('GAME');
        }
    };

    const leaveRoom = () => { socket.emit("leave_room", roomId); setInGame(false); setRoomData(null); setRoomId(""); };
    const placeBet = () => { socket.emit("place_bet", { roomId, amount: Number(betAmount) }); };
    const sendChoice = (choice) => { socket.emit("make_choice", { roomId, choice }); };
    const cashout = () => { socket.emit("cashout", roomId); };

    if (!user) {
        return (
            <div className="App centered-layout">
                <h1 className="game-title">GAMBLE</h1>
                <div className="card auth-card">
                    <h2>{isRegistering ? "NOUVEAU COMPTE" : "CONNEXION"}</h2>
                    <input type="text" placeholder="Pseudo" value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} />
                    <input type="password" placeholder="Mot de passe" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
                    <button onClick={handleAuth} className="gold-btn">{isRegistering ? "CRÉER COMPTE" : "ENTRER"}</button>
                    <p onClick={() => setIsRegistering(!isRegistering)} className="toggle-auth">
                        {isRegistering ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
                    </p>
                </div>
            </div>
        );
    }

    const renderGameContent = () => {
        if (!inGame) {
            return (
                <div className="lobby-container">
                    <div className="lobby-content">
                        <div className="card lobby-actions" style={{minWidth: '400px'}}>
                            <h2 style={{marginBottom: 20, color: '#FFD700', letterSpacing: 2}}>REJOINDRE UNE TABLE</h2>
                            <div className="join-controls">
                                <input type="text" placeholder="Nom de la table..." value={roomId} onChange={(e) => setRoomId(e.target.value)} />
                                <button onClick={() => joinRoom(null)} className="gold-btn">GO</button>
                            </div>
                        </div>
                    </div>

                    <div className="room-list-container">
                        <h3 style={{textAlign: 'center', opacity: 0.7}}>TABLES EN COURS</h3>
                        {roomsList.length === 0 ? <p className="no-tables" style={{textAlign:'center', color:'#555'}}>Aucune table active.</p> : (
                            <div className="room-grid">
                                {roomsList.map((room) => (
                                    <div key={room.id} className={`room-card ${room.status}`} onClick={() => joinRoom(room.id)}>
                                        <div className="room-info"><strong>{room.id}</strong><span className="status-dot"></span></div>
                                        <div className="room-players">
                                            <IconUser /> {room.players}/5
                                            <span style={{fontSize:'0.7em', marginLeft:'5px', color: room.status === 'LOBBY' ? '#4cd964' : '#ff3b30'}}>
                                            {room.status === 'LOBBY' ? 'OUVERTE' : 'EN COURS'}
                                        </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (!roomData) return <p>Chargement table...</p>;

        return (
            <div className="game-wrapper">
                <header className="game-header">
                    <h2>TABLE: {roomData.id}</h2>
                    <button className="leave-btn" onClick={leaveRoom}><IconDoor /> QUITTER</button>
                </header>

                <div className="multiplier-track">
                    {[1.5, 2, 5, 10].map((mult, index) => {
                        const roundNum = index + 1;
                        let status = "pending";
                        if (roomData.round === roundNum) status = "current";
                        if (roomData.round > roundNum) status = "passed";
                        return (
                            <div key={index} className={`mult-step ${status}`}>
                                <div className="mult-val">x{mult}</div>
                                <div className="mult-label">R{roundNum}</div>
                            </div>
                        );
                    })}
                </div>

                <div className="game-board">
                    <div className="cards-container">
                        {roomData.drawnCards.length === 0 && <div className="placeholder-card">G</div>}
                        {roomData.drawnCards.map((c, i) => (
                            <div key={i} className={`playing-card ${c.color}`} style={{animationDelay: `${i * 0.1}s`}}>
                                <div className="card-top">{c.value === 11 ? 'J' : c.value === 12 ? 'Q' : c.value === 13 ? 'K' : c.value === 14 ? 'A' : c.value}</div>
                                <div className="card-suit">
                                    {c.suit === '♥' && <SuitHeart />}
                                    {c.suit === '♦' && <SuitDiamond />}
                                    {c.suit === '♠' && <SuitSpade />}
                                    {c.suit === '♣' && <SuitClub />}
                                </div>
                                <div className="card-bottom">{c.value === 11 ? 'J' : c.value === 12 ? 'Q' : c.value === 13 ? 'K' : c.value === 14 ? 'A' : c.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="controls">
                    {roomData.gameState === 'LOBBY' && (
                        <div className="action-area">
                            <p className="phase-text">FAITES VOS JEUX</p>
                            <div className="betting-box" style={{display:'flex', gap:10, justifyContent:'center'}}>
                                <input type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} disabled={roomData.players.find(p => p.id === socket.id)?.isReady} style={{maxWidth:100}} />
                                <button onClick={placeBet} disabled={roomData.players.find(p => p.id === socket.id)?.isReady} className="gold-btn" style={{width:'auto'}}>
                                    {roomData.players.find(p => p.id === socket.id)?.isReady ? <IconCheck /> : "MISER"}
                                </button>
                            </div>
                        </div>
                    )}

                    {roomData.gameState === 'ENDED' && <div className="action-area"><h2 className="phase-text">PARTIE TERMINÉE</h2></div>}

                    {roomData.gameState === 'PLAYING' && (
                        <div className="action-area">
                            {(() => {
                                const me = roomData.players.find(p => p.id === socket.id);
                                if (!me) return null;
                                if (me.isSpectator) return <div className="status-msg">SPECTATEUR</div>;
                                if (!me.isAlive) return <div className="status-msg dead"><IconSkull /> ÉLIMINÉ</div>;
                                if (me.hasCashedOut) return <div className="status-msg win">ENCAISSÉ : {me.winnings}$</div>;
                                if (me.choice !== null) return <div className="status-msg"><IconCheck /> CHOIX VALIDÉ</div>;

                                return (
                                    <div className="choices-grid">
                                        {roomData.round === 1 && (<><button className="btn-opt red" onClick={() => sendChoice("RED")}>ROUGE</button><button className="btn-opt black" onClick={() => sendChoice("BLACK")}>NOIR</button></>)}
                                        {roomData.round === 2 && (<><button className="btn-opt" onClick={() => sendChoice("UPPER")}>UPPER</button><button className="btn-opt" onClick={() => sendChoice("LOWER")}>LOWER</button></>)}
                                        {roomData.round === 3 && (<><button className="btn-opt" onClick={() => sendChoice("INSIDE")}>INSIDE</button><button className="btn-opt" onClick={() => sendChoice("OUTSIDE")}>OUTSIDE</button></>)}
                                        {roomData.round === 4 && (<><button className="btn-opt" onClick={() => sendChoice("♥")}><SuitHeart /></button><button className="btn-opt" onClick={() => sendChoice("♦")}><SuitDiamond /></button><button className="btn-opt" onClick={() => sendChoice("♠")}><SuitSpade /></button><button className="btn-opt" onClick={() => sendChoice("♣")}><SuitClub /></button></>)}
                                        <button className="cashout-btn" onClick={cashout}>ENCAISSER {me.winnings}$</button>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>

                <div className="player-list-container">
                    {roomData.players.map((p) => {
                        let statusClass = "";
                        if (p.isSpectator) statusClass = "spectator";
                        else if (!p.isAlive) statusClass = "eliminated";
                        else if (p.hasCashedOut) statusClass = "cashed";
                        else if (roomData.gameState === 'LOBBY') statusClass = p.isReady ? "ready" : "not-ready";
                        else statusClass = "ready";

                        return (
                            <div key={p.id} className={`player-row ${statusClass}`}>
                                <div className="p-name">
                                    {statusClass === 'eliminated' ? <IconSkull /> : <IconUser />}
                                    {p.name}
                                    {p.id === roomData.host && <span className="p-host">HOST</span>}
                                </div>
                                <div className="p-bet">
                                    {p.isSpectator ? "👀" : `${p.betAmount}$`}
                                    {p.hasCashedOut && " 💰"}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="bottom-progress-container">
                    <div
                        className="progress-bar"
                        style={{
                            width: `${(timeLeft / 30) * 100}%`,
                            backgroundColor: timeLeft < 10 ? '#ef4444' : '#FFD700',
                            boxShadow: timeLeft < 10 ? '0 0 20px #ef4444' : '0 0 20px #FFD700'
                        }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="App centered-layout">
            <nav className="main-navbar">
                <div className="nav-left">
                    <div className="user-info">
                        <IconUser /> <span>{user.username}</span>
                    </div>
                    <div className="balance-info">
                        <IconWallet /> <span>{user.balance.toLocaleString()}$</span>
                    </div>
                </div>

                <div className="nav-center">
                    <button className={`nav-link ${currentView === 'ROULETTE' ? 'active' : ''}`} onClick={() => changeView('ROULETTE')}>
                        <IconRoulette /> Roulette
                    </button>
                    <button className={`nav-link ${currentView === 'GAME' ? 'active' : ''}`} onClick={() => changeView('GAME')}>
                        <IconCards /> Jeu de Cartes
                    </button>
                    <button className={`nav-link ${currentView === 'RANKING' ? 'active' : ''}`} onClick={() => changeView('RANKING')}>
                        <IconTrophy /> Classement
                    </button>
                </div>

                <div className="nav-right">
                    <button className="nav-logout" onClick={() => setUser(null)} title="Déconnexion">
                        <IconLogout />
                    </button>
                </div>
            </nav>

            <div className="main-content">
                {currentView === 'GAME' && renderGameContent()}

                {currentView === 'ROULETTE' && (
                    <div className="placeholder-view">
                        <IconRoulette style={{fontSize: '5rem', color: '#FFD700', marginBottom: 20}} />
                        <h2>Roulette System</h2>
                        <p>Bientôt disponible. Préparez vos jetons !</p>
                    </div>
                )}

                {currentView === 'RANKING' && (
                    <div className="ranking-view">
                        <h2>🏆 CLASSEMENT DES JOUEURS</h2>
                        <div className="ranking-list">
                            {leaderboard.map((p, index) => {
                                let rankClass = "";
                                if (index === 0) rankClass = "rank-1";
                                else if (index === 1) rankClass = "rank-2";
                                else if (index === 2) rankClass = "rank-3";

                                const isMe = p.username === user.username ? "is-me" : "";

                                return (
                                    <div key={index} className={`ranking-row ${rankClass} ${isMe}`}>
                                        <div className="rank-pos">#{index + 1}</div>
                                        <div className="rank-name">
                                            {p.username}
                                            {isMe && <span style={{fontSize:'0.7em', marginLeft:10, opacity:0.8}}>(Moi)</span>}
                                        </div>
                                        <div className="rank-balance">{p.balance.toLocaleString()}$</div>
                                        {index === 0 && <span style={{fontSize:'1.5rem'}}>👑</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;