import { Command } from "commander";
import { getClient } from "../client";
import { saveConfig, loadConfig } from "../config";
import { formatOutput, OutputFormat } from "../formatter";

export function registerCompaniesCommands(program: Command): void {
  const companies = program.command("companies").description("事業所管理");

  companies
    .command("list")
    .description("事業所一覧を取得")
    .action(async () => {
      const format = program.opts().format as OutputFormat || "table";
      try {
        const client = getClient();
        const res = await client.get("/api/1/companies");
        const items = res.data.companies.map(
          (c: { id: number; display_name: string; role: string }) => ({
            ID: c.id,
            名前: c.display_name,
            権限: c.role,
          })
        );
        formatOutput(items, format, [
          { key: "ID", label: "ID" },
          { key: "名前", label: "事業所名" },
          { key: "権限", label: "権限" },
        ]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`事業所一覧の取得に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  companies
    .command("set <id>")
    .description("デフォルト事業所を設定")
    .action((id: string) => {
      const companyId = parseInt(id, 10);
      if (isNaN(companyId)) {
        console.error("事業所IDは数値で指定してください。");
        process.exit(1);
      }
      const appConfig = loadConfig();
      appConfig.companyId = companyId;
      saveConfig(appConfig);
      console.log(`デフォルト事業所を ${companyId} に設定しました。`);
    });

  companies
    .command("current")
    .description("現在のデフォルト事業所を表示")
    .action(() => {
      const appConfig = loadConfig();
      if (appConfig.companyId) {
        console.log(`デフォルト事業所ID: ${appConfig.companyId}`);
      } else {
        console.log("デフォルト事業所が設定されていません。");
      }
    });
}
