#!/bin/bash


echo "Deleting CloudFormation Stack"
 aws cloudformation delete-stack --profile dev --region us-east-1 --stack-name csye6225
echo "CloudFormation Stack deleted"


 
