import { api } from "./api";

type LoginResponse = {
  access_token: string;
  [key: string]: unknown; 
};

export const login = async (
  form: { username: string; password: string }
): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>("/auth/login", {
    username: form.username,
    password: form.password,
  });

  const accessToken = response.data?.access_token;
  if (typeof accessToken === "string") {
    localStorage.setItem("accessToken", accessToken);
  } else {
    throw new Error("Jeton d'accès invalide reçu du serveur.");
  }

  return response.data;
};
