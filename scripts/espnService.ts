// todo: delete this and use a downloaded copy of data from nflfastr or
// somethign
import { queryDB, generateSeasons, playerStatsByYearAndType } from "./dbclient";

const espnAthlete =
  "https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/";
const espnTeamStats =
  "https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/statistics/byteam";

const util = require("util");
const axios = require("axios");

async function createPlayerLabel(playerSummary) {
  await queryDB(`create (p:Player${util.inspect(playerSummary)}) return p`);
}

async function writePlayerStatsToDB(playerSummary) {
  await axios
    .get(`${espnAthlete + playerSummary.espnid}/stats`)
    .then(async (response) => {
      for (const statisticalCategory of response.data.categories) {
        if (statisticalCategory.names.includes("fieldGoalsMade-fieldGoalAttempts")) {
          return;
        }
        generatePlayerStatsForCategory(statisticalCategory, playerSummary);
      }
    })
    .catch((error) => {
      console.log(`Unable to get player info because...\n${error}`);
    });
}

async function generatePlayerStatsForCategory(category, playerSummary) {
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

    // If they don't exist in the DB, make the stats and insert
    if (!seasonStatsForThisCategory.records) {
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
    }
  }
}

export async function writePlayerInfoToDB(espnPlayerId: string) {
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
        createPlayerLabel(playerSummary);
        writePlayerStatsToDB(playerSummary);
      }
    })
    .catch((error) => {
      console.log(`Unable to get player info because...\n${error}`);
    });
}

async function getTeamsStats() {
  const url = `${espnTeamStats}`;
  axios.get(url).then((response) => {
    let teamStats = response.data.map((x) => {
      return {
        team: x.teams.team.name,
        team_stats: x.teams.categories,
        stats: x.categories.map((x) => {
          return { category: x.name, stats: x.names };
        }),
      };
    });
    console.log(`response\n${JSON.stringify(teamStats)}`);
  });
}

async function getStatNamesForCateogry(statsCategory) {
  // TODO remove this fetch of data in the function and pass data as param
  await axios.get(espnTeamStats).then((response) => {
    let statNames = response.data.categories.filter(
      (c) => c.name === statsCategory
    )[0].names;

    console.log(`stat names for ${statsCategory} are ${statNames}`);
  });
}
async function getTeamStatsForCategory(statsCategory) {
  // TODO remove this fetch of data in the function and pass data as param

  await axios.get(espnTeamStats).then((response) => {
    response.data.teams.forEach((team) => {
      // console.log(`team is ${JSON.stringify(team)}`)
      let teamStats = {};
      let ownStats = team.categories.filter((c) => c.name === statsCategory)[0];
      let opponentStats = team.categories.filter(
        (c) => c.name === statsCategory
      )[1];

      let formattedStats = {
        own: { ranks: ownStats.ranks, values: ownStats.values },
        opponent: {
          ranks: opponentStats.ranks,
          values: opponentStats.values,
        },
      };

      teamStats[statsCategory] = formattedStats;
      console.log(
        `${statsCategory} stats for ${JSON.stringify(
          team.team.name
        )} are ${JSON.stringify(teamStats)}\n`
      );
    });
  });
}
