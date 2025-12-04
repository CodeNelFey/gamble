import React, { useState } from 'react';
import { IconUser, IconWallet, IconRoulette, IconCards, IconTrophy, IconLogout, IconNumber21, IconSlots } from '../ui/Icons';

export default function Navbar({ user, currentView, changeView, logout }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    if (!user) return null;

    // Ferme le menu après un clic (pour mobile)
    const handleNavClick = (view) => {
        changeView(view);
        setIsMenuOpen(false);
    };

    return (
        <>
            <nav className="main-navbar">
                {/* GAUCHE : Infos Utilisateur */}
                <div className="nav-left">
                    <div className="user-info">
                        <IconUser /> <span className="username-text">{user.username}</span>
                    </div>
                    <div className="balance-info">
                        <IconWallet /> <span>{user.balance.toLocaleString()}$</span>
                    </div>
                </div>

                {/* BOUTON HAMBURGER (Visible uniquement sur mobile) */}
                <button
                    className={`hamburger-btn ${isMenuOpen ? 'open' : ''}`}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    <span className="bar"></span>
                    <span className="bar"></span>
                    <span className="bar"></span>
                </button>

                {/* CENTRE : Liens de Navigation (Menu Latéral sur Mobile) */}
                <div className={`nav-center ${isMenuOpen ? 'mobile-visible' : ''}`}>
                    <button
                        className={`nav-link ${currentView === 'CLASSIC' ? 'active' : ''}`}
                        onClick={() => handleNavClick('CLASSIC')}
                    >
                        <IconCards /> Bus Driver
                    </button>

                    <button
                        className={`nav-link ${currentView === 'BLACKJACK' ? 'active' : ''}`}
                        onClick={() => handleNavClick('BLACKJACK')}
                    >
                        <IconNumber21 /> Blackjack
                    </button>

                    <button
                        className={`nav-link ${currentView === 'SLOTS' ? 'active' : ''}`}
                        onClick={() => handleNavClick('SLOTS')}
                    >
                        <IconSlots /> Slots
                    </button>

                    <button
                        className={`nav-link ${currentView === 'ROULETTE' ? 'active' : ''}`}
                        onClick={() => handleNavClick('ROULETTE')}
                    >
                        <IconRoulette /> Roulette
                    </button>

                    <button
                        className={`nav-link ${currentView === 'RANKING' ? 'active' : ''}`}
                        onClick={() => handleNavClick('RANKING')}
                    >
                        <IconTrophy /> Classement
                    </button>

                    {/* Bouton Déconnexion MOBILE (En bas du menu) */}
                    <button className="nav-link mobile-logout" onClick={logout}>
                        <IconLogout /> Déconnexion
                    </button>
                </div>

                {/* DROITE : Bouton Déconnexion DESKTOP */}
                <div className="nav-right">
                    <button className="nav-logout" onClick={logout} title="Déconnexion">
                        <IconLogout />
                    </button>
                </div>
            </nav>

            {/* Fond sombre quand le menu est ouvert */}
            {isMenuOpen && <div className="mobile-backdrop" onClick={() => setIsMenuOpen(false)}></div>}
        </>
    );
}