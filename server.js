const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const initWebRoutes = require('./route');

var config = require('./config');
const sql = require('mssql');
dotenv.config();

const PORT = process.env.PORT || 8080;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Thay đổi cấu hình CORS để cho phép tất cả các origin
app.use(
    cors({
        origin: '*', // Cho phép tất cả các origin
        credentials: true,
        optionsSuccessStatus: 200,
        methods: "GET,POST,PUT,DELETE",
    })
);

initWebRoutes(app);

// Database connection
sql.connect(config).then(pool => {
    if (pool.connected) {
        console.log('Connected to database');
    } else {
        console.log('Failed to connect to database');
    }
}).catch(err => {
    console.error('Database connection failed: ', err);
});

app.listen(PORT, () => {
    console.log('Student API is running at ' + PORT);
});

module.exports = app;