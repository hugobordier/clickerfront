import './LoginForm.css';
import { login } from '../services/auth'; 
import React, { useState } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { useRef } from 'react';
type Props = {
  onContinuer: () => void;
};

const LoginForm = ({ onContinuer }: Props) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { connect } = useWebSocket();
  const [loginDisabled, setLoginDisabled] = useState(false);

 const [, setAudioStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startAudio = async() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio('/song.mp3');
    audio.loop = true;
    try {
      await audio.play();
      setAudioStarted(true);
    } catch (err) {
      console.error('Erreur lecture audio', err);
    }
  };


  const handleLogin = async () => {
    try {
      if (loginDisabled) return;
      setLoginDisabled(true);
      
      const response = await login({ username: username, password });
      const token: string = response.access_token as string;

      await startAudio();
      connect(token); 
      onContinuer();
    } catch (error) {
      alert('Erreur de connexion');
      setLoginDisabled(false);
      console.error(error);
    }
  };

   return (
    <div className="login-container">
      <input
        type="username"
        placeholder="Username"
        className="input-field"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Mot de passe"
        className="input-field"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button className="continue-button" onClick={() => void handleLogin()} disabled={loginDisabled}>
        Continuer
      </button>
      <div className="signup-text">
        Pas de compte?
        <a href="#"> Créer</a>
      </div>
    </div>
  );
};


export default LoginForm;