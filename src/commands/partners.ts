import { Command } from "commander";
import { getClient } from "../client";
import { getCompanyId } from "../config";
import { formatOutput, OutputFormat } from "../formatter";

export function registerPartnersCommands(program: Command): void {
  const partners = program.command("partners").description("取引先管理");

  partners
    .command("list")
    .description("取引先一覧を取得")
    .option("--keyword <keyword>", "キーワード検索")
    .option("--limit <n>", "取得件数", "50")
    .option("--offset <n>", "オフセット", "0")
    .action(async (opts) => {
      const format = program.opts().format as OutputFormat || "table";
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const params: Record<string, string | number> = {
          company_id: companyId,
          limit: parseInt(opts.limit, 10),
          offset: parseInt(opts.offset, 10),
        };
        if (opts.keyword) params.keyword = opts.keyword;

        const res = await client.get("/api/1/partners", { params });
        const items = res.data.partners.map(
          (p: {
            id: number;
            name: string;
            code: string | null;
            shortcut1: string | null;
          }) => ({
            ID: p.id,
            名前: p.name,
            コード: p.code || "",
            ショートカット: p.shortcut1 || "",
          })
        );
        formatOutput(items, format, [
          { key: "ID", label: "ID" },
          { key: "名前", label: "取引先名" },
          { key: "コード", label: "コード" },
          { key: "ショートカット", label: "ショートカット" },
        ]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`取引先一覧の取得に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  partners
    .command("get <id>")
    .description("取引先詳細を取得")
    .action(async (id: string) => {
      const format = program.opts().format as OutputFormat || "table";
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const res = await client.get(`/api/1/partners/${id}`, {
          params: { company_id: companyId },
        });
        const p = res.data.partner;
        formatOutput(
          {
            ID: p.id,
            名前: p.name,
            コード: p.code || "",
            ショートカット1: p.shortcut1 || "",
            ショートカット2: p.shortcut2 || "",
            住所: p.address_attributes?.zipcode
              ? `〒${p.address_attributes.zipcode} ${p.address_attributes.prefecture_code || ""} ${p.address_attributes.street_name1 || ""}`
              : "",
          },
          format
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`取引先の取得に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  partners
    .command("create")
    .description("取引先を作成")
    .requiredOption("--name <name>", "取引先名")
    .option("--code <code>", "取引先コード")
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
        if (opts.code) body.code = opts.code;
        if (opts.shortcut1) body.shortcut1 = opts.shortcut1;
        if (opts.shortcut2) body.shortcut2 = opts.shortcut2;

        const res = await client.post("/api/1/partners", body);
        console.log(`取引先を作成しました (ID: ${res.data.partner.id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`取引先の作成に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  partners
    .command("update <id>")
    .description("取引先を更新")
    .option("--name <name>", "取引先名")
    .option("--code <code>", "取引先コード")
    .option("--shortcut1 <shortcut>", "ショートカット1")
    .option("--shortcut2 <shortcut>", "ショートカット2")
    .action(async (id: string, opts) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const body: Record<string, unknown> = { company_id: companyId };
        if (opts.name) body.name = opts.name;
        if (opts.code) body.code = opts.code;
        if (opts.shortcut1) body.shortcut1 = opts.shortcut1;
        if (opts.shortcut2) body.shortcut2 = opts.shortcut2;

        await client.put(`/api/1/partners/${id}`, body);
        console.log(`取引先を更新しました (ID: ${id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`取引先の更新に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  partners
    .command("delete <id>")
    .description("取引先を削除")
    .action(async (id: string) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        await client.delete(`/api/1/partners/${id}`, {
          params: { company_id: companyId },
        });
        console.log(`取引先を削除しました (ID: ${id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`取引先の削除に失敗しました: ${message}`);
        process.exit(1);
      }
    });
}
