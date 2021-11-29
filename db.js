
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
    postDate: {
        type: String,
        required: true
    },
    postTime: {
        type: String,
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
    },
    slug: {
        type: String,
        slug: "author",
        unique: true
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
    }],
    slug: {
        type: String,
        slug: "name",
        unique: true
    }
});

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
    location: {
        type: String,
        required: true,
        trim: true
    },
    coasters: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Coaster",
    }],
    slug: {
        type: String,
        slug: "name",
        unique: true
    }
});

// user schema methods

userSchema.methods.isValidPassword = function(password) {
    return bcrypt.compare(password, this.password);
};

// coaster schema methods

coasterSchema.methods.getRating = async function() {
    const reviews = await find("Review", { _id: {$in: this.reviews} });
    return reviews.length === 0 ? "N/A" : (reviews.reduce((sum, r) => sum + r.rating, 0.0) / reviews.length).toFixed(2);
};

// park schema methods

parkSchema.methods.getRating = async function() {
    const coasters = await find("Coaster", { _id: {$in: this.coasters} });
    let totalRating = 0;
    let ratedCoasters = 0;
    for(const c of coasters) {
        const r = await c.getRating();
        if(r !== "N/A") {
            totalRating += parseFloat(r);
            ratedCoasters++;
        }
    }

    return ratedCoasters === 0 ? "N/A" : (totalRating / ratedCoasters).toFixed(2);
};

// middleware for salting and hashing password

userSchema.pre("save", async function() {
    if(this.isNew) {
        this.password = await bcrypt.hash(this.password, 10);
    }
});

const User = mongoose.model("User", userSchema);
const Review = mongoose.model("Review", reviewSchema);
const Coaster = mongoose.model("Coaster", coasterSchema);
const Park = mongoose.model("Park", parkSchema);

// db api

const opsTable = {
    create: (model, args) => model.create(...args),
    find: (model, args) => model.find(...args),
    findOne: (model, args) => model.findOne(...args),
    findById: (model, args) => model.findById(...args),
    findOneAndUpdate: (model, args) => model.findOneAndUpdate(...args),
    deleteOne: (model, args) => model.deleteOne(...args),
    deleteMany: (model, args) => model.deleteMany(...args),
    count: (model, args) => model.count(...args)
};

Object.freeze(opsTable);

function dispatchOnModel(model, op, ...args) {
    switch(model) {
        case "User":
            return opsTable[op](User, args);
        case "Review":
            return opsTable[op](Review, args);
        case "Coaster":
            return opsTable[op](Coaster, args);
        case "Park":
            return opsTable[op](Park, args);
        default:
            throw new Error("Unknown model: " + model);
    }
}

function create(model, obj) {
    return dispatchOnModel(model, "create", obj);
}

function find(model, query) {
    return dispatchOnModel(model, "find", query);
}

function findOne(model, query) {
    return dispatchOnModel(model, "findOne", query);
}

function findById(model, id) {
    return dispatchOnModel(model, "findById", id);
}

function findOneAndUpdate(model, search, update) {
    return dispatchOnModel(model, "findOneAndUpdate", search, update);
}

function deleteOne(model, query) {
    return dispatchOnModel(model, "deleteOne", query);
}

function deleteMany(model, query) {
    return dispatchOnModel(model, "deleteMany", query);
}

function count(model, query) {
    return dispatchOnModel(model, "count", query);
}

async function deleteCoaster(query) {
    const coaster = await findOne("Coaster", query);
    if(coaster) {
        await deleteMany("Review", { _id: {$in: coaster.reviews} });
        await deleteOne("Coaster", coaster);
    }
}

async function deletePark(query) {
    const park = await findOne("Park", query);
    if(park) {
        await Promise.all(park.coasters.map(async c => deleteCoaster({ _id: c })));
        await deleteOne("Park", park);
    }
}

const creds = config.get("db.username") === "" ? "" : `${config.get("db.username")}:${config.get("db.password")}`;
const host = creds === "" ? config.get("db.host") : `${creds}@${config.get("db.host")}`;
const cstring = `mongodb://${host}/${config.get("db.name")}`;
mongoose.connect(cstring);

module.exports = {
    create,
    find,
    findOne,
    findById,
    findOneAndUpdate,
    deleteOne,
    deleteMany,
    count,
    deleteCoaster,
    deletePark
};
