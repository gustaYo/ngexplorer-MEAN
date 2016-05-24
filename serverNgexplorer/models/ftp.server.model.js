exports = module.exports = function(mongoose) {
    Schema = mongoose.Schema;
    var FTPSchema = new Schema({
        name: {
            type: String,
            unique: true,
            required: 'Name is required',
            trim: true
        },
        user: String,
        pass: String,
        uri: String,
        dirscan: String,
        port: String,
        type: String,
        query: String,
        queryDate: String,
        querySize: String,
        ignore: String,
        thread: Number,
        update: {
            type: Date,
            default: Date.now
        },
        create: {
            type: Date,
            default: Date.now
        }
        //files:[]
    });
    mongoose.model('ftps', FTPSchema);

    //trabajo con indexs http://mongoosejs.com/docs/2.7.x/docs/indexes.html
    var FileFtpSchema = new Schema(
            {
                name: {
                    type: String,
                    sparse: true
                },
                extname: String,
                directory: String,
                ftp: {type: Schema.Types.ObjectId, ref: 'ftps'},
                size: String,
                time: String
            });
    mongoose.model('ftpfiles', FileFtpSchema);
}