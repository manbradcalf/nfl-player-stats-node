import e from "express";
import { queryDB } from "./js/dbclient";
import { mapResultsForTable, queryMapper } from "./js/mutators";
import "http-errors";
const app = e();
const port = 3000;
let path = require("path");

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
