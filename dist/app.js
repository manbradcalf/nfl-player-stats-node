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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dbclient_1 = require("./js/dbclient");
require("http-errors");
const app = express_1.default();
const port = 3000;
let path = require("path");
// Set our static public folder for static assets such as css and images
app.use(express_1.default.static(path.join(__dirname, "/public")));
// view engine setup
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "hbs");
app.get("/", (req, res) => {
    res.render("index", { title: "Home" });
});
app.get("/results", (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // get results from db for query
        let dbResults = yield dbclient_1.queryDB(req.query.dbquery);
        let keys = dbResults.records[0].keys;
        let fields = dbResults.records[0]._fields;
        let headers = [];
        // grab the properties from the first record to make the headers
        // field == player || relationship || season, etc
        for (let i = 0; i < fields.length; i++) {
            let field = fields[i];
            // If field has no properties object we can assume
            // we've been given the value directly, ex: r.rushingYards
            if (!field.properties) {
                // Keys.length should equal fields.length, so we can grab the
                // missing key value here by diving into the keys array
                headers.push(keys[i]);
            }
            else {
                // keys are columns, like rushing yards or player name
                Object.keys(field.properties).forEach((p) => {
                    if (!headers[p]) {
                        headers.push(p);
                    }
                });
            }
        }
        // format results for consumption by view
        let rows = [];
        dbResults.records.forEach((r) => {
            let tableRow = [];
            r._fields.forEach((field) => {
                // populate the table row with properties
                if (!field.properties) {
                    tableRow.push(field);
                }
                else {
                    Object.values(field.properties).forEach((value) => {
                        tableRow.push(value);
                    });
                }
            });
            rows.push(tableRow);
        });
        // render view
        res.render("results", {
            title: "Results",
            header: headers,
            results: rows,
        });
    }
    catch (err) {
        next(err.Neo4JError);
    }
}));
app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
//# sourceMappingURL=app.js.map