#!/bin/bash
cd /home/ubuntu/webapp
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/home/ubuntu/cloudWatchConfig.json -s
forever stopall
forever start index.js
forever start sqs-consumer.js


