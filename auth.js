
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

passport.use("local-login", new LocalStrategy(
    { passReqToCallback: true },
    (req, username, password, done) => {
        User.findOne({ username: username }, (err, user) => {
            if(err) {
                console.log("login1");
                done(null, false, req.flash("errorMessage", messages.error.internal));
            } else if(!user || !user.isValidPassword(password)) {
                console.log("login2");
                done(null, false, req.flash("errorMessage", messages.error.login));
            } else {
                console.log("login3");
                done(null, user);
            }
        });
    }
));

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
passport.deserializeUser(function(id, done) {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

function handleRegistrationError(err, req, done) {
    console.log(err);
    const errors = err.errors;
    if(errors.username && errors.username.kind === "unique") {
        console.log("register1");
        done(null, false, req.flash("errorMessage", messages.error.usernameRegisTaken));
    } else if(errors.username) {
        console.log("register2");
        done(null, false, req.flash("errorMessage", messages.error.usernameRegisInvalid));
    } else if(errors.password) {
        console.log("register3");
        done(null, false, req.flash("errorMessage", messages.error.passwordRegis));
    } else {
        console.log("register4");
        done(null, false, req.flash("errorMessage", messages.error.internal));
    }
}

// register a user and start an authenticated session
passport.use("local-register", new LocalStrategy(
    { passReqToCallback: true },
    (req, username, password, done) => {
        User.create({ type: "user", username: username, password: password })
            .then(user => done(null, user))
            .catch(err => handleRegistrationError(err, req, done));
    }
));

// module.exports = {
//     messages,
//     registerUser
// };