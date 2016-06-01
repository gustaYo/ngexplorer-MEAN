
var mongoose = require('mongoose');
var Ftp = mongoose.model('ftps');
var FtpFiles = mongoose.model('ftpfiles');
var Logs = mongoose.model('logs');
var async = require('async');
var path = require('path');
var config = require('../config.js');
var cheerio = require('cheerio');
var request = require("request");
var moment = require('moment');
var paso = 500;
var useElastic = config.elasticsearch.use;
var elastic = {}
if (useElastic) {
    elastic = require('./util/elasticSearch.js');
}
exports.AddFtpServer = function(req, res) {
    var data = req.body;
    if (data._id) {
        // editar
        var id = data._id;
        delete data['_id'];
        Ftp.update(
                {_id: id},
        {$set: data
        }, function(err) {
            if (err)
                return res.send(500, err.message);
            else
                res.status(200).jsonp('ok');
        });
    } else {
        //insertar
        var ftp = new Ftp(data);
        ftp.save(function(err, newftp) {
            if (err) {
                return res.send(500, err.message);
            } else {
                res.status(200).jsonp(newftp);
            }
        });
    }
}
exports.GetFtpsProveedores = function(req, res) {
    Ftp.find(function(err, ftps) {
        if (err)
            res.send(500, err.message);
        res.status(200).send(ftps);
    });
};
exports.SincronizeServerProve = function(req, res) {
    var parms = req.query;
    if (parms.action === 'found') {
        Ftp.findOne({
            uri: parms.uri,
            dirscan: parms.dirscan
        }, function(err, ftp) {
            if (err) {
                res.send(500, err.message);
            } else {
                // contar la cantidad de archivos
                FtpFiles.count({ftp: ftp._id}, function(err, count) {
                    res.status(200).send({ftp: ftp, numFiles: count});
                });
            }
        });
    }
    if (parms.action === 'getfiles') {
        var perPage = 530;
        FtpFiles.find({
            ftp: parms.idprove
        })
                .select('-_id')
                .limit(parms.perPage)
                .skip(parms.perPage * parms.page)
                .exec(function(err, files) {
                    res.status(200).send(files);
                });
    }
}

exports.AddFileToServerProve = function(req, res) {
    var parms = req.body;
    if (parms.action === 'insert') {
        var insert = new Array();
        for (var i in parms.files) {
            insert.push(new FtpFiles(parms.files[i]));
        }
        async.mapLimit(insert, 10, function(document, next) {
            document.save(next);
        }, function() {
            res.status(200).send('ok');
        });
    }
    if (parms.action === 'finish') {
        console.log('eliminar archivos')
        deleteDocumentFiles(parms.idNew, function(error) {
            if (error) {
                return res.send(500, error.message);
            } else {
                // actulizar nuevos idenficadores                
                FtpFiles
                        .update(
                                {ftp: parms.idOld},
                        {$set: {
                                ftp: parms.idNew
                            }
                        },
                        {multi: true},
                        function(err) {
                            if (err) {
                                return res.send(500, err.message);
                            }
                            else {
                                if (useElastic) {
                                    sincroniceProveMongoFilesElasticSearch(parms.idNew);
                                }
                                res.status(200).jsonp('ok');
                            }
                        });
            }
        });
    }
}
var saveLog = function(log) {
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
            logModel.save();
        }
    });
}
/**
 * GetFtps
 */
