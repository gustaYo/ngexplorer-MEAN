module.exports = function(app, express, controllers) {
    var ftp = express.Router();
    ftp.route('/api')
            .post(controllers.user.UserAccess('Admin'), controllers.ftp.AddFtpServer)
            .put(controllers.user.UserAccess('Admin'), controllers.ftp.ScannerFtpServer)
    ftp.route('/files')
            .post(controllers.ftp.GetFtpsFiles)
            .get(controllers.ftp.SincronizeServerProve)
            .put(controllers.user.UserAccess('Admin'), controllers.ftp.AddFileToServerProve)
    ftp.route('/filescount')
            .post(controllers.ftp.CountFtpsFiles)
            .get(controllers.ftp.getSizeFolder)
            .put(controllers.ftp.getChartStadist)
    ftp.route('/api/:parms')
            .get(controllers.ftp.GetFtpsProveedores)
            .delete(controllers.user.UserAccess('Admin'), controllers.ftp.DeleteFTP);
    app.use('/ftp', ftp)
};