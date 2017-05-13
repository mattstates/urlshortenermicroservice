const express = require('express');
const app = express();
const path = require('path');
const port = process.env.port || 3000;
if (!process.env.port) require('./env.js');


///// Database and Schema /////
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database is connected.');
});

const ShortSchema = mongoose.Schema({
    fullLink: {
        type: String,
        lowercase: true
    },
    shortLink: {
        type: String,
        lowercase: true
    }
});

const Link = mongoose.model('Link', ShortSchema);

///// Middleware /////
app.use(express.static(path.join(__dirname, 'public')));

///// Routes /////

// Home Page //
app.get('/', (req, res) => {
    res.sendFile('./public.index.html')
})

// Link Creation //
// Any route that follows this pattern, "/new/http(s)://" ~ will be used to save a link.
app.get(/^\/new\/https?:\/\//, (req, res) => {
    // TODO: Add a check to dedup URLS that alread exist and send the existing redirect.
    const originalUrl = req.path.substr(5);
    const shortenedUrl = 'http://' + req.hostname;

    Link.find().then(function(collection) {
        const index = collection.length;
        const shortLink = new Link({
            fullLink: originalUrl,
            shortLink: shortenedUrl + '/sh/' + index
        });

        shortLink.save().then(function() {
            res.json({
                fullLink: originalUrl,
                shortLink: shortenedUrl + '/sh/' + index
            });
        });
    })
});

// Link Redirect //
app.get('/sh/:urlId', (req, res) => {
    // Match entries where the shortLink ends with "/sh/" + someNumbers.
    const urlFinder = new RegExp('/sh/'+req.params.urlId +'$', 'i')
    Link.findOne({
        shortLink: urlFinder
    }).then(function(collection) {
        res.redirect(collection.fullLink)
    });
});

///// Server Start /////
app.listen(port, () => {
    console.log('listening on port ' + port)
});