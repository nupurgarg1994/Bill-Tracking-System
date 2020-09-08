
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const userDetails = require('./routes/userDetails');
const billTracking = require('./routes/billTracking');
const fileDetails = require('./routes/attachment');
const storage = require('./routes/storage');
const fileUpload = require('express-fileupload');
const logg = require('./logger');


storage.init();

//nupur

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());


userDetails(app);
billTracking(app);
fileDetails(app);


//connecting to port
var index = app.listen(
    process.env.PORT || 3006,
    function() {
        var port = index.address().port;
        console.log('Running on port: ', port);
        logg.info({success : 'Running on port: 3006'});

    }
);

app.use(function (err, req, res, next) {
    console.log('This is the invalid field ->', err.field);
    logg.error({ error: err.field.toString() });
    next(err)
})

//exporting the server
module.exports = app;
