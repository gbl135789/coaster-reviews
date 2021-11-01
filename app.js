
// node modules
const path = require("path");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");

// mongoose models
// const { User, Review, Coaster, Park } = require("./db.js");

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
require("./auth");

app.get("/", (req, res) => {
    res.render("index");
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
        // handle non-admin case
    }
}

app.get("...", checkAdmin, (req, res) => {

});

app.listen(3000);
