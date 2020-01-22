const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
var express = require('express');
var app = express();

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), getSpreadsheetData);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

// List of motivational phrases
var motivationalPhrases = [];
// List of Words of the Day
var words = [];
// List of Images
var images = [];

/**
 * Get Spreadsheetdata to be shown on TV
 * @see https://docs.google.com/spreadsheets/d/1ruw-TZyJl7Cu_RuJkrVeArbGMHFi6dU45EDGDDBbMHY/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function getSpreadsheetData(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: '1ruw-TZyJl7Cu_RuJkrVeArbGMHFi6dU45EDGDDBbMHY',
    range: 'Phrases!A:A',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    motivationalPhrases = res.data.values;
    if (motivationalPhrases.length) {
      console.log('Showing phrases!');
    } else {
      console.log('No data found.');
    }
  });

  sheets.spreadsheets.values.get({
    spreadsheetId: '1ruw-TZyJl7Cu_RuJkrVeArbGMHFi6dU45EDGDDBbMHY',
    range: 'Words!A:B',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    words = res.data.values;
    if (words.length) {
      console.log('Showing words!');
    } else {
      console.log('No data found.');
    }
  });

  sheets.spreadsheets.values.get({
    spreadsheetId: '1ruw-TZyJl7Cu_RuJkrVeArbGMHFi6dU45EDGDDBbMHY',
    range: 'Images!A:A',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    images = res.data.values;
    if (images.length) {
      console.log('Showing images!');
    } else {
      console.log('No data found.');
    }
  });
}

const css = 'position: absolute;' +
'top: 50%;' +
'left: 50%;' +
'-moz-transform: translateX(-50%) translateY(-50%);' +
'-webkit-transform: translateX(-50%) translateY(-50%);';

const imagecentercss = 'display: block;' +
  'margin-left: auto;' +
  'margin-right: auto;' +
  'width: 30%; ' +
  'height: 30%; ';

var phraseIndex = 1;
app.get('/motivationalphrase', function (req, res) {

    var text = '<!DOCTYPE html><html><body><h1 style="'+css+'">'+`${motivationalPhrases[phraseIndex]}`+'</h1></body></html>';
    res.send(text);
    if (phraseIndex == motivationalPhrases.length-1) {
      phraseIndex = 1;
    } else {
      phraseIndex++;
    }
  });

  var wordIndex = 1;
  app.get('/wordoftheday', function (req, res) {
    var arr = `${words[wordIndex]}`.split(",");
    var text = '<!DOCTYPE html><html><body><h1 style="'+ css +'"><span style="color:blue">' + arr[0] + ': </span>' + arr[1] + '</h1></body></html>';
    res.send(text);
    if (wordIndex == words.length-1) {
      wordIndex = 1;
    } else {
      wordIndex++;
    }
  });

  var imageIndex = 1;
  app.get('/image', function (req, res) {
    var text = '<!DOCTYPE html><html><body><img style="'+imagecentercss+'" src=" '+ `${images[imageIndex]}` +'"></img></body></html>';
    res.send(text);
    if (imageIndex == images.length-1) {
      imageIndex = 1;
    } else {
      imageIndex++;
    }
  });

  app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
  });