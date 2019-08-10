const express = require('express');
const app = express();
const path = require('path');
const request = require('request');
const SpotifyWebApi = require('spotify-web-api-node');
const cookieParser = require('cookie-parser');
const querystring = require('querystring');
const axios = require('axios');
require('dotenv').config()

//Listening PORT
const port = process.env.PORT || 8080;

// Spotify web api credentials
let my_client_id = process.env.CLIENT_ID;
let clientSecret = process.env.CLIENT_SECRET;
let redirectUri = process.env.REDIRECT_URI;

var spotifyApi = new SpotifyWebApi({
  clientId: my_client_id,
  clientSecret: clientSecret,
  redirectUri: redirectUri,
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// index page
app.get('/', function(req, res) {
  if (!spotifyApi.getAccessToken()) {
    res.render('login');
  } else {
    res.redirect('/home');
  }
});

// Home page when user is auth
app.get('/home', (req, res) => {
  if(!spotifyApi.getAccessToken()) {
    res.render('login');
  }else{
    // Get signed in user data
    spotifyApi.getMe()
    .then(function(data) {
      var display_name = data.body.display_name;
      var user_profile_picture = data.body.images[0].url;
      var user_country = data.body.country;
      var user_id = data.body.id;
      var user_sub = data.body.product;
      var user_followers_count = data.body.followers.total;
      // Get signed in user followed artists
      spotifyApi.getFollowedArtists()
      .then(function(data) {
        var user_following_count = data.body.artists.total;
           // Get signed in user playlists
          spotifyApi.getUserPlaylists()
          .then(function(data) {
            var user_playlists_count = data.body.total;
            // Get signed in user tracks
            spotifyApi.getMySavedTracks()
            .then(function(data) {
              var user_fav_tracks_count = data.body.total;
              res.render('index', {display_name, user_profile_picture, user_country, user_id, user_sub, user_followers_count, user_following_count, user_playlists_count, user_fav_tracks_count});
            }, function(err) {
              console.log('Something went wrong!', err);
            });
            
          },function(err) {
            console.log('Something went wrong!', err);
          });
        
      }, function(err) {
        console.log('Something went wrong!', err);
      });

    }, function(err) {
      console.log('Something went wrong!', err);
    });
  }
});

// Get signed in user top tracks
app.get('/topTracks', (req, res) => {
  // Check if there is no access token then make the user login first
  if(!spotifyApi.getAccessToken()) {
    res.render('login');
  }else{
    var config = {headers: {'Authorization': "Bearer " + spotifyApi.getAccessToken()}};
    axios.get( 
      'https://api.spotify.com/v1/me/top/tracks?limit=10',
      config
    ).then((response) => {
      var topTracks = response.data.items;
      res.render('topTracks', {topTracks});
    }).catch((error) => {
      console.log(error)
    });
  }
});

// Get signed in user top artists
app.get('/topArtists', (req, res) => {
  // Check if there is no access token then make the user login first
  if(!spotifyApi.getAccessToken()) {
    res.render('login');
  }else{
    var config = {headers: {'Authorization': "Bearer " + spotifyApi.getAccessToken()}};
    axios.get( 
      'https://api.spotify.com/v1/me/top/artists?limit=10',
      config
    ).then((response) => {
      var topArtists = response.data.items;
      res.render('topArtists', {topArtists});
    }).catch((error) => {
      console.log(error)
    });
  }
});

// callback 
app.get('/callback', function(req, res) {
  const code = req.query.code || null;
    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      },
      headers: {
        Authorization: `Basic ${new Buffer.from(`${my_client_id}:${clientSecret}`).toString('base64')}`,
      },
      json: true,
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        const access_token = body.access_token;
        // const refresh_token = body.refresh_token;
        spotifyApi.setAccessToken(access_token);
        // we can also pass the token to the browser to make requests from there
        res.redirect('/home');
      } else {
        res.redirect(`/error/#${querystring.stringify({ error: 'invalid_token' })}`);
      }
    });
});

// login
app.get('/login', function(req, res) {

// your application requests authorization
const scopes = 'user-library-read user-read-private user-read-email user-read-recently-played user-top-read user-follow-read playlist-read-private playlist-read-collaborative';

res.redirect('https://accounts.spotify.com/authorize' +
  '?response_type=code' +
  '&client_id=' + my_client_id +
  (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
  '&redirect_uri=' + encodeURIComponent(redirectUri));
});

// Logout
app.get('/logout', (req, res) => {
  spotifyApi.resetCredentials();
  res.redirect('/');
});

app.listen(port);
console.log('Listening on port ' + port);
