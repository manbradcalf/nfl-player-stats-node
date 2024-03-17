const espnAthlete =
  "https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/";
import { queryDB, generateSeasons, playerStatsByYearAndType } from "./dbclient";
const espnTeamStats =
  "https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/statistics/byteam";
const util = require("util");
const axios = require("axios");
var queryString: String = "";

interface PlayerSummary {
  espnid: string;
  name: string;
  position: string;
}

async function buildPlayer(playerSummary: PlayerSummary, espnPlayerId: string) {
  await axios
    .get(`${espnAthlete + espnPlayerId}/stats`)
    .then(async (response) => {
      queryString += `create (p:Player${util.inspect(playerSummary)})`;

      for (const statisticalCategory of response.data.categories) {
        buildStatsForCategory(statisticalCategory, playerSummary);
      }
    })
    .catch((error) => {
      console.log(`Unable to get player info because...\n${error}`);
    });
}

async function buildStatsForCategory(statisticalCategory, playerSummary: PlayerSummary) {
  let statKeys = statisticalCategory.names;
  let seasons = statisticalCategory.statistics;
  let categoryName = statisticalCategory.name;

  seasons.forEach((season) => {
    console.log(
      `stat category is ${JSON.stringify(
        statisticalCategory
      )} is category\nstats are ${statKeys}`
    );
  

    queryString += `MATCH (p:Player), (s:NFLStatisticalSeason) 
    WHERE p.name = \"${playerSummary.name}\" 
    AND s.name = ${season.year} 
    CREATE (p)-[r:${categoryName}]->(s) RETURN type(r) `;

    
    for (var i = 0; i < statKeys.length -1; i++ ) {
      let statName = statKeys[i];
      let querySegment = 
      `MATCH (p: Player {name: \"${playerSummary.name}\"})
               MATCH (s: NFLStatisticalSeason {name: ${season.season.year}})
               MATCH (p)-[r:${categoryName}]->(s)
              SET r.${statName} = ${season.stats[i].replace(",", "")} `;
      console.log(`adding ${querySegment}`)
      queryString += querySegment 
    }
  })
}

async function getPlayerInfoAndAddToQuery(espnPlayerId: string) {
  const url = `${espnAthlete}${espnPlayerId}`;
  await axios
    .get(url)
    .then(async (response) => {
      if (response.data != undefined) {
        let playerSummary: PlayerSummary = {
          espnid: espnPlayerId,
          name: response.data.athlete.displayName,
          position: response.data.athlete.position.abbreviation,
        };
        await buildPlayer(playerSummary, espnPlayerId);
      }
    })
    .catch((error) => {
      console.log(`Unable to get player info because...\n${error}`);
    });
}

/**
 * Team Stats: WIP
 */
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

getStatNamesForCateogry("rushing");
// getTeamStatsForCategory("rushing");
// Script does stuff now
let skillPlayers = require("../../tmpEspnIds.json");

skillPlayers.forEach(async (item: string) => {
  console.log(`calling espn for ${item}`);
  await getPlayerInfoAndAddToQuery(item);
  if (item == skillPlayers[skillPlayers.length - 1]) {
    console.log(`at last player....inserting query ${queryString}`);
    queryDB(queryString);
  }
});
