import { Command } from "commander";
import fs from "fs";
import path from "path";
import { getClient } from "../client";
import { getCompanyId } from "../config";

export function registerJournalsCommands(program: Command): void {
  const journals = program.command("journals").description("仕訳帳管理");

  journals
    .command("download")
    .description("仕訳帳をダウンロード (非同期)")
    .requiredOption("--start-date <date>", "開始日 (YYYY-MM-DD)")
    .requiredOption("--end-date <date>", "終了日 (YYYY-MM-DD)")
    .option("--download-type <type>", "フォーマット (csv/pdf/yayoi/generic)", "csv")
    .option("-o, --output <file>", "出力ファイルパス")
    .action(async (opts) => {
      const companyId = getCompanyId(program.opts().companyId);
      try {
        const client = getClient();

        // Step 1: ダウンロードリクエスト
        console.log("仕訳帳のダウンロードをリクエスト中...");
        const requestRes = await client.get("/api/1/journals", {
          params: {
            company_id: companyId,
            download_type: opts.downloadType,
            start_date: opts.startDate,
            end_date: opts.endDate,
          },
        });

        const statusUrl = requestRes.headers["location"];
        if (!statusUrl) {
          // 直接ダウンロード可能な場合
          const ext = opts.downloadType === "pdf" ? "pdf" : "csv";
          const outputPath =
            opts.output || `journals_${opts.startDate}_${opts.endDate}.${ext}`;
          fs.writeFileSync(outputPath, requestRes.data);
          console.log(`仕訳帳を保存しました: ${outputPath}`);
          return;
        }

        // Step 2: ステータス確認 (ポーリング)
        console.log("ダウンロード準備中...");
        let downloadUrl = "";
        for (let i = 0; i < 60; i++) {
          await sleep(2000);
          try {
            const statusRes = await client.get(statusUrl);
            if (statusRes.status === 200 && statusRes.data?.journals?.url) {
              downloadUrl = statusRes.data.journals.url;
              break;
            }
          } catch (err: unknown) {
            if (
              err &&
              typeof err === "object" &&
              "response" in err &&
              (err as { response?: { status?: number } }).response?.status === 202
            ) {
              process.stdout.write(".");
              continue;
            }
            throw err;
          }
        }

        if (!downloadUrl) {
          console.error("\nダウンロードがタイムアウトしました。");
          process.exit(1);
        }

        console.log("\nダウンロード中...");

        // Step 3: ファイルダウンロード
        const { default: axios } = await import("axios");
        const downloadRes = await axios.get(downloadUrl, {
          responseType: "arraybuffer",
        });

        const ext = opts.downloadType === "pdf" ? "pdf" : "csv";
        const outputPath =
          opts.output ||
          path.join(
            process.cwd(),
            `journals_${opts.startDate}_${opts.endDate}.${ext}`
          );
        fs.writeFileSync(outputPath, Buffer.from(downloadRes.data));
        console.log(`仕訳帳を保存しました: ${outputPath}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`仕訳帳のダウンロードに失敗しました: ${message}`);
        process.exit(1);
      }
    });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
