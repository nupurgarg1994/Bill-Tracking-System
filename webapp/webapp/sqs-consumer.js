const { Consumer } = require('sqs-consumer');
const AWS = require('aws-sdk');
const logg = require('./logger');

AWS.config.update({
    region: "us-east-1"
    
    
});
var topic_arn = process.env.SNS_ARN;

var topic_arn = process.env.SNS_ARN;


    app = Consumer.create({
        queueUrl: process.env.SQS_URL,
        //queueUrl : 'https://sqs.us-east-1.amazonaws.com/714891973760/MyQueue',
        handleMessage: async (message) => {
            // do some work with `message`
            console.log("Handle Message is:" +message);
             logg.info({success: JSON.stringify(message.toString())});

            //n
            var params = {
                Message: JSON.stringify(message) /* required */,
                TopicArn: topic_arn
            };
            // Create promise and SNS service object
            var publishTextPromise = new AWS.SNS({
                apiVersion: "2010-03-31"
            })
                .publish(params)
                .promise();
            publishTextPromise
                .then(function (data) {
                    console.log(
                        `Message ${params.Message} send sent to the topic ${params.TopicArn}`
                    );
                    logg.info({ success: `Message ${params.Message} send sent to the topic ${params.TopicArn}` });
            
            
                    console.log("MessageID is " + JSON.stringify(data));
                    logg.info({ success: "MessageID is " + JSON.stringify(data)});
            
                })
                .catch(function (err) {
                    console.error(err, err.stack);
                    logg.info({ error: err.toString() });
                });
            //n
         

        },
        sqs: new AWS.SQS()
    });

    app.on('error', (err) => {
        console.error(err.message);

    });

    app.on('processing_error', (err) => {
        console.error(err.message);

    });


    app.start();


