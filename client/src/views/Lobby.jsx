// src/views/Lobby.jsx
import React, { useState } from 'react';
import { IconUser } from '../components/ui/Icons';

// On reçoit 'gameType' en prop (CLASSIC ou BLACKJACK)
export default function Lobby({ roomsList, onJoin, gameType }) {
    const [roomId, setRoomId] = useState("");

    // On ne garde que les tables qui correspondent à l'onglet actuel
    const filteredRooms = roomsList.filter(r => r.type === gameType);

    return (
        <div className="lobby-container">
            <div className="lobby-content">
                <div className="card lobby-actions" style={{minWidth: '400px'}}>
                    <h2 style={{marginBottom: 20, color: '#FFD700', letterSpacing: 2}}>
                        {gameType === 'BLACKJACK' ? 'TABLE BLACKJACK' : 'TABLE HIGH/LOW'}
                    </h2>

                    <div className="join-controls">
                        <input
                            type="text"
                            placeholder="Nom de la table..."
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                        />
                        {/* Quand on clique sur GO, on force le type actuel */}
                        <button onClick={() => onJoin(roomId, gameType)} className="gold-btn">CRÉER / REJOINDRE</button>
                    </div>
                </div>
            </div>

            <div className="room-list-container">
                <h3 style={{textAlign: 'center', opacity: 0.7}}>TABLES {gameType} EN COURS</h3>

                {filteredRooms.length === 0 ? (
                    <p className="no-tables" style={{textAlign:'center', color:'#555'}}>Aucune table active dans cette catégorie.</p>
                ) : (
                    <div className="room-grid">
                        {filteredRooms.map((room) => (
                            <div key={room.id} className={`room-card ${room.status}`} onClick={() => onJoin(room.id, room.type)}>
                                <div className="room-info">
                                    <strong>{room.id}</strong>
                                    <span className="status-dot"></span>
                                </div>
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