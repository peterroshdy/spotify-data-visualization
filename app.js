const express = require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const session = require('express-session');
const passport = require('passport');
const SpotifyStrategy = require('passport-spotify/lib/passport-spotify/index').Strategy;

require('dotenv').config();


//Listening PORT
const port = process.env.PORT || 8080;

// Spotify web api credentials
let my_client_id = process.env.CLIENT_ID;
let clientSecret = process.env.CLIENT_SECRET;
let redirectUri = process.env.REDIRECT_URI;

// global var to store access token
global._token = '';

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session. Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing. However, since this example does not
//   have a database of user records, the complete spotify profile is serialized
//   and deserialized.
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

//   Use the SpotifyStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, expires_in
//   and spotify profile), and invoke a callback with a user object.
passport.use(
  new SpotifyStrategy({
      clientID: my_client_id,
      clientSecret: clientSecret,
      callbackURL: redirectUri,
    },
    function (accessToken, refreshToken, expires_in, profile, done) {
      // asynchronous verification, for effect...
      _token = accessToken;
      process.nextTick(function () {
        // To keep the example simple, the user's spotify profile is returned to
        // represent the logged-in user. In a typical application, you would want
        // to associate the spotify account with a user record in your database,
        // and return that user instead.
        return done(null, profile);
      });
    }
  )
);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions (recommended).
app.use(passport.initialize());
app.use(passport.session());

// index page
app.get('/', function (req, res) {
  if (req.cookies['_token']) {
    res.redirect('/account');
  } else {
    res.render('login');
  }

});


// GET /auth/spotify
//   Use passport.authenticate() as route middleware to authenticate the
//   request. The first step in spotify authentication will involve redirecting
//   the user to spotify.com. After authorization, spotify will redirect the user
//   back to this application at /auth/spotify/callback
app.get(
  '/auth/spotify',
  passport.authenticate('spotify', {
    scope: ['user-library-read user-read-private user-read-email user-read-recently-played user-top-read user-follow-read playlist-read-private playlist-read-collaborative'],
    showDialog: true
  }),
  function (req, res) {
    // The request will be redirected to spotify for authentication, so this
    // function will not be called.
  }
);

// GET /auth/spotify/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request. If authentication fails, the user will be redirected back to the
//   login page. Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get(
  '/callback',
  passport.authenticate('spotify', {
    failureRedirect: '/'
  }),
  function (req, res) {
    res.cookie('_token', _token);
    res.redirect('/account');
  }
);

app.get('/logout', function (req, res) {
  req.logout();
  res.clearCookie('_token');
  res.redirect('/');
});

// Home page when user is auth
app.get('/account', ensureAuthenticated, (req, res) => {
  var config = {
    headers: {
      'Authorization': "Bearer " + req.cookies['_token']
    }
  };

  // Get user's 'following' count
  axios.get(
    'https://api.spotify.com/v1/me/following?type=artist',
    config
  ).then((response) => {

    // Get user's 'following' count
    var followingCount = response.data.artists.total;

    axios.get(
      'https://api.spotify.com/v1/me/tracks',
      config
    ).then((response) => {

      // Get user's 'fav tracks' count
      var favTracksCount = response.data.total;

      //Send data to the 'index.ejs' view
      res.render('index', {
        user: req.user,
        followingCount,
        favTracksCount
      });

    }).catch((error) => {
      console.log(error);
      res.redirect('/error');
    });

  }).catch((error) => {
    console.log(error);
    res.redirect('/error');
  });
});

// Get signed in user top tracks
app.get('/topTracks', ensureAuthenticated, (req, res) => {

  var config = {
    headers: {
      'Authorization': "Bearer " + req.cookies['_token']
    }
  };
  axios.get(
    'https://api.spotify.com/v1/me/top/tracks?limit=10',
    config
  ).then((response) => {
    var topTracks = response.data.items;
    res.render('topTracks', {
      topTracks,
    });
  }).catch((error) => {
    console.log(error);
    res.redirect('/error');
  });
});

// Get signed in user top artists
app.get('/topArtists', (req, res) => {

  var config = {
    headers: {
      'Authorization': "Bearer " + req.cookies['_token']
    }
  };
  axios.get(
    'https://api.spotify.com/v1/me/top/artists?limit=10',
    config
  ).then((response) => {
    var topArtists = response.data.items;
    res.render('topArtists', {
      topArtists
    });
  }).catch((error) => {
    console.log(error);
    res.redirect('/error');
  });
});


app.get('/error', (req, res) => {
  res.render('error');
});


function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  req.logout();
  res.clearCookie('_token');
  res.redirect('/');
}

app.listen(port);
console.log('Listening on port ' + port);