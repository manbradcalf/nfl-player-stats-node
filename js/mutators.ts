import { QueryResult } from "neo4j-driver/types/result";

function mapResultsForTable(dbResults) {
  let records = dbResults.records;
  // format results for consumption by view
  let rows: Array<any> = [];
  // for each row
  records.forEach((player) => {
    let tableCells: Array<any> = [];
    // for each stat category (ex: receiving)
    player.forEach((stat) => {
      // for each individual stat, populate a cell
      Object.entries(stat.properties).forEach((p) => {
        tableCells.push(p[1]);
      });
    });
    rows.push(tableCells);
  });

  //TODO: I think this is stupid
  let headers = [];
  records[0].forEach((stat) => {
    // for each individual stat, populate a cell
    Object.entries(stat.properties).forEach((p) => {
      headers.push(p[0]);
    });
  });

  return { headers, rows };
}

function queryMapper(req) {
  //TODO: Use this format for queries
  //match (p)-[r1]->(s)
  //match (p)-[r2]->(s)
  //where s.name = 2019 and r1.rushingYards > 500 and r2.receivingYards > 1000 return p, r1, r2
  let query = req.query;
  let matchClause = "";
  let whereClause = "where ";
  let returnClause = "return p, ";
  if (query.statistics instanceof Array) {
    let lines = query.statistics.length;
    // match clause
    for (let i = 0; i < lines; i++) {
      matchClause += `match (p)-[r${i}]->(s) `;
      whereClause += `r${i}.${query.statistics[i]} ${query.operator[i]} ${query.quantifier[i]} `;
      returnClause += `r${i} as ${query.statistics[i]}, `;
      // add 'and' for every condition but the last
      if (i < lines - 1) {
        whereClause += "and ";
      } else {
        returnClause += "s";
      }
    }
    return matchClause + whereClause + returnClause;
  } else {
    console.log("Haven't impelmented single line query rn\n\n")
  }
}

export { queryMapper, mapResultsForTable };
