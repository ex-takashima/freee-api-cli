import { Command } from "commander";
import { getClient } from "../client";
import { getCompanyId } from "../config";
import { formatOutput, OutputFormat } from "../formatter";

export function registerTrialBalanceCommands(program: Command): void {
  const trialBalance = program
    .command("trial-balance")
    .description("試算表管理");

  trialBalance
    .command("get")
    .description("試算表を取得")
    .option("--fiscal-year <year>", "会計年度")
    .option("--start-month <month>", "開始月 (1-12)")
    .option("--end-month <month>", "終了月 (1-12)")
    .option(
      "--type <type>",
      "試算表種別 (pl: 損益計算書 / bs: 貸借対照表)",
      "pl"
    )
    .action(async (opts) => {
      const format = program.opts().format as OutputFormat || "table";
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();

        const endpoint =
          opts.type === "bs"
            ? "/api/1/reports/trial_bs"
            : "/api/1/reports/trial_pl";

        const params: Record<string, string | number> = {
          company_id: companyId,
        };
        if (opts.fiscalYear) params.fiscal_year = parseInt(opts.fiscalYear, 10);
        if (opts.startMonth) params.start_month = parseInt(opts.startMonth, 10);
        if (opts.endMonth) params.end_month = parseInt(opts.endMonth, 10);

        const res = await client.get(endpoint, { params });
        const balances = res.data.trial_pl?.balances || res.data.trial_bs?.balances || [];

        const items = balances.map(
          (b: {
            account_item_id: number;
            account_item_name: string;
            account_category_name: string;
            opening_balance: number;
            debit_amount: number;
            credit_amount: number;
            closing_balance: number;
          }) => ({
            勘定科目ID: b.account_item_id,
            勘定科目名: b.account_item_name,
            カテゴリ: b.account_category_name || "",
            期首残高: b.opening_balance,
            借方: b.debit_amount,
            貸方: b.credit_amount,
            期末残高: b.closing_balance,
          })
        );
        formatOutput(items, format, [
          { key: "勘定科目名", label: "勘定科目" },
          { key: "カテゴリ", label: "カテゴリ" },
          { key: "期首残高", label: "期首残高" },
          { key: "借方", label: "借方" },
          { key: "貸方", label: "貸方" },
          { key: "期末残高", label: "期末残高" },
        ]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`試算表の取得に失敗しました: ${message}`);
        process.exit(1);
      }
    });
}
