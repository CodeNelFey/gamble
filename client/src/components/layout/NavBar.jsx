// src/components/layout/Navbar.jsx
import React from 'react';
// 1. ON IMPORTE LA NOUVELLE ICÔNE ET ON RETIRE L'ANCIENNE (IconRoulette)
import { IconUser, IconWallet, IconLuckySeven, IconCards, IconTrophy, IconLogout, IconNumber21 } from '../ui/Icons';

export default function Navbar({ user, currentView, changeView, logout }) {
    if (!user) return null;

    return (
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
                <button
                    className={`nav-link ${currentView === 'CLASSIC' ? 'active' : ''}`}
                    onClick={() => changeView('CLASSIC')}
                >
                    <IconCards /> High / Low
                </button>

                <button
                    className={`nav-link ${currentView === 'BLACKJACK' ? 'active' : ''}`}
                    onClick={() => changeView('BLACKJACK')}
                >
                    <IconNumber21 /> Blackjack
                </button>

                {/* 2. UTILISE IconLuckySeven ICI POUR LA ROULETTE */}
                <button
                    className={`nav-link ${currentView === 'ROULETTE' ? 'active' : ''}`}
                    onClick={() => changeView('ROULETTE')}
                >
                    <IconLuckySeven /> Roulette
                </button>

                <button
                    className={`nav-link ${currentView === 'RANKING' ? 'active' : ''}`}
                    onClick={() => changeView('RANKING')}
                >
                    <IconTrophy /> Classement
                </button>
            </div>

            <div className="nav-right">
                <button className="nav-logout" onClick={logout} title="Déconnexion">
                    <IconLogout />
                </button>
            </div>
        </nav>
    );
}