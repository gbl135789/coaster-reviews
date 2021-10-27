
// node modules
const path = require("path");
const express = require("express");

// mongoose models
const { User, Review, Coaster, Park } = require("./db.js");

// app setup
const app = express();
app.set("view engine", "hbs");
app.use(express.static(path.resolve(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index");
});

app.listen(3000);