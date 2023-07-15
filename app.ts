import "http-errors";
import e from "express";
import { generateSeasons, queryDB } from "./scripts/dbclient";
import { mapResultsForTable, queryMapper } from "./scripts/mutators";
import { writePlayerInfoToDB } from "./scripts/espnService";
import { skillPlayers } from "./scripts/espnIds";

const app = e();
const port = process.env.port;
let path = require("path");

/**
 * THIS IS TEMPORARY!
 */
// generateSeasons();
// skillPlayers.forEach((item) => {
//   writePlayerInfoToDB(item.toString());
// });
/**
 * THIS IS TEMPORARY!
 */

// Set our static public folder for static assets such as css and images
app.use(e.static(path.join(__dirname, "../public")));

// view engine setup
app.engine("hbs", require("exphbs"));
app.set("view engine", "hbs");

// routes
app.get("/", (req, res) => {
  res.render("index", { title: "Home" });
});

app.get("/results", async (req, res, next) => {
  try {
    let query = queryMapper(req);
    let dbResponse = await queryDB(query);
    let { headers, rows } = mapResultsForTable(dbResponse);

    // get results from db for query
    // render view
    res.render("results", {
      title: "Results",
      header: headers,
      results: rows,
    });
  } catch (err) {
    res.send(err.message);
    console.log(err);
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
