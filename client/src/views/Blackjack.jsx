// src/views/Blackjack.jsx
import React from 'react';
import { socket } from '../services/socket';
import ResultOverlay from '../components/ui/ResultOverlay';
import { IconDoor, IconCheck, IconUser, SuitHeart, SuitDiamond, SuitSpade, SuitClub } from '../components/ui/Icons';

export default function Blackjack({ roomData, timeLeft, leaveRoom, betAmount, setBetAmount }) {

    const placeBet = () => { socket.emit("place_bet", { roomId: roomData.id, amount: Number(betAmount) }); };
    const sendAction = (action) => { socket.emit("make_choice", { roomId: roomData.id, choice: action }); };

    const me = roomData.players.find(p => p.id === socket.id);
    const allRivals = roomData.players.filter(p => p.id !== socket.id && !p.isSpectator);
    const midPoint = Math.ceil(allRivals.length / 2);
    const leftRivals = allRivals.slice(0, midPoint);
    const rightRivals = allRivals.slice(midPoint);
    const dealerCards = roomData.drawnCards || [];

    const renderCard = (c, index, type) => {
        const delay = type === 'hero' ? index * 0.3 : index * 0.1;
        return (
            <div key={`${c.value}-${c.suit}-${index}`} className={`playing-card ${c.color}`} style={{animationDelay: `${delay}s`}}>
                <div className="card-top">{c.value === 11 ? 'J' : c.value === 12 ? 'Q' : c.value === 13 ? 'K' : c.value === 14 ? 'A' : c.value}</div>
                <div className="card-suit">
                    {c.suit === '♥' && <SuitHeart />}
                    {c.suit === '♦' && <SuitDiamond />}
                    {c.suit === '♠' && <SuitSpade />}
                    {c.suit === '♣' && <SuitClub />}
                </div>
                {type !== 'rival' && (
                    <div className="card-bottom">{c.value === 11 ? 'J' : c.value === 12 ? 'Q' : c.value === 13 ? 'K' : c.value === 14 ? 'A' : c.value}</div>
                )}
            </div>
        );
    };

    const renderRivalSeat = (p) => (
        <div key={p.id} className={`rival-seat ${p.isAlive ? 'active' : ''}`}>
            <div className="player-label"><IconUser/> {p.name}</div>
            <div className="bj-card-zone">
                {p.score > 0 && (
                    <div className={`score-badge ${p.score > 21 ? 'bust' : ''}`}>
                        {p.score > 21 ? 'X' : p.score}
                    </div>
                )}
                <div className="bj-hand card-rival">
                    {p.hand.map((c, i) => renderCard(c, i, 'rival'))}
                </div>
            </div>
        </div>
    );

    const getDealerScore = () => {
        let score = 0; let aces = 0;
        dealerCards.forEach(c => { score += c.bjValue; if(c.value === 14) aces++; });
        while(score > 21 && aces > 0) { score -= 10; aces--; }
        return score;
    };
    const dealerScore = getDealerScore();

    return (
        <div className="game-wrapper">
            <header className="game-header">
                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                    <h2 style={{margin:0, color:'#FFD700', fontSize:'1.2rem'}}>BLACKJACK</h2>
                    <span style={{color:'gray', fontSize:'0.9rem'}}>Table: {roomData.id}</span>
                </div>
                <button className="leave-btn" onClick={leaveRoom}><IconDoor /> QUITTER</button>
            </header>

            {/* OVERLAY RESULTAT */}
            {roomData.gameState === 'ENDED' && me && (
                <ResultOverlay bet={me.betAmount} winnings={me.winnings} />
            )}

            <div className="bj-table">
                <div className="table-logo">BJ</div>

                {/* 1. DEALER ZONE (RESTORED) */}
                <div className="bj-dealer-zone">
                    <div className="player-label">CROUPIER</div>

                    {/* J'ai remis la DIV bj-card-zone ici */}
                    <div className="bj-card-zone">
                        <div className={`score-badge ${dealerScore > 21 ? 'bust' : ''}`}>
                            {dealerScore > 21 ? 'X' : dealerScore}
                        </div>
                        <div className="bj-hand card-dealer">
                            {dealerCards.map((c, i) => renderCard(c, i, 'dealer'))}
                        </div>
                    </div>
                </div>

                {/* 2. RIVALS */}
                <div className="bj-rivals-zone">
                    <div className="rival-side left">{leftRivals.map(renderRivalSeat)}</div>
                    <div className="rival-side right">{rightRivals.map(renderRivalSeat)}</div>
                </div>

                {/* 3. HERO ZONE */}
                <div className="bj-hero-zone">
                    <div className="bj-card-zone" style={{minWidth:180, minHeight:200, borderColor: me?.isAlive && !me?.hasFinishedTurn ? 'var(--gold)' : ''}}>
                        {me && me.hand.length > 0 && (
                            <div className={`score-badge ${me.score > 21 ? 'bust' : (me.score === 21 && me.hand.length === 2 ? 'blackjack' : '')}`}>
                                {me.score > 21 ? 'BUST' : (me.score === 21 && me.hand.length === 2 ? 'BJ' : me.score)}
                            </div>
                        )}
                        <div className="bj-hand card-hero">
                            {me ? me.hand.map((c, i) => renderCard(c, i, 'hero')) : <div style={{color:'#555', fontSize:'0.8em'}}>En attente...</div>}
                        </div>
                    </div>
                    <div className="player-label hero-label">MOI {me?.betAmount > 0 && `(${me.betAmount}$)`}</div>
                </div>
            </div>

            <div className="controls">
                {roomData.gameState === 'LOBBY' && (
                    <div className="action-area">
                        <p className="phase-text">FAITES VOS JEUX ({timeLeft}s)</p>
                        <div className="betting-box" style={{display:'flex', gap:10, justifyContent:'center'}}>
                            <input type="number" value={betAmount} onChange={(e) => setBetAmount(e.target.value)} disabled={me?.isReady} style={{maxWidth:100}} />
                            <button onClick={placeBet} disabled={me?.isReady} className="gold-btn" style={{width:'auto'}}>
                                {me?.isReady ? <IconCheck /> : "MISER"}
                            </button>
                        </div>
                    </div>
                )}

                {roomData.gameState === 'PLAYING' && me && !me.isSpectator && !me.hasFinishedTurn && (
                    <div className="action-area">
                        <div className="choices-grid">
                            <button className="btn-opt" style={{borderColor:'#4cd964', color:'#4cd964', background:'rgba(76, 217, 100, 0.1)'}} onClick={() => sendAction("HIT")}>
                                TIRER (+)
                            </button>
                            <button className="btn-opt" style={{borderColor:'#ef4444', color:'#ef4444', background:'rgba(239, 68, 68, 0.1)'}} onClick={() => sendAction("STAND")}>
                                RESTER (✋)
                            </button>
                        </div>
                    </div>
                )}
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
}