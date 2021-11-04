
const config = require("./config/config");
const slugGenerator = require("mongoose-slug-generator");
const uniqueValidator = require("mongoose-unique-validator");
const autopopulate = require("mongoose-autopopulate");
const mongoose = require("mongoose");
mongoose.plugin(slugGenerator);

const bcrypt = require("bcrypt");

/*
-users have a type, username, and password
-type may be 'user' or 'admin'
-'admin' has more privileges than 'user'
-passwords are salted and hashed
*/
const userSchema = mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ["user", "admin"],
        default: "user"
    },
    username: {
        type: String,
        required: true,
        minLength: 5,
        maxLength: 30,
        validate: v => v.length > 0 && !v.match(/\s/),
        unique: true
    },
    password: {
        type: String,
        required: true,
        minLength: 5,
        maxLength: 30,
        validate: v => v.length > 0 && !v.match(/\s/)
    }
});

userSchema.plugin(uniqueValidator);

/*
-reviews have an author, post time, rating, and body
-the rating must be a number between 1 and 5
*/
const reviewSchema = mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        autopopulate: true
    },
    postTime: Date,
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    body: {
        type: String,
        required: true
    }
});

reviewSchema.plugin(autopopulate);

/*
-coasters have a name, a list of reviews, and a slug
-the rating will be calculated by taking the average of the review ratings
*/
const coasterSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
        autopopulate: true
    }],
    slug: {
        type: String,
        slug: "name",
        unique: true
    }
});

coasterSchema.plugin(autopopulate);

/*
-parks have a name, a list of reviews, and a slug
-the rating will be calculated by taking the average of the coaster ratings
*/
const parkSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    coasters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coaster",
        autopopulate: true
    }],
    slug: {
        type: String,
        slug: "name",
        unique: true
    }
});

parkSchema.plugin(autopopulate);

// user schema methods

userSchema.methods.isValidPassword = function(password) {
    return bcrypt.compare(password, this.password);
};

// middleware for salting and hashing password

userSchema.pre("save", async function() {
    if(this.isNew) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

// other helper functions

function getCoasterPark(coaster) {
    return Park.findOne({ coasters: coaster._id });
}

function getCoasterRating(coaster) {
    const reviews = coaster.reviews;
    return reviews.length === 0 ? "N/A" : reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

async function getCoasterWithRating(coaster) {
    const result = coaster.toObject();
    result.rating = getCoasterRating(coaster);
    return result;
}

async function getCoastersWithRatings(coasters) {
    const result = [];
    for(const c of coasters) {
        result.push(await getCoasterWithRating(c));
    }
    return result;
}

async function getCoastersWithRatingsAndParks(coasters) {
    const result = await getCoastersWithRatings(coasters);
    for(const c of result) {
        c.park = await getCoasterPark(c);
    }
    return result;
}

async function getParkRating(park) {
    const coasters = park.coasters;

    let totalRating = 0;
    let ratedCoasters = 0;
    for(const c of coasters) {
        const r = getCoasterRating(c);
        if(r !== "N/A") {
            totalRating += r;
            ratedCoasters++;
        }
    }

    return ratedCoasters === 0 ? "N/A" : totalRating / ratedCoasters;
}

async function getParkWithRating(park) {
    const result = park.toObject();
    result.rating = await getParkRating(park);
    return result;
}

async function getParksWithRatings(parks) {
    const result = [];
    for(const p of parks) {
        result.push(await getParkWithRating(p));
    }
    return result;
}

const User = mongoose.model("User", userSchema);
const Review = mongoose.model("Review", reviewSchema);
const Coaster = mongoose.model("Coaster", coasterSchema);
const Park = mongoose.model("Park", parkSchema);

const creds = `${config.get("db.username")}:${config.get("db.password")}`;
const cstring = `mongodb://${creds}@${config.get("db.host")}/${config.get("db.name")}`;
mongoose.connect(cstring);

module.exports = {
    User,
    Review,
    Coaster,
    Park,
    getCoasterRating,
    getCoasterWithRating,
    getCoastersWithRatings,
    getCoastersWithRatingsAndParks,
    getParkRating,
    getParkWithRating,
    getParksWithRatings
};
