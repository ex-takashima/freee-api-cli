import { Command } from "commander";
import { getClient } from "../client";
import { formatOutput, OutputFormat } from "../formatter";

export function registerBanksCommands(program: Command): void {
  const banks = program.command("banks").description("連携サービス管理");

  banks
    .command("list")
    .description("連携サービス一覧を取得")
    .option("--offset <n>", "オフセット", "0")
    .option("--limit <n>", "取得件数", "20")
    .action(async (opts) => {
      const format = program.opts().format as OutputFormat || "table";
      try {
        const client = getClient();
        const params: Record<string, string | number> = {
          offset: parseInt(opts.offset, 10),
          limit: parseInt(opts.limit, 10),
        };

        const res = await client.get("/api/1/banks", { params });
        const items = res.data.banks.map(
          (b: {
            id: number;
            name: string;
            type: string;
            name_kana: string;
          }) => ({
            ID: b.id,
            名前: b.name,
            名前カナ: b.name_kana || "",
            種別: b.type || "",
          })
        );
        formatOutput(items, format, [
          { key: "ID", label: "ID" },
          { key: "名前", label: "サービス名" },
          { key: "名前カナ", label: "カナ" },
          { key: "種別", label: "種別" },
        ]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`連携サービス一覧の取得に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  banks
    .command("get <id>")
    .description("連携サービスの詳細を取得")
    .action(async (id: string) => {
      const format = program.opts().format as OutputFormat || "table";
      try {
        const client = getClient();
        const res = await client.get(`/api/1/banks/${id}`);
        const b = res.data.bank;
        formatOutput(
          {
            ID: b.id,
            名前: b.name,
            名前カナ: b.name_kana || "",
            種別: b.type || "",
          },
          format
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`連携サービスの取得に失敗しました: ${message}`);
        process.exit(1);
      }
    });
}
