
var elastic = {};
var config = require('../../config.js');
var elasticsearch = require('elasticsearch');
var clientelastic = new elasticsearch.Client(config.elasticsearch.config.client);
var indexElastic = config.elasticsearch.config.indexName;
clientelastic.ping({
    // ping usually has a 3000ms timeout
    requestTimeout: Infinity,
    // undocumented params are appended to the query string
    hello: "elasticsearch!"
}, function(error) {
    if (error) {
        console.trace('elasticsearch cluster is down!');
    } else {
        console.log('All is well');
    }
});

elastic.elasticCountFiles = function(next) {
    clientelastic.count(function(error, response, status) {
        // check for and handle error
        var count = response.count;
        console.log(count);
        next(count);
    });
};
elastic.elasticListDir = function(parms, next) {
    var search = parms.directory;
    clientelastic.search({
        index: indexElastic,
        size: 300,
        body: {
            query: {
                match: {
                    directory: search
                },
            },
            filter: {
                and: [
                {
                    term: {ftp: parms.ftp}
                },
                ]
            }
        }
    }, function(error, response) {
        var retorn = new Array();
        var hist = response.hits.hits;
        for (var i in hist) {
            var file= hist[i]._source;
            file._id=hist[i]._id;
            retorn.push(file);
        }
        next(retorn);
    });
}
elastic.elasticInsert = function(auxT, next) {
    var br = [];
    function create_bulk(bulk_request) {
        var obj;
        for (var i = 0; i < auxT.length; i++) {
            obj = auxT[i];
            bulk_request.push({index: {_index: indexElastic, _type: 'file'}});
            bulk_request.push(obj);
        }
        return bulk_request;
    }
    create_bulk(br);
    clientelastic.bulk(
    {
        body: br
    }, function(err, resp) {
        next();
    });
}

/**
 * Delete an existing index
 */
 elastic.deleteIndex = function() {
    return clientelastic.indices.delete({
        index: indexElastic
    });
}
/**
 * create the index
 */
//http://techblog.realestate.com.au/implementing-autosuggest-in-elasticsearch/

//http://elasticsearch-users.115913.n3.nabble.com/Unable-to-preserve-special-characters-in-search-results-of-ElasticSearch-td4072409.html#a4072648
var settings = {
    "index": {
        "analysis": {
            "filter": {
                "myNGramFilter": {
                    "type": "edgeNGram",
                    "min_gram": 1,
                    "max_gram": 40
                }},
                "analyzer": {
                    "myNGramAnalyzer": {
                        "type": "custom",
                        "tokenizer": "standard",
                        "filter": ["lowercase", "myNGramFilter"]
                    }},
                },
                "mappings": {
                    "file": {
                        "properties": {
                            "name": {
                                "type": "string",
                                "index_analyzer": "myNGramAnalyzer",
                                "search_analyzer": "standard"
                            }
                        }
                    }
                }
            }
        };
        elastic.initIndex = function() {
            return clientelastic.indices.create({
                index: indexElastic,
                body: {
                    settings: settings
                }
            });
        }
/**
 * check if the index exists
 */
 elastic.indexExists = function() {
    return clientelastic.indices.exists({
        index: indexElastic
    });
}

elastic.initMapping = function() {
    return clientelastic.indices.putMapping({
        index: indexElastic,
        type: "file",
        body: {
            properties: {
                directory: {type: "string", "index": "not_analyzed"},
//                name: {type: "string", "index": "not_analyzed"},
}
}
});
}
elastic.elasticgetSizeFolder = function(parms, next) {

}
elastic.elasticDeleteFiles = function(parms, next) {
    var allTitles = [];
// first we do a search, and specify a scroll timeout
clientelastic.search({
    index: indexElastic,
        // Set to 30 seconds because we are calling right back
        scroll: '30s',
        search_type: 'scan',
        fields: ['name'],
        q: 'ftp:' + parms
    }, function getMoreUntilDone(error, response) {
        // collect the title from each response
        response.hits.hits.forEach(function(hit) {
            allTitles.push({delete: {_index: indexElastic, _type: 'file', _id: hit._id}});
        });
        var numFiles = 0;
        elastic.elasticCountFiles(function(num) {
            numFiles = num;
        })
        if (response.hits.total !== allTitles.length) {
            // now we can call scroll over and over
            clientelastic.scroll({
                scrollId: response._scroll_id,
                scroll: '30s'
            }, getMoreUntilDone);
        } else {
            clientelastic.bulk(
            {
                body: allTitles
            }
            , function(err, resp) {
                var __t;
                var esperarEliminar = function() {
                    clearTimeout(__t);
                    // ver si no hay otra operacion de insertar
                    elastic.elasticCountFiles(function(num) {
                        if (num < numFiles) {
                            numFiles = num;
                            __t = setTimeout(function() {
                                esperarEliminar();
                            }, 6000);
                        } else {
                            numFiles = num;
                            next();
                        }
                    });
                }
                esperarEliminar();
            });
        }
    });
}

//http://stackoverflow.com/questions/22522863/elasticsearch-case-insensitive-query-string-query-with-wildcards?rq=1

//http://stackoverflow.com/questions/16776260/elasticsearch-multi-match-with-filter

var sanatize_QUERY = function(query) {
    return query
            .replace(/[\*\+\-=~><\"\?^\${}\(\)\:\!\/[\]\\\s]/g, '\\$&') // replace single character special characters
            .replace(/\|\|/g, '\\||') // replace ||
            .replace(/\&\&/g, '\\&&') // replace &&
            .replace(/AND/g, '\\A\\N\\D') // replace AND
            .replace(/OR/g, '\\O\\R') // replace OR
            .replace(/NOT/g, '\\N\\O\\T'); // replace NOT
        };
        elastic.elasticFind = function(parms, next) {
    // filtrar por extname tambien
    var extname = {};
    if (typeof parms.extname !== 'undefined' && parms.extname !== '') {
//        extname = {
//            term: {extname: parms.extname}
//        }
extname = {
    "regexp": {
        "name": ".*" + parms.extname + ".*",
    }
}

}
var searchParams = {
    index: indexElastic,
    from: 0,
    size: 100,
    body: {
        "query": {"match_phrase_prefix": {"name": encodeURIComponent(parms.name.toLowerCase())}},
        filter: {
            and: [
            {
                terms: {ftp: parms.ftps}
            },
//                    {
//                        "regexp": {
//                            "name": ".*" + encodeURIComponent(parms.name) + ".*",
//                        }
//                    },
extname
]
}
}
};
clientelastic.search(searchParams, next);
}
module.exports = elastic;


