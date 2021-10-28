
const slugGenerator = require("mongoose-slug-generator");
const mongoose = require("mongoose");
mongoose.plugin(slugGenerator);

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
        minLength: 5,
        maxLength: 30,
        required: true
    },
    password: {
        type: String,
        minLength: 5,
        maxLength: 30,
        required: true
    }
});

/*
-reviews have an author, post time, rating, and body
-the rating must be a number between 1 and 5
*/
const reviewSchema = mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
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

/*
-coasters have a name, a list of reviews, and a slug
-the rating will be calculated by taking the average of the review ratings
*/
const coasterSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    reviews: [reviewSchema],
    slug: {
        type: String,
        slug: "name"
    }
});

/*
-parks have a name, a list of reviews, and a slug
-the rating will be calculated by taking the average of the coaster ratings
*/
const parkSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    coasters: [coasterSchema],
    slug: {
        type: String,
        slug: "name"
    }
});

coasterSchema.methods.calcRating = function(cb) {
    // TODO
};

parkSchema.methods.calcRating = function(cb) {
    // TODO
};

/* TODO: add middleware for:
User: salt and hash password
Review: update coaster and park rating
*/

const User = mongoose.model("User", userSchema);
const Review = mongoose.model("Review", reviewSchema);
const Coaster = mongoose.model("Coaster", coasterSchema);
const Park = mongoose.model("Park", parkSchema);

mongoose.connect("mongodb://localhost/final-project");

module.exports = { User, Review, Coaster, Park };