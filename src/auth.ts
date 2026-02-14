import http from "http";
import { URL } from "url";
import axios from "axios";
import { config, saveToken, loadToken, TokenData } from "./config";

export function getAuthorizationUrl(): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    prompt: "select_company",
  });
  return `${config.authorizationEndpoint}?${params.toString()}`;
}

export async function waitForAuthorizationCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url || "", `http://localhost:${config.callbackPort}`);
      if (url.pathname === "/callback") {
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");
        if (error) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<h1>認証エラー</h1><p>ブラウザを閉じてください。</p>");
          server.close();
          reject(new Error(`Authorization error: ${error}`));
          return;
        }
        if (code) {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(
            "<h1>認証成功</h1><p>ブラウザを閉じてCLIに戻ってください。</p>"
          );
          server.close();
          resolve(code);
        }
      }
    });

    server.listen(config.callbackPort, () => {
      // Server is ready
    });

    server.on("error", (err) => {
      reject(new Error(`Failed to start callback server: ${err.message}`));
    });

    setTimeout(() => {
      server.close();
      reject(new Error("認証がタイムアウトしました (120秒)"));
    }, 120000);
  });
}

export async function exchangeCodeForToken(code: string): Promise<TokenData> {
  const response = await axios.post(
    config.tokenEndpoint,
    {
      grant_type: "authorization_code",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    },
    { headers: { "Content-Type": "application/json" } }
  );

  const data = response.data;
  const token: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
  };

  saveToken(token);
  return token;
}

export async function refreshAccessToken(): Promise<TokenData> {
  const currentToken = loadToken();
  if (!currentToken?.refresh_token) {
    throw new Error("リフレッシュトークンがありません。再度ログインしてください。");
  }

  const response = await axios.post(
    config.tokenEndpoint,
    {
      grant_type: "refresh_token",
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: currentToken.refresh_token,
    },
    { headers: { "Content-Type": "application/json" } }
  );

  const data = response.data;
  const token: TokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    token_type: data.token_type,
  };

  saveToken(token);
  return token;
}

export function isTokenExpired(): boolean {
  const token = loadToken();
  if (!token) return true;
  return Date.now() >= token.expires_at - 60000; // 1分前にexpired扱い
}
