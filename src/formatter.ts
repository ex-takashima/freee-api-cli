import Table from "cli-table3";

export type OutputFormat = "table" | "json";

export function formatOutput(
  data: Record<string, unknown>[] | Record<string, unknown>,
  format: OutputFormat,
  columns?: { key: string; label: string }[]
): void {
  if (format === "json") {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  // テーブル表示
  const items = Array.isArray(data) ? data : [data];
  if (items.length === 0) {
    console.log("データがありません。");
    return;
  }

  const cols =
    columns ||
    Object.keys(items[0]).map((key) => ({ key, label: key }));

  const table = new Table({
    head: cols.map((c) => c.label),
    style: { head: ["cyan"] },
    wordWrap: true,
  });

  for (const item of items) {
    table.push(cols.map((c) => String(item[c.key] ?? "")));
  }

  console.log(table.toString());
}
