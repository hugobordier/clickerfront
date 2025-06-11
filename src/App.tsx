import './App.css';
import LoginForm from './components/LoginForm';
import React, { useState } from 'react'
import { useWindowSize } from 'react-use'
import Confetti from 'react-confetti'
import { useNavigate } from 'react-router-dom';

function App() {
  const [showConfetti, setShowConfetti] = useState(false);
  const {width, height} = useWindowSize();
  const navigate = useNavigate();

    const handleContinuer = () => {
        setShowConfetti(true);
        setTimeout(() => {
        setShowConfetti(false);
        navigate("/Pagejeu");
      }, 2000);
    };
  return (
    
      <div className="App">
        {showConfetti && <Confetti width={width} height={height} gravity={0.5}/>}
        <LoginForm onContinuer={handleContinuer} />
      </div>
      
  )}

export default App;
