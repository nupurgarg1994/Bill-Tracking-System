#!/bin/bash
cd /home/ubuntu/webapp
sudo npm install
sudo npm install bcrypt --save
sudo npm install aws-sdk
sudo npm install sqs-consumer --save
sudo npm install forever -g
echo "After install hook completed successfully"
