#!/usr/bin/env node
import { Command } from "commander";
import { registerAuthCommands } from "./commands/auth";
import { registerCompaniesCommands } from "./commands/companies";
import { registerDealsCommands } from "./commands/deals";
import { registerAccountItemsCommands } from "./commands/account-items";
import { registerPartnersCommands } from "./commands/partners";
import { registerSectionsCommands } from "./commands/sections";
import { registerTagsCommands } from "./commands/tags";
import { registerJournalsCommands } from "./commands/journals";
import { registerTrialBalanceCommands } from "./commands/trial-balance";
import { registerWalletablesCommands } from "./commands/walletables";
import { registerWalletTxnsCommands } from "./commands/wallet-txns";
import { registerBanksCommands } from "./commands/banks";
import { registerTransfersCommands } from "./commands/transfers";

const program = new Command();

program
  .name("freee")
  .description("freee会計 API CLI ツール")
  .version("1.2.1")
  .option("--company-id <id>", "事業所ID")
  .option("--format <format>", "出力フォーマット (table/json)", "table");

// コマンド登録
registerAuthCommands(program);
registerCompaniesCommands(program);
registerDealsCommands(program);
registerAccountItemsCommands(program);
registerPartnersCommands(program);
registerSectionsCommands(program);
registerTagsCommands(program);
registerJournalsCommands(program);
registerTrialBalanceCommands(program);
registerWalletablesCommands(program);
registerWalletTxnsCommands(program);
registerBanksCommands(program);
registerTransfersCommands(program);

program.parse(process.argv);