exports.GetFtpsFiles = function(req, res) {
    var parms = req.body;
    if (typeof parms.type !== 'undefined') {
        parms.name = parms.name || "";
//        // para cuando upgradee el mongodb >2.6
//        FtpFiles.find({$text: {$search: "angular"}})
//                .limit(20)
//                .exec(function(err, items) {
//                    console.log("items", items);
//                });

        if (useElastic) {
            elastic.elasticFind(parms, function(e, r) {
                if (typeof parms.name !== 'undefined' && parms.name !== '') {
                    saveLog({
                        type: 'f',
                        search: parms.name
                    });
                }
                var retorn = new Array();
                if (r.hits.total > 0) {
                    var hist = r.hits.hits;
                    for (var i in hist) {
                        retorn.push(hist[i]._source);
                    }
                }
                return   res.status(200).send(retorn);
            });
        } else {
            var query = {name: new RegExp(encodeURIComponent(parms.name), "i"), "ftp": {$in: parms.ftps}};
            if (typeof parms.extname !== 'undefined' && parms.extname !== '') {
                query.extname = new RegExp(parms.extname, "i");
            }
            FtpFiles.find(query)
                    .limit(50)
                    .exec(function(err, filesftps) {
                        if (err)
                            res.send(500, err.message);
                        if (typeof parms.name !== 'undefined' && parms.name !== '') {
                            saveLog({
                                type: 'f',
                                search: parms.name
                            });
                        }
                        res.status(200).send(filesftps);
                    });
        }
    } else {
        // listar directorio
        if (useElastic) {
            elastic.elasticListDir(parms, function(rr) {
                res.status(200).send(rr);
            })
        } else {
            FtpFiles.find(parms)
                    .sort({name: -1})
                    .exec(function(err, filesftps) {
                        if (err)
                            res.send(500, err.message);
                        res.status(200).send(filesftps);
                    });
        }
    }
}

/**
 * CountFtpsFiles
 */
exports.CountFtpsFiles = function(req, res) {
    var ftps = req.body;
    FtpFiles.count({}, function(err, allFiles) {
        FtpFiles.count({"ftp": {$in: ftps}}, function(err, count) {
            var retorn = {
                countAll: allFiles,
                ftpsFilesSelect: count
            }
            res.status(200).send(retorn);
        });
    });
}
/**
 * CountFtpsFiles
 */
exports.getSizeFolder = function(req, res) {
    var parms = req.query;
    if (useElastic) {
        elastic.getSizeFolder(parms, function(result) {
            res.status(200).send(result);
        })
    } else {
        var join = parms.directory === '/' ? '' : '/';
        var query = {ftp: parms.ftp, directory: new RegExp('^' + parms.directory + join + parms.name + '.*$', "i"), extname: {$exists: true}};
        FtpFiles.find(query, {size: 1, extname: 1, time: 1})
                .sort({time: -1})
                .exec(function(err, files) {
                    var lastUpdate = "";
                    var pesa = 0;
                    if (files.length > 0) {
                        lastUpdate = files[0].time;
                    }
                    for (var file in files) {
                        var num = isNaN(parseInt(files[file].size)) ? 0 : parseInt(files[file].size);
                        pesa = pesa + num;
                    }

                    FtpFiles.update(
                            {_id: parms._id},
                    {$set: {
                            size: pesa,
                            time: lastUpdate
                        }
                    }, function(err) {
                        res.status(200).jsonp(pesa);
                    });
                });
    }
}
/**
 * DeleteFTP
 */
exports.DeleteFTP = function(req, res) {
    var ids = JSON.parse(req.params.parms);
    Ftp.remove({_id: {$in: ids}}, function(error) {
        if (error) {
            return res.send(500, error.message);
        } else {
            FtpFiles.remove({ftp: {$in: ids}}, function(error) {
                if (error) {
                    return res.send(500, error.message);
                } else {
                    if (useElastic)
                        async.mapLimit(ids, 1, function(server, next) {
                            elastic.elasticDeleteFiles(server, function() {
                                next();
                            });
                        }, function() {
                            console.log("eliminado todos lo dos en el servidor elastic");
                        });
                    res.status(200).jsonp('ok');
                }
            });
        }
    });
}
/**
 * GetFtps
 */

var listProvEscanner = new Array();
var isServerEscanner = function(idServer) {
    var index = listProvEscanner.indexOf(idServer);
    if (index === -1) {
        listProvEscanner.push(idServer);
        return true;
    } else {
        return false;
    }
}
var freeServer = function(idServer) {
    var index = listProvEscanner.indexOf(idServer);
    listProvEscanner.splice(index, 1);
}

