const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'placeholder',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'placeholder',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
    proxy: true
  },
  async function(accessToken, refreshToken, profile, cb) {
    try {
        const email = profile.emails[0].value;
        const name = profile.displayName || 'Google User';

        // Check if user already exists
        let user = await User.findByEmail(email);

        if (!user) {
            // Create a new user automatically since Google has verified their email
            user = await User.createFromOAuth(name, email);
        }

        return cb(null, user);
    } catch (error) {
        return cb(error, null);
    }
  }
));

// Serialize user into the session
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

// Deserialize user from the session
passport.deserializeUser(function(user, cb) {
  cb(null, user);
});

module.exports = passport;
