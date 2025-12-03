// src/views/Game.jsx
import React from 'react';
import { socket } from '../services/socket';
import ResultOverlay from '../components/ui/ResultOverlay';
import { IconDoor, IconSkull, IconCheck, IconUser, SuitHeart, SuitDiamond, SuitSpade, SuitClub } from '../components/ui/Icons';

export default function Game({ roomData, timeLeft, leaveRoom, betAmount, setBetAmount }) {

    const placeBet = () => { socket.emit("place_bet", { roomId: roomData.id, amount: Number(betAmount) }); };
    const sendChoice = (choice) => { socket.emit("make_choice", { roomId: roomData.id, choice }); };
    const cashout = () => { socket.emit("cashout", roomData.id); };

    const me = roomData.players.find(p => p.id === socket.id);

    return (
        <div className="game-wrapper">

            {/* --- HEADER HARMONISÉ (STYLE BLACKJACK) --- */}
            <header className="game-header">
                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                    <h2 style={{margin:0, color:'#FFD700', fontSize:'1.2rem'}}>HIGH / LOW</h2>
                    <span style={{color:'gray', fontSize:'0.9rem'}}>Table: {roomData.id}</span>
                </div>
                <button className="leave-btn" onClick={leaveRoom}><IconDoor /> QUITTER</button>
            </header>

            {/* --- OVERLAY DE RÉSULTAT --- */}
            {roomData.gameState === 'ENDED' && me && (
                <ResultOverlay bet={me.betAmount} winnings={me.winnings} />
            )}

            {/* FRISE DES MULTIPLICATEURS */}
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

            {/* TAPIS DE JEU */}
            <div className="game-board">
                <div className="cards-container">
                    {roomData.drawnCards.length === 0 && <div className="placeholder-card">G</div>}
                    {roomData.drawnCards.map((c, i) => (
                        <div key={i} className={`playing-card ${c.color}`} style={{animationDelay: `${i * 0.6}s`}}>
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

            {/* --- CONTROLS --- */}
            <div className="controls">

                {/* LOBBY */}
                {roomData.gameState === 'LOBBY' && (
                    <div className="action-area">
                        <p className="phase-text">FAITES VOS JEUX ({timeLeft}s)</p>
                        <div className="betting-box" style={{display:'flex', gap:10, justifyContent:'center'}}>
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(e.target.value)}
                                disabled={me?.isReady}
                                style={{maxWidth:100}}
                            />
                            <button onClick={placeBet} disabled={me?.isReady} className="gold-btn" style={{width:'auto'}}>
                                {me?.isReady ? <IconCheck /> : "MISER"}
                            </button>
                        </div>
                    </div>
                )}

                {/* ENDED */}
                {roomData.gameState === 'ENDED' && (
                    <div className="action-area">
                        <h2 className="phase-text" style={{color:'#FFD700'}}>PARTIE TERMINÉE</h2>
                    </div>
                )}

                {/* PLAYING */}
                {roomData.gameState === 'PLAYING' && me && (
                    <div className="action-area">
                        {me.isSpectator ? (
                            <div className="status-msg">SPECTATEUR</div>
                        ) : !me.isAlive ? (
                            <div className="status-msg dead"><IconSkull /> ÉLIMINÉ</div>
                        ) : me.hasCashedOut ? (
                            <div className="status-msg win">ENCAISSÉ : {me.winnings}$</div>
                        ) : me.choice !== null ? (
                            <div className="status-msg"><IconCheck /> CHOIX VALIDÉ</div>
                        ) : (
                            <div className="choices-grid">
                                {roomData.round === 1 && (
                                    <>
                                        <button className="btn-opt red" onClick={() => sendChoice("RED")}>ROUGE</button>
                                        <button className="btn-opt black" onClick={() => sendChoice("BLACK")}>NOIR</button>
                                    </>
                                )}
                                {roomData.round === 2 && (
                                    <>
                                        <button className="btn-opt" onClick={() => sendChoice("UPPER")}>UPPER</button>
                                        <button className="btn-opt" onClick={() => sendChoice("LOWER")}>LOWER</button>
                                    </>
                                )}
                                {roomData.round === 3 && (
                                    <>
                                        <button className="btn-opt" onClick={() => sendChoice("INSIDE")}>INSIDE</button>
                                        <button className="btn-opt" onClick={() => sendChoice("OUTSIDE")}>OUTSIDE</button>
                                    </>
                                )}
                                {roomData.round === 4 && (
                                    <>
                                        <button className="btn-opt" onClick={() => sendChoice("♥")}><SuitHeart /></button>
                                        <button className="btn-opt" onClick={() => sendChoice("♦")}><SuitDiamond /></button>
                                        <button className="btn-opt" onClick={() => sendChoice("♠")}><SuitSpade /></button>
                                        <button className="btn-opt" onClick={() => sendChoice("♣")}><SuitClub /></button>
                                    </>
                                )}
                                <button className="cashout-btn" onClick={cashout}>ENCAISSER {me.winnings}$</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* PLAYERS LIST */}
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

            {/* TIMER BAR */}
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
}