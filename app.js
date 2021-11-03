
// node modules
const path = require("path");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");

// mongoose models
const db = require("./db.js");

// app setup
const app = express();
app.set("view engine", "hbs");
app.use(express.static(path.resolve(__dirname, "public")));
app.use(session({
    secret: "temp-secret", // TODO: configure secret
    resave: false,
    saveUninitialized: true
}));
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
const { isAdmin } = require("./auth");

app.use((req, res, next) => {
    console.log(req.url);
    next();
});

app.get("/", (req, res) => {
    res.render("index", { errorMessage: req.flash("errorMessage") });
});

app.get("/parks", async (req, res) => {
    try {
        const parks = await db.getParksWithRatings(await db.Park.find());
        res.render("parks", {
            errorMessage: req.flash("errorMessage"),
            successMessage: req.flash("successMessage"),
            isAdmin: isAdmin(req),
            parks: parks
        });
    } catch(err) {
        console.log(err);
        req.flash("errorMessage", "Could not display parks, please try again");
        res.redirect("back");
    }
});

app.get("/coasters", async (req, res) => {
    try {
        const coasters = await db.getCoastersWithRatingsAndParks(await db.Coaster.find());
        res.render("coasters", {
            errorMessage: req.flash("errorMessage"),
            successMessage: req.flash("successMessage"),
            coasters: coasters
        });
    } catch(err) {
        console.log(err);
        req.flash("errorMessage", "Could not display coasters, please try again");
        res.redirect("back");
    }
});

app.get("/login", (req, res) => {
    res.render("login", { errorMessage: req.flash("errorMessage") });
});

app.post("/login", passport.authenticate("local-login", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}));

app.get("/register", (req, res) => {
    res.render("register", { errorMessage: req.flash("errorMessage") });
});

app.post("/register", passport.authenticate("local-register", {
    successRedirect: "/",
    failureRedirect: "/register",
    failureFlash: true
}));

// TODO: authenticated-only user actions

function checkAuthenticated(req, res, next) {
    if(req.isAuthenticated()) {
        next();
    } else {
        req.flash("errorMessage", "Please log in to perform this action");
        res.redirect("/login");
    }
}

app.get("/account", (req, res) => {
    if(req.isAuthenticated()) {
        res.render("account", { username: req.user.username });
    } else {
        res.render("login");
    }
});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/login");
});

// TODO: admin-only actions

function checkAdmin(req, res, next) {
    if(req.isAuthenticated() && req.user.type === "admin") {
        next();
    } else {
        res.send("You must be logged in as an admin to take this action");
    }
}

app.post("/add-park", checkAdmin, async (req, res) => {
    try {
        await db.Park.create({ name: req.body.name });
        req.flash("successMessage", "Successfully added park");
    } catch(err) {
        console.log(err);
        req.flash("errorMessage", "Unable to add park, please try again");
    }
    res.redirect("back");
});

// routes with parameters

app.post("/:park/add-coaster", checkAdmin, async (req, res) => {
    try {
        const coaster = await db.Coaster.create({ name: req.body.name });
        await db.Park.findOneAndUpdate(
            { slug: req.params.park },
            { $push: {coasters: coaster._id} }
        );
        req.flash("successMessage", "Successfully added coaster");
    } catch(err) {
        console.log(err);
        req.flash("errorMessage", "Unable to add coaster, please try again");
    }
    res.redirect("back");
});

app.get("/:park/:coaster", async (req, res) => {
    try {
        const park = await db.Park.findOne({ slug: req.params.park });
        const coaster = park.coasters.find(c => c.slug === req.params.coaster);
        res.render("coaster", {
            errorMessage: req.flash("errorMessage"),
            successMessage: req.flash("successMessage"),
            isAuthenticated: req.isAuthenticated(),
            park: park,
            coaster: await db.getCoasterWithRating(coaster)
        });
    } catch(err) {
        console.log(err);
        req.flash("errorMessage", "Could not display coaster info, please try again");
        res.redirect("back");
    }
});

app.get("/:park", async (req, res) => {
    try {
        const park = await db.Park.findOne({ slug: req.params.park });
        res.render("park", {
            errorMessage: req.flash("errorMessage"),
            successMessage: req.flash("successMessage"),
            isAdmin: isAdmin(req),
            park: await db.getParkWithRating(park),
            coasters: await db.getCoastersWithRatings(park.coasters)
        });
    } catch(err) {
        console.log(err);
        req.flash("errorMessage", "Could not display park info, please try again");
        res.redirect("/parks");
    }
});

app.listen(3000);
