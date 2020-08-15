const express = require("express");
const dbClient = require("./js/dbclient");
const app = express();
const port = 3000;
let path = require("path");

// Set our static public folder for static assets such as css and images
app.use(express.static(path.join(__dirname, "/public")));

// view engine setup
app.set("views", path.join(__dirname, "./views"));
app.set("view engine", "hbs");

app.get("/", (req, res) => {
  res.render("index", { title: "Home" });
});

app.get("/results", async (req, res) => {
  // try {
  // get results from db for query
  let dbResults = await dbClient.queryDB(req.query.dbquery);
  // } catch {
  //   res.send("Something went wrong");
  // }

  // format results for consumption by view
  let formattedResults = [];
  dbResults.records.forEach((record) => {
    formattedResults.push({
      name: record._fields[0].properties.name,
      pos: record._fields[0].properties.position,
      espnid: record._fields[0].properties.espnid,
    });
  });

  // render view
  res.render("results", {
    title: "Results",
    results: formattedResults,
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
