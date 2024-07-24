const express = require('express');
const sql = require("mssql");
let router = express.Router();
var config = require('./config');
let initWebRoutes = (app) => {
    router.get('/', (req, res) => {
        res.send('Hello World');
    });
    router.get("/icon", (req, res) => {
        res.send('😀😃😄😁😆😅🤣😂');
    });

    router.post("/insertData", async (req, res) => {
        try {
            let data = req.body;

            const { SBD, FullName, CMND, BirthDate, Gender, PriorityGroup, PriorityArea, EncouragementScore, AdmissionStatus, Choice1, Choice2, Choice3, Choice4 } = data;

            const pool = await sql.connect(config);

            let isExist = await checkUserCredential(SBD, CMND);
            const request = new sql.Request(pool);
            if (!isExist) {

                const query = `
                    INSERT INTO Student( SBD, FullName, CMND, BirthDate, Gender, PriorityGroup, PriorityArea, EncouragementScore, AdmissionStatus, Choice1, Choice2, Choice3, Choice4)
                    VALUES ( @SBD, @FullName, @CMND, @BirthDate, @Gender, @PriorityGroup, @PriorityArea, @EncouragementScore, @AdmissionStatus, @Choice1, @Choice2, @Choice3, @Choice4)

                `;

                // Xử lý ngày tháng
                let formattedBirthDate;
                if (BirthDate) {
                    // Giả sử BirthDate có định dạng 'DD/MM/YYYY'
                    const [day, month, year] = BirthDate.split('/');
                    formattedBirthDate = new Date(year, month - 1, day);

                    if (isNaN(formattedBirthDate.getTime())) {
                        throw new Error('Invalid BirthDate format');
                    }
                }
                let processedEncouragementScore = EncouragementScore === "" ? 0 : parseFloat(EncouragementScore);

                request.input('SBD', sql.NVarChar, SBD);
                request.input('FullName', sql.NVarChar, FullName);
                request.input('CMND', sql.VarChar, CMND);
                request.input('BirthDate', sql.Date, formattedBirthDate);
                request.input('Gender', sql.NVarChar, Gender);
                request.input('PriorityGroup', sql.NVarChar, PriorityGroup);
                request.input('PriorityArea', sql.NVarChar, PriorityArea);
                request.input('EncouragementScore', sql.Float, processedEncouragementScore);
                request.input('AdmissionStatus', sql.NVarChar, AdmissionStatus);
                request.input('Choice1', sql.VarChar, Choice1);
                request.input('Choice2', sql.VarChar, Choice2);
                request.input('Choice3', sql.VarChar, Choice3);
                request.input('Choice4', sql.VarChar, Choice4);

                await request.query(query);

                await request.query(query2);

                res.send('Insert data successfully');
            } else {
                if (await checkSameChoice(SBD, Choice1, Choice2, Choice3, Choice4)) {

                    const query2 = `
                    INSERT INTO Choice(StudentID, Choice1, Choice2, Choice3, Choice4)
                    VALUES ((SELECT STT FROM Student WHERE SBD = @SBD), @Choice1, @Choice2, @Choice3, @Choice4)
                    `;

                    request.input('SBD', sql.NVarChar, SBD);
                    request.input('Choice1', sql.VarChar, Choice1);
                    request.input('Choice2', sql.VarChar, Choice2);
                    request.input('Choice3', sql.VarChar, Choice3);
                    request.input('Choice4', sql.VarChar, Choice4);

                    await request.query(query2);

                    res.send('Insert data successfully');
                }
            }
        } catch (err) {
            console.error(err);
            res.status(500).send(`An error occurred while inserting data: ${err.message}`);
        }
    });

    router.post("/insertTotal", async (req, res) => {
        try {
            let data = req.body;

            const { TotalStudent } = data;
            console.log(data)
            const totaParse = parseInt(TotalStudent);

            console.log(totaParse)
            const pool = await sql.connect(config);

            const request = new sql.Request(pool);
            const query = `
                INSERT INTO StudentCount(StudentCount)
                VALUES (@Total)
            `;

            request.input('Total', sql.Int, totaParse);

            await request.query(query);

            res.send('Insert total successfully');
        } catch (err) {
            console.error(err);
            res.status(500).send(`An error occurred while inserting total: ${err.message}`);
        }
    });

    router.get("/getStudent", async (req, res) => {
        try {
            const pool = await sql.connect(config);

            const request = new sql.Request(pool);
            const query = `
                SELECT * FROM Student
            `;

            const result = await request.query(query);

            res.send(result.recordset);
        } catch (err) {
            console.error(err);
            res.status(500).send(`An error occurred while getting total: ${err.message}`);
        }
    });

    router.get("/getTotal", async (req, res) => {
        try {
            const pool = await sql.connect(config);

            const request = new sql.Request(pool);
            const query = `
                SELECT * FROM StudentCount
            `;

            const result = await request.query(query);

            res.send(result.recordset);
        } catch (err) {
            console.error(err);
            res.status(500).send(`An error occurred while getting total: ${err.message}`);
        }
    });

    const checkUserCredential = (SBD, CMND) => {
        return new Promise(async (resolve, reject) => {
            const pool = await new sql.ConnectionPool(config);
            pool.connect().then(() => {
                const request = new sql.Request(pool);
                request.query(`SELECT * FROM Student WHERE SBD = '${SBD}' AND CMND = '${CMND}'`, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (result.recordset.length > 0) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    }
                });
            }).catch(err => {
                reject(err);
            });
        });
    }

    const checkSameChoice = (SBD, Choice1, Choice2, Choice3, Choice4) => {
        return new Promise(async (resolve, reject) => {
            const pool = await new sql.ConnectionPool(config);
            pool.connect().then(() => {
                const request = new sql.Request(pool);
                request.query(`SELECT * FROM Choice WHERE StudentID = (SELECT STT FROM Student WHERE SBD = '${SBD}') AND Choice1 = '${Choice1}' AND Choice2 = '${Choice2}' AND Choice3 = '${Choice3}' AND Choice4 = '${Choice4}'`, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        if (result.recordset.length > 0) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    }
                });
            }).catch(err => {
                reject(err);
            });
        });
    }

    return app.use("/", router);
};

module.exports = initWebRoutes;