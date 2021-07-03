const pkg = require("espn-fantasy-football-api/node-dev.js");
import { queryDB, generateSeasons, playerStatsByYearAndType } from "./dbclient";
const espnAthlete =
  "https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/";
const espnTeam =
  "https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/statistics/byteam";
const util = require("util");
const axios = require("axios");

async function writePlayerStatsToDB(playerSummary, espnPlayerId) {
  // check for existing player node. if not existing, create one
  let playerNode = await queryDB(
    `match (p:Player{name:\"${playerSummary.name}\"}) return p`
  );

  await axios
    .get(`${espnAthlete + espnPlayerId}/stats`)
    .then(async (response) => {
      if (playerNode.records.length == 0) {
        await queryDB(
          `create (p:Player${util.inspect(playerSummary)}) return p`
        );
      }

      for (const statisticalCategory of response.data.categories) {
        generateStatsForCategory(statisticalCategory, playerSummary);
      }
    })
    .catch((error) => {
      console.log(`Unable to get player info because...\n${error}`);
    });
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
  const url = `${espnAthlete}${espnPlayerId}`;
  axios
    .get(url)
    .then((response) => {
      if (response.data != undefined) {
        let playerSummary = {
          espnid: espnPlayerId,
          name: response.data.athlete.displayName,
          position: response.data.athlete.position.abbreviation,
        };
        writePlayerStatsToDB(playerSummary, espnPlayerId);
      }
    })
    .catch((error) => {
      console.log(`Unable to get player info because...\n${error}`);
    });
}

async function getTeamsStats() {
  const url = `${espnTeam}`;
  axios.get(url).then((response) => {
    let teamStats = response.data.teams.map((t, c) => {
      return { team: t.team.name, stats: t.categories };
    });
    console.log(`response\n${JSON.stringify(teamStats)}`);
  });
}

// Script does stuff now
// generateSeasons();
// let skillPlayers = require("../../espnIds.json");

// skillPlayers.forEach((item) => {
//   writePlayerInfoToDB(item);
// });
getTeamsStats();
