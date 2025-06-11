import React, { useRef, useEffect, useState, use } from "react";
import { incrementscore } from "../services/servicesjeu";
import { useWebSocket } from "../context/WebSocketContext";
import { checkmilestone } from "../services/servicesjeu";
import ModalECaptcha from "./modalecaptcha";

const Pagejeu = () => {
  const { socket, userId, connectedUsers } = useWebSocket();
  const containerRef = useRef<HTMLDivElement>(null); //ref vers le div contenant l'animation

  const { widthitems, heightitems } = { widthitems: 200, heightitems: 200 };
  const { widthtete, heighttete } = { widthtete: 150, heighttete: 150 };

  const [startPos] = useState(() => getRandomxy(widthtete, heighttete));
  const [pos, setPos] = useState(startPos);
  const [dir, setDir] = useState({ dx: 2, dy: 2 });
  // const [staticimages,setstaticimages]= useState<{x:number;y:number,id:number,src:string}[]>([]);
  const [staticimagescentre, setstaticimagescentre] = useState<
    { id: number; src: string }[]
  >([]);
  const [nextID, setNextID] = useState(0);
  //
  const [imgquibougent, setimgquibougent] = useState<
    {
      id: string;
      pos: { x: number; y: number };
      dir: { dx: number; dy: number };
      src: string;
      username: string;
      score: number;
    }[]
  >([]);

  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaData, setCaptchaData] = useState<any>(null);

  useEffect(() => {
    console.log("connectedUsers", connectedUsers);

    if (!connectedUsers || connectedUsers.length === 0) return;

    setimgquibougent(
      connectedUsers.map((user) => {
        let pos;
        do {
          pos = getRandomxy(widthtete, heighttete);
        } while (isOverlappingCenter(pos.x, pos.y));
        return {
          id: user.id,
          pos,
          dir: { dx: 2, dy: 2 },
          src: `https://projetdelamort.onrender.com/assets/${user.id}.png`,
          username: user.username,
          score: user.score,
        };
      })
    );
  }, [connectedUsers]);

  useEffect(() => {
    let animationFrame: number;

    const move = () => {
      setimgquibougent((imgs) =>
        imgs.map((img) => {
          const container = containerRef.current;
          if (!container) return img;

          let newX = img.pos.x + (img.dir?.dx ?? 2);
          let newY = img.pos.y + (img.dir?.dy ?? 2);
          let newDx = img.dir?.dx ?? 2;
          let newDy = img.dir?.dy ?? 2;

          // rebond sur les bords du container
          if (newX <= 0 || newX + widthtete >= container.offsetWidth) {
            newDx *= -1;
          }
          if (newY <= 0 || newY + heighttete >= container.offsetHeight) {
            newDy *= -1;
          }

          // collision avec l'image centrale
          const Imagecentrex = container.offsetWidth / 2 - widthitems / 2;
          const Imagecentrey = container.offsetHeight / 2 - heightitems / 2;
          const rectImagemov = {
            left: newX,
            right: newX + widthtete,
            top: newY,
            bottom: newY + heighttete,
          };
          const rectImagecenter = {
            left: Imagecentrex,
            right: Imagecentrex + widthitems,
            top: Imagecentrey,
            bottom: Imagecentrey + heightitems,
          };
          const collision =
            rectImagemov.left < rectImagecenter.right &&
            rectImagemov.right > rectImagecenter.left &&
            rectImagemov.top < rectImagecenter.bottom &&
            rectImagemov.bottom > rectImagecenter.top;

          if (collision) {
            const overlapX =
              Math.min(rectImagemov.right, rectImagecenter.right) -
              Math.max(rectImagemov.left, rectImagecenter.left);
            const overlapY =
              Math.min(rectImagemov.bottom, rectImagecenter.bottom) -
              Math.max(rectImagemov.top, rectImagecenter.top);

            if (overlapX < overlapY) {
              newDx *= -1;
            } else {
              newDy *= -1;
            }
          }

          return {
            ...img,
            pos: { x: newX, y: newY },
            dir: { dx: newDx, dy: newDy },
          };
        })
      );
      animationFrame = requestAnimationFrame(move);
    };

    animationFrame = requestAnimationFrame(move);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  function isOverlappingCenter(x: number, y: number) {
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    const centerX = containerWidth / 2 - widthitems / 2;
    const centerY = containerHeight / 2 - heightitems / 2;

    const rectMov = {
      left: x,
      right: x + widthtete,
      top: y,
      bottom: y + heighttete,
    };
    const rectCenter = {
      left: centerX,
      right: centerX + widthitems,
      top: centerY,
      bottom: centerY + heightitems,
    };

    return (
      rectMov.left < rectCenter.right &&
      rectMov.right > rectCenter.left &&
      rectMov.top < rectCenter.bottom &&
      rectMov.bottom > rectCenter.top
    );
  }

  useEffect(() => {
    const imageSources = [
      "/images/coca.jpg",
      "/images/biere.png",
      "/images/mcsmart.jpg",
      "/images/bouteilles martini.png",
      "/images/burger.png",
      "/images/choppes bière.webp",
      "/images/frites.png",
      "/images/moscow mule.webp",
      "/images/pina colada.png",
      "/images/pisco sour.png",
      "/images/ti punch.png",
      "/images/verre de bière.webp",
    ];

    const intervalle = setInterval(() => {
      const randomimages =
        imageSources[Math.floor(Math.random() * imageSources.length)];

      const newImage = {
        id: nextID,
        src: randomimages,
      };

      setstaticimagescentre([newImage]);
      setNextID((id) => id + 1);
    }, 1000);

    return () => clearInterval(intervalle);
  }, []);

  function getRandomxy(width: number, height: number) {
    const x = Math.floor(Math.random() * (window.innerWidth - width));
    const y = Math.floor(Math.random() * (window.innerHeight - height));
    return { x, y };
  }

  const handleClick = async () => {
    try {
      if (socket && socket.readyState === WebSocket.OPEN) {
        const check = await checkmilestone();
        if (check.requires_verification) {
          setCaptchaData(check);
          setShowCaptcha(true);
          return;
        }

        socket.send(
          JSON.stringify({ type: "click", data: { x: pos.x, y: pos.y } })
        );

        const response = await incrementscore();
        const newScore = response.new_score;

        if (userId) {
          setimgquibougent((prev) =>
            prev.map((img) =>
              img.id === userId ? { ...img, score: newScore } : img
            )
          );
        }

        console.log("Score incrémenté:", response);
      } else {
        console.error("pas connecté au websocket");
      }
    } catch (error) {
      console.error("Erreur lors du clic sur l'image:", error);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#000",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {imgquibougent.map((img) => (
        <div key={img.id} style={{ position: "relative" }}>
          <img
            src={img.src}
            alt={`user ${img.username}`}
            style={{
              position: "absolute",
              top: img.pos.y,
              left: img.pos.x,
              width: widthtete,
              height: heighttete,
              zIndex: 1,
            }}
          />
          {/* Affichage optionnel du nom et score */}
          <div
            style={{
              position: "absolute",
              top: img.pos.y - 25,
              left: img.pos.x,
              color: "white",
              fontSize: "12px",
              backgroundColor: "rgba(0,0,0,0.7)",
              padding: "2px 4px",
              borderRadius: "3px",
              zIndex: 2,
              whiteSpace: "nowrap",
            }}
          >
            {img.username}: {img.score}
          </div>
        </div>
      ))}

      {staticimagescentre.map((img) => (
        <img
          key={img.id}
          src={img.src}
          onClick={handleClick}
          style={{
            position: "absolute",
            top: `calc(50% - ${heightitems / 2}px)`,
            left: `calc(50% - ${widthitems / 2}px)`,
            width: widthitems,
            height: heightitems,
            cursor: "pointer",
            zIndex: 10,
          }}
        />
      ))}

      {showCaptcha && (
        <ModalECaptcha
          onClose={() => setShowCaptcha(false)}
          captchaData={captchaData}
        />
      )}
    </div>
  );
};

export default Pagejeu;
