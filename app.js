'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const fs = require('fs');
const readline = require('readline');
const uuidv4 = require('uuid/v4');
var cors = require('cors');

const journal = 'data/events.txt';
const port = 3000;

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Static content
app.use(express.static('public'));

// Add CORS header
app.use(cors());

// Router for /api
// get an instance of the express Router
let router = express.Router();

let aggregates = {};

// Read the events from the file
var rd = readline.createInterface({
    input: fs.createReadStream(journal),
    output: process.stdout,
    console: false
});

// Replay events at startup to get the balances of the accounts
rd.on('line', function(line) {
    processEvent(JSON.parse(line));
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});

function getProperies(object, callback) {
    for (var property in object) {
        if (object.hasOwnProperty(property)) {
            callback(property);
        }
    }
}

router.get('/v1/:entity', function(req, res) {
    if (aggregates[req.params.entity] != null) {
        // return the objects that match with the supplied query parameters if there are any
        res.json(aggregates[req.params.entity].filter(e => {
            let match = true;
            getProperies(req.query, (property) => {
                if (req.query[property] != e[property]) {
                    match = false;
                }
            });

            return match;
        }));
        return;
    }

    // Not found, send 404
    res.sendStatus(404);
});

router.get('/v1/:entity/:id', function(req, res) {
    if (aggregates[req.params.entity] != null) {
        let result = aggregates[req.params.entity].find(a => a.id === req.params.id)
        if (result !== undefined) {
            res.json(result);
            return;
        }
    }

    // Not found, send 404
    res.sendStatus(404);
});

router.post('/v1/:entity', function(req, res) {
    console.log(`Received Entity: '${req.params.entity}' JSON: '${req.body}'`);

    processCommand({
        entity: req.params.entity,
        event: 'create',
        payload: req.body
    });

    res.sendStatus(202);
});


router.put('/v1/:entity/:id', function(req, res) {
    console.log(`Received Entity: '${req.params.entity}' JSON: '${req.body}'`);

    if (aggregates[req.params.entity] != null &&
        aggregates[req.params.entity].find(a => a.id === req.params.id) !== undefined) {

        processCommand({
            entity: req.params.entity,
            event: 'update',
            payload: Object.assign(req.body, { id: req.params.id })
        });

        res.sendStatus(202);
    } else {
        // Not found, send 404
        res.sendStatus(404);
    }
});

router.patch('/v1/:entity/:id', function(req, res) {
    console.log(`Received Entity: '${req.params.entity}' JSON: '${req.body}'`);

    if (aggregates[req.params.entity] != null &&
        aggregates[req.params.entity].find(a => a.id === req.params.id) !== undefined) {

        processCommand({
            entity: req.params.entity,
            event: 'patch',
            payload: Object.assign(req.body, { id: req.params.id })
        });

        res.sendStatus(202);
    } else {
        // Not found, send 404
        res.sendStatus(404);
    }
});

router.delete('/v1/:entity/:id', function(req, res) {
    console.log(`Received Entity: '${req.params.entity}' Delete`);

    if (aggregates[req.params.entity] != null &&
        aggregates[req.params.entity].find(a => a.id === req.params.id) !== undefined) {

        processCommand({
            entity: req.params.entity,
            event: 'delete',
            payload: { id: req.params.id }
        });

        res.sendStatus(202);
    } else {
        // Not found, send 404
        res.sendStatus(404);
    }
});

// more routes for our API will happen here

// all of our routes will be prefixed with /api
app.use('/api', router);

// Start the server
app.listen(port);

console.log('Application is running on ' + port);

function processCommand(command) {
    let event = command;
    event.timestamp = new Date();

    event.id = uuidv4();

    // Add an entity id in case of a create
    if (event.event === 'create') {
        event.payload.id = uuidv4();
    }

    // Store event
    // These two methods should be refactored to a pub/sub mechanism for larger applications
    fs.appendFileSync(journal, JSON.stringify(event) + "\n");

    // Update the account information
    processEvent(event);
}

function processEvent(event) {
    switch (event.event) {
        case 'create':
            if (!aggregates[event.entity]) {
                aggregates[event.entity] = []
            }
            aggregates[event.entity].push(event.payload);
            break;
        case 'update':
            if (aggregates[event.entity]) {
                let itemIndex = aggregates[event.entity].findIndex(e => e.id === event.payload.id);
                if (itemIndex > -1) {
                    aggregates[event.entity][itemIndex] =
                        aggregates[event.entity][itemIndex] = event.payload;
                }
            }
            break;
        case 'patch':
            if (aggregates[event.entity]) {
                let itemIndex = aggregates[event.entity].findIndex(e => e.id === event.payload.id);
                if (itemIndex > -1) {
                    aggregates[event.entity][itemIndex] =
                        Object.assign(aggregates[event.entity][itemIndex], event.payload);
                }
            }
            break;
        case 'delete':
            if (aggregates[event.entity]) {
                let itemIndex = aggregates[event.entity].findIndex(e => e.id === event.payload.id);
                if (itemIndex > -1) {
                    aggregates[event.entity].splice(itemIndex, 1);
                }
            }
            break;
    }
}