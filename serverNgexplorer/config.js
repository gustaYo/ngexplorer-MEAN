var config = {
    db: {
        options: {
            db: {native_parser: true},
            server: {poolSize: 5},
//  replset: { rs_name: 'myReplicaSetName' },
//  user: 'admin',
//  pass: '123456'
        },
        uri: 'mongodb://127.0.0.1/ngexplorerbd'
    },
    porthttps: 3020,
    porthttp: 3010,
    elasticsearch: {
        use: true,
        config: {
            client: {
                host: '10.55.11.3:9201',
//                log: 'trace',
            },
            indexName: "ftpfiledev"
        }
    }
}
module.exports = config;
/*
 * seguridad
 http://mongoosejs.com/
 mongo
 show dbs
 use databaseName
 db.addUser('admin','123456')
 contrl-c
 sudo su
 gedit /etc/mongodb.conf
 descomentariar auth
 service mongodb restart
 mongo --port 27017 -u manager -p 123456 --authenticationDatabase admin
 */
