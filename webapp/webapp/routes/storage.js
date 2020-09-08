const Sequelize = require('sequelize');
const mysql = require("mysql");
require('dotenv').config();


//nupur

// const sequelize = new Sequelize(
//     'csye6225',
//     'root',
//     'Nupur@0330',
//     {
//         host: 'localhost',
//         port: 3306,
//         dialect: 'mysql',
//         //storage: 'app.db'
//     }
// );
const sequelize = new Sequelize(
    'csye6225',
    process.env.rds_Username,
    process.env.RDS_UserPassword,
    {
        host: process.env.RDS_HOSTNAME,
        port: 3306,
        dialect: 'mysql',
        logging: console.log,
        maxConcurrentQueries: 100,
        dialectOptions: {
            ssl:'Amazon RDS'
        },
        pool: { maxConnections: 5, maxIdleTime: 30},
        language: 'en'

    }
);

//nupur


class User extends Sequelize.Model {}

User.init(
    {
        id: {
            type: Sequelize.UUID,
            primaryKey: true, msg:"Id cannot be null"
        },
        first_name: {
            type: Sequelize.STRING, allowNull: false, msg:"First name cannot be null"
        },
        last_name: {
            type: Sequelize.STRING, allowNull: false, msg:"Last name cannot be null"
        },
        password: {
            type: Sequelize.STRING, allowNull: false,
            len: {
                args: [8, 128],
                msg: "Password  must be between 8 and 128 characters in length"
            },
        },
        email_address: {
            type: Sequelize.STRING, allowNull: false, unique: true, isEmail: true
        }

    },
    {
        sequelize,
        timestamps: true, updatedAt: 'account_updated', createdAt: 'account_created'
    });

class Bill extends Sequelize.Model {}

Bill.init(
    {
        id: {
            type: Sequelize.UUID, allowNull: false,
            primaryKey: true, msg:"Id must be unique"
        },
        vendor: {
            type: Sequelize.STRING,
            allowNull: false
        },
        bill_date: {
            type: Sequelize.DATE,
            allowNull: false,
            msg:"bill_date cannot be null"
        },
        due_date: {
            type: Sequelize.DATE,
            allowNull: false,
            msg:"due_date cannot be null"
        },
        payment_status: {
            type: Sequelize.ENUM({
                values: [
                    'paid',
                    'due',
                    'past_due',
                    'no_payment_required'
                ]
            }),
            allowNull: false,
            msg:"payment_status cannot have a null value"
        },
        categories: {
            type: Sequelize.JSON
        },
        amount_due: {
            type: Sequelize.DOUBLE,
            validate: { min: 0.01, max: 1000000 },
            allowNull: false,
            msg:"amount_due cannot be null"
        },
        attachment: {
            type: Sequelize.JSON
        }
    },
    {
        sequelize,
        timestamps: true,
        updatedAt: 'updated_at',
        createdAt: 'created_at'
    }
);


//file
class Attachement extends Sequelize.Model {}

Attachement.init(
    {
        id: {
            type: Sequelize.UUID,
            allowNull: false,
            primaryKey: true, msg:"Id must be unique"
        },
        file_name: {
            type: Sequelize.STRING,
            //defaultValue: "abc"
            allowNull: false,

        },
        size: {
            type: Sequelize.STRING,
            allowNull: false
        },
        md5: {
            type: Sequelize.STRING,
            allowNull: false
        },
        mime_type: {
            type: Sequelize.STRING,
            allowNull: false
        },
        url: {
            type: Sequelize.STRING,
            allowNull: false
        },
        upload_date: {
            type: Sequelize.DATE,
            allowNull: false
        }
    },
    {
        sequelize,
        timestamps :false

    }
);
User.hasMany(Bill, { as: 'bills' });
Bill.hasOne(Attachement,{onDelete: "cascade"});
const init = async () => {
    await sequelize.authenticate();
    await sequelize.sync();
};

module.exports = { User, Bill,Attachement, init };