exports.ScannerFtpServer = function(req, res) {
    if (isServerEscanner(req.body._idServer)) {
        ScannerProveedor(req.body, function(err) {
            if (err) {
                console.log(err)
                return  res.status(500).send("Ocurrio un error, asegurese de que la direccion del proveedor sea la correcta");
            }
            return  res.status(200).jsonp('ok');
        });
    } else {
        return res.status(500).send("Se esta escaneado, espere...");
    }
}

var deleteDocumentFiles = function(idServer, next) {
    FtpFiles
            .remove({ftp: idServer}, function(error) {
                if (useElastic) {
                    elastic.elasticDeleteFiles(idServer, function() {
                        next();
                    });
                } else {
                    next();
                }
            });
}
/**
 * ScannerFTP
 */
var ScannerProveedor = function(ftp, errorCallback) {
    Ftp.findOne({_id: ftp._idServer})
            .exec(function(err, result) {
                if (ftp.complete === 'no') {
                    // continuar escaneo
                    deleteDocumentFiles(result._id, function() {
                        sincroniceProveMongoFilesElasticSearch(result._id);
                    });
                    errorCallback();
                } else {
                    // Escaneo completo
                    deleteDocumentFiles(result._id, function() {
                        if (result.type == 'ftp') {
                            console.log('Escaneando ftp');
                            return  scannerFTPoneThread(result, errorCallback);
                        } else {
                            console.log('Escaneando http');
                            return  scannerHTTPoneThread(result, ftp.proxy, errorCallback);
                        }
                    });
                }
            });
};

var Client = require('ftp');
var scannerFTPoneThread = function(result, errorCallback) {
    var timeConsult = new Date().getTime();
    var num = 0;
    var folders = new Array();
    // adicionar ruta raiz
    folders.push(result.dirscan);
    var c = new Client();
// connect to localhost:21 as anonymous
    c.connect({
        host: result.uri,
        port: result.port != '' ? result.port : '', // defaults to 21
        user: result.user != '' ? result.user : '', // defaults to "anonymous"
        password: result.pass != '' ? result.pass : '',
    });
    var files_scanner = new Array();
    c.on('ready', function() {
        errorCallback();
        var exploreFolder = function() {
            if (folders.length !== 0) {
                var url = folders[0];
                c.list(url, function(err, list) {
                    if (err) {
                        console.log(err);
                    } else {
                        list.forEach(function(file) {
                            var name = "";
                            try {
                                // If the string is UTF-8, this will work and not throw an error.
                                name = decodeURIComponent(escape(file.name));
                            } catch (e) {
                                // If it isn't, an error will be thrown, and we can asume that we have an ISO string.
                                name = file.name;
                            }
                            if (file.type !== 'd') {
                                var newFile = {
                                    name: encodeURIComponent(name),
                                    extname: path.extname(name),
                                    directory: url,
                                    ftp: result._id,
                                    size: file.size,
                                    time: new Date(file.date).getTime()
                                };
                                files_scanner.push(newFile);
                                num++;
                            } else {
                                var join = "/";
                                if (url === '/') {
                                    join = '';
                                }
                                var newPaht = url + join + name;
                                var carpeta = {
                                    directory: url,
                                    name: name,
                                    ftp: result._id,
                                }
                                files_scanner.push(carpeta);
                                folders.push(newPaht);
                            }
                        });
                    }
                    // eliminar directorio de arreglo
                    folders.splice(0, 1);
                    // busca en la proxima carpeta
                    console.log(result.uri + url + " escaneado");
                    console.log("restan " + folders.length);
                    if (files_scanner.length > paso) {
                        insertDocumentFile(files_scanner, function() {
                            files_scanner = new Array();
                            exploreFolder();
                        })
                    } else {
                        exploreFolder();
                    }
                });

            } else {
                if (files_scanner.length > 0) {
                    console.log("Quedaron archivos");
                    insertDocumentFile(files_scanner, function() {
                        files_scanner = new Array();
                    });
                }
                c.end();
                if (useElastic) {
                    sincroniceProveMongoFilesElasticSearch(result._id)
                }
                // desbloquear servidor para que pueda ser escaneado
                freeServer(result._id);
                var demoro = new Date().getTime() - timeConsult;
                demoro = demoro / 1000;
                console.log('escaneado en ', demoro);
            }
        }
        exploreFolder();
    });
}
var insertDocumentFile = function(files_scanner, next) {
    FtpFiles.collection.insert(files_scanner, function(callback) {
        next();
    });
}
var sincroniceProveMongoFilesElasticSearch = function(idServer) {
    // obtener todos los archivos del ftp proveedor
    var numFiles = 0;
    elastic.elasticCountFiles(function(num) {
        numFiles = num;
        FtpFiles.count({ftp: idServer}, function(err, count) {
            var numFilesTotales = count;
            console.log("sincronizando collection con elasticSearch index", count)
            var perPage = 5000;
            var skip = 0;
            var page = 1;
            var __t;
            var recurInsertBulk = function() {
                clearTimeout(__t);
                // ver si no hay otra operacion de insertar
                elastic.elasticCountFiles(function(num) {
                    if (num > numFiles) {
                        numFiles = num;
                        __t = setTimeout(function() {
                            recurInsertBulk();
                        }, 8000);
                    } else {
                        numFiles = num;
                        insert();
                    }
                });
            }
            var insert = function() {
                FtpFiles.find({
                    ftp: idServer
                })
                        .select('-_id')
                        .limit(perPage)
                        .skip(skip)
                        .exec(function(err, files) {
                            if (files.length === 0) {
                                console.log("terminado")
                            } else {
                                elastic.elasticInsert(files, function() {
                                    skip = skip + perPage;
                                    console.log("iteracion", page, "/", parseInt(numFilesTotales / perPage) + 1)
                                    page++;
                                    recurInsertBulk();
                                })
                            }
                        })
            }
            recurInsertBulk();
        });
    });
}

