import { Command } from "commander";
import { getClient } from "../client";
import { getCompanyId } from "../config";
import { formatOutput, OutputFormat } from "../formatter";

const walletableTypes: Record<string, string> = {
  bank_account: "銀行口座",
  credit_card: "クレジットカード",
  wallet: "現金",
};

function formatType(type: string): string {
  return walletableTypes[type] || type;
}

export function registerWalletablesCommands(program: Command): void {
  const walletables = program
    .command("walletables")
    .description("口座管理");

  walletables
    .command("list")
    .description("口座一覧を取得")
    .option("--type <type>", "種別で絞り込み (bank_account/credit_card/wallet)")
    .action(async (opts) => {
      const format = program.opts().format as OutputFormat || "table";
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const params: Record<string, string | number> = {
          company_id: companyId,
        };
        if (opts.type) params.type = opts.type;

        const res = await client.get("/api/1/walletables", { params });
        const items = res.data.walletables.map(
          (w: {
            id: number;
            name: string;
            type: string;
            bank_id: number | null;
            last_balance: number;
            walletable_balance: number;
          }) => ({
            ID: w.id,
            名前: w.name,
            種別: formatType(w.type),
            銀行ID: w.bank_id ?? "-",
            残高: w.walletable_balance,
            同期残高: w.last_balance,
          })
        );
        formatOutput(items, format, [
          { key: "ID", label: "ID" },
          { key: "名前", label: "口座名" },
          { key: "種別", label: "種別" },
          { key: "銀行ID", label: "銀行ID" },
          { key: "残高", label: "残高" },
          { key: "同期残高", label: "同期残高" },
        ]);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`口座一覧の取得に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  walletables
    .command("get <type> <id>")
    .description("口座詳細を取得 (type: bank_account/credit_card/wallet)")
    .action(async (type: string, id: string) => {
      const format = program.opts().format as OutputFormat || "table";
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const res = await client.get(
          `/api/1/walletables/${type}/${id}`,
          { params: { company_id: companyId } }
        );
        const w = res.data.walletable;
        formatOutput(
          {
            ID: w.id,
            名前: w.name,
            種別: formatType(w.type),
            銀行ID: w.bank_id ?? "-",
            残高: w.walletable_balance,
            同期残高: w.last_balance,
          },
          format
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`口座の取得に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  walletables
    .command("create")
    .description("口座を作成")
    .requiredOption("--name <name>", "口座名")
    .requiredOption(
      "--type <type>",
      "種別 (bank_account/credit_card/wallet)"
    )
    .option("--bank-id <id>", "サービスID (銀行口座・クレジットカードの場合)")
    .option(
      "--group-name <group>",
      "決算書表示名 (現金・預金, 売掛金 等)"
    )
    .action(async (opts) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const body: Record<string, unknown> = {
          company_id: companyId,
          name: opts.name,
          type: opts.type,
        };
        if (opts.bankId) body.bank_id = parseInt(opts.bankId, 10);
        if (opts.groupName) body.group_name = opts.groupName;

        const res = await client.post("/api/1/walletables", {
          walletable: body,
        });
        console.log(
          `口座を作成しました (ID: ${res.data.walletable.id})`
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`口座の作成に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  walletables
    .command("update <type> <id>")
    .description("口座を更新 (type: bank_account/credit_card/wallet)")
    .option("--name <name>", "口座名")
    .option("--group-name <group>", "決算書表示名")
    .action(async (type: string, id: string, opts) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        const body: Record<string, unknown> = {
          company_id: companyId,
        };
        if (opts.name) body.name = opts.name;
        if (opts.groupName) body.group_name = opts.groupName;

        await client.put(`/api/1/walletables/${type}/${id}`, {
          walletable: body,
        });
        console.log(`口座を更新しました (ID: ${id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`口座の更新に失敗しました: ${message}`);
        process.exit(1);
      }
    });

  walletables
    .command("delete <type> <id>")
    .description("口座を削除 (type: bank_account/credit_card/wallet)")
    .action(async (type: string, id: string) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();
        await client.delete(`/api/1/walletables/${type}/${id}`, {
          params: { company_id: companyId },
        });
        console.log(`口座を削除しました (ID: ${id})`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`口座の削除に失敗しました: ${message}`);
        process.exit(1);
      }
    });
}
