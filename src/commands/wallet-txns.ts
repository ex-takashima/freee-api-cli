import { Command } from "commander";
import { getClient } from "../client";
import { getCompanyId } from "../config";
import { formatOutput, OutputFormat } from "../formatter";

const entryDirections: Record<string, string> = {
  income: "入金",
  expense: "出金",
};

export function registerWalletTxnsCommands(program: Command): void {
  const walletTxns = program
    .command("wallet-txns")
    .description("口座明細管理");

  walletTxns
    .command("list")
    .description("口座明細一覧を取得")
    .option("--walletable-id <id>", "口座ID")
    .option(
      "--walletable-type <type>",
      "口座種別 (bank_account/credit_card/wallet)"
    )
    .option("--start-date <date>", "開始日 (YYYY-MM-DD)")
    .option("--end-date <date>", "終了日 (YYYY-MM-DD)")
    .option(
      "--entry-side <side>",
      "入出金 (income/expense)"
    )
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
        if (opts.walletableId)
          params.walletable_id = parseInt(opts.walletableId, 10);
        if (opts.walletableType)
          params.walletable_type = opts.walletableType;
        if (opts.startDate) params.start_date = opts.startDate;
        if (opts.endDate) params.end_date = opts.endDate;
        if (opts.entrySide) params.entry_side = opts.entrySide;

        const res = await client.get("/api/1/wallet_txns", { params });
        const items = res.data.wallet_txns.map(
          (t: {
            id: number;
            date: string;
            entry_side: string;
            amount: number;
            walletable_id: number;
            walletable_type: string;
            description: string;
            balance: number;
            status: number;
          }) => ({
            ID: t.id,
            日付: t.date,
            入出金: entryDirections[t.entry_side] || t.entry_side,
            金額: t.amount,
            残高: t.balance,
            摘要: t.description || "",
            口座ID: t.walletable_id,
            ステータス: t.status === 1 ? "確定" : "未確定",
          })
        );
        formatOutput(items, format, [
          { key: "ID", label: "ID" },
          { key: "日付", label: "日付" },
          { key: "入出金", label: "入出金" },
          { key: "金額", label: "金額" },
          { key: "残高", label: "残高" },
          { key: "摘要", label: "摘要" },
          { key: "口座ID", label: "口座ID" },
          { key: "ステータス", label: "状態" },
        ]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`口座明細の取得に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  walletTxns
    .command("get <id>")
    .description("口座明細の詳細を取得")
    .action(async (id: string) => {
      const format = program.opts().format as OutputFormat || "table";
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const res = await client.get(`/api/1/wallet_txns/${id}`, {
          params: { company_id: companyId },
        });
        const t = res.data.wallet_txn;
        formatOutput(
          {
            ID: t.id,
            日付: t.date,
            入出金: entryDirections[t.entry_side] || t.entry_side,
            金額: t.amount,
            残高: t.balance,
            摘要: t.description || "",
            口座ID: t.walletable_id,
            口座種別: t.walletable_type,
            ステータス: t.status === 1 ? "確定" : "未確定",
          },
          format
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`口座明細の取得に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  walletTxns
    .command("create")
    .description("口座明細を作成")
    .requiredOption(
      "--walletable-type <type>",
      "口座種別 (bank_account/credit_card/wallet)"
    )
    .requiredOption("--walletable-id <id>", "口座ID")
    .requiredOption("--date <date>", "日付 (YYYY-MM-DD)")
    .requiredOption(
      "--entry-side <side>",
      "入出金 (income/expense)"
    )
    .requiredOption("--amount <amount>", "金額")
    .option("--description <text>", "摘要")
    .option("--balance <amount>", "残高")
    .action(async (opts) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const body: Record<string, unknown> = {
          company_id: companyId,
          walletable_type: opts.walletableType,
          walletable_id: parseInt(opts.walletableId, 10),
          date: opts.date,
          entry_side: opts.entrySide,
          amount: parseInt(opts.amount, 10),
        };
        if (opts.description) body.description = opts.description;
        if (opts.balance) body.balance = parseInt(opts.balance, 10);

        const res = await client.post("/api/1/wallet_txns", body);
        console.log(
          `口座明細を作成しました (ID: ${res.data.wallet_txn.id})`
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`口座明細の作成に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  walletTxns
    .command("delete <id>")
    .description("口座明細を削除")
    .action(async (id: string) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        await client.delete(`/api/1/wallet_txns/${id}`, {
          params: { company_id: companyId },
        });
        console.log(`口座明細を削除しました (ID: ${id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`口座明細の削除に失敗しました: ${message}`);
        process.exit(1);
      }
    });
}