var isDir = function(url) {
    return url[url.length - 1] === '/';
}
function ValidURL(str) {
    var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
    if (!regex.test(str)) {
        return false;
    } else {
        return true;
    }
}
var dirIsValid = function(dir, array) {
    if (typeof dir !== 'undefined') {
        // los directorios hay que decodificarlos
        try {
            // If the string is UTF-8, this will work and not throw an error.
            dir = decodeURIComponent(escape(dir));
        } catch (e) {

        }
        if (!ValidURL(dir)) {
            var index = array.indexOf(dir);
            return index === -1;
        }
    }
    return false;
}
var convertToKB = function(size) {
    size = size.trim();
    if (!isNaN(parseInt(size))) {
        var toKB = 1024 * 1024;
        if (size[size.length - 1] === 'G') {
            toKB = toKB * 1024;
        }
        if (size[size.length - 1] === 'K') {
            toKB = 1;
        }
        var megas = size.substring(0, size.length - 1);
        var num = isNaN(parseInt(megas)) ? 0 : parseInt(megas);
        return num * toKB;
    }
    return size;
}


function getHTML(url, next) {
    var unirest = require('unirest');
    unirest.get(url)
            .headers({'Accept': 'application/json', 'Content-Type': 'application/json'})
            .end(function(response) {
                var body = response.body;
                if (next)
                    next(body);
            });
}
//getHTML('http://store.uci.cu/seguridad/DOCUMENTACION/Inform%c3%a1tica%20Forense/Infosecurity%20Forum%20Taller%20Forencia%20Digital/1%20Infosecurity%20Forum%202007.pdf', function(html) {
//    console.log(html);
//});


