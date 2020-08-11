const pkg = require("espn-fantasy-football-api/node-dev.js");
const espnAPI = new pkg.Client({ leagueId: 1077416 });
const espnStats = "https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes"
const util = require('util');
const axios = require("axios");
const { queryDB, playerStatsByYearAndType, generateSeasons } = require("./dbclient.js");

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
                SET r.${statKeys[statIndex]} = ${stat}`)
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

let dalvin = {
    espnid: 3116593,
    name: "Dalvin Cook",
    position: "RB"
}

generateSeasons()
writeStatsForPlayer(dalvin)
console.log("Done")