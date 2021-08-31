/** Routes for demonstrating authentication in Express. */

const express = require("express");
const router = new express.Router();
const ExpressError = require("../expressError");
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            throw new ExpressError("Username and password required", 400);
        }
        let result = await User.authenticate(username, password);
        if (result) {
            User.updateLoginTimestamp(username);
            const token = jwt.sign({ username }, SECRET_KEY);
            return res.json({ message: `Logged in!`, token })
        }
        else {
            throw new ExpressError("Invalid username/password", 400);
        }
    } catch (e) {
        return next(e);
    }
})

/** POST /register - register user: registers, logs in, and returns token.
 * {username, password, first_name, last_name, phone} => {token}.
 *  Make sure to update their last-login!
 */
router.post('/register', async (req, res, next) => {
    try {
        const { username, password, first_name, last_name, phone } = req.body;
        if (!username || !password) {
            throw new ExpressError("Username and password required", 400);
        }

        let result = await User.register({ username, password, first_name, last_name, phone });
        User.updateLoginTimestamp(username);
        let token = jwt.sign({ username }, SECRET_KEY);
        return res.json({ token });

    } catch (e) {
        if (e.code === '23505') {
            return next(new ExpressError("Username taken. Please pick another!", 400));
        }
        return next(e)
    }
});

module.exports = router;