// este forma de escanear http es consultar carpeta por carpeta en una sola peticion mas lento
var scannerHTTPoneThread = function(result, proxy, errorCallback) {
    var timeConsult = new Date().getTime();
    var proxyUrl = "";
    if (proxy.enabled === 'active') {
        proxyUrl = proxy.url + ":" + proxy.port;
    }
    var noValid = ['../', '..', '?C=N;O=A', '?C=M;O=A', '?C=S;O=A', '?=D;O=A', '?C=N;O=D', '?C=D;O=A', '#'];
    // directorios comunes a los que no se puede entrar
    var listDirertoryNotEnter = noValid;
    // directorios propios especificados por el usuario
    if (typeof result.ignore !== 'undefined') {
        var d = result.ignore.split(',');
        for (var i = 0; i <= d.length; i++) {
            if (d[i] !== '') {
                listDirertoryNotEnter.push(d[i]);
            }
        }
    }
    var folders = new Array();
    // adicionar ruta raiz
    folders.push(result.dirscan);
    var num = 0;
    var escannerInit = false;
    var q = async.queue(function(url, callback) {
        var newFiles = new Array();
        var peti = request;
        var retorn = {};
        var newUrls = new Array();
        var parmsRequest = {
            'url': result.uri + url,
            pool: {maxSockets: 2},
            headers: [
                {
                    name: 'content-type',
                    value: 'application/x-www-form-urlencoded'
                }
            ]
        };
        if (proxy.enabled === 'active') {
            parmsRequest.proxy = proxyUrl;
        }
        retorn = peti(parmsRequest, function(error, response, body) {
            if (url.length > 1) {
                if (url[url.length - 1] === '/') {
                    url = url.substring(0, url.length - 1)
                }
            }
            if (error) {
                console.log(error)
                if (!escannerInit) {
                    escannerInit = true;
                    errorCallback(error)
                } else {
                    console.log("sigue")
                }
            } else {
                if (!escannerInit) {
                    escannerInit = true;
                    errorCallback();
                }
            }
            if (typeof body != 'undefined') {
                $ = cheerio.load(body);
                $(result.query).each(function() {
                    var element = this;
                    var href = $(element).attr('href');
                    try {
                        href = href.replace(parmsRequest.url, "");
                    } catch (e) {
                        console.log("no puede reemplazar")
                    }
                    if (dirIsValid(href, listDirertoryNotEnter)) {
                        if ($(this).text() !== "Parent Directory") {
                            if (isDir(href)) {
                                // es directorio
                                href = href.substring(0, href.length - 1);
                                var carpeta = {
                                    directory: url,
                                    name: href,
                                    ftp: result._id,
                                }
                                var join = "/";
                                if (url === '/') {
                                    join = '';
                                }
                                var newPaht = url + join + href;
                                if (dirIsValid(newPaht, listDirertoryNotEnter)) {
                                    newUrls.push(newPaht + '/');
                                    newFiles.push(carpeta);
                                }
                            } else {
                                // obtener fecha y tamanno
                                // esto se obtiene en dependencia de la configuracion el servidor
                                if (result.queryDate === '') {
                                    // configuracion base
                                    try {
                                        var text = $(element)[0].nextSibling.nodeValue.trim();
                                        var text = text.split(' ');
                                        var fecha = text[0] + ' ' + text[1];
                                        var size = text[text.length - 1];
                                        fecha = Date.parse(fecha);
                                    } catch (e) {
                                        console.log("algo no fue bien esto es obligado")
                                    }
                                } else {
                                    if (result.queryDate === 'td') {
                                        // buscado los otros tipos
                                        var fecha = $(element).parent().next().text();
                                        var size = $(element).parent().next().next().text();
                                        size = convertToKB(size);
                                        fecha = Date.parse(fecha);
//                                        console.log(size, fecha)
                                    }
                                }
                                var newFile = {
                                    name: href,
                                    extname: path.extname(href),
                                    directory: url,
                                    ftp: result._id,
                                    size: size,
                                    time: fecha
                                }
                                num++;
                                newFiles.push(newFile);
                            }
                        }
                    }
                });
            }
            retorn.abort();
            retorn.destroy();
            q.push(newUrls, function(err) {
                console.log(result.uri + url + " escaneado");
            });
            insertDocumentFile(newFiles, function() {

            });
            callback();
        })
    }, result.thread);
// cuando termine de escanear todo
    q.drain = function() {
        var demoro = new Date().getTime() - timeConsult;
        demoro = demoro / 1000;
        console.log('escaneado en', demoro, "segundos");
        freeServer(result._id);
        sincroniceProveMongoFilesElasticSearch(result._id);
    }
// empezando a escanear introducciendo el

    q.unshift(result.dirscan, function(err) {
        console.log('empezando el scanner');
    });

}

