import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../services/socket';
import { IconDoor } from '../components/ui/Icons';
import ResultOverlay from '../components/ui/ResultOverlay';

// --- IMPORTS DES IMAGES ---
import sevenImg from '../assets/imgs/seven.png';
import diamondImg from '../assets/imgs/diamond.png';
import bellImg from '../assets/imgs/bell.png';
import grapesImg from '../assets/imgs/grapes.png';
import lemonImg from '../assets/imgs/lemon.png';
import cherryImg from '../assets/imgs/cherry.png';

// Dictionnaire de correspondance
const SYMBOLS_MAP = {
    'seven': sevenImg,
    'diamond': diamondImg,
    'bell': bellImg,
    'grapes': grapesImg,
    'lemon': lemonImg,
    'cherry': cherryImg
};

export default function Slots({ roomData, leaveRoom, betAmount, setBetAmount }) {
    const me = roomData.players.find(p => p.id === socket.id);

    const [reelsSpinning, setReelsSpinning] = useState([false, false, false]);
    // On initialise avec des clés (noms) au lieu d'emojis
    const [displaySymbols, setDisplaySymbols] = useState(['cherry', 'cherry', 'cherry']);
    const [showResult, setShowResult] = useState(false);

    const [lastResult, setLastResult] = useState({ bet: 0, win: 0 });

    const expectingResult = useRef(false);
    const finalHandRef = useRef([]);
    const [tempSymbols, setTempSymbols] = useState(['grapes', 'lemon', 'cherry']);

    const isSpinning = reelsSpinning.some(s => s === true);

    // Helper pour afficher l'image
    const renderSymbol = (symbolKey) => {
        const src = SYMBOLS_MAP[symbolKey];
        if (!src) return <span>❓</span>;
        return <img src={src} alt={symbolKey} className="slot-img" />;
    };

    // 1. Animation visuelle
    useEffect(() => {
        let interval;
        if (isSpinning) {
            const keys = Object.keys(SYMBOLS_MAP);
            interval = setInterval(() => {
                setTempSymbols([
                    keys[Math.floor(Math.random() * keys.length)],
                    keys[Math.floor(Math.random() * keys.length)],
                    keys[Math.floor(Math.random() * keys.length)]
                ]);
            }, 80);
        }
        return () => clearInterval(interval);
    }, [isSpinning]);

    // 2. Réception résultat
    useEffect(() => {
        if (expectingResult.current && me?.hasFinishedTurn && me?.hand?.length === 3) {
            setLastResult({
                bet: me.betAmount,
                win: me.winnings
            });
            finalHandRef.current = me.hand.map(s => s.char); // s.char contient maintenant 'cherry', 'seven', etc.
            startStopSequence();
            expectingResult.current = false;
        }
    }, [me?.hasFinishedTurn, me?.hand, me?.winnings, me?.betAmount]);

    // 3. Séquence d'arrêt
    const startStopSequence = () => {
        const STOP_DELAYS = [600, 1200, 1800];

        STOP_DELAYS.forEach((delay, index) => {
            setTimeout(() => {
                setReelsSpinning(prev => {
                    const newState = [...prev];
                    newState[index] = false;
                    return newState;
                });

                setDisplaySymbols(prev => {
                    const newSymbols = [...prev];
                    newSymbols[index] = finalHandRef.current[index];
                    return newSymbols;
                });

                if (index === 2) {
                    setShowResult(true);
                    setTimeout(() => setShowResult(false), 2000);
                }
            }, delay);
        });
    };

    const handleSpin = () => {
        if (isSpinning) return;
        setShowResult(false);
        setReelsSpinning([true, true, true]);
        expectingResult.current = true;
        socket.emit("place_bet", { roomId: roomData.id, amount: Number(betAmount) });
        socket.emit("make_choice", { roomId: roomData.id, choice: 'SPIN' });
    };

    const paytable = [
        { s: 'seven', m: 'x100', l: '1.5%' },
        { s: 'diamond', m: 'x50', l: '3%' },
        { s: 'bell', m: 'x20', l: '6%' },
        { s: 'grapes', m: 'x10', l: '12%' },
        { s: 'lemon', m: 'x5', l: '23%' },
        { s: 'cherry', m: 'x2', l: '35%' },
    ];

    const isButtonDisabled = isSpinning || me?.hasFinishedTurn;

    return (
        <div className="game-wrapper">
            <header className="game-header">
                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                    <h2 style={{margin:0, color:'#FFD700', fontSize:'1.2rem', fontFamily:'Cinzel'}}>SLOTS</h2>
                    <span style={{color:'gray', fontSize:'0.9rem'}}>SOLO MODE</span>
                </div>
                <button className="leave-btn" onClick={leaveRoom}><IconDoor /> QUITTER</button>
            </header>

            {showResult && (
                <ResultOverlay bet={lastResult.bet} winnings={lastResult.win} />
            )}

            <div className="slots-machine">
                <div className="slots-header-deco">CASINO SLOTS</div>

                <div className="slots-frame">
                    <div className="reels-container">
                        {/* Rouleau 1 */}
                        <div className={`reel ${reelsSpinning[0] ? 'spinning-blur' : ''}`}>
                            {renderSymbol(reelsSpinning[0] ? tempSymbols[0] : displaySymbols[0])}
                        </div>
                        {/* Rouleau 2 */}
                        <div className={`reel ${reelsSpinning[1] ? 'spinning-blur' : ''}`}>
                            {renderSymbol(reelsSpinning[1] ? tempSymbols[1] : displaySymbols[1])}
                        </div>
                        {/* Rouleau 3 */}
                        <div className={`reel ${reelsSpinning[2] ? 'spinning-blur' : ''}`}>
                            {renderSymbol(reelsSpinning[2] ? tempSymbols[2] : displaySymbols[2])}
                        </div>
                    </div>
                    <div className="payline"></div>
                </div>

                <div className="slot-controls">
                    <div className="bet-adjust">
                        <label>MISE</label>
                        <div className="bet-input-group">
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(e.target.value)}
                                disabled={isButtonDisabled}
                            />
                            <span className="bet-currency">$</span>
                        </div>
                    </div>

                    <button
                        className={`spin-btn ${isButtonDisabled ? 'disabled' : ''}`}
                        onClick={handleSpin}
                        disabled={isButtonDisabled}
                    >
                        {isSpinning ? '...' : 'JOUER'}
                    </button>
                </div>
            </div>

            <div className="paytable-container">
                <h3>TABLE DES GAINS</h3>
                <div className="paytable-grid">
                    {paytable.map((p, i) => (
                        <div key={i} className="pay-row">
                            <span className="pay-sym">
                                {renderSymbol(p.s)} {renderSymbol(p.s)} {renderSymbol(p.s)}
                            </span>
                            <span className="pay-mult">{p.m}</span>
                            <span className="pay-prob">{p.l}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}