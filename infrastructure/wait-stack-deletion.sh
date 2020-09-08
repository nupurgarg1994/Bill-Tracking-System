#!/bin/bash


echo "Wait for stack deletion"
 aws cloudformation wait stack-delete-complete --profile dev --region us-east-1 --stack-name csye6225
echo "Stack deleted completly"
