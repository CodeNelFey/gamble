// src/components/ui/Icons.jsx
import React from 'react';

export const IconUser = () => (
    <svg viewBox="0 0 24 24" className="icon" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
);

export const IconWallet = () => (
    <svg viewBox="0 0 24 24" className="icon" fill="currentColor">
        <path d="M21 18v1c0 1.1-.9 2-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1h-9a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
    </svg>
);

export const IconLogout = () => (
    <svg viewBox="0 0 24 24" className="icon" fill="currentColor">
        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
    </svg>
);

// --- NOUVELLE ICÔNE TROPHÉE ---
export const IconTrophy = () => (
    <svg viewBox="0 0 24 24" className="icon" fill="currentColor"
         style={{ transform: 'scale(1.3)' }} /* <-- ZOOM ICI */
    >
        <path d="M18 2c-.9 0-2 1-2 2H8c0-1-1.1-2-2-2H2v9c0 1 1 2 2 2h2.2c.4 2 1.7 3.7 4.8 4v2.08C8 19.54 8 22 8 22h8s0-2.46-3-2.92V17c3.1-.3 4.4-2 4.8-4H20c1 0 2-1 2-2V2h-4M6 11H4V4h2v7m14 0h-2V4h2v7Z"></path>
    </svg>
);

export const IconCards = () => <svg  viewBox="0 0 344 408" className="icon"><path fill="currentColor" d="M0 301V88q0-27 12.5-44.5t38-26t53-11.5t67-3t67 3t53 11.5t38 26T341 88v213q0 28-21 48v38q0 8-6.5 14.5T299 408h-22q-8 0-14.5-6.5T256 387v-22H85v22q0 8-6 14.5T64 408H43q-9 0-15.5-6.5T21 387v-38Q0 329 0 301zm74.5 22q13.5 0 23-9.5t9.5-23t-9.5-22.5t-23-9t-22.5 9t-9 22.5t9 23t22.5 9.5zm192 0q13.5 0 23-9.5t9.5-23t-9.5-22.5t-23-9t-22.5 9t-9 22.5t9 23t22.5 9.5zM299 195V88H43v107h256z"/></svg>;


// --- ICÔNE BLACKJACK (ZOOMÉE) ---
export const IconNumber21 = () => (
    <svg
        viewBox="0 0 24 24"
        className="icon"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transform: 'scale(2.3)' }} /* <-- ZOOM ICI */
    >
        <path d="m15 10l2-2v8M7 8h3a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h3"></path>
    </svg>
);

export const IconSlots = () => (
    <svg viewBox="0 0 24 24" className="icon" fill="currentColor">
        <path d="M22.38 1.92L21.49.85a1.51 1.51 0 0 0-1.82-.38a9.6 9.6 0 0 1-4.12 1A7.4 7.4 0 0 1 12.5.79A8.25 8.25 0 0 0 9.09 0a7.6 7.6 0 0 0-3.65.9a.21.21 0 0 1-.19 0A.26.26 0 0 1 5.1.8A1.5 1.5 0 0 0 3.78 0h-1a1.5 1.5 0 0 0-1.5 1.5v7a1.5 1.5 0 0 0 1.5 1.5h1.07a1.49 1.49 0 0 0 1.47-1.22a2.64 2.64 0 0 1 2.7-2a7.4 7.4 0 0 1 2.22.62a9.2 9.2 0 0 0 3.16.81a.38.38 0 0 1 .29.63A23.46 23.46 0 0 0 7.9 22.41a1.54 1.54 0 0 0 .41 1.12A1.5 1.5 0 0 0 9.4 24h5.93a1.5 1.5 0 0 0 1.49-1.34c.54-5.07 4.58-16 5.81-19.25a1.52 1.52 0 0 0-.25-1.49"></path>
    </svg>
);

// --- ANCIENNE ROULETTE (GARDÉE AU CAS OÙ, MAIS NON UTILISÉE) ---
export const IconRoulette = () => (
    <svg viewBox="0 0 24 24" className="icon" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
    </svg>
);

export const IconSkull = () => (
    <svg viewBox="0 0 24 24" className="icon" fill="currentColor">
        <path d="M12 2c-4.97 0-9 3.58-9 8 0 2.92 1.56 5.47 3.89 6.86-.31 1.45-.55 2.66-.55 2.66-.17.85.39 1.48 1.17 1.48h8.99c.77 0 1.34-.63 1.17-1.48 0 0-.24-1.21-.55-2.66 2.33-1.39 3.89-3.94 3.89-6.86 0-4.42-4.03-8-9-8zm0 12c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm4-3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-8 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
    </svg>
);

export const IconCheck = () => (
    <svg viewBox="0 0 24 24" className="icon" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
);

export const IconDoor = () => (
    <svg viewBox="0 0 24 24" className="icon" fill="currentColor">
        <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 0 0-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
    </svg>
);

// --- LES ENSEIGNES (SUITS) ---

export const SuitHeart = () => (
    <svg viewBox="0 0 1025 1024" className="suit-icon red" fill="currentColor">
        <path d="m805.694 724l-293 300l-294-300q-119-122-168.5-231T.694 256q0-106 75-181t181-75t181 75t75 181q0-106 75-181t181-75t181 75t75 181q0 127-49.5 236.5T805.695 724z"></path>
    </svg>
);

export const SuitDiamond = () => (
    <svg viewBox="0 0 17 16" className="suit-icon red" fill="currentColor">
        <path fillRule="evenodd" d="M7.93 15.644L3.34 8.796a1.162 1.162 0 0 1-.002-1.641L7.904.323a1.162 1.162 0 0 1 1.642.002l4.54 6.85a1.16 1.16 0 0 1 .004 1.641l-4.518 6.83s-1.187.451-1.642-.002z"></path>
    </svg>
);

export const SuitClub = () => (
    <svg viewBox="0 0 256 256" className="suit-icon black" fill="currentColor">
        <path d="M240 144a56 56 0 0 1-84.81 48h-4.44l8.91 29.7A8 8 0 0 1 152 232h-48a8 8 0 0 1-7.66-10.3l8.91-29.7h-4.44A56 56 0 1 1 72 88h2.33a56 56 0 1 1 107.34 0H184a56.06 56.06 0 0 1 56 56Z"></path>
    </svg>
);

export const SuitSpade = () => (
    <svg viewBox="0 0 256 256" className="suit-icon black" fill="currentColor">
        <path d="M232 136a56 56 0 0 1-83.4 48.82l11.06 36.88A8 8 0 0 1 152 232h-48a8 8 0 0 1-7.66-10.3l11.06-36.88A56 56 0 0 1 24 136c0-32 17.65-62.84 51-89.27a234.14 234.14 0 0 1 49.89-30.11a7.93 7.93 0 0 1 6.16 0A234.14 234.14 0 0 1 181 46.73C214.35 73.16 232 104 232 136Z"></path>
    </svg>
);