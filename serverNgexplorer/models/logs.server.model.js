exports = module.exports = function(mongoose) {
    Schema = mongoose.Schema;
    var LogsSchema = new Schema({
        browser: String,
        browser_version: String,
        device: String,
        os: String,
        ip: String,
        created: {
            type: Date,
            default: Date.now
        },
        type: String,
        search: String
    });
    module.exports = mongoose.model('logs', LogsSchema);
}