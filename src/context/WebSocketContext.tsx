import React, { createContext, useContext, useState, useRef } from "react";
import { api } from "../services/api";

type User = {
  id: string;
  username: string;
  score: number;
};

type WebSocketContextType = {
  socket: WebSocket | null;
  connect: (token: string) => void;
  disconnect: () => void;
  userId: string | null;
  connectedUsers: User[];
  userScores: Record<string, number>;
};

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

export const WebSocketProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [userScores, setUserScores] = useState<Record<string, number>>({});
  const [_, forceUpdate] = useState(0);
  const [shouldReposition, setShouldReposition] = useState(false);

  // Fonction pour récupérer les infos d'un utilisateur
  const fetchUserInfo = async (userId: string): Promise<User | null> => {
    try {
      const res = await api.get(`auth/user/${userId}`);
      const userInfo = res.data;

      return {
        id: userInfo.id,
        username: userInfo.username,
        score: userInfo.score,
      };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des infos utilisateur:",
        error
      );
    }
    return null;
  };

  const connect = (token: string) => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    const socket = new WebSocket(
      `wss://projetdelamort.onrender.com/ws?token=${token}`
    );

    socket.onopen = () => {
      console.log("WebSocket connecté");
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "user_connected" && data.user_id) {
          setUserId(data.user_id);

          // Récupérer les infos du nouvel utilisateur connecté
          const userInfo = await fetchUserInfo(data.user_id);
          if (userInfo) {
            setConnectedUsers((prev) => {
              // Éviter les doublons
              const exists = prev.some((user) => user.id === userInfo.id);
              return exists ? prev : [...prev, userInfo];
            });

            // Mettre à jour les scores aussi
            setUserScores((prev) => ({
              ...prev,
              [userInfo.id]: userInfo.score,
            }));
          }
        }

        if (
          data.type === "user_already_connected" &&
          Array.isArray(data.users)
        ) {
          console.log("Liste des utilisateurs connectés :", data.users);

          // Récupérer les infos complètes de tous les utilisateurs connectés
          const userPromises = data.users.map((user: { user_id: string }) =>
            fetchUserInfo(user.user_id)
          );

          const usersInfo = await Promise.all(userPromises);
          const validUsers = usersInfo.filter(
            (user): user is User => user !== null
          );

          setConnectedUsers(validUsers);

          // Mettre à jour les scores
          const scores: Record<string, number> = {};
          validUsers.forEach((user) => {
            scores[user.id] = user.score;
          });
          setUserScores(scores);
        }

        if (data.type === "user_disconnected" && data.user_id) {
          console.log("❌ Utilisateur déconnecté :", data.user_id);

          // Enlever l'utilisateur de la liste
          setConnectedUsers((prev) =>
            prev.filter((user) => user.id !== data.user_id)
          );

          // Enlever son score
          setUserScores((prev) => {
            const copy = { ...prev };
            delete copy[data.user_id];
            return copy;
          });
        }

        if (
          data.type === "score_update" &&
          data.from &&
          typeof data.score === "number"
        ) {
          console.log("Mise à jour du score :", data.score, "de", data.from);

          // Mettre à jour le score dans userScores
          setUserScores((prev) => ({
            ...prev,
            [data.from]: data.score,
          }));

          // Mettre à jour le score dans connectedUsers aussi
          setConnectedUsers((prev) =>
            prev.map((user) =>
              user.id === data.from ? { ...user, score: data.score } : user
            )
          );
        }
      } catch (e) {
        console.log("Message reçu (non JSON) :", event.data);
      }
    };

    socket.onerror = (error) => {
      console.error("Erreur WebSocket :", error);
    };

    socket.onclose = () => {
      console.log("WebSocket fermé");
    };

    socketRef.current = socket;
    forceUpdate((x) => x + 1);
  };

  const disconnect = () => {
    socketRef.current?.close();
    socketRef.current = null;
    setConnectedUsers([]);
    setUserScores({});
    forceUpdate((x) => x + 1);
  };

  return (
    <WebSocketContext.Provider
      value={{
        socket: socketRef.current,
        connect,
        disconnect,
        userId,
        connectedUsers,
        userScores,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context)
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  return context;
};
