import Result, { QueryResult } from "neo4j-driver/types/result";

// default export
const n4j = require("neo4j-driver");
const driver = n4j.driver;
const auth = n4j.auth;
const dbDriver = driver(
  "neo4j://localhost:7687",
  auth.basic("ff2020admin", "qwerty12!")
);

async function playerStatsByYearAndType(playerName, categoryName, year) {
  return queryDB(
    `match (p:Player{name: \"${playerName}\"})-[r:${categoryName}]->(s:NFLStatisticalSeason{name:${year}}) return r`
  );
}

async function generateSeasons() {
  queryDB(
    `create (s14:NFLStatisticalSeason{name:2014})
         create (s15:NFLStatisticalSeason{name:2015})
         create (s16:NFLStatisticalSeason{name:2016})
         create (s17:NFLStatisticalSeason{name:2017})
         create (s18:NFLStatisticalSeason{name:2018})
         create (s19:NFLStatisticalSeason{name:2019})`
  );
}

async function queryDB(query) {
  try {
    const session = await dbDriver.session();

    if (query.startsWith("create")) {
      console.log(`Running create query\n${query}\non session\n${session}`);
    }

    const result = await session.run(query);

    if (result.records.length != 0) {
      console.log(`Returning this result for ${query}\n\n${result}`);
    }
    await session.close();
    console.log("closed session\n");
    return result;
  } catch (error) {
    console.log(error);
  }
}

async function resultsMapper(dbResults: QueryResult) {
  let keys = dbResults.records[0].keys;
  let fields = dbResults.records[0]._fields;
  let headers = [];
  // grab the properties from the first record to make the headers
  // field == player || relationship || season, etc
  for (let i = 0; i < fields.length; i++) {
    let field = fields[i];
    // If field has no properties object we can assume
    // we've been given the value directly, ex: r.rushingYards
    if (!field.properties) {
      // Keys.length should equal fields.length, so we can grab the
      // missing key value here by diving into the keys array
      headers.push(keys[i]);
    } else {
      // keys are columns, like rushing yards or player name
      Object.keys(field.properties).forEach((p) => {
        if (!headers[p]) {
          headers.push(p);
        }
      });
    }
  }

  // format results for consumption by view
  let rows = [];
  dbResults.records.forEach((r) => {
    let tableRow = [];
    r._fields.forEach((field) => {
      // populate the table row with properties
      if (!field.properties) {
        tableRow.push(field);
      } else {
        Object.values(field.properties).forEach((value) => {
          tableRow.push(value);
        });
      }
    });
    rows.push(tableRow);
  });
  return { headers, rows };
}

function queryMapper(req)  {
  // create query line to fetch desired stat
  function matchStatTemplate(statType, season, operator, quantifier) {
    return `MATCH (n:Player)-[r:${statType}]->(s:NFLStatisticalSeason{name:${season}}) WHERE r ${operator} ${quantifier}`;
  }

  req.params.forEach((param) => {
    console.log(`this param is ${param}`);
  });

  // example query:
  // http://localhost:3000/results?statistics=ReceivingTDs&operator=LessThan&quantifier=10&statistics=Receptions&operator=GreaterThan&quantifier=90&wr=true
}
export {
  queryDB,
  generateSeasons,
  playerStatsByYearAndType,
  resultsMapper,
  queryMapper,
};
