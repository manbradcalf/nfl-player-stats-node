const pkg = require("espn-fantasy-football-api/node-dev.js");
import { queryDB, generateSeasons, playerStatsByYearAndType } from "./dbclient";
const espnAPI = new pkg.Client({ leagueId: 1077416 });
const espnPlayerEndpoint =
  "https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/";
const util = require("util");
const axios = require("axios");

async function writePlayerToDB(playerSummary, response) {
  // check for existing player node. if not existing, create one
  let playerNode = await queryDB(
    `match (p:Player{name:\"${playerSummary.name}\"}) return p`
  );

  let stats = response.data.categories;

  // if we have no player, make one
  if (playerNode.records.length == 0) {
    // Using util inspect here to trim quotes from json keys
    // https://stackoverflow.com/questions/11233498/json-stringify-without-quotes-on-properties
    await queryDB(`create (p:Player${util.inspect(playerSummary)}) return p`);
  }

  // ESPN statistical category. Indexed by stat type rather than year for some reason
  let espnResponseCategories = [
    stats.filter((s) => s.name === "rushing")[0],
    stats.filter((s) => s.name === "scoring")[0],
    stats.filter((s) => s.name === "passing")[0],
    stats.filter((s) => s.name === "receiving")[0],
  ];

  // Use for loop because forEach doesn't work well with async/await
  for (let index = 0; index < espnResponseCategories.length; index++) {
    let category = espnResponseCategories[index];
    // TODO: what is null safety in javascript
    if (category) {
      generateStatsForCategory(category, playerSummary);
    }
  }
}

async function generateStatsForCategory(category, playerSummary) {
  let statKeys = category.names;
  let seasons = category.statistics;
  let categoryName = category.name;

  // For each season of this particulat stat category (i.e. rushing, passing)
  for (let index = 0; index < seasons.length; index++) {
    let season = seasons[index];

    // Get the stats
    let seasonStatsForThisCategory = await playerStatsByYearAndType(
      playerSummary.name,
      categoryName,
      season.season.year
    );

    // If they don't exist, make the stats
    if (seasonStatsForThisCategory.records.length == 0) {
      //TODO; Broken
      let dbStatsForSeason = await queryDB(
        `MATCH (p:Player), (s:NFLStatisticalSeason) 
              WHERE p.name = \"${playerSummary.name}\" AND s.name = ${season.season.year} 
              CREATE (p)-[r:${categoryName}]->(s) RETURN type(r) `
      );
      console.log(`season stats in db: ${dbStatsForSeason.results}`);
    }

    for (let statIndex = 0; statIndex < season.stats.length; statIndex++) {
      let stat = season.stats[statIndex];

      // addStatForYear is a long query which:
      // ensures the season and relationship exist
      // matches the player node
      // matches the season node (which has been created outside of this script)
      // matches the relationship between player and season
      // where this statistic is a property on that relationship
      let addStatForYear = await queryDB(
        `MATCH (p: Player {name: \"${playerSummary.name}\"}) 
               MATCH (s: NFLStatisticalSeason {name: ${season.season.year}}) 
               MATCH (p)-[r:${categoryName}]->(s) 
              SET r.${statKeys[statIndex]} = ${stat.replace(",", "")}`
      );

      console.log(`just added stats: ${addStatForYear.records}`);
    }
  }
}

async function writePlayerInfoToDB(espnPlayerId: string) {
  const url = `${espnPlayerEndpoint}${espnPlayerId}`;
  console.log(`url is ${url}\n`);
  axios
    .get(url)
    .then((response) => {
      if (response.data != undefined) {
        console.log(`response looks like ${Object.keys(response.data)}`);
        let playerSummary = {
          espnid: espnPlayerId,
          name: response.data.athlete.displayName,
          position: response.data.athlete.position.abbreviation,
        };
        console.log(`playerSummary is ${JSON.stringify(playerSummary)}`);
        //TODO: Commenting out because prototyping
        // writePlayerToDB(playerSummary, response);
      }
    })
    .catch((error) => {
      console.log(`Unable to get player info because...\n${error}`);
    });
}

// Script does stuff now
generateSeasons();
let skillPlayers = require("../espnIds.json");

skillPlayers.forEach((item) => {
  writePlayerInfoToDB(item);
});
