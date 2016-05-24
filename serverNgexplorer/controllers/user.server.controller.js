
var jwt = require("jsonwebtoken");
var bcrypt = require('bcrypt-nodejs');
var moment = require('moment');
var async = require('async');
var mongoose = require('mongoose');
var User = mongoose.model('users');
var Logs = mongoose.model('logs');
var FtpFiles = mongoose.model('ftpfiles');

exports.authenticate = function(req, res) {
    User.findOne({username: req.body.username}, function(err, user) {
        if (err) {
            res.send(500, 'internal_server_error');
        } else {
            if (user) {
                if (bcrypt.compareSync(req.body.password, user.password)) {
                    var token = generaTokenUser(user._id, req);
                    res.json({
                        type: true,
                        data: user,
                        token: token
                    });
                } else {
                    res.send(500, 'passw_incorrect');
                }
            } else {
                res.send(500, 'user_not_found');
            }
        }
    });
}

exports.signin = function(req, res) {
    var data = req.body;
    if (data._id) {
        // editando usuario
        var id = data._id;
        delete data['_id'];
        // actualizando nuevo pass el usuario admin agrego al formulario editar la contrasenna
        if (data.password !== "") {
            data.password = bcrypt.hashSync(data.password);
        } else {
            delete data['password'];
        }
        User.update(
                {_id: id},
        {$set: data
        }, function(err, user) {
            if (err) {
                return res.send(500, err.message);
            } else {
                res.status(200).jsonp('ok');
            }
        });
    } else {
//Adicionando usuario 
        User.findOne({username: data.username}, function(err, user) {
            if (err) {
                console.log('error')
                res.send(500, 'internal_server_error');
            } else {
                if (user) {
                    console.log('error')
                    res.send(500, 'user_exists');
                } else {
                    console.log(data)
                    var userModel = new User(data);
                    userModel.email = data.email;
                    userModel.password = bcrypt.hashSync(data.password);
                    userModel.save(function(err, user) {
                        res.json({
                            type: true,
                            data: user,
                            token: generaTokenUser(user._id, req)
                        });
                    });
                }
            }
        });
    }
}
var generaTokenUser = function(id_user, req) {
    var newToken = {
        id_user: id_user,
        iat: moment().unix(),
        exp: moment().add(3, "days").unix(),
        host: requestIp.getClientIp(req)
    };
    return jwt.sign(newToken, 'ultrsddsdasdasdasdasdas');
}
exports.UserAccess = function(perm) {
    return function(req, res, next) {
        var bearerToken;
        var bearerHeader = req.headers["authorization"];
        if (typeof bearerHeader !== 'undefined') {
            var bearer = bearerHeader.split(" ");
            bearerToken = bearer[1];
            var token = jwt.decode(bearerToken, {complete: true});
            //verificando validez del token en el tiempo
            if ((token.exp <= moment().unix())) {
                res.send(403);
            } else {
                //verificando mismo host de usuario
                if (token.host !== requestIp.getClientIp(req)) {
                    res.send(403);
                } else {
                    // asegurando permiso de usuario en servidor
                    User.findOne({_id: token.id_user, role: perm}, function(err, user) {
                        if (user) {
                            next();
                        } else {
                            res.send(403);
                        }
                    });
                }
            }
        } else {
            return res.send(403);
        }
    }
}
var requestIp = require('request-ip');
var TotalVisitas = function(next) {
    var today = moment().startOf('day')
    var tomorrow = moment(today).add(1, 'days')
    // an example using an object instead of an array
    async.parallel({
        allTotal: function(callback) {
            Logs.count({type: 'v'}, function(err, count) {
                callback(null, count);
            })
        },
        allUnique: function(callback) {
            Logs.collection.distinct("ip", {type: 'v'}, function(error, results) {
                callback(null, results.length);
            })
        },
        todayTotal: function(callback) {
            Logs.count({
                type: 'v',
                created: {
                    $gte: today.toDate(),
                    $lt: tomorrow.toDate()
                }
            }, function(err, count) {
                callback(null, count);
            })
        },
        todayUnique: function(callback) {
            Logs.collection.distinct("ip", {
                type: 'v',
                created: {
                    $gte: today.toDate(),
                    $lt: tomorrow.toDate()
                }
            }, function(error, results) {
                callback(null, results.length);
            })
        },
    },
            next);
}
var saveLog = function(log, next) {
    // los log de usuario de filtro y visita son validos cada tm minutos
    var tm = 15;
    var now = moment();
    var past = moment(now).subtract(tm, 'm');
    var query = {
        ip: log.ip,
        created: {
            $gte: past.toDate(),
            $lt: now.toDate()
        },
        type: log.type
    };
    if (log.type === 'f') {
        query.search = log.search;
    }
    Logs.count(query, function(err, count) {
        if (count === 0) {
            var logModel = new Logs(log);
            logModel.save(function(err, h) {
                next();
            });
        }
        next();
    });
}

