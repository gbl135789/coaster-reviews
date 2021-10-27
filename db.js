
const mongoose = require("mongoose");

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
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

/*
-reviews have an author, rating, and body
-the rating must be a number between 1 and 5
*/
const reviewSchema = mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
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
-coasters have a name, rating, and a list of reviews
-the rating must be a number between 1 and 5
*/
const coasterSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    reviews: [reviewSchema]
});

/*
-parks have a name, rating, and a list of reviews
-the rating must be a number between 1 and 5
*/
const parkSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    coasters: [coasterSchema]
});

coasterSchema.methods.updateRating = function(cb) {
    // TODO
};

parkSchema.methods.updateRating = function(cb) {
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