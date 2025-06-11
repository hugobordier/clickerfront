import axios from "axios";
import createCache from "../utils/cache";
const BASE_URL = "https://projetdelamort.onrender.com/";
// const BASE_URL = "http://127.0.0.1:8000/";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10000,
});

const cache = createCache(500, 300000);

 api.interceptors.request.use(
  async (config) => {
    if (!navigator.onLine) {
  return Promise.reject({
    response: { data: { message: "Pas de connexion Internet" } },
  });
}


    const accessToken = localStorage.getItem("accessToken");
    if (
      accessToken &&
      !config.url?.includes("/login") &&
      !config.url?.includes("/register") &&
      !config.url?.includes("/forgot-password") &&
      !config.url?.includes("/verify-reset-code") &&
      !config.url?.includes("/logout") &&
      !config.url?.includes("/refresh")
    ) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
      // console.log(accessToken);
    }

    const paramsString = config.params
      ? new URLSearchParams(config.params).toString()
      : "";
    const bodyString = config.data ? JSON.stringify(config.data) : "";
    const cacheKey = `${config.url}?${paramsString}&body=${bodyString}`;

    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log("cache hit : ", cachedData);
      return Promise.reject({ isCached: true, data: cachedData });
    }
    // console.log("=== INTERCEPTOR ===");
    // console.log("AccessToken =", accessToken);
    // console.log("URL =", config.url);
    // console.log("Headers avant =", config.headers);

    return config;
  },
  (error) => Promise.reject(error)
);