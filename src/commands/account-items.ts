import { Command } from "commander";
import { getClient } from "../client";
import { getCompanyId } from "../config";
import { formatOutput, OutputFormat } from "../formatter";

export function registerAccountItemsCommands(program: Command): void {
  const accountItems = program
    .command("account-items")
    .description("勘定科目管理");

  accountItems
    .command("list")
    .description("勘定科目一覧を取得")
    .option("--keyword <keyword>", "キーワード検索")
    .action(async (opts) => {
      const format = program.opts().format as OutputFormat || "table";
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const params: Record<string, string | number> = {
          company_id: companyId,
        };
        if (opts.keyword) params.keyword = opts.keyword;

        const res = await client.get("/api/1/account_items", { params });
        const items = res.data.account_items.map(
          (a: {
            id: number;
            name: string;
            shortcut: string;
            categories: string[];
            tax_code: number;
          }) => ({
            ID: a.id,
            名前: a.name,
            ショートカット: a.shortcut || "",
            カテゴリ: Array.isArray(a.categories)
              ? a.categories.join(", ")
              : "",
            税区分: a.tax_code,
          })
        );
        formatOutput(items, format, [
          { key: "ID", label: "ID" },
          { key: "名前", label: "勘定科目名" },
          { key: "ショートカット", label: "ショートカット" },
          { key: "税区分", label: "税区分" },
        ]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`勘定科目一覧の取得に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  accountItems
    .command("get <id>")
    .description("勘定科目詳細を取得")
    .action(async (id: string) => {
      const format = program.opts().format as OutputFormat || "table";
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const res = await client.get(`/api/1/account_items/${id}`, {
          params: { company_id: companyId },
        });
        const a = res.data.account_item;
        formatOutput(
          {
            ID: a.id,
            名前: a.name,
            ショートカット: a.shortcut || "",
            税区分: a.tax_code,
            グループ名: a.group_name || "",
            対応する収入カテゴリ: a.corresponding_income_name || "",
            対応する支出カテゴリ: a.corresponding_expense_name || "",
          },
          format
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`勘定科目の取得に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  accountItems
    .command("create")
    .description("勘定科目を作成")
    .requiredOption("--name <name>", "勘定科目名")
    .requiredOption("--tax-code <code>", "税区分コード")
    .requiredOption(
      "--group-name <group>",
      "決算書表示名 (現金・預金, 売掛金 等)"
    )
    .option("--shortcut <shortcut>", "ショートカット")
    .option(
      "--account-category <category>",
      "勘定科目カテゴリ (assets/liabilities/equity/income/expense)"
    )
    .action(async (opts) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const body: Record<string, unknown> = {
          company_id: companyId,
          name: opts.name,
          tax_code: parseInt(opts.taxCode, 10),
          group_name: opts.groupName,
        };
        if (opts.shortcut) body.shortcut = opts.shortcut;
        if (opts.accountCategory)
          body.account_category = opts.accountCategory;

        const res = await client.post("/api/1/account_items", {
          account_item: body,
        });
        console.log(
          `勘定科目を作成しました (ID: ${res.data.account_item.id})`
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`勘定科目の作成に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  accountItems
    .command("update <id>")
    .description("勘定科目を更新")
    .option("--name <name>", "勘定科目名")
    .option("--tax-code <code>", "税区分コード")
    .option("--shortcut <shortcut>", "ショートカット")
    .option("--group-name <group>", "決算書表示名")
    .action(async (id: string, opts) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const body: Record<string, unknown> = { company_id: companyId };
        if (opts.name) body.name = opts.name;
        if (opts.taxCode) body.tax_code = parseInt(opts.taxCode, 10);
        if (opts.shortcut) body.shortcut = opts.shortcut;
        if (opts.groupName) body.group_name = opts.groupName;

        await client.put(`/api/1/account_items/${id}`, {
          account_item: body,
        });
        console.log(`勘定科目を更新しました (ID: ${id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`勘定科目の更新に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  accountItems
    .command("delete <id>")
    .description("勘定科目を削除")
    .action(async (id: string) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        await client.delete(`/api/1/account_items/${id}`, {
          params: { company_id: companyId },
        });
        console.log(`勘定科目を削除しました (ID: ${id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`勘定科目の削除に失敗しました: ${message}`);
        process.exit(1);
      }
    });
}
