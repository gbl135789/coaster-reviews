
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const { User } = require("./db");

const messages = {
    error: {
        usernameRegisInvalid: "Username must be between 5 and 30 characters with no spaces",
        usernameRegisTaken: "Username already exists",
        passwordRegis: "Password must be between 5 and 30 characters with no spaces",
        login: "Incorrect username or password",
        internal: "Internal error, please try again"
    }
};

Object.freeze(messages);

// attempt to log in a user, catching errors other than username/password mismatch as needed
async function handleLogin(req, username, password, done) {
    try {
        const user = await User.findOne({ username: username });
        if(!user || !(await user.isValidPassword(password))) {
            done(null, false, req.flash("errorMessage", messages.error.login));
        } else {
            done(null, user);
        }
    } catch(err) {
        done(null, false, req.flash("errorMessage", messages.error.internal));
    }
}

passport.use("local-login", new LocalStrategy({ passReqToCallback: true }, handleLogin));

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
passport.deserializeUser(function(id, done) {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

function handleRegistrationError(err, req, done) {
    const errors = err.errors;
    if(errors.username && errors.username.kind === "unique") {
        done(null, false, req.flash("errorMessage", messages.error.usernameRegisTaken));
    } else if(errors.username) {
        done(null, false, req.flash("errorMessage", messages.error.usernameRegisInvalid));
    } else if(errors.password) {
        done(null, false, req.flash("errorMessage", messages.error.passwordRegis));
    } else {
        done(null, false, req.flash("errorMessage", messages.error.internal));
    }
}

// attempt to register a user, catching errors such as schema validation as needed
// password hashing is handled by Mongoose pre-save middleware
async function handleRegistration(req, username, password, done) {
    try {
        const user = await User.create({ type: "user", username: username, password: password });
        done(null, user);
    } catch(err) {
        handleRegistrationError(err, req, done);
    }
}

passport.use("local-register", new LocalStrategy({ passReqToCallback: true }, handleRegistration));
