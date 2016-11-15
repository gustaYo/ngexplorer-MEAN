

module.exports = function(app, express) {
    var controllers = require('../controllers');
    app.route('/angular').get(function(req, res) {
        res.render('index');
    });
// vue client
app.route('/vue').get(function(req, res) {
    res.render('vueindex');
});
app.route('/vueq').get(function(req, res) {
    res.render('vueqindex');
});
// react client
app.route('/').get(function(req, res) {
    
    controllers.user.contadorVisitServer(req,function(stadist){
        console.log(stadist)
    })
res.redirect('/vueq');
    //res.render('reactindex');
});
app.route('/list').get(function(req, res) {
res.redirect('/vue');

/*
    controllers.user.contadorVisitServer(req,function(stadist){
        console.log(stadist)
    })

    res.render('reactindex');

    */
});
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,POST,PUT,DELETE');
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    if ('OPTIONS' == req.method) {
        return res.sendStatus(200);
    }
    next();
});
var fs = require('fs')
var walk = function(path) {
    fs.readdirSync(path).forEach(function(file) {
        var newPath = path + '/' + file;
        var stat = fs.statSync(newPath);
        if (stat.isFile()) {
            if (/(.*)\.(js|coffee)/.test(file)) {
                if (file != 'index.js') {
                    require(newPath)(app, express, controllers);
                }
            }
        } else if (stat.isDirectory()) {
                // walk(newPath);
            }
        });
};
var models_path = __dirname;
walk(models_path);
};


