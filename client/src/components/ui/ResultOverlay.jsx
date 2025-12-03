// src/components/ui/ResultOverlay.jsx
import React, { useMemo } from 'react';

export default function ResultOverlay({ bet, winnings }) {
    const net = winnings - bet;

    // On calcule la position et rotation aléatoire UNE SEULE FOIS au chargement
    const style = useMemo(() => {
        const randomX = Math.floor(Math.random() * 20 - 10); // Décalage X
        const randomY = Math.floor(Math.random() * 20 - 10); // Décalage Y
        const rotation = Math.floor(Math.random() * 30 - 15); // Rotation

        return {
            transform: `translate(calc(-50% + ${randomX}%), calc(-50% + ${randomY}%)) rotate(${rotation}deg)`
        };
    }, []);

    let text = "";
    let className = "result-text";

    if (winnings === 0) {
        text = `-${bet}$`;
        className += " loss";
    } else if (net > 0) {
        text = `+${net}$`;
        className += " win";
    } else {
        text = "PUSH";
        className += " push";
    }

    return (
        // Le conteneur gère la position et la rotation
        <div className="result-overlay-container" style={style}>
            {/* Le texte gère l'animation pop/glow/fade */}
            <span className={className}>{text}</span>
        </div>
    );
}