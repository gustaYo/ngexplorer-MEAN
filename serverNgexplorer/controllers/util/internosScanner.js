const fs = require('fs');
const got = require('got');
const cheerio = require('cheerio');
const async = require('async');
const request = require('request');
const base_url= "http://internos.uci.cu";
const numThreads = 2;
var nodos_internos= new Array();
var idProveedor= 23213;
var menus= []


var loadAllLinks = function(next){
    console.log("Visitando todos los links")
    var timeConsult = new Date().getTime();
    var linksVisita= []
    for (var i = menus.length - 1; i >= 0; i--) {
        for (var j = menus[i].submenus.length - 1; j >= 0; j--) {
            linksVisita.push(menus[i].submenus[j])
        }
    }
    console.log(linksVisita)

    var q = async.queue(function(node, callback) {
        var newUrl= base_url+node.href
        var peti = request;
        var retorn = {};
        var newUrls = new Array();
        var parmsRequest = {
            'url': newUrl,
            pool: {maxSockets: 2},
            headers: {
                'Accept': "text/plain"
            }
        };
        retorn = peti(parmsRequest, function(error, response, body) {
          if (!error && response.statusCode == 200) {
            const dom = cheerio.load(body)

            if(dom('body').hasClass("page-taxonomy-term")){
                var newSubmenus= new Array();
                dom('div.view-content div.views-row div.nodo-mini h4.media-title a').each(function(){
                 var element = this;
                 var href = dom(element).attr('href')
                 console.log(href)
                 var enlace = {
                    parent: node.href,
                    href: href
                }
                newSubmenus.push(enlace)
            });
                q.push(newSubmenus, function(err) {
                    console.log("escaneado ",node.href);
                    
                });

            }else{
                if(dom('body').hasClass("node-type-contenedor")){
                    console.log("node-type-contenedor");
                    // obtener los datos de un nodo contenedor
                    var nodo= {
                        parent: node.parent,
                        title: dom('h1.page-title').text(),
                        type: "node-type-contenedor",
                        href: node.href
                    }
                    console.log(nodo)
                    // buscando subnodos
                    var name= nodo.href.split('/');
                    name= name[name.length-1];
                    var carpeta = {
                        directory: nodo.parent,
                        name: name,
                        ftp: idProveedor,
                    }
                    nodos_internos.push(carpeta)

                    var newSubmenus= new Array();
                    dom('div.view-content div.views-row div.nodo-mini h4.media-title a').each(function(){
                     var element = this;
                     var href = dom(element).attr('href')
                     console.log(href)
                     var enlace = {
                        parent: nodo.href,
                        href: href
                    }
                    newSubmenus.push(enlace)
                    var name= enlace.href.split('/');
                    name= name[name.length-1];
                    var newFile = {
                        name: name,
                        extname: 'webm',
                        directory: enlace.parent,
                        ftp: idProveedor,
                        size: 0,
                        time: 0
                    }
                    nodos_internos.push(newFile)

                });
                    /*
                    q.push(newSubmenus, function(err) {
                        console.log("escaneado ",node.href);
                    });
                    */
                }else{
                    if(dom('body').hasClass("node-type-publicacion")){
                        console.log("publicacionnnnnn",node.href)
                    }
                }
            }

        }
        retorn.abort();
        retorn.destroy();
        callback()
    })
    }, numThreads);

    // cuando termine de escanear todo
    q.drain = function() {
        var demoro = new Date().getTime() - timeConsult;
        demoro = demoro / 1000;
        console.log('escaneado en', demoro, "segundos");
        //console.log(nodos_internos)
        next(nodos_internos)
    }
    // empezando a escanear introducciendo el
    var scannerSerie= linksVisita.slice(0, 2)
    q.unshift(linksVisita, function(err) {
        console.log('empezando el scanner');
    });
}


const getLinks = (next) =>
got(base_url)
.then(response => {
    const dom = cheerio.load(response.body)
    console.log("obteniendo menus")
    var menu=dom('div.menu-principal').children('ul')
    dom(menu).find('li.expanded').each(function(){
       var element = this;
       var menu= {
        name: dom(element).children('a').text(),
        href: dom(element).children('a').attr('href'),
        submenus: []
    }

nameee = menu.href.substring(1, menu.href.length)

    var carpeta = {
        directory: '/',
        name: nameee,
        ftp: idProveedor,
    }
    nodos_internos.push(carpeta)
    var submenus = []
             // submenus
             dom(element).children('ul').find('li.leaf').each(function(){
                var submenu= {
                  name: dom(this).children('a').text(),
                  href: dom(this).children('a').attr('href')
              }
              submenus.push(submenu)
              var name= submenu.href.split('/');
              name= name[name.length-1];
              if (name[0] === '/') {
                name = name.substring(1, url.length)
            }
            var carpeta = {
                directory: menu.href,
                name: name,
                ftp: idProveedor,
            }
            nodos_internos.push(carpeta)
        })
             menu.submenus=submenus;
             menus.push(menu);
         })
    console.log(nodos_internos)
    
    loadAllLinks(next)
})
.catch(error => {
    console.log(error.response.body);
        //=> 'Internal server error ...'
    });


exports.scannerInternos = function(idProv,retorn) {
    idProveedor=idProv;
    getLinks(function(__nodos__){
        retorn(__nodos__)
    })
}