# ami

## Student Information

| Name | NEU ID | Email Address |
| --- | --- | --- |
| Nupur | 001357340 | lnu.n@husky.neu.edu |

## Requirement 

Packer 

## Installation guide 

presequisite : [Packer Installation](https://packer.io/downloads.html).

## Build Instruction 

 1. clone directory 
 2. Fill out details in vars.json file   
 3. validate template
    * Packer validate template.jsn
 4. Build Template
    * packer build -var-file=./vars.json template.json
    
## Test Instructions

   CirclCI job: j
    
    It will install packer, and then validate template file and build the template.
    It will create AMI in accounts linked and share with accounts mentioned in ami_users object.
    NodeJS is installed in AMI created.
