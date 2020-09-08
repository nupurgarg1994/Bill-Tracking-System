# infrastructure

Creating VPC, Subnets, Security Groups for application and Database, S3 Bucket, IAM role and Policy, EC2 and RDS Instance

## Student Information

| Name | NEU ID | Email Address |
| --- | --- | --- |
| Nupur | 001357340 | lnu.n@husky.neu.edu |

## Build Instructions
prerequisites:
Template file i.e networking.json should be in the same directory as the scripts

## Deploy Instructions
1. Run the script using ./stack-creation.sh
2. After the stack is created run the script /stack-deletion.sh to delete the vpc
3. To ensure the complete deletion of vpc, run the script wait-stack-deletion.sh

## Note: Import SSH Certificate using AWS CLI
1. Certificate file(.crt) generated is converted into .pem format using command openssl x509 -in prod_nupurgarg_me.crt -out prod_nupurgarg_me.pem
2. Private key file(.key) generated is converted into .pem format using command aws acm import-certificate --certificate file:// prod_nupurgarg_me.pem --private-key file:// ssl_pivatekey.pem
3. Certificate Chain file(.p7b) generated is converted into .pem format openssl pkcs7 -print_certs -in CertificateChain.p7b -out CertificateChain.cer
4. The following PEM-encoaded commands are placed in a continuos line and the following command is run to import the Certificate generated
aws acm import-certificate --certificate file://prod_nupurgarg_me.pem --certificate-chain file://CertificateChain.pem --private-key file://ssl_pivatekey.pem




