// src/components/layout/Auth.jsx
import React, { useState } from 'react';

export default function Auth({ onAuth }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [authForm, setAuthForm] = useState({ username: "", password: "" });

    const handleSubmit = () => {
        onAuth(authForm, isRegistering);
    };

    return (
        <div className="App centered-layout">
            <h1 className="game-title">GAMBLE</h1>
            <div className="card auth-card">
                <h2>{isRegistering ? "NOUVEAU COMPTE" : "CONNEXION"}</h2>
                <input
                    type="text"
                    placeholder="Pseudo"
                    value={authForm.username}
                    onChange={e => setAuthForm({...authForm, username: e.target.value})}
                />
                <input
                    type="password"
                    placeholder="Mot de passe"
                    value={authForm.password}
                    onChange={e => setAuthForm({...authForm, password: e.target.value})}
                />
                <button onClick={handleSubmit} className="gold-btn">
                    {isRegistering ? "CRÉER COMPTE" : "ENTRER"}
                </button>
                <p onClick={() => setIsRegistering(!isRegistering)} className="toggle-auth">
                    {isRegistering ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
                </p>
            </div>
        </div>
    );
}