const express = require("express");
const router = new express.Router();
const Message = require("../models/message");
const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const ExpressError = require("../expressError")


/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get('/:id', ensureLoggedIn, async (req, res, next) => {
    try {
        let { id } = req.params;
        let result = await Message.get(id);
        if (result.from_user.username == req.user.username || result.to_user.username == req.user.username) {
            res.json(result);
        }
        else {
            throw new ExpressError(`Not authorized`, 401);
        }
    }
    catch (e) {
        return next(e);
    }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post('/', ensureLoggedIn, async (req, res, next) => {
    try {
        let { to_username, body } = req.body;
        let result = await Message.create(req.user.username, to_username, body);
        res.json(result);
    }
    catch (e) {
        return next(e);
    }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.post('/:id/read', ensureLoggedIn, async (req, res, next) => {
    try {
        let { id } = req.params;
        let result = await Message.get(id);
        if (result.to_user.username == req.user.username) {
            let messageTo = await Message.markRead(id);
            res.json(messageTo);
        }
        else {
            throw new ExpressError("Message not for you. Unauthorized.", 401);
        }
    }
    catch (e) {
        return next(e);
    }
});

module.exports = router;
