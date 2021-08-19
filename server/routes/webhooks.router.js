const express = require('express');
const pool = require('../modules/pool');
const router = express.Router();


/**
 * GET route template
 */
router.get('/order-created', (req, res) => {

});

/**
 * POST route template
 */


const logExternal = (status, message) => {
    const axios = require('axios');
    const url = "https://webhook.site/688b8302-ff63-4f25-878f-cd9fded384bc";
    axios.post(url, {status, message})
        .then( res => {

        })
        .catch(e => {

        })
}

const respond = (res, status, message, extLog = true) => {
    res.status(status);
    res.json(message);
    res.end();
    if(extLog) logExternal(status, message);
}

router.post('/order-created', async (req, res) => {
    //pull data from the request body and send it over to the database pool
    const { line_items, id, billing } = req.body;
    const phone = billing?.phone;
    const email = billing?.email;
    const registerProductId = 32675;// the WP Post ID of the registration product

    const newRows = line_items?.filter(i => i.product_id === registerProductId).map( registration => {
        return registration?.meta_data?.reduce((acc, current) => {
            const {key, value} = current;
            switch (key.toLowerCase()){
                case 'first name':
                    acc['fisrtName'] = value.trim();
                    break;
                case 'last name':
                    acc['lastName'] = value.trim();
                    break;
                case 'date of birth':
                    acc['dateOfBirth'] = value.trim();
                    break;
                case 'badge name':
                    acc['badgeName'] = value.trim();
                    break;
                default: break;
            }
            return acc;
        }, { id, phone, email });

    });

    //if there are any actual registration orders in this order created webhook...
    if( newRows && newRows.length > 0 ){
        console.log('has rows', newRows.length);
        //const connection = await pool.connect();

        const addRow = async row => {
            const queryText = `INSERT INTO "Attendee" ("LastName", "FirstName", "DateOfBirth", "BadgeName", "EmailAddress", "PhoneNumber", "orderID") VALUES ($1, $2, $3, $4, $5, $6, $7);`;
            await pool.query(queryText, [row.lastName, row.firstName, row.dateOfBirth, row.badgeName, row.email, row.phone, row.id]);
        }

        try {
            console.log("starting database query")
           // await pool.query('BEGIN');
            newRows.forEach(addRow);
            //await pool.query('COMMIT');
            const successMsg = {message: "Attendee added", details: req.body};
            console.log('pre success message');
            respond(res, 200, successMsg);
            console.log('post success message, it worked!!!!');
        } catch (error){
            console.log("query error:", error);
            //await connection.query('ROLLBACK');
            const errorMsg = {error};
            respond(res, 500, errorMsg);
        } finally {
            //connection.release();
        }

    } else {
        console.log('has no rows');
        const noneFoundMsg = {payload: req.body, message: "No Registration products found"};
        respond(res,200, noneFoundMsg);
    }
});


router.post('/santiy-check', ((req, res) => {
    respond(res, 200, {
        pool,
        dburl: process.env.DATABASE_URL
    });
}));

module.exports = router;