import { Command } from "commander";
import { getClient } from "../client";
import { getCompanyId } from "../config";
import { formatOutput, OutputFormat } from "../formatter";

export function registerTagsCommands(program: Command): void {
  const tags = program.command("tags").description("メモタグ管理");

  tags
    .command("list")
    .description("メモタグ一覧を取得")
    .action(async () => {
      const format = program.opts().format as OutputFormat || "table";
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const res = await client.get("/api/1/tags", {
          params: { company_id: companyId },
        });
        const items = res.data.tags.map(
          (t: {
            id: number;
            name: string;
            shortcut1: string | null;
            shortcut2: string | null;
          }) => ({
            ID: t.id,
            名前: t.name,
            ショートカット1: t.shortcut1 || "",
            ショートカット2: t.shortcut2 || "",
          })
        );
        formatOutput(items, format, [
          { key: "ID", label: "ID" },
          { key: "名前", label: "タグ名" },
          { key: "ショートカット1", label: "ショートカット1" },
          { key: "ショートカット2", label: "ショートカット2" },
        ]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`メモタグ一覧の取得に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  tags
    .command("create")
    .description("メモタグを作成")
    .requiredOption("--name <name>", "タグ名")
    .option("--shortcut1 <shortcut>", "ショートカット1")
    .option("--shortcut2 <shortcut>", "ショートカット2")
    .action(async (opts) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const body: Record<string, unknown> = {
          company_id: companyId,
          name: opts.name,
        };
        if (opts.shortcut1) body.shortcut1 = opts.shortcut1;
        if (opts.shortcut2) body.shortcut2 = opts.shortcut2;

        const res = await client.post("/api/1/tags", body);
        console.log(`メモタグを作成しました (ID: ${res.data.tag.id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`メモタグの作成に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  tags
    .command("update <id>")
    .description("メモタグを更新")
    .option("--name <name>", "タグ名")
    .option("--shortcut1 <shortcut>", "ショートカット1")
    .option("--shortcut2 <shortcut>", "ショートカット2")
    .action(async (id: string, opts) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const body: Record<string, unknown> = { company_id: companyId };
        if (opts.name) body.name = opts.name;
        if (opts.shortcut1) body.shortcut1 = opts.shortcut1;
        if (opts.shortcut2) body.shortcut2 = opts.shortcut2;

        await client.put(`/api/1/tags/${id}`, body);
        console.log(`メモタグを更新しました (ID: ${id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`メモタグの更新に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  tags
    .command("delete <id>")
    .description("メモタグを削除")
    .action(async (id: string) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        await client.delete(`/api/1/tags/${id}`, {
          params: { company_id: companyId },
        });
        console.log(`メモタグを削除しました (ID: ${id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`メモタグの削除に失敗しました: ${message}`);
        process.exit(1);
      }
    });
}
