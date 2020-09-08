const Sequelize = require('sequelize');
const pv = require('./passwordverification');
const uuidv4 = require('uuidv4');
const fs = require('fs');
const AWS = require('aws-sdk');
const logg = require('../logger');
var dateformat = require("dateformat");


// const s3 = new AWS.S3({
//   accessKeyId: process.env.AWS_ACCESS_KEY,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
// });

const s3 = new AWS.S3();

const SDC = require('statsd-client');
sdc = new SDC(
    {
      host: 'localhost',
      port: 8125
    });



//nupur

AWS.config.update({
  region: "us-east-1"
});

//SQS



var queue_url = process.env.SQS_URL;


//retreive SQS


//SNS
var topic_arn = process.env.SNS_ARN;
// var createTopicPromise = new AWS.SNS({ apiVersion: "2010-03-31" })
//     .createTopic({ Name: "SNSTopic" })
//     .promise();
//
// Handle promise's fulfilled/rejected states
// createTopicPromise
//     .then(function(data) {
//       console.log("Topic ARN is " + data.TopicArn);
//       topic_arn = data.TopicArn;
//     })
//     .catch(function(err) {
//       console.error(err, err.stack);
//     });
//nupur



//module.exports = function(app) {
module.exports = function (app) {
  const { Bill, User, Attachement } = require('./storage');



  app.post('/v1/bill', async (req, res) => {
    try {
      var startDate = new Date();
      logg.info("Post Bill API Called");
      sdc.increment('POST Bill ');
      let user = await pv.validateUser(req, User);

      var startDateDb = new Date();
      let bill = await Bill.create({
        id: uuidv4.uuid(),
        vendor: req.body.vendor,
        bill_date: req.body.bill_date,
        due_date: req.body.due_date,
        amount_due: req.body.amount_due,
        payment_status: req.body.payment_status,
        categories: req.body.categories,
        attachment: {}
      });
      //console.log(user);
      //console.log(bill);



      await user.addBill(bill);
      var endDatedb = new Date();
      var secondsdb = (endDatedb.getTime() - startDateDb.getTime()) / 1000;
      sdc.timing('bill-create-db-time', secondsdb);
      res.status(201).send(bill.toJSON());
      logg.info({ success: "Bill created successfully" });

      var endDate = new Date();
      var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
      sdc.timing('post-bill-api-time', seconds);

    } catch (error) {
      let message = null;
      if (error instanceof Sequelize.ValidationError) {
        message = error.errors[0].message;
      }
      res.status(400).send(message || error.toString());
      logg.error({ error: e.toString() });
    }
  });
  app.get('/v2/bills', async (req, res) => {
    try {

      var startDate = new Date();
      logg.info("GET Bills API Called");
      sdc.increment('GET Bills ');
      var startDateDb = new Date();
      const user = await pv.validateUser(
          req,
          User
      );
      const bills = await user.getBills();
      var endDatedb = new Date();
      var secondsdb = (endDatedb.getTime() - startDateDb.getTime()) / 1000;
      sdc.timing('bills-get-db-time', secondsdb);

      res.status(200).send(bills);
      logg.info({ success: "Bills got successfully" });

      var endDate = new Date();
      var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
      sdc.timing('get-bill-api-time', seconds);

    } catch (e) {
      res.status(400).send(e.toString());
      logg.error({ error: e.toString() });
    }
  });

  app.get('/v1/bill/:id', async (req, res) => {
    try {
      var startDate = new Date();
      logg.info("Get Bill by ID API Called");
      sdc.increment('GET Bill by ID ');
      const user = await pv.validateUser(
          req,
          User
      );
      var startDateDb = new Date();
      const bills = await user.getBills({
        where: { id: req.params.id }
      });
      if (bills.length == 0) {
        throw new Error('Invalid Bill Id');
      }
      bill = bills[0];
      const file = await Attachement.findOne({
        where: { BillId: req.params.id }
      });


      const attachment = await Bill.update(
          { attachment: file },
          { where: { id: req.params.id } }
      );

      bill1 = bill.dataValues;
      bill_db = { ...bill1, ...attachment };

      var endDatedb = new Date();
      var secondsdb = (endDatedb.getTime() - startDateDb.getTime()) / 1000;
      sdc.timing('bill-getbyID-db-time', secondsdb);
      res.status(200).send(bill1);
      logg.info({ success: "Bill got successfully" });
      var endDate = new Date();
      var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
      sdc.timing('get-bill-byId-api-time', seconds);
    } catch (e) {
      res.status(400).send(e.toString());
      logg.error({ error: e.toString() });
    }
  });

  app.delete('/v1/bill/:id', async (req, res) => {
    try {
      var startDate = new Date();
      logg.info("Delete Bill API Called");
      sdc.increment('DELETE Bill ');
      var startDateDb = new Date();
      const user = await pv.validateUser(
          req,
          User
      );
      const bills = await user.getBills({
        where: { id: req.params.id }
      });
      if (bills.length == 0) {
        throw new Error('Invalid Bill Id');
        logg.error({ error: 'Invalid Bill Id' });
      }
      const bill = bills[0];
      //nupur
      const attachments = await bill.getAttachement({
        where: { BillId: req.params.id }
      });


      //nupur
      if (attachments != null) {


        var params = {
          Bucket: process.env.S3_BUCKET_NAME,
          Delete: { // required
            Objects: [ // required
              {
                Key: req.params.id + "_" + attachments.file_name // required
              }
            ],
          },
        };

        s3.deleteObjects(params, function (err, data) {
          var startDate = new Date();
          if (err) {
            console.log(err, err.stack);
            logg.error({ error: err.stack });
          }
          else {
            console.log('delete', data);
            logg.info({ success: "successufully deleted s3 bucket" });
          }
          var endDate = new Date();
          var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
          sdc.timing('s3-deleteBill-api-time', seconds);
        });
      }

      await user.removeBill(bill);
      await Bill.destroy({
        where: { id: req.params.id }
      });
      //nupur


      await Attachement.destroy({
        where: { BillId: req.params.id }
      });





      // await fs.promises.unlink(
      //     `${__dirname}/../uploads/${req.params.id}${attachments.dataValues.file_name}`
      // );
      //nupur
      var endDatedb = new Date();
      var secondsdb = (endDatedb.getTime() - startDateDb.getTime()) / 1000;
      sdc.timing('bill-delete-db-time', secondsdb);
      res.status(204).send();
      var endDate = new Date();
      var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
      sdc.timing('delete-bill-api-time', seconds);
    } catch (e) {
      res.status(400).send(e.toString());
    }
  });

  app.put('/v1/bill/:id', async (req, res) => {
    try {
      var startDate = new Date();
      logg.info("Put Bill API Called");
      sdc.increment('PUT Bill ');
      var startDateDb = new Date();
      const user = await pv.validateUser(
          req,
          User
      );
      const bills = await user.getBills({
        where: { id: req.params.id }
      });
      if (bills.length == 0) {
        throw new Error('Invalid Bill Id');
        logg.error({ error: "Invalid Bill Id" });
      }
      const bill = bills[0];

      if (req.body.vendor) {
        bill.vendor = req.body.vendor;
      }
      if (req.body.bill_date) {
        bill.bill_date = req.body.bill_date;
      }
      if (req.body.due_date) {
        bill.due_date = req.body.due_date;
      }
      if (req.body.amount_due < 0.01) {
        throw new Error("Amount can't be less than 0.01");
        logg.error({ error: "Amount can't be less than 0.01" });
      }
      else {
        bill.amount_due = req.body.amount_due;
      }
      if (req.body.payment_status) {
        bill.payment_status = req.body.payment_status;
      }
      if (req.body.categories) {
        bill.categories = req.body.categories;
      }

      await bill.save();
      var endDatedb = new Date();
      var secondsdb = (endDatedb.getTime() - startDateDb.getTime()) / 1000;
      sdc.timing('bill-put-db-time', secondsdb);
      res.status(204).send();
      logg.info({ success: "successfully bills updated" });
      var endDate = new Date();
      var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
      sdc.timing('put-bill-api-time', seconds);
    } catch (e) {
      res.status(400).send(e.toString());
      logg.info({ error: e.toString() });
    }
  });

  app.get('/v1/bills/due/:x', async (req, res) => {
    logg.info("Bill Due days API Called");
    sdc.increment('PUT Bill ');
    let x = req.params.x;
    try {
      //validating the user
      const user = await pv.validateUser(
          req,
          User
      );
      //nn
      function formatDate(date) {
        var d = new Date(date),
            month = "" + (d.getMonth() + 1),
            day = "" + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2) month = "0" + month;
        if (day.length < 2) day = "0" + day;

        return [year, month, day].join("-");
      }


      var dd = dateformat(new Date(), "yyyy-mm-dd");
      console.log("Current Date :" + dd);

      var d = new Date();
      console.log("Current Date :" + d);

      var new_date = new Date().setDate(
          new Date().getDate() + Number(req.params.x)
      );
      var formatted_date = formatDate(new_date);
      console.log("Bills Before Date: ", formatted_date);


      //k
      const bills = await user.getBills();
      //bill = JSON.parse(JSON.stringify(bills));
      bill = bills;
      console.log(bill);


      Response_Msg = [];
      for (const i in bill) {
        console.log(formatDate(bill[i].due_date));
        console.log("Due date is: " + formatDate(bill[i].due_date));
        console.log("Formatted date is: " + formatted_date);

        logg.info({ success: formatDate(bill[i].due_date) });
        logg.info({ success: "Due date is: " + formatDate(bill[i].due_date) });
        logg.info({ success: "Formatted date is: " + formatted_date });


        if (formatDate(bill[i].due_date) < formatted_date) {
          const message = { url: "http://prod.nupurgarg.me/v1/bill/" + bill[i].id };
          console.log("The message is :" + message);

          logg.info({ success: "The message is :" + message });


          Response_Msg.push(message);
        }

      }
      //k


      const Response = {
        Response_Msg: Response_Msg,
        Response_email: user.email_address
      };

      var send_queue_params = {
        MessageBody: JSON.stringify(Response),
        QueueUrl: queue_url,
        DelaySeconds: 0
      };
      var sqs = new AWS.SQS();

      sqs.sendMessage(send_queue_params, function (error3, data) {
        if (error3) {
          console.error(error3);
          logg.info({ error: error3.toString() });
        } else {
          console.log(
              "Sent Message From Queue" + JSON.stringify(data)
          );

          logg.info({ success: "Sent Message From Queue" + JSON.stringify(data) });

        }
      });

      console.log("Response: " + JSON.stringify(Response));

      logg.info({ success: "Response: " + JSON.stringify(Response) });


      //res.status(200).send(JSON.stringify(Response));
      res.status(200).send("Please check your Emails to view Due Bills");

//       var receive_queue_params = {
//         QueueUrl: queue_url,
//         VisibilityTimeout: 0 // 0 min wait time for anyone else to process.
//       };
//       sqs.receiveMessage(receive_queue_params, function (
//           error4,
//           data2
//       ) {
//         if (error4) {
//           console.error(error4);
//           logg.info({ error: error4.toString() });
//         } else {
//           console.log(
//               "Recived Message From Queue" + JSON.stringify(data2)
//           );
//           logg.info({ success: "Recived Message From Queue" + JSON.stringify(data2) });

          // var params = {
          //   Message: JSON.stringify(data2) /* required */,
          //   TopicArn: topic_arn
          // };

          // Create promise and SNS service object
          // var publishTextPromise = new AWS.SNS({
          //   apiVersion: "2010-03-31"
          // })
          //     .publish(params)
          //     .promise();

          // Handle promise's fulfilled/rejected states
          // publishTextPromise
          //     .then(function (data) {
          //       console.log(
          //           `Message ${params.Message} send sent to the topic ${params.TopicArn}`
          //       );
          //       logg.info({ success: `Message ${params.Message} send sent to the topic ${params.TopicArn}` });
          //
          //
          //       console.log("MessageID is " + JSON.stringify(data));
          //       logg.info({ success: "MessageID is " + JSON.stringify(data)});
          //
          //     })
          //     .catch(function (err) {
          //       console.error(err, err.stack);
          //       logg.info({ error: err.toString() });
          //     });
//         }
//       });

    } catch (e) {
      res.status(400).send(e.toString());
      logg.error({ error: e.toString() });
    }
  });

};

