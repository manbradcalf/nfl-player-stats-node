import e from "express";
import { queryDB } from "./js/dbclient";
import "http-errors";
const app = e();
const port = 3000;
let path = require("path");
// Set our static public folder for static assets such as css and images
app.use(e.static(path.join(__dirname, "/public")));

// view engine setup
app.set("views", path.join(__dirname, "../views"));
app.set("view engine", "hbs");

app.get("/", (req, res) => {
  res.render("index", { title: "Home" });
});

app.get("/results", async (req, res, next) => {
  try {
    // get results from db for query
    let dbResults = await queryDB(req.query.dbquery);

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
      } else {
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
        } else {
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
  } catch (err) {
    next(err.Neo4JError);
  }
});
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
