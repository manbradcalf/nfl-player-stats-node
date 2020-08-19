"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerStatsByYearAndType = exports.generateSeasons = exports.queryDB = void 0;
// default export
const n4j = require("neo4j-driver");
const driver = n4j.driver;
const auth = n4j.auth;
const dbDriver = driver("neo4j://localhost:7687", auth.basic("ffadmin", "qwerty12!"));
function playerStatsByYearAndType(playerName, categoryName, year) {
    return __awaiter(this, void 0, void 0, function* () {
        return queryDB(`match (p:Player{name: \"${playerName}\"})-[r:${categoryName}]->(s:NFLStatisticalSeason{name:${year}}) return r`);
    });
}
exports.playerStatsByYearAndType = playerStatsByYearAndType;
function generateSeasons() {
    return __awaiter(this, void 0, void 0, function* () {
        queryDB(`create (s14:NFLStatisticalSeason{name:2014})
         create (s15:NFLStatisticalSeason{name:2015})
         create (s16:NFLStatisticalSeason{name:2016})
         create (s17:NFLStatisticalSeason{name:2017})
         create (s18:NFLStatisticalSeason{name:2018})
         create (s19:NFLStatisticalSeason{name:2019})`);
        queryDB(`create (s19:NFLStatisticalSeason{name:2019})`);
    });
}
exports.generateSeasons = generateSeasons;
function queryDB(query) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const session = yield dbDriver.session();
            if (query.startsWith("create")) {
                console.log(`Running create query\n${query}\non session\n${session}`);
            }
            const result = yield session.run(query);
            if (result.records.length != 0) {
                console.log(`Returning this result for ${query}\n\n${result}`);
            }
            yield session.close();
            console.log("closed session\n");
            return result;
        }
        catch (error) {
            console.log(error);
        }
    });
}
exports.queryDB = queryDB;
//# sourceMappingURL=dbclient.js.map