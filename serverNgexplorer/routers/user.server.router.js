module.exports = function(app, express, controllers) {
    var user = express.Router();
    user.route('/authenticate')
            .post(controllers.user.authenticate)

    user.route('/signin')
            .post(controllers.user.signin)
    user.route('/counter')
            .post(controllers.user.contadorVisit)
            .get(controllers.user.getStadist)
    app.use('/user', user);
};

