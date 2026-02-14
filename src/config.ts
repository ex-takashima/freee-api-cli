import path from "path";
import os from "os";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const CONFIG_DIR = path.join(os.homedir(), ".freee-cli");
const TOKEN_PATH = path.join(CONFIG_DIR, "token.json");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

export const config = {
  clientId: process.env.CLIENT_ID || "",
  clientSecret: process.env.CLIENT_SECRET || "",
  redirectUri: "http://localhost:8089/callback",
  authorizationEndpoint:
    "https://accounts.secure.freee.co.jp/public_api/authorize",
  tokenEndpoint: "https://accounts.secure.freee.co.jp/public_api/token",
  apiBaseUrl: "https://api.freee.co.jp",
  callbackPort: 8089,
  configDir: CONFIG_DIR,
  tokenPath: TOKEN_PATH,
  configPath: CONFIG_PATH,
};

export function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  token_type: string;
}

export function loadToken(): TokenData | null {
  if (!fs.existsSync(TOKEN_PATH)) return null;
  try {
    const data = fs.readFileSync(TOKEN_PATH, "utf-8");
    return JSON.parse(data) as TokenData;
  } catch {
    return null;
  }
}

export function saveToken(token: TokenData): void {
  ensureConfigDir();
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2), "utf-8");
}

export function deleteToken(): void {
  if (fs.existsSync(TOKEN_PATH)) {
    fs.unlinkSync(TOKEN_PATH);
  }
}

export interface AppConfig {
  companyId?: number;
}

export function loadConfig(): AppConfig {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try {
    const data = fs.readFileSync(CONFIG_PATH, "utf-8");
    return JSON.parse(data) as AppConfig;
  } catch {
    return {};
  }
}

export function saveConfig(appConfig: AppConfig): void {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(appConfig, null, 2), "utf-8");
}

export function getCompanyId(optionValue?: string): number {
  if (optionValue) return parseInt(optionValue, 10);
  const appConfig = loadConfig();
  if (appConfig.companyId) return appConfig.companyId;
  console.error(
    "事業所IDが指定されていません。--company-id オプションか freee companies set <id> で設定してください。"
  );
  process.exit(1);
}
