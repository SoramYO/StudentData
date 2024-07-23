require('dotenv').config();
const config = {
    user: process.env.USER_DATABASE, // sql user
    password: process.env.PASSWORD_DATABASE, //sql user password
    server: process.env.SERVER_DATABASE, // if it does not work try- localhost
    database: process.env.DATABASE,
    options: {
        encrypt: true,
        enableArithAbort: true
    },
    port: 1433
}

module.exports = config;