exports.contadorVisit = function(req, res) {
    var clientIp = requestIp.getClientIp(req);
    console.log("new conection from", clientIp);
    var data = req.body;
    data.ip = clientIp;
    saveLog(data, function() {
        TotalVisitas(
                function(err, results) {
                    return res.status(200).jsonp(results);
                });
    })
}
exports.getStadist = function(req, res) {
    var today = moment().startOf('day')
    var tomorrow = moment(today).add(1, 'days');
    async.parallel({
        allTotal: function(callback) {
            Logs.count({type: 'v'}, function(err, count) {
                callback(null, count);
            })
        },
        allUnique: function(callback) {
            Logs.collection.distinct("ip", {type: 'v'}, function(error, results) {
                callback(null, results.length);
            })
        },
        todayTotal: function(callback) {
            Logs.count({
                type: 'v',
                created: {
                    $gte: today.toDate(),
                    $lt: tomorrow.toDate()
                }
            }, function(err, count) {
                callback(null, count);
            })
        },
        todayUnique: function(callback) {
            Logs.collection.distinct("ip", {
                type: 'v',
                created: {
                    $gte: today.toDate(),
                    $lt: tomorrow.toDate()
                }
            }, function(error, results) {
                callback(null, results.length);
            })
        },
        TotalFiles: function(callback) {
            FtpFiles.count({}, function(err, count) {
                callback(null, count);
            });
        },
        TotalFilters: function(callback) {
            Logs.count({type: 'f'}, function(err, count) {
                callback(null, count);
            })
        },
        naveTop: function(callback) {
            foundTop('v', "$browser", callback)
        },
        osTop: function(callback) {
            foundTop('v', "$os", callback)
        },
        ipTop: function(callback) {
            foundTop('v', "$ip", callback)
        },
        wordSearchTop: function(callback) {
            foundTop('f', "$search", callback)
        }
    },
    function(err, results) {
        console.log(results)
        res.status(200).jsonp(results);
    });
}
var foundTop = function(type, group, next) {
    Logs.aggregate(
            {
                $match: {
                    type: type
                }
            },
    {
        $group: {_id: group, cantpost: {$sum: 1}},
    },
            {
                $sort: {cantpost: -1}
            },
    {
        $limit: 3
    }
    , function(err, result) {
        if (err) {
            next(err)
        }
        else {
            next(null, result)
        }
    });
}


var InstallInit = function() {
    setTimeout(function() {
        User.count({}, function(err, count) {
            if (count == 0) {
                console.log('instalando usuario root')
                // install user root admin
                var data = {
                    username: 'admin',
                    password: 'admin',
                    email: 'admin@uci.cu',
                    fistlastname: 'crespo',
                    secondlastname: 'sanchez',
                    role: 'Admin'
                }
                var userModel = new User(data);
                userModel.password = bcrypt.hashSync(data.password);
                userModel.save(function(err, user) {
                    console.log(user);
                })
            }
        })
        TotalVisitas(
                function(err, results) {
                    console.log(results)
                });
    }, 3000);
}
InstallInit();