/**********Metodos de escaneo recursivos*************/

var scannerFTPRecursivo = function(result) {
    var c = new Client();
    c.connect({
        host: result.uri,
        port: result.port != '' ? result.port : '', // defaults to 21
        user: result.user != '' ? result.user : '', // defaults to "anonymous"
        password: result.pass != '' ? result.pass : '',
    });
    c.on('ready', function() {
        var exploreFolderRecur = function(url) {
            var files_scanner = new Array();
            c.list(url, function(err, list) {
                if (err) {
                    console.log(err);
                } else {
                    list.forEach(function(file) {
                        var name = "";
                        try {
                            // If the string is UTF-8, this will work and not throw an error.
                            name = decodeURIComponent(escape(file.name));
                        } catch (e) {
                            // If it isn't, an error will be thrown, and we can asume that we have an ISO string.
                            name = file.name;
                        }
                        if (file.type !== 'd') {
                            var newFile = {
                                name: name,
                                extname: path.extname(name),
                                directory: url,
                                ftp: result._id,
                                size: file.size,
                                time: file.date
                            }
                            var curTime = new Date();
                            var num_dias = curTime.getTime()
                            console.log(num_dias)
                            files_scanner.push(newFile);
                        } else {
                            var join = "/";
                            if (url === '/') {
                                join = '';
                            }
                            var newPaht = url + join + name;
                            var carpeta = {
                                directory: url,
                                name: name,
                                ftp: result._id,
                            }
                            files_scanner.push(carpeta);
                            exploreFolderRecur(newPaht);
                        }
                    });
                    FtpFiles.collection.insert(files_scanner, function(callback) {
                        console.log("Escaneado " + url);
                    });
                }
            });
        }
        exploreFolderRecur(result.dirscan);
    });
}
var InstallInit = function() {
    setTimeout(function() {
//        clientelastic.indices.delete({
//            index: "_all"
//        })
//        elastic.deleteIndex();

        elastic.indexExists().then(function(exists) {
            if (exists) {
                listDefault();
            } else {
                elastic.initIndex().then(elastic.initMapping).then(function() {
                    elastic.elasticCountFiles(function(num) {

                    })
                    listDefault();
                });
            }
        })
    }, 3000);
}
var listDefault = function() {
    var runScanner = function(err) {
        console.log("Escaneado proveedor predeterminado")
    }
    Ftp.count({}, function(err, count) {
        if (count === 0) {
            console.log('instalando proveedores por defecto');
            var listProvDefault = [
                // proveedores ftp
                {
                    name: 'FTP Producción',
                    uri: 'ftp.prod.uci.cu',
                    dirscan: '/',
                    port: '21',
                    type: 'ftp',
                    thread: 3
                },
                {
                    name: 'MEdia2',
                    uri: 'media2.prod.uci.cu',
                    dirscan: '/',
                    port: '21',
                    type: 'ftp',
                    thread: 3
                },
                // proveedores http
                {
                    name: 'Http STORE',
                    uri: 'http://store.uci.cu',
                    dirscan: '/',
                    type: 'http',
                    query: 'a',
                    ignore: "http://php.uci.cu,mailto:php@uci.cu,https://csharp.uci.cu",
                    thread: 3
                },
                {
                    name: 'ISOS',
                    uri: 'http://isos.uci.cu/',
                    dirscan: '/',
                    type: 'http',
                    query: 'a',
                    thread: 3
                }
            ]
            for (var i in listProvDefault) {
                var FtpModel = new Ftp(listProvDefault[i]);
                FtpModel.save(function(err, ftp) {
                    var provv = {
                        _idServer: ftp._id,
                        proxy: {
                            enabled: 'none'
                        }
                    };
                    ScannerProveedor(provv, runScanner);
                });
            }
        } else {
            console.log("ya hay proveedores en el sistema")
        }
    });
}
InstallInit();
