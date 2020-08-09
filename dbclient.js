// default export
import pkg from 'neo4j-driver';
const { driver, auth } = pkg;

const dbDriver = driver('neo4j://localhost:7687', auth.basic('ffadmin', 'qwerty12!'))
const session = dbDriver.session()

// Example queries for future reference
const playersWhoRushedForTenOrMoreGamesIn2018 =
    "match (s:NFLStatisticalSeason)<-[r:RUSHED_FOR]-(p:Player) where r.gamesPlayed > 10 return p, r, s"
const getAll = "match (p) return"

async function getPlayerByName(name) {
    let query = `match (p:Player{name:\"${name}\"}) return p`

    try {
        const result = await session.run(query);
        const singleRecord = result.records[0];
        const node = singleRecord.get(0);

        // returns { name: 'Aaron Jones', team: 'GB', pos: 'RB' }
        console.log(node.properties);
    }
    finally {
        await session.close
    }
}

getPlayerByName("Dalvin Cook")

//TODO: Create player record
//TODO: Parameterized query function(s)?