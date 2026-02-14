import { Command } from "commander";
import { getClient } from "../client";
import { getCompanyId } from "../config";
import { formatOutput, OutputFormat } from "../formatter";

export function registerSectionsCommands(program: Command): void {
  const sections = program.command("sections").description("部門管理");

  sections
    .command("list")
    .description("部門一覧を取得")
    .action(async () => {
      const format = program.opts().format as OutputFormat || "table";
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const res = await client.get("/api/1/sections", {
          params: { company_id: companyId },
        });
        const items = res.data.sections.map(
          (s: {
            id: number;
            name: string;
            long_name: string | null;
            shortcut1: string | null;
          }) => ({
            ID: s.id,
            名前: s.name,
            正式名称: s.long_name || "",
            ショートカット: s.shortcut1 || "",
          })
        );
        formatOutput(items, format, [
          { key: "ID", label: "ID" },
          { key: "名前", label: "部門名" },
          { key: "正式名称", label: "正式名称" },
          { key: "ショートカット", label: "ショートカット" },
        ]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`部門一覧の取得に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  sections
    .command("create")
    .description("部門を作成")
    .requiredOption("--name <name>", "部門名")
    .option("--long-name <longName>", "正式名称")
    .option("--shortcut1 <shortcut>", "ショートカット1")
    .option("--shortcut2 <shortcut>", "ショートカット2")
    .option("--parent-id <id>", "親部門ID")
    .action(async (opts) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const body: Record<string, unknown> = {
          company_id: companyId,
          name: opts.name,
        };
        if (opts.longName) body.long_name = opts.longName;
        if (opts.shortcut1) body.shortcut1 = opts.shortcut1;
        if (opts.shortcut2) body.shortcut2 = opts.shortcut2;
        if (opts.parentId) body.parent_id = parseInt(opts.parentId, 10);

        const res = await client.post("/api/1/sections", { section: body });
        console.log(`部門を作成しました (ID: ${res.data.section.id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`部門の作成に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  sections
    .command("update <id>")
    .description("部門を更新")
    .option("--name <name>", "部門名")
    .option("--long-name <longName>", "正式名称")
    .option("--shortcut1 <shortcut>", "ショートカット1")
    .option("--shortcut2 <shortcut>", "ショートカット2")
    .action(async (id: string, opts) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const body: Record<string, unknown> = { company_id: companyId };
        if (opts.name) body.name = opts.name;
        if (opts.longName) body.long_name = opts.longName;
        if (opts.shortcut1) body.shortcut1 = opts.shortcut1;
        if (opts.shortcut2) body.shortcut2 = opts.shortcut2;

        await client.put(`/api/1/sections/${id}`, { section: body });
        console.log(`部門を更新しました (ID: ${id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`部門の更新に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  sections
    .command("delete <id>")
    .description("部門を削除")
    .action(async (id: string) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        await client.delete(`/api/1/sections/${id}`, {
          params: { company_id: companyId },
        });
        console.log(`部門を削除しました (ID: ${id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`部門の削除に失敗しました: ${message}`);
        process.exit(1);
      }
    });
}
