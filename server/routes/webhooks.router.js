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
                    acc['fisrtName'] = value;
                    break;
                case 'last name':
                    acc['lastName'] = value;
                    break;
                case 'date of birth':
                    acc['dateOfBirth'] = value;
                    break;
                case 'badge name':
                    acc['badgeName'] = value;
                    break;
                default: break;
            }
            return acc;
        }, { id, phone, email });

    });

    const logExternal = (status, message) => {
        const axios = require('axios');
        const url = "https://webhook.site/688b8302-ff63-4f25-878f-cd9fded384bc";
        axios.post(url, {status, message})
            .then( res => {

            })
            .catch(e => {

            })
    }

    //if there are any actual registration orders in this order created webhook...
    if( newRows && newRows.length ){
        const connection = await pool.connect();

        const addRow = async row => {
            const queryText = `INSERT INTO "Attendee" ("LastName", "FirstName", "DateOfBirth", "BadgeName", "EmailAddress", "PhoneNumber", "orderID") VALUES ($1, $2, $3, $4, $5, $6, $7);`;
            await connection.query(queryText, [row.firstName, row.lastName, row.dateOfBirth, row.badgeName, row.email, row.phone, row.id]);
        }

        try {
            await connection.query('BEGIN');
            newRows.forEach(addRow);
            await connection.query('COMMIT');
            const successMsg = {message: "Attendee added", details: req.body};
            res.status(200);
            res.send(JSON.stringify(successMsg));
            logExternal(200, successMsg);
        } catch (error){
            await connection.query('ROLLBACK');
            const errorMsg = {error};
            res.sendStatus(500);
            res.send(JSON.stringify(errorMsg));
            logExternal(500, errorMsg);
        } finally {
            connection.release();
        }
    } else {
        const noneFoundMsg = {payload: req.body, message: "No Registration products found"};
        res.status(200);
        res.send(JSON.stringify(noneFoundMsg));
        logExternal(200, noneFoundMsg);
    }
});

module.exports = router;