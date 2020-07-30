import fs from "fs";
import axios from "axios";
import pkg from "espn-fantasy-football-api/node-dev.js";
const { Client } = pkg;
const espnAPI = new Client({ leagueId: 1077416 });
const espnStats = "https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes"

espnAPI.setCookies({
  espnS2:
    "AEBT8vOkxMc2bOJ0dsbtqzeRp8ZDOjSQ7D9qQw1G5FDe9D4HDS5aYSM%2FEMlwzjSnKzPtDnBrUz9vaoIpDL1tBJKAGXBrqO%2BtCIFMJuuCpbluc%2BSPybwSj%2Fxi5cEN9vlyoZhMjy64tBvqrv8Ng%2FyTeLBc5M6zuuORPgNqJr0IW0d7NDXaGvk3pkHdoDLRPrGpoDL3n0qLaxEqx8Xb35tYFh6iy3P0hrKIxXbybtMCXnWQgA9ymbBCRSye8%2BGxZ0kIGIHlRnM7dFdQNcH%2F0FvZBJLJvT61MDySg0sC9AucsjlQaQ%3D%3D",
  SWID: "A0C037F3-FB5E-4932-AF85-0A9BDAB4C45B",
});

let skillPlayers;

espnAPI.getFreeAgents({
  seasonId: 2019,
  scoringPeriodId: 2,
}).then((players) => {
  console.log("Players object looks like this" + JSON.stringify(players[0]));
  skillPlayers = players.filter((item) => {
    console.log("What am i wroking with item wise\n" + JSON.stringify(item))

    // Defenses have negative ids and I think it breaks this
    return item.player.id > 0
  })

  skillPlayers.forEach((item) => {
    // All wideouts are listed by ESPN as RB/WR fome reason
    if (item.player.defaultPosition == "RB/WR") {
      item.player.defaultPosition = "WR"
    }

    let playerSummary = {
      id: item.player.id,
      firstName: item.player.firstName,
      lastName: item.player.lastName,
      fullName: item.player.fullName,
      defaultPosition: item.player.defaultPosition
    }
    writeStatsForPlayer(playerSummary);
  })
})
  .catch((error) => {
    console.log(error);
  });;

function playerStatMapper(playerSummary, response) {
  console.log("mapping stats for " + JSON.stringify(playerSummary) + " \n")

  // Statistic building blocks
  let espnRushingCategory = response.data.categories.filter((statCategory) => { return statCategory.name === "rushing" })[0];
  let espnScoringCategory = response.data.categories.filter((statCategory) => { return statCategory.name === "scoring" })[0];
  let espnPassingCategory = response.data.categories.filter((statCategory) => { return statCategory.name === "passing" })[0];
  let espnReceivingCategory = response.data.categories.filter((statCategory) => { return statCategory.name === "receiving" })[0];

  // Stat keys

  // Create empty array to populate stats by season
  let rushingCareerStats = {};
  let receivingCareerStats = {};
  let passingCareerStats = {};
  let scoringCareerStats = {};

  // build careerStats object
  let careerStats = {
    "rushing": rushingCareerStats,
    "passing": passingCareerStats,
    "receiving": receivingCareerStats,
    "scoring": scoringCareerStats
  }

  // Iterate through the seasons
  if (espnRushingCategory) {
    let espnRushingStatKeys = espnRushingCategory.names;
    let espnRushingSeasons = espnRushingCategory.statistics;

    espnRushingSeasons.forEach((season) => {
      console.log("Getting rushing stats for \n" + JSON.stringify(season))
      // and populate the rushing stats for each year
      rushingCareerStats[season.season.year] = season.stats.reduce(function (result, rushingStat, index) {
        console.log("Getting rushing stats for \n" + JSON.stringify(espnRushingStatKeys[index]))
        result[espnRushingStatKeys[index]] = rushingStat;
        return result;
      }, {})
    })
  }

  if (espnReceivingCategory) {
    let espnReceivingStatKeys = espnReceivingCategory.names;
    let espnReceivingSeasons = espnReceivingCategory.statistics;

    espnReceivingSeasons.forEach((season) => {
      console.log("Getting receiving stats for \n" + JSON.stringify(season))
      // and populate the rushing stats for each year
      receivingCareerStats[season.season.year] = season.stats.reduce(function (result, receivingStat, index) {
        result[espnReceivingStatKeys[index]] = receivingStat;
        return result;
      }, {})
    })
  }

  if (espnPassingCategory) {
    let espnPassingStatKeys = espnPassingCategory.names;
    let espnPassingSeasons = espnPassingCategory.statistics;

    espnPassingSeasons.forEach((season) => {
      // and populate the rushing stats for each year
      passingCareerStats[season.season.year] = season.stats.reduce(function (result, passingStat, index) {
        result[espnPassingStatKeys[index]] = passingStat;
        return result;
      }, {})
    })
  }

  if (espnScoringCategory) {
    let espnScoringStatKeys = espnScoringCategory.names;
    let espnScoringSeasons = espnScoringCategory.statistics;

    espnScoringSeasons.forEach((season) => {
      // and populate the rushing stats for each year
      scoringCareerStats[season.season.year] = season.stats.reduce(function (result, scoringStat, index) {

        result[espnScoringStatKeys[index]] = scoringStat;
        return result;
      }, {})
    })
  }

  console.log("new stats are " + JSON.stringify(careerStats) + "\n");
  return careerStats;
}

function writeStatsForPlayer(playerSummary) {
  let url = espnStats + "/" + playerSummary.id.toString() + "/stats?region=us&lang=en&contentorigin=espn"
  console.log("url i'm trying to hit for " + playerSummary.fullName + " is " + url + "\n")

  axios.get(url)
    .then((response) => {
      let stats = playerStatMapper(playerSummary, response);
      fs.writeFile("playerstats/" + playerSummary.defaultPosition + "/" + playerSummary.fullName + ".json", JSON.stringify(stats),
        function (err) {
          if (err) return console.log(err);
        });
    })
    .catch((error) => {
      console.log("Unable to get " + playerSummary.fullName + " stats because...\n")
      console.log(error)
    })
};