const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const pv = require('./passwordverification');
const uuidv4 = require('uuidv4');
const logg = require('../logger');
const SDC = require('statsd-client');
sdc = new SDC(
    {
      host: 'localhost',
      port: 8125});

module.exports = function(app) {

  const { User } = require('./storage');

  app.get('/', async (req,res)=>{
    res.status(200).json({
      "message":"Hello... Today's date is : "+new Date()
    });
  });

  app.post('/v1/user', async (req, res) => {
    try {
      var startDate = new Date();
      logg.info("Post User API Called");
      sdc.increment('Post User ');
      pv.validatePwd(req.body.password);
      //const password = pv.validatePwdHashEncoding(req.body.password);
      const hash = await bcrypt.hash(req.body.password, 10);

      var startDateDb = new Date();
      let users = await User.create({

        id: uuidv4.uuid(),
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        password: hash,
        email_address: req.body.email_address
      });
      var endDatedb   = new Date();
      var secondsdb = (endDatedb.getTime() - startDateDb.getTime()) / 1000;
      sdc.timing('user-create-db-time', secondsdb);
      users = users.toJSON();
      delete users.password;
      res.status(201).send(users);
      logg.info({success: "User posted successfuly"});
      var endDate   = new Date();
      var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
      sdc.timing('post-user-api-time', seconds);
    } catch (error) {
      let message = null;
      if (error instanceof Sequelize.ValidationError) {
        message = error.errors[0].message;
        logg.error({ error: message });
      }
      res.status(400).send(message || error.toString());
      logg.error({ error:  error.toString() });
    }
  });

  app.get('/v1/user/self', async (req, res) => {
    try {
      var startDate = new Date();
      logg.info("Gett User API Called");
      sdc.increment('GET User ');

      var startDateDb = new Date();
      let user = await pv.validateUser(req, User);
      user = user.toJSON();
      delete user.password;
      var endDatedb   = new Date();
      var secondsdb = (endDatedb.getTime() - startDateDb.getTime()) / 1000;
      sdc.timing('user-get-db-time', secondsdb);
      res.status(200).send(user);
      logg.info({ success: "successfully got the users" });
      var endDate   = new Date();
      var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
      sdc.timing('get-user-api-time', seconds);

    } catch (e) {
      res.status(400).send(e.toString());
      logg.error({ error: e.toString() });
    }
  });

  app.put('/v1/user/self', async (request, response) => {
    try {
      var startDate = new Date();
      logg.info("Put User API Called");
      sdc.increment('PUT user ');
      var startDateDb = new Date();
      let user = await pv.validateUser(request, User);


      if (request.body.first_name) {
        user.first_name = request.body.first_name;
      }
      if (request.body.last_name) {
        user.last_name = request.body.last_name;
      }
      if (request.body.password) {
        pv.validatePwd(request.body.password);


        user.password = await bcrypt.hash(request.body.password, 10);
      }
      await user.save();
      var endDatedb   = new Date();
      var secondsdb = (endDatedb.getTime() - startDateDb.getTime()) / 1000;
      sdc.timing('user-put-db-time', secondsdb);
      response.status(204).send();
      logg.info({ success: "success" });
      var endDate   = new Date();
      var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
      sdc.timing('put-user-api-time', seconds);
    } catch (e) {
      response.status(400).send(e.toString());
      logg.error({ error: e.toString() });
    }
  });
};


