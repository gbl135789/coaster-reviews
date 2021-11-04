
// node modules
const path = require("path");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");

// mongoose models and helpers
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

app.use((req, _, next) => {
    console.log("Request method:", req.method);
    console.log("Request path:", req.path, "\n");
    next();
});

// decorator for async route handlers
function getAsyncHandler(handler) {
    return function(req, res, next) {
        handler(req, res, next).catch(next);
    };
}

// middleware for handling errors
function errorHandler(err, req, res, _) {
    console.log(req.method, req.path, "encountered an error:");
    console.log(err, "\n");
    req.flash("errorMessage", "An error occurred, please try again");
    res.redirect("back");
}

app.get("/", (req, res) => {
    res.render("index", { errorMessage: req.flash("errorMessage") });
});

app.get("/parks", getAsyncHandler(async (req, res) => {
    const parks = await db.getParksWithRatings(await db.Park.find());
    res.render("parks", {
        errorMessage: req.flash("errorMessage"),
        successMessage: req.flash("successMessage"),
        isAdmin: isAdmin(req),
        parks: parks
    });
}));

app.get("/coasters", getAsyncHandler(async (req, res) => {
    const coasters = await db.getCoastersWithRatingsAndParks(await db.Coaster.find());
    res.render("coasters", {
        errorMessage: req.flash("errorMessage"),
        successMessage: req.flash("successMessage"),
        coasters: coasters
    });
}));

app.get("/login", (req, res) => {
    res.render("login", {
        errorMessage: req.flash("errorMessage"),
        successMessage: req.flash("successMessage")
    });
});

app.post("/login", passport.authenticate("local-login", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}));

app.get("/register", (req, res) => {
    res.render("register", {
        errorMessage: req.flash("errorMessage"),
        successMessage: req.flash("successMessage")
    });
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
        res.render("account", {
            errorMessage: req.flash("errorMessage"),
            successMessage: req.flash("successMessage"),
            username: req.user.username
        });
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.logout();
    req.flash("successMessage", "Successfully logged out");
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

app.post("/add-park", checkAdmin, getAsyncHandler(async (req, res) => {
    await db.Park.create({ name: req.body.name });
    req.flash("successMessage", "Successfully added park");
    res.redirect("back");
}));

// routes with parameters

app.post("/:coaster/review", checkAuthenticated, getAsyncHandler(async (req, res) => {
    const review = await db.Review.create({
        author: req.user._id,
        rating: req.body.rating,
        body: req.body.body
    });
    await db.Coaster.findOneAndUpdate(
        { slug: req.params.coaster },
        { $push: {reviews: review._id} }
    );
    req.flash("successMessage", "Successfully posted review");
    res.redirect("back");
}));

app.post("/:park/add-coaster", checkAdmin, getAsyncHandler(async (req, res) => {
    const coaster = await db.Coaster.create({ name: req.body.name });
    await db.Park.findOneAndUpdate(
        { slug: req.params.park },
        { $push: {coasters: coaster._id} }
    );
    req.flash("successMessage", "Successfully added coaster");
    res.redirect("back");
}));

app.get("/:park/:coaster", getAsyncHandler(async (req, res) => {
    const park = await db.Park.findOne({ slug: req.params.park });
    const coaster = park.coasters.find(c => c.slug === req.params.coaster);
    const isAuthenticated = req.isAuthenticated();
    res.render("coaster", {
        errorMessage: req.flash("errorMessage"),
        successMessage: req.flash("successMessage"),
        isAuthenticated: isAuthenticated,
        hasNotWritten: isAuthenticated && !coaster.reviews.find(r => r.author.username === req.user.username),
        park: park,
        coaster: await db.getCoasterWithRating(coaster)
    });
}));

app.get("/:park", getAsyncHandler(async (req, res) => {
    const park = await db.Park.findOne({ slug: req.params.park });
    res.render("park", {
        errorMessage: req.flash("errorMessage"),
        successMessage: req.flash("successMessage"),
        isAdmin: isAdmin(req),
        park: await db.getParkWithRating(park),
        coasters: await db.getCoastersWithRatings(park.coasters)
    });
}));

app.use(errorHandler);

app.listen(3000);
