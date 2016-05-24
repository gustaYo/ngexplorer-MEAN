// Required Modules
var express = require("express");
var morgan = require("morgan");
var bodyParser = require('body-parser');
//var compression = require('compression');

var jwt = require("jsonwebtoken");
var mongoose = require("mongoose");
var bcrypt = require('bcrypt-nodejs');
var app = express();
var config = require('./config.js');
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
//app.use(morgan("dev"));
var http = require("http");
// add https server
var selfSignedHttps = require('self-signed-https');
var forceSsl = require('force-ssl');

/*cosas generales*/
var
        // Local ip address that we're trying to calculate
        address
        // Provides a few basic operating-system related utility functions (built-in)
        , os = require('os')
        // Network interfaces
        , ifaces = os.networkInterfaces();
// Iterate over interfaces ...
for (var dev in ifaces) {
    // ... and find the one that matches the criteria
    var iface = ifaces[dev].filter(function(details) {
        return details.family === 'IPv4' && details.internal === false;
    });

    if (iface.length > 0)
        address = iface[0].address;
}
if (typeof address == 'undefined') {
    address = '127.0.0.1';
}
// Set view engine
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
// Setting the app router and static folder
//app.use(compression());
var oneYear = 365 * 86400000;
app.use(express.static(__dirname + '/public', {maxAge: oneYear}));
console.log(__dirname + '/public');
app.set('ipaddr', address);
app.set('port', config.porthttp);

app.use(bodyParser.json({limit: '700mb'}));
app.use(bodyParser.urlencoded({limit: '700mb', extended: true}));
process.on('uncaughtException', function(err) {
    console.log(err);
});
// Start Express http server on port 
var webServer = http.createServer(app).listen(config.porthttp);
//force https server
//var httpsForce = selfSignedHttps(app).listen(config.porthttps); // https on port 3001
//forceSsl.https_port = config.porthttps; // specify that https is running on port 3001
//app.use(forceSsl);

// Configure routing
require('./routers')(app, express);
// Tell developer about it
console.log('Server running at http://' + app.get('ipaddr') + ':' + app.get('port'));
