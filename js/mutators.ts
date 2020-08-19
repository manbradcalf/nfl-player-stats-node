import { QueryResult } from "neo4j-driver/types/result";

async function mapResultsForTable(dbResults: QueryResult) {
  let records = dbResults.records;
  let headers = records[0].keys;

  // format results for consumption by view
  let rows: Array<any> = [];
  records.forEach((record) => {
    let tableCells: Array<any> = [];
    record.forEach((entry: Object) => {
      let tableCells: Array<any> = [];
      tableCells.push(entry);
    });
    rows.push(tableCells);
  });
  return { headers, rows };
}
