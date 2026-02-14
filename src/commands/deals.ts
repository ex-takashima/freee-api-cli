import { Command } from "commander";
import { getClient } from "../client";
import { getCompanyId } from "../config";
import { formatOutput, OutputFormat } from "../formatter";

export function registerDealsCommands(program: Command): void {
  const deals = program.command("deals").description("取引管理");

  deals
    .command("list")
    .description("取引一覧を取得")
    .option("--partner <name>", "取引先名で絞り込み")
    .option("--status <status>", "ステータスで絞り込み (settled/unsettled)")
    .option("--start-date <date>", "開始日 (YYYY-MM-DD)")
    .option("--end-date <date>", "終了日 (YYYY-MM-DD)")
    .option("--limit <n>", "取得件数", "20")
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
        if (opts.partner) params.partner_code = opts.partner;
        if (opts.status) params.status = opts.status;
        if (opts.startDate) params.start_issue_date = opts.startDate;
        if (opts.endDate) params.end_issue_date = opts.endDate;

        const res = await client.get("/api/1/deals", { params });
        const items = res.data.deals.map(
          (d: {
            id: number;
            issue_date: string;
            type: string;
            amount: number;
            status: string;
            partner_id: number | null;
          }) => ({
            ID: d.id,
            発生日: d.issue_date,
            種別: d.type === "income" ? "収入" : "支出",
            金額: d.amount,
            状態: d.status,
            取引先ID: d.partner_id ?? "-",
          })
        );
        formatOutput(items, format, [
          { key: "ID", label: "ID" },
          { key: "発生日", label: "発生日" },
          { key: "種別", label: "種別" },
          { key: "金額", label: "金額" },
          { key: "状態", label: "状態" },
          { key: "取引先ID", label: "取引先ID" },
        ]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`取引一覧の取得に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  deals
    .command("get <id>")
    .description("取引詳細を取得")
    .action(async (id: string) => {
      const format = program.opts().format as OutputFormat || "table";
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const res = await client.get(`/api/1/deals/${id}`, {
          params: { company_id: companyId },
        });
        const d = res.data.deal;
        const details = d.details?.map(
          (det: {
            account_item_id: number;
            tax_code: number;
            amount: number;
            description: string;
          }) => ({
            勘定科目ID: det.account_item_id,
            税区分: det.tax_code,
            金額: det.amount,
            備考: det.description || "",
          })
        );

        console.log(`取引ID: ${d.id}`);
        console.log(`発生日: ${d.issue_date}`);
        console.log(`種別: ${d.type === "income" ? "収入" : "支出"}`);
        console.log(`金額: ${d.amount}`);
        console.log(`状態: ${d.status}`);
        if (details && details.length > 0) {
          console.log("\n明細:");
          formatOutput(details, format, [
            { key: "勘定科目ID", label: "勘定科目ID" },
            { key: "税区分", label: "税区分" },
            { key: "金額", label: "金額" },
            { key: "備考", label: "備考" },
          ]);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`取引詳細の取得に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  deals
    .command("create")
    .description("取引を作成")
    .requiredOption("--type <type>", "種別 (income/expense)")
    .requiredOption("--issue-date <date>", "発生日 (YYYY-MM-DD)")
    .requiredOption("--amount <amount>", "金額")
    .requiredOption("--account-item-id <id>", "勘定科目ID")
    .requiredOption("--tax-code <code>", "税区分コード")
    .option("--partner-id <id>", "取引先ID")
    .option("--description <text>", "備考")
    .option("--from-json <file>", "JSONファイルから作成")
    .action(async (opts) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        let body: Record<string, unknown>;

        if (opts.fromJson) {
          const fs = await import("fs");
          const content = fs.readFileSync(opts.fromJson, "utf-8");
          body = JSON.parse(content);
          body.company_id = companyId;
        } else {
          body = {
            company_id: companyId,
            issue_date: opts.issueDate,
            type: opts.type,
            details: [
              {
                account_item_id: parseInt(opts.accountItemId, 10),
                tax_code: parseInt(opts.taxCode, 10),
                amount: parseInt(opts.amount, 10),
                description: opts.description || "",
              },
            ],
          };
          if (opts.partnerId) {
            body.partner_id = parseInt(opts.partnerId, 10);
          }
        }

        const res = await client.post("/api/1/deals", body);
        console.log(`取引を作成しました (ID: ${res.data.deal.id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`取引の作成に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  deals
    .command("update <id>")
    .description("取引を更新")
    .option("--type <type>", "種別 (income/expense)")
    .option("--issue-date <date>", "発生日 (YYYY-MM-DD)")
    .option("--from-json <file>", "JSONファイルから更新")
    .action(async (id: string, opts) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        let body: Record<string, unknown>;

        if (opts.fromJson) {
          const fs = await import("fs");
          const content = fs.readFileSync(opts.fromJson, "utf-8");
          body = JSON.parse(content);
          body.company_id = companyId;
        } else {
          body = { company_id: companyId } as Record<string, unknown>;
          if (opts.type) body.type = opts.type;
          if (opts.issueDate) body.issue_date = opts.issueDate;
        }

        await client.put(`/api/1/deals/${id}`, body);
        console.log(`取引を更新しました (ID: ${id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`取引の更新に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  deals
    .command("delete <id>")
    .description("取引を削除")
    .action(async (id: string) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        await client.delete(`/api/1/deals/${id}`, {
          params: { company_id: companyId },
        });
        console.log(`取引を削除しました (ID: ${id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`取引の削除に失敗しました: ${message}`);
        process.exit(1);
      }
    });
}
