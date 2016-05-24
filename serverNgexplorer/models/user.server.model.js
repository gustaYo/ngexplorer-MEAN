var jwt = require("jsonwebtoken");
var SECRET = 'gustaaaaaaaaaaaaaa-secret';
exports = module.exports = function(mongoose) {
    Schema = mongoose.Schema;
    var UserSchema = new Schema({
        email: String,
//        token: String,
//        user: String,
        name: String,
        fistlastname: String,
        secondlastname: String,
        username: String,
        password: String,
        created: {
            type: Date,
            default: Date.now
        },
        role: String
    });

//    UserSchema.pre('save', function(next) {
//        this.token = jwt.sign(this, SECRET);
//        next();
//    });
    module.exports = mongoose.model('users', UserSchema);
}