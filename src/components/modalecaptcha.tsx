import React, { useState, useEffect } from "react";
import { incrementscore, checkmilestone } from "../services/servicesjeu";
import { useNavigate } from "react-router-dom";
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';
import { calculateProofOfWork } from "../utils/calculateProofOfWork";

type Challenge = {
  challenge_id: string;
  image_data: string;
  timestamp: string;
};

type ModalECaptchaProps = {
  onClose: () => void;
  captchaData: { challenge: Challenge };
};

export default function ModalECaptcha({ onClose, captchaData }: ModalECaptchaProps) {
  const [captchaImg, setCaptchaImg] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string>('');
  const [challenge_id, Setchallenge_id] = useState<string>('');
  const [client_timestamp, setclient_timestamp] = useState<string>('');
  const [tries, setTries] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  useEffect(() => {
    const fetchCaptcha = () => {
      try {
        const { challenge_id, image_data, timestamp } = captchaData.challenge;
        setCaptchaImg(`data:image/png;base64,${image_data}`);
        Setchallenge_id(String(challenge_id));
        setclient_timestamp(String(timestamp));
        setAnswer('');
        setErrorMsg('');
        setTries(0);
      } catch (error) {
        console.error('Erreur lors de la récupération du captcha:', error);
      }
    };
    fetchCaptcha();
  }, [captchaData]);

  const getnewcaptcha = async () => {
    try {
      const newCaptcha = await checkmilestone();
      setCaptchaImg(`data:image/png;base64,${newCaptcha.challenge.image_data}`);
      Setchallenge_id(String(newCaptcha.challenge.challenge_id));
      setclient_timestamp(String(newCaptcha.challenge.timestamp));
      setAnswer('');
    } catch (error) {
      console.error("Erreur lors de la récupération d'un nouveau captcha:", error);
    }
  };

  const handlecaptchavalue = async () => {
    if (tries >= 2) {
      setErrorMsg("Tentatives de captcha épuisées.");
      navigate('/');
      return;
    }
    try {
      const calculatedPoW = await calculateProofOfWork(challenge_id, 4); 
      const form = {
        challenge_id,
        answer,
        client_timestamp,
        proof_of_work: calculatedPoW
      };
      console.log("Formulaire envoyé:", form);
      const response = await incrementscore(form);
      console.log("Réponse du serveur:", response);
      if (response.requires_verification === false) {
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
          onClose();
        }, 6000);
      } else {
        const newTries = tries + 1;
        setTries(newTries);
        if (newTries >= 3) {
          setErrorMsg("Tentatives de captcha épuisées.");
        } else {
          setErrorMsg("Captcha incorrect, veuillez réessayer.");
          await getnewcaptcha();
        }
      }
    } catch (error: any) {
      const newTries = tries + 1;
      setTries(newTries);
      console.error("Erreur complète:", error);
      console.log("Détail backend:", error?.response?.data);
      alert(JSON.stringify(error?.response?.data, null, 2));
      if (newTries >= 3) {
        setErrorMsg("Tentatives de captcha épuisées.");
      } else {
        setErrorMsg("Erreur lors de la vérification du captcha, veuillez réessayer.");
        await getnewcaptcha();
      }
    }
  };

  return (
    <>
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          gravity={0.5}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            pointerEvents: "none",
            zIndex: 2000,
          }}
        />
      )}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#fff',
          padding: '20px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          zIndex: 1001,
        }}
      >
        <h2>Vérification eCaptcha</h2>
        <p>Veuillez résoudre le captcha pour continuer.</p>
        <img
          src={captchaImg || '/images/loading.png'}
          alt="Captcha"
          style={{ width: '100%', height: 'auto', marginBottom: '10px' }}
        />
        <input
          type="text"
          placeholder="Votre réponse"
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
          disabled={tries >= 3}
        />
        <div style={{ position: "relative" }}>
          <button
            onClick={() => { void handlecaptchavalue(); }}
            style={{ width: '100%', padding: '8px' }}
            disabled={tries >= 3}
          >
            Valider
          </button>
        </div>
        {errorMsg && (
          <div style={{ color: 'red', marginTop: 10, textAlign: 'center' }}>
            {errorMsg}
          </div>
        )}
      </div>
    </>
  );
}
