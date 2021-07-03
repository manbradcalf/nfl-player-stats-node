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
      if (stat.properties) {
        Object.entries(stat.properties).forEach((p) => {
          if (p[1]) {
            tableCells.push(p[1]);
          } else {
            tableCells.push(p);
          }
        });
      } else {
        tableCells.push(stat);
      }
    });
    rows.push(tableCells);
  });

  let headers = [];
  records[0].forEach((stat) => {
    // for each individual stat, populate a cell
    if (stat.properties) {
      Object.entries(stat.properties).forEach((p) => {
        // this will make "Mark Ingram III" the header, instead of "Name"
        headers.push(p[0]);
      });
    } else {
      headers.push(stat);
    }
  });

  return { headers, rows };
}

function queryMapper(req) {
  let query = req.query;
  let matchClause = "";
  let whereClause = "where ";
  let returnClause = "return p.name as Name, p.position as Position, ";
  if (query.statistics instanceof Array) {
    // this is a hacky way to figure out how many match clauses to build
    let lines = query.operator.length;

    for (let i = 0; i < lines; i++) {
      matchClause += `match (p)-[r${i}]->(s${i}:NFLStatisticalSeason{name:${query.season[i]}}) `;

      whereClause += `r${i}.${query.statistics[i]} ${query.operator[i]} ${query.quantifier[i]} `;

      // add 'and' for every condition but the last
      if (i < lines - 1) {
        returnClause += `s${i}.name, r${i}, `;
        whereClause += "and ";
      } else {
        // on the last condition, dont append trailing comma to return clause
        returnClause += `s${i}.name, r${i}`;
      }
    }
  } else {
    matchClause += `match (p)-[r]-(s:NFLStatisticalSeason{name:${query.season}}) `;
    whereClause += `r.${query.statistics} ${query.operator} ${query.quantifier} `;
    returnClause += `r, s`;
  }
  // finally, we add the player position
  // which is a checkbox representing all match clauses
  if (Array.isArray(query.position)) {
    // if multiple positions are selected, query "in"
    whereClause += `and p.position in ${query.position} `;
  } else if (query.position) {
    // if only one, query "="
    whereClause += `and p.position = "${query.position}" `;
  }

  return matchClause + whereClause + returnClause;
}

export { queryMapper, mapResultsForTable };
