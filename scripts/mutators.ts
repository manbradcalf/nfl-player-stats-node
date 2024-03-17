function mapHeaders(row) {
  let headers = [];

  row.keys.forEach((key) => {
    let keysIndex = row._fieldLookup[key];
    if (row._fields[keysIndex].properties) {
      // we have to pull keys from relationship properties
      headers.push(...Object.keys(row._fields[keysIndex].properties));
    } else {
      headers.push(key);
    }
  });
  return headers;
}

function mapRows(records) {
  let rows: Array<any> = [];
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

  return rows;
}

function mapResultsForTable(dbResults) {
  let records = dbResults.records;
  let rows = mapRows(records);
  let headers = mapHeaders(records[0]);
  return { headers, rows };
}

function queryMapper(req) {
  let query = req.query;
  let queryEntries = Object.entries(query);
  let statsToReturn = queryEntries
    .filter((q) => q[1] == "true")
    .map((q) => q[0]);
  let returnClauseWithNamedStats = "";

  //TODO how to handle diff relationship types via request queries
  statsToReturn.forEach((s) => {
    if (s != statsToReturn[statsToReturn.length - 1]) {
      returnClauseWithNamedStats += `r.${s} as ${s}, `;
    } else {
      returnClauseWithNamedStats += `r.${s} as ${s} `;
    }
  });
  let matchClause = "";
  let whereClause = "where ";
  let returnClause = `return p.name as Name, p.position as Position, ${returnClauseWithNamedStats}`;

  if (query.statistics instanceof Array) {
    // this is a hacky way to figure out how many match clauses to build
    let lines = query.operator.length;

    // For each stat constraint. EX: rushers over 1000 yards
    for (let i = 0; i < lines; i++) {
      matchClause += `match (p)-[r${i}]->(s${i}:NFLStatisticalSeason{name:${query.season[i]}}) `;

      whereClause += `r${i}.${query.statistics[i]} ${query.operator[i]} ${query.quantifier[i]} `;

      // add 'and' for every condition but the last
      if (i < lines - 1) {
        returnClause += `s${i}, r${i}, `;
        whereClause += "and ";
      } else {
        // on the last condition, dont append trailing comma to return clause
        returnClause += `s${i}, r${i}`;
      }
    }
  } else {
    matchClause += `match (p)-[r]-(s:NFLStatisticalSeason{name:${query.season}}) `;
    whereClause += `r.${query.statistics} ${query.operator} ${query.quantifier} `;
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
  const dbQuery = matchClause + whereClause + returnClause;

  return dbQuery;
}
export { queryMapper, mapResultsForTable };
