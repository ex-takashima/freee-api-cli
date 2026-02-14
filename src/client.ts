import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { config, loadToken } from "./config";
import { refreshAccessToken, isTokenExpired } from "./auth";

let apiClient: AxiosInstance | null = null;

export function getClient(): AxiosInstance {
  if (apiClient) return apiClient;

  apiClient = axios.create({
    baseURL: config.apiBaseUrl,
    headers: { "Content-Type": "application/json" },
  });

  // リクエストインターセプター: Authorizationヘッダー付与 + トークン自動リフレッシュ
  apiClient.interceptors.request.use(
    async (reqConfig: InternalAxiosRequestConfig) => {
      if (isTokenExpired()) {
        try {
          await refreshAccessToken();
        } catch {
          console.error("トークンのリフレッシュに失敗しました。再度ログインしてください。");
          process.exit(1);
        }
      }
      const token = loadToken();
      if (token) {
        reqConfig.headers.Authorization = `Bearer ${token.access_token}`;
      }
      return reqConfig;
    }
  );

  // レスポンスインターセプター: 401時にリフレッシュ&リトライ
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          await refreshAccessToken();
          const token = loadToken();
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token.access_token}`;
          }
          return apiClient!.request(originalRequest);
        } catch {
          console.error("認証エラー: 再度ログインしてください。");
          process.exit(1);
        }
      }
      return Promise.reject(error);
    }
  );

  return apiClient;
}
