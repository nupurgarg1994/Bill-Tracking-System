const aws = require("aws-sdk");
var dynomoDB = new aws.DynamoDB({ apiVersion: "2012-08-10" });
var ses = new aws.SES();
aws.config.update({ region: "us-east-1" });

exports.handler = function (event, context, callback) {

  let message = event.Records[0].Sns.Message;
  let messageJson = JSON.parse(message);

  let messageDataJson = JSON.parse(messageJson.data);

  console.log("Test Link: " + messageDataJson.results);
  console.log("Test Email: " + messageDataJson.Email);

  let currentTime = new Date().getTime();
  let ttl = 1 * 60 * 1000;

  let expirationTime = (currentTime + ttl).toString();

  var emailParams = {
    Destination: {
      ToAddresses: [
        messageDataJson.Email
      ]
    },
    Message: {
      Body: {
        Text: {
          Charset: "UTF-8",
          Data: messageDataJson.results
        }
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Bills due in x days"
      }
    },
    Source: "csye6225@" + process.env.DOMAIN_NAME
  };


  let putParams = {
    TableName: "csye6225",
    Item: {
      id: { S: messageDataJson.Email },
      bills: { S: messageDataJson.data },
      ttl: { N: expirationTime }
    }
  };

  let queryParams = {
    TableName: 'csye6225',
    Key: {
      'id': { S: messageDataJson.Email }
    },
  };

///****DynamoDB****///

  dynomoDB.getItem(queryParams, (err, data) => {
    if (err) console.log(err)
    else {
      if (data.Item == null) {
        dynomoDB.putItem(putParams, (err, data) => {
          if (err) console.log(err);
          else {
            console.log(data);
            var sendPromise = ses.sendEmail(emailParams).promise();
            sendPromise
              .then(function (data) {
                console.log(data.MessageId);
              })
              .catch(function (err) {
                console.error(err, err.stack);
              });
          }
        });
      } else {

        let jsonData = JSON.stringify(data)
        let parsedJson = JSON.parse(jsonData);
        let curr = new Date().getTime();
        let ttl = Number(parsedJson.Item.ttl.N);
        console.log(typeof curr + ' ' + curr);
        console.log(typeof ttl + ' ' + ttl);
        if (curr > ttl) {
          dynomoDB.putItem(putParams, (err, data) => {
            if (err) console.log(err);
            else {
              console.log(data);
              console.log('sent from 1st function')
              var sendPromise = ses.sendEmail(emailParams).promise();
              sendPromise
                .then(function (data) {
                  console.log(data.MessageId);
                })
                .catch(function (err) {
                  console.error(err, err.stack);
                });
            }
          });

        }
      }
    }
  });
};