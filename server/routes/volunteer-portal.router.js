const express = require('express');
const { rejectUnauthenticated } = require('../modules/authentication-middleware');
const { rejectNonVetted } = require('../modules/isVettedVolunteerAuthentication-middleware');
const pool = require('../modules/pool');
const router = express.Router();


router.get('/', rejectUnauthenticated, rejectNonVetted, (req, res) => {
    let queryText = ``;
    pool.query(queryText)
        .then((result) => {
            console.log('in volunteer GET router:', result.rows);
            res.send(result.rows);
        })
        .catch((error) => {
            console.log('error in volunteer GET router:', error)
            res.sendStatus(500)
        })
})

router.get('/hours', rejectUnauthenticated, rejectNonVetted, (req, res) => {
    let queryText = `
        SELECT
            "Shift"."BadgeNumber",
            "Attendee"."FirstName",
            "Attendee"."LastName",
            "VolunteerContact"."VolunteerDiscord",
        -- the ShiftsScheduled and ShiftsWorked tables are aliases created by the joins below
            "ShiftsScheduled"."TotalScheduled" AS "HoursScheduled",
        -- coalesce to make sure NULL values are converted to zero --
            COALESCE("ShiftsWorked"."TotalWorked", 0) + COALESCE("VolunteerContact"."VolunteerHours", 0) AS "HoursWorked"
        FROM "Shift"
        -- create a table from a subquery with the counts of total shifts containing distinct badge numbers --
        INNER JOIN (
                SELECT "BadgeNumber", COUNT("ShiftID") AS "TotalScheduled" FROM "Shift"
                WHERE "BadgeNumber" IS NOT NULL
                GROUP BY "BadgeNumber"
            ) AS "ShiftsScheduled"
            ON "Shift"."BadgeNumber" = "ShiftsScheduled"."BadgeNumber"
        -- create another table counting only shifts that have already happened (or at least started)
        -- where the user has not been flagged as a no-show
        -- (outer join in case all someone's shifts are in the future)
        LEFT OUTER JOIN (
                SELECT "BadgeNumber", COUNT("ShiftID") AS "TotalWorked" FROM "Shift"
                WHERE "BadgeNumber" IS NOT NULL
                AND "NoShow" IS false
                AND (
                    "Shift"."ShiftDate" < CURRENT_DATE
                    OR (
                        "Shift"."ShiftDate" = CURRENT_DATE
                        AND "Shift"."ShiftTime" < CURRENT_TIME
                    )
                )
                GROUP BY "BadgeNumber"
            ) AS "ShiftsWorked"
            ON "Shift"."BadgeNumber" = "ShiftsWorked"."BadgeNumber"
        -- bring in attendee data for all shift volunteers
        INNER JOIN "Attendee" ON "Shift"."BadgeNumber" = "Attendee"."BadgeNumber"
        -- bring in volunteer data for everyone in the volunteer table
        -- (outer join in case so nobody who isn't in there yet)
        LEFT OUTER JOIN "VolunteerContact" ON "Attendee"."VolunteerID" = "VolunteerContact"."VolunteerID"
        GROUP BY "Shift"."BadgeNumber", "Attendee"."FirstName", "Attendee"."LastName", "VolunteerContact"."VolunteerDiscord", "VolunteerContact"."VolunteerHours", "ShiftsScheduled"."TotalScheduled", "ShiftsWorked"."TotalWorked";
    `;
    pool.query(queryText)
        .then((result) => {
            console.log('in volunteer hours GET router:', result.rows);
            res.send(result.rows);
        })
        .catch((error) => {
            console.log('error in volunteer hours GET router:', error)
            res.sendStatus(500)
        })
})


module.exports = router;