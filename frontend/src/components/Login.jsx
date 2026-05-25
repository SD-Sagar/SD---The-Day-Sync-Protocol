import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore, API_BASE } from '../store/gameStore';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useGameStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
        navigate('/play');
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection to server failed');
    }
  };

  const handleGuest = () => {
    login(null, null); // Null profile = Guest
    navigate('/play');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-900 bg-opacity-95">
      <div className="bg-gray-800 bg-opacity-40 p-8 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.9)] w-96 max-w-[90%] flex flex-col items-center">
        <h1 className="text-7xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400 tracking-wider mb-1 drop-shadow-[0_0_20px_rgba(239,68,68,0.85)] font-mono italic select-none">
          SD
        </h1>
        <h2 className="text-center text-orange-500 mb-8 text-[11px] tracking-[0.25em] font-extrabold uppercase italic drop-shadow-[0_0_8px_rgba(249,115,22,0.6)] select-none">
          THE DAY SYNC PROTOCOL
        </h2>

        {error && <p className="text-red-500 text-center mb-4 text-xs font-bold">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <input
            type="text"
            placeholder="Callsign (Username)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="p-3 bg-gray-700 bg-opacity-80 rounded text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder-gray-400"
            required
          />
          <input
            type="password"
            placeholder="Passcode"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 bg-gray-700 bg-opacity-80 rounded text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder-gray-400"
            required
          />
          <button
            type="submit"
            className="mt-4 p-3 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black rounded transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-red-900/30 tracking-wider"
          >
            {isLogin ? 'INITIATE SYNC' : 'REGISTER RECRUIT'}
          </button>
        </form>

        <div className="relative flex py-5 items-center w-full">
          <div className="flex-grow border-t border-gray-700"></div>
          <span className="flex-shrink mx-4 text-gray-500 text-xs font-mono">OR</span>
          <div className="flex-grow border-t border-gray-700"></div>
        </div>

        <button
          onClick={handleGuest}
          className="w-full p-3 bg-gray-700 bg-opacity-50 hover:bg-gray-600 text-white font-bold rounded transition-colors border border-gray-600 tracking-wider"
        >
          PLAY AS GUEST
        </button>

        <p className="mt-6 text-center text-gray-400 text-sm">
          {isLogin ? "New recruit?" : "Already enlisted?"}{" "}
          <span
            className="text-orange-400 cursor-pointer hover:underline font-bold transition-all"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Register here" : "Login here"}
          </span>
        </p>

        <div className="mt-8 text-center text-xs text-gray-500 font-mono flex flex-col gap-2 select-none w-full">
          <div className="text-gray-500">SECURE PROTOCOL v1.0.4</div>
          <div className="text-[10px] text-gray-600">©2026 Sagar Dey all rights reserved</div>
        </div>
      </div>
    </div>
  );
}
