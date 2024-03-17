// default export
const n4j = require("neo4j-driver");
const driver = n4j.driver;
const auth = n4j.auth;

// const dbDriver = driver(
//   process.env.NEO4J_URI,
//   auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
// );
const dbDriver = driver(
  "localhost:7687",
  auth.basic("node", "webbedfeet")
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
  console.log(query);
  try {
    const session = await dbDriver.session();
    const result = await session.run(query);
    await session.close();
    console.log(result);
    return result;
  } catch (error) {
    console.log(error);
  }
}

export { queryDB, generateSeasons, playerStatsByYearAndType };
