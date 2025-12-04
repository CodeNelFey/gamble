import React, { useMemo } from 'react';

export default function ResultOverlay({ bet, winnings }) {
    const net = winnings - bet;

    const style = useMemo(() => {
        const randomX = Math.floor(Math.random() * 20 - 10);
        const randomY = Math.floor(Math.random() * 20 - 10);
        const rotation = Math.floor(Math.random() * 30 - 15);

        return {
            transform: `translate(calc(-50% + ${randomX}%), calc(-50% + ${randomY}%)) rotate(${rotation}deg)`
        };
    }, []);

    let text = "";
    let className = "result-text";

    if (winnings === 0) {
        text = `-${bet}$`; // Ajout du $
        className += " loss";
    } else if (net > 0) {
        text = `+${net}$`; // Ajout du $
        className += " win";
    } else {
        text = "PUSH";
        className += " push";
    }

    return (
        <div className="result-overlay-container" style={style}>
            <span className={className}>{text}</span>
        </div>
    );
}