const pkg = require("espn-fantasy-football-api/node-dev.js");
import { queryDB, playerStatsByYearAndType, generateSeasons} from "./dbclient"
const espnAPI = new pkg.Client({ leagueId: 1077416 });
const espnStats = "https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes"
const util = require('util');
const axios = require("axios");

async function writePlayerToDB(playerSummary, response) {
  // check for existing player node. if not existing, create one
  let playerNode = await queryDB(`match (p:Player{name:\"${playerSummary.name}\"}) return p`)

  // if we have no player, make one
  if (playerNode.records.length == 0) {
    // Using util inspect here to trim quotes from json keys
    // https://stackoverflow.com/questions/11233498/json-stringify-without-quotes-on-properties
    await queryDB(`create (p:Player${util.inspect(playerSummary)}) return p`)
  }

  // ESPN statistical category. Indexed by stat type rather than year for some reason
  let espnRushingCategory = response.data.categories.filter((statCategory) => { return statCategory.name === "rushing" })[0];
  let espnScoringCategory = response.data.categories.filter((statCategory) => { return statCategory.name === "scoring" })[0];
  let espnPassingCategory = response.data.categories.filter((statCategory) => { return statCategory.name === "passing" })[0];
  let espnReceivingCategory = response.data.categories.filter((statCategory) => { return statCategory.name === "receiving" })[0];
  let espnResponseCategories = [espnRushingCategory, espnReceivingCategory, espnPassingCategory, espnScoringCategory];


  // Use for loop because forEach doesn't work well with async/await
  for (let index = 0; index < espnResponseCategories.length; index++) {
    let category = espnResponseCategories[index]
    // TODO: what is null safety in javascript
    if (category) { generateStatsForCategory(category, playerSummary) }
  };
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
    )

    // If they don't exist, make the stats
    if (seasonStatsForThisCategory.records.length == 0) {
      //TODO; Broken
      let dbStatsForSeason = await queryDB(
        `MATCH (p:Player), (s:NFLStatisticalSeason) 
              WHERE p.name = \"${playerSummary.name}\" AND s.name = ${season.season.year} 
              CREATE (p)-[r:${categoryName}]->(s) RETURN type(r) `)
      console.log(`season stats in db: ${dbStatsForSeason.results}`)
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
              SET r.${statKeys[statIndex]} = ${stat.replace(",", "")}`)

      console.log(`just added stats: ${addStatForYear.records}`)
    }
  };
}

async function writeStatsForPlayer(playerSummary) {
  let url = espnStats + "/" + playerSummary.espnid.toString() + "/stats?region=us&lang=en&contentorigin=espn"
  axios.get(url)
    .then((response) => {
      if (response.data.categories != undefined) {
        writePlayerToDB(playerSummary, response);
      }
    })
    .catch((error) => {
      console.log(
        "Unable to get " + playerSummary.fullName +
        ` stats because...\n${error}`)
    })
};

// Script does stuff now 
espnAPI.setCookies({
  espnS2:
    "AEBT8vOkxMc2bOJ0dsbtqzeRp8ZDOjSQ7D9qQw1G5FDe9D4HDS5aYSM%2FEMlwzjSnKzPtDnBrUz9vaoIpDL1tBJKAGXBrqO%2BtCIFMJuuCpbluc%2BSPybwSj%2Fxi5cEN9vlyoZhMjy64tBvqrv8Ng%2FyTeLBc5M6zuuORPgNqJr0IW0d7NDXaGvk3pkHdoDLRPrGpoDL3n0qLaxEqx8Xb35tYFh6iy3P0hrKIxXbybtMCXnWQgA9ymbBCRSye8%2BGxZ0kIGIHlRnM7dFdQNcH%2F0FvZBJLJvT61MDySg0sC9AucsjlQaQ%3D%3D",
  SWID: "A0C037F3-FB5E-4932-AF85-0A9BDAB4C45B",
});


generateSeasons()
let skillPlayers;

espnAPI.getFreeAgents({
  seasonId: 2019,
  scoringPeriodId: 2,
}).then((players) => {
  skillPlayers = players.filter((item) => {
    // Defenses have negative ids and I think it breaks this
    return item.player.id > 0
  })

  skillPlayers.forEach((item) => {
    // All wideouts are listed by ESPN as RB/WR fome reason
    if (item.player.defaultPosition == "RB/WR") {
      item.player.defaultPosition = "WR"
    }

    let playerSummary = {
      espnid: item.player.id,
      name: item.player.fullName,
      position: item.player.defaultPosition
    }
    writeStatsForPlayer(playerSummary);
  })
})
  .catch((error) => {
    console.log(error);
  });;
