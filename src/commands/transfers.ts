import { Command } from "commander";
import { getClient } from "../client";
import { getCompanyId } from "../config";
import { formatOutput, OutputFormat } from "../formatter";

export function registerTransfersCommands(program: Command): void {
  const transfers = program.command("transfers").description("振替管理");

  transfers
    .command("list")
    .description("振替一覧を取得")
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
        if (opts.startDate) params.start_date = opts.startDate;
        if (opts.endDate) params.end_date = opts.endDate;

        const res = await client.get("/api/1/transfers", { params });
        const items = res.data.transfers.map(
          (t: {
            id: number;
            date: string;
            amount: number;
            from_walletable_id: number;
            from_walletable_type: string;
            to_walletable_id: number;
            to_walletable_type: string;
            description: string;
          }) => ({
            ID: t.id,
            日付: t.date,
            金額: t.amount,
            振替元ID: t.from_walletable_id,
            振替元種別: t.from_walletable_type,
            振替先ID: t.to_walletable_id,
            振替先種別: t.to_walletable_type,
            摘要: t.description || "",
          })
        );
        formatOutput(items, format, [
          { key: "ID", label: "ID" },
          { key: "日付", label: "日付" },
          { key: "金額", label: "金額" },
          { key: "振替元ID", label: "振替元ID" },
          { key: "振替元種別", label: "振替元種別" },
          { key: "振替先ID", label: "振替先ID" },
          { key: "振替先種別", label: "振替先種別" },
          { key: "摘要", label: "摘要" },
        ]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`振替一覧の取得に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  transfers
    .command("get <id>")
    .description("振替の詳細を取得")
    .action(async (id: string) => {
      const format = program.opts().format as OutputFormat || "table";
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const res = await client.get(`/api/1/transfers/${id}`, {
          params: { company_id: companyId },
        });
        const t = res.data.transfer;
        formatOutput(
          {
            ID: t.id,
            日付: t.date,
            金額: t.amount,
            振替元ID: t.from_walletable_id,
            振替元種別: t.from_walletable_type,
            振替先ID: t.to_walletable_id,
            振替先種別: t.to_walletable_type,
            摘要: t.description || "",
          },
          format
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`振替の取得に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  transfers
    .command("create")
    .description("振替を作成")
    .requiredOption("--date <date>", "日付 (YYYY-MM-DD)")
    .requiredOption("--amount <amount>", "金額")
    .requiredOption(
      "--from-walletable-type <type>",
      "振替元口座種別 (bank_account/credit_card/wallet)"
    )
    .requiredOption("--from-walletable-id <id>", "振替元口座ID")
    .requiredOption(
      "--to-walletable-type <type>",
      "振替先口座種別 (bank_account/credit_card/wallet)"
    )
    .requiredOption("--to-walletable-id <id>", "振替先口座ID")
    .option("--description <text>", "摘要")
    .action(async (opts) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const body: Record<string, unknown> = {
          company_id: companyId,
          date: opts.date,
          amount: parseInt(opts.amount, 10),
          from_walletable_type: opts.fromWalletableType,
          from_walletable_id: parseInt(opts.fromWalletableId, 10),
          to_walletable_type: opts.toWalletableType,
          to_walletable_id: parseInt(opts.toWalletableId, 10),
        };
        if (opts.description) body.description = opts.description;

        const res = await client.post("/api/1/transfers", body);
        console.log(`振替を作成しました (ID: ${res.data.transfer.id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`振替の作成に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  transfers
    .command("update <id>")
    .description("振替を更新")
    .option("--date <date>", "日付 (YYYY-MM-DD)")
    .option("--amount <amount>", "金額")
    .option(
      "--from-walletable-type <type>",
      "振替元口座種別 (bank_account/credit_card/wallet)"
    )
    .option("--from-walletable-id <id>", "振替元口座ID")
    .option(
      "--to-walletable-type <type>",
      "振替先口座種別 (bank_account/credit_card/wallet)"
    )
    .option("--to-walletable-id <id>", "振替先口座ID")
    .option("--description <text>", "摘要")
    .action(async (id: string, opts) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const body: Record<string, unknown> = {
          company_id: companyId,
        };
        if (opts.date) body.date = opts.date;
        if (opts.amount) body.amount = parseInt(opts.amount, 10);
        if (opts.fromWalletableType)
          body.from_walletable_type = opts.fromWalletableType;
        if (opts.fromWalletableId)
          body.from_walletable_id = parseInt(opts.fromWalletableId, 10);
        if (opts.toWalletableType)
          body.to_walletable_type = opts.toWalletableType;
        if (opts.toWalletableId)
          body.to_walletable_id = parseInt(opts.toWalletableId, 10);
        if (opts.description) body.description = opts.description;

        await client.put(`/api/1/transfers/${id}`, body);
        console.log(`振替を更新しました (ID: ${id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`振替の更新に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  transfers
    .command("delete <id>")
    .description("振替を削除")
    .action(async (id: string) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        await client.delete(`/api/1/transfers/${id}`, {
          params: { company_id: companyId },
        });
        console.log(`振替を削除しました (ID: ${id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`振替の削除に失敗しました: ${message}`);
        process.exit(1);
      }
    });
}
