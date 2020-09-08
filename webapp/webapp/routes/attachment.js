const Sequelize = require('sequelize');
const pv = require('./passwordverification');
const uuidv4 = require('uuidv4');
const multer = require('multer');
const fs = require('fs');
const mime = require('mime');
var dateformat = require("dateformat");
const AWS = require('aws-sdk');
const logg = require('../logger');
require('dotenv').config();
const SDC = require('statsd-client');
sdc = new SDC(
    {
        host: 'localhost',
        port: 8125});

module.exports = function(app) {

    const {Bill, User, Attachement} = require('./storage');

//     const s3 = new AWS.S3({
//         accessKeyId: process.env.AWS_ACCESS_KEY,
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
//     });
    
    const s3 = new AWS.S3();



    app.post('/v1/bill/:id/file', async (req, res) => {
        try {
            var startDate = new Date();

            //validating the user
            logg.info("Attachment Post Method Called");
            sdc.increment('POST Attachment ');
            let user = await pv.validateUser(req, User);
            //let files = req.file;
            if (
                !req.files ||
                Object.keys(req.files).length === 0 ||
                !req.files.attachment
            ) {
                throw new Error('No files were uploaded.');
                logg.error({ error: 'No files were uploaded.' });
            }

            //comparing the bill id
            let bills = await user.getBills({
                where: {id: req.params.id}
            });

            bill = bills[0];
            if (bill.length == 0) {
                throw new Error('Invalid Bill Id');
                logg.error({ error: 'Invalid Bill Id' });
            }

            const attachments = await Attachement.findAll({
                where: {BillId: req.params.id}
            });

            if (attachments.length != 0) {
                throw  new Error("BillId already exists");
                logg.error({ error: 'BillId already exists' });
            }
            const uuid = uuidv4.uuid();

            let ext = mime.getExtension(req.files.attachment.mimetype);



            if (ext == 'pdf' || ext == 'jpeg' || ext == 'jpg' || ext == 'png') {

                // var k =await req.files.attachment.mv(
                //           `${__dirname}/../uploads/${req.params.id}${req.files.attachment.name}`);
                // console.log(k);


                params = {Bucket: process.env.S3_BUCKET_NAME, Key: req.params.id+"_"+req.files.attachment.name, Body: JSON.stringify(req.files.attachment) };


                s3.putObject(params, function(err, data) {
                    var startDate = new Date();
                    if (err) {
                        console.log(err);
                        logg.error({ error: err });

                    } else {
                        console.log("Successfully uploaded data to Bucket/Key");
                        logg.error({ error: err });
                    }
                    var endDate   = new Date();
                    var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                    sdc.timing('s3-putAttachment-api-time', seconds);

                });


                var startDateDb = new Date();
                let file_db = await Attachement.create({

                    id: uuid,
                    file_name: req.files.attachment.name,
                    mime_type: req.files.attachment.mimetype,
                    size: req.files.attachment.size,
                    md5: req.files.attachment.md5,
                    upload_date: dateformat(new Date(), "yyyy-mm-dd"),
                    url: "https://" + process.env.S3_BUCKET_NAME + ".s3.amazonaws.com" + "/" + req.params.id+"_"+req.files.attachment.name

                });

                const file_json = {
                    id: uuid,
                    file_name: req.files.attachment.name,
                    url: "https://" + process.env.S3_BUCKET_NAME + ".s3.amazonaws.com" + "/" + req.params.id+"_"+req.files.attachment.name,
                    upload_date: dateformat(new Date(), "yyyy-mm-dd")
                };

                await Bill.update(
                    {attachment : file_json},
                    {where: {id: req.params.id}}

                );

                await bill.setAttachement(file_db);
                var endDatedb   = new Date();
                var secondsdb = (endDatedb.getTime() - startDateDb.getTime()) / 1000;
                sdc.timing('attachment-create-db-time', secondsdb);
                res.status(201).send(file_json);
            }     else{
                       throw  new Error("Invalid Extension of attachment");
                logg.error({ error : 'Invalid Extension of attachment' });
            }

            var endDate   = new Date();
            var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
            sdc.timing('post-attachment-api-time', seconds);

        } catch (error) {
            let message = null;
            if (error instanceof Sequelize.ValidationError) {
                message = error.errors[0].message;
            }
            res.status(400).send(message || error.toString());
        }
    });


    app.get('/v1/bill/:billId/file/:fileId',async (req, res) => {
                try{
                    var startDate = new Date();

                    logg.info("GET Attachment api called");
                    sdc.increment('GET Attachment');
                    //validating the user
                    const user = await pv.validateUser(req, User);


                    const bills = await user.getBills({
                        where: { id: req.params.billId }
                    });

                    if (bills.length == 0) {
                        throw new Error('Invalid Bill Id');
                    }

                    const bill = bills[0];
                    const attachments = await bill.getAttachement({
                        where: { id: req.params.fileId }
                    });
                    var startDateDb = new Date();
                    const attachment_upload={
                        id:req.params.fileId,
                        file_name:attachments.file_name,
                        url:attachments.url,
                        upload_date:dateformat(attachments.upload_date,"yyyy-mm-dd")

                    }
                    if (attachments.length == 0) {
                        throw new Error('Invalid Attachment Id');
                    }
                    var endDatedb   = new Date();
                    var secondsdb = (endDatedb.getTime() - startDateDb.getTime()) / 1000;
                    sdc.timing('attachment-get-db-time', secondsdb);
                    res.status(200).send(attachment_upload);
                    logg.info({ success: "success" });

                    var endDate   = new Date();
                    var seconds = (endDate.getTime() - startDate.getTime()) / 1000;


                    sdc.timing('get-attachments-api-time', seconds);


                }catch(exp){
                    res.status(400).send(exp.toString());
                }
            var endDate   = new Date();
            var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
            sdc.timing('get-attachment-api-time', seconds);

            }
            );

    app.delete('/v1/bill/:billId/file/:fileId', async (req, res) => {
            try{
                var startDate = new Date();
                logg.info("Delete Attachment API called");
                sdc.increment('Delete Attachment by ID');

                const user = await pv.validateUser(req, User);

                const bills = await user.getBills({
                    where: { id: req.params.billId }
                });

                if (bills.length == 0) {
                    throw new Error('Invalid Bill Id');
                    logg.error({ error: 'Invalid Bill Id' });
                }

                const bill = bills[0];
                const attachments = await bill.getAttachement({
                    where: { id: req.params.fileId }
                });

                if (attachments.length == 0) {
                    throw new Error('Invalid Attachment Id');
                    logg.error({ error: 'Invalid Attachment Id' });
                }

                const attachment = attachments[0];

                //params = {Bucket: process.env.S3_BUCKET_NAME, Key: req.params.billId+"_"+attachments.name};

                var params = {
                    Bucket: process.env.S3_BUCKET_NAME,
                    Delete: { // required
                        Objects: [ // required
                            {
                                Key: req.params.billId+"_"+attachments.file_name // required
                            }
                        ],
                    },
                };

                s3.deleteObjects(params, function(err, data) {
                    var startDate = new Date();
                    if (err)
                    {
                        console.log(err, err.stack);
                        logg.error({ error:err.stack });

                    }
                    else
                    {console.log('delete', data);
                    logg.info({ success: "successfully deleted bucket" });
                    }
                    var endDate   = new Date();
                    var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                    sdc.timing('s3-delete-attachment-api-time', seconds);

                });

                  // await fs.promises.unlink(
                  //             `uploads/${req.params.billId}${attachments.file_name}`
                  //         );
                 //await bill.removeAttachment(attachment);


                var startDateDb = new Date();
                await Attachement.destroy({
                    where: {BillId: req.params.billId}

                });
                await Bill.update(
                    {attachment : { }},
                    {where: {id: req.params.billId}}
                );

                  //await attachment.destroy();
                var endDatedb   = new Date();
                var secondsdb = (endDatedb.getTime() - startDateDb.getTime()) / 1000;
                sdc.timing('Attachment-delete-db-time', secondsdb);
                res.status(204).send();
                logg.info({ success: "success" });
                var endDate   = new Date();
                var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
                sdc.timing('delete-attachment-api-time', seconds);
            }catch (e) {
                res.status(400).send(e.toString());
                logg.error({ error: e.toString() });
            }
        }
    );

        };


