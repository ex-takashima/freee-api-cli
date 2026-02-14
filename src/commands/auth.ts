import { Command } from "commander";
import { config, loadToken, deleteToken } from "../config";
import {
  getAuthorizationUrl,
  waitForAuthorizationCode,
  exchangeCodeForToken,
} from "../auth";

export function registerAuthCommands(program: Command): void {
  const auth = program.command("auth").description("認証管理");

  auth
    .command("login")
    .description("freee APIにOAuth認証でログイン")
    .action(async () => {
      if (!config.clientId || !config.clientSecret) {
        console.error(
          "CLIENT_ID と CLIENT_SECRET が設定されていません。.env ファイルを確認してください。"
        );
        process.exit(1);
      }

      const authUrl = getAuthorizationUrl();
      console.log("ブラウザで認証ページを開きます...");
      console.log(`URL: ${authUrl}`);

      try {
        const open = (await import("open")).default;
        await open(authUrl);
      } catch {
        console.log("ブラウザを自動で開けませんでした。上記URLを手動で開いてください。");
      }

      try {
        console.log("認証コールバックを待機中...");
        const code = await waitForAuthorizationCode();
        console.log("認証コードを受信しました。トークンを取得中...");
        await exchangeCodeForToken(code);
        console.log("ログインに成功しました！");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`ログインに失敗しました: ${message}`);
        process.exit(1);
      }
    });

  auth
    .command("logout")
    .description("保存されたトークンを削除")
    .action(() => {
      deleteToken();
      console.log("ログアウトしました。");
    });

  auth
    .command("status")
    .description("認証状態を表示")
    .action(() => {
      const token = loadToken();
      if (!token) {
        console.log("未認証: ログインしていません。");
        return;
      }
      const expiresAt = new Date(token.expires_at);
      const isExpired = Date.now() >= token.expires_at;
      console.log(`認証済み`);
      console.log(`トークン有効期限: ${expiresAt.toLocaleString()}`);
      console.log(`状態: ${isExpired ? "期限切れ (自動リフレッシュされます)" : "有効"}`);
    });
}
