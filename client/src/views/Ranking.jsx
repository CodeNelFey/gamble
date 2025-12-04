// src/views/Ranking.jsx
import React, { useEffect, useState } from 'react';
import {API_URL} from "../config.js";

export default function Ranking({ user }) {
    const [leaderboard, setLeaderboard] = useState([]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                // Adapter l'URL si tu es en prod
                const URL = API_URL;
                console.log("Fetching leaderboard for leaderboard ", URL);
                const res = await fetch(`${URL}/leaderboard`);
                const data = await res.json();
                setLeaderboard(data);
                // eslint-disable-next-line no-unused-vars
            } catch (e) { console.error("Erreur ranking"); }
        };
        fetchLeaderboard();
    }, []);

    return (
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
    );
}