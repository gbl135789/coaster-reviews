
// node modules
const path = require("path");
const express = require("express");
const session = require("express-session");
const passport = require("passport");
const flash = require("connect-flash");

// other modules
const auth = require("./auth");
const db = require("./db");

// app setup
const config = require("./config/config");
const app = express();
app.set("view engine", "hbs");
app.use(express.static(path.resolve(__dirname, "public")));
app.use(session({
    secret: config.get("sessionSecret"),
    resave: false,
    saveUninitialized: true
}));
app.use(express.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req, _, next) => {
    console.log("Request method:", req.method);
    console.log("Request path:", req.path, "\n");
    next();
});

app.use((req, res, next) => {
    res.locals.errorMessage = req.flash("errorMessage");
    res.locals.successMessage = req.flash("successMessage");
    next();
});

// decorator for async route handlers
function getAsyncHandler(asyncHandler) {
    return function(req, res, next) {
        asyncHandler(req, res, next).catch(next);
    };
}

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/parks", getAsyncHandler(async (req, res) => {
    const parks = await db.find("Park", {});
    const isAdmin = auth.isAdmin(req);
    res.render("parks", {
        isAdmin: isAdmin,
        parks: await Promise.all(parks.map(async p => ({
            name: p.name,
            location: p.location,
            rating: await p.getRating(),
            slug: p.slug,
            deletable: isAdmin
        })))
    });
}));

app.get("/coasters", getAsyncHandler(async (req, res) => {
    const coasters = await db.find("Coaster", {});
    res.render("coasters", {
        coasters: await Promise.all(coasters.map(async c => ({
            name: c.name,
            park: await db.findOne("Park", { coasters: c._id }),
            rating: await c.getRating(),
            slug: c.slug,
            deletable: auth.isAdmin(req)
        })))
    });
}));

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", passport.authenticate("local-login", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true
}));

app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", passport.authenticate("local-register", {
    successRedirect: "/",
    failureRedirect: "/register",
    failureFlash: true
}));

app.get("/account", getAsyncHandler(async (req, res) => {
    if(auth.isAuthenticated(req)) {
        const user = await db.findOne("User", { username: req.user.username });
        const reviews = await db.find("Review", { author: user._id });
        res.render("account", {
            username: req.user.username,
            reviews: await Promise.all(reviews.map(async r => ({
                rating: r.rating,
                postDate: r.postDate,
                postTime: r.postTime,
                body: r.body,
                slug: r.slug,
                coaster: await db.findOne("Coaster", { reviews: r._id })
            })))
        });
    } else {
        res.redirect("/login");
    }
}));

app.get("/logout", (req, res) => {
    req.logout();
    req.flash("successMessage", "Successfully logged out");
    res.redirect("/login");
});

app.post("/add-park", auth.checkAdmin, getAsyncHandler(async (req, res) => {
    await db.create("Park", { name: req.body.name, location: req.body.location });
    req.flash("successMessage", "Successfully added park");
    res.redirect("back");
}));

// routes with parameters

app.post("/:review/delete-review", auth.checkAuthenticated, getAsyncHandler(async (req, res) => {
    const review = await db.findOne("Review", { slug: req.params.review });
    if(!auth.isAdmin(req) && req.user.username !== review.author.username) {
        res.send("You cannot delete this review");
    } else {
        await db.deleteOne("Review", { slug: review.slug });
        req.flash("successMessage", "Successfully deleted review");
        res.redirect("back");
    }
}));

app.post("/:coaster/delete-coaster", auth.checkAdmin, getAsyncHandler(async (req, res) => {
    await db.deleteCoaster({ slug: req.params.coaster });
    req.flash("successMessage", "Successfully deleted coaster");
    res.redirect("back");
}));

app.post("/:park/delete-park", auth.checkAdmin, getAsyncHandler(async (req, res) => {
    await db.deletePark({ slug: req.params.park });
    req.flash("successMessage", "Successfully deleted park");
    res.redirect("back");
}));

app.post("/:coaster/post-review", auth.checkAuthenticated, getAsyncHandler(async (req, res) => {
    const date = new Date();
    const review = await db.create("Review", {
        author: req.user._id,
        postDate: date.toLocaleDateString(),
        postTime: date.toLocaleTimeString(),
        rating: req.body.rating,
        body: req.body.body
    });
    await db.findOneAndUpdate("Coaster",
        { slug: req.params.coaster },
        { $push: {reviews: review._id} }
    );
    req.flash("successMessage", "Successfully posted review");
    res.redirect("back");
}));

app.post("/:park/add-coaster", auth.checkAdmin, getAsyncHandler(async (req, res) => {
    const coaster = await db.create("Coaster", { name: req.body.name });
    await db.findOneAndUpdate("Park",
        { slug: req.params.park },
        { $push: {coasters: coaster._id} }
    );
    req.flash("successMessage", "Successfully added coaster");
    res.redirect("back");
}));

app.get("/:park/:coaster", getAsyncHandler(async (req, res) => {
    const park = await db.findOne("Park", { slug: req.params.park });
    const coaster = await db.findOne("Coaster", { slug: req.params.coaster });
    const reviews = await db.find("Review", { _id: {$in: coaster.reviews} });
    const isAuthenticated = auth.isAuthenticated(req);
    res.render("coaster", {
        isAuthenticated: isAuthenticated,
        hasNotWritten: isAuthenticated && !reviews.find(r => r.author.username === req.user.username),
        park: {
            name: park.name,
            slug: park.slug
        },
        coaster: {
            name: coaster.name,
            rating: await coaster.getRating(),
            reviews: reviews.map(r => ({
                author: r.author,
                rating: r.rating,
                postDate: r.postDate,
                postTime: r.postTime,
                body: r.body,
                slug: r.slug,
                deletable: auth.isAdmin(req) || (isAuthenticated && req.user.username === r.author.username)
            })),
            slug: coaster.slug
        }
    });
}));

app.get("/:park", getAsyncHandler(async (req, res) => {
    const park = await db.findOne("Park", { slug: req.params.park });
    const coasters = await db.find("Coaster", { _id: {$in: park.coasters} });
    const isAdmin = auth.isAdmin(req);
    res.render("park", {
        isAdmin: isAdmin,
        park: {
            name: park.name,
            location: park.location,
            rating: await park.getRating(),
            slug: park.slug
        },
        coasters: await Promise.all(coasters.map(async c => ({
            name: c.name,
            rating: await c.getRating(),
            slug: c.slug,
            deletable: isAdmin
        })))
    });
}));

app.use((err, req, res, next) => {
    console.log(req.method, req.path, "encountered an error:");
    console.log(err, "\n");
    req.flash("errorMessage", "An error occurred, please try again");
    res.redirect("back");
});

app.listen(config.get("port"));
