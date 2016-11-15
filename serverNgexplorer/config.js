var config = {
    db: {
        options: {
            db: {native_parser: true},
            server: {poolSize: 5},
//  replset: { rs_name: 'myReplicaSetName' },
//  user: 'admin',
//  pass: '123456'
        },
        uri: process.env.MONGO_URL || 'mongodb://127.0.0.1/ngexplorercasa'
    },
    porthttps: 3020,
    porthttp: process.env.PORT || 3010,
    elasticsearch: {
        use: false,
        config: {
            client: {
                host: '127.0.0.1:9200',
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
