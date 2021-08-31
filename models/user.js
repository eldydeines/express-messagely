/** User class for message.ly */
/** Message class for message.ly */

const db = require("../db");
const ExpressError = require("../expressError");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR, SECRET_KEY } = require("../config");

/** User of the site. */

class User {

  /** register new user -- returns {username, password, first_name, last_name, phone} */
  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
       VALUES($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
       RETURNING username, password, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]);
    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */
  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT username, password 
       FROM users
       WHERE username = $1`,
      [username]);
    const currentUser = result.rows[0];

    if (currentUser && await bcrypt.compare(password, currentUser.password)) {
      return true;
    }
    else {
      return false;
    }

  }

  /** Update last_login_at for user */
  static async updateLoginTimestamp(username) {
    await db.query(
      `UPDATE users
      SET last_login_at = current_timestamp
      WHERE username = $1`,
      [username]);
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */
  static async all() {
    const results = await db.query(`SELECT username, first_name, last_name, phone FROM users`);
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */
  static async get(username) {
    const results = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
       FROM users
       WHERE username = $1`,
      [username]);
    const currentUser = results.rows[0];
    if (!currentUser) {
      throw new ExpressError(`${username} not found`, 404)
    }
    return currentUser;
  }


  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */
  static async messagesFrom(username) {
    const results = await db.query(
      `SELECT m.id, m.body, m.sent_at, m.read_at, m.to_username, u.first_name, u.last_name, u.phone 
       FROM messages AS m
       INNER JOIN users AS u ON (m.to_username = u.username)
       WHERE from_username = $1`,
      [username]);
    if (results.rows.length === 0) {
      throw new ExpressError("No messages not found", 404);
    }
    const toUsers = results.rows.map(r => ({ id: r.id, body: r.body, sent_at: r.sent_at, read_at: r.read_at, to_user: { username: r.to_username, first_name: r.first_name, last_name: r.last_name, phone: r.phone } }));
    return toUsers;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */
  static async messagesTo(username) {
    const results = await db.query(
      `SELECT m.id, m.body, m.sent_at, m.read_at, m.from_username, u.first_name, u.last_name, u.phone 
       FROM messages AS m
       INNER JOIN users AS u ON (m.from_username = u.username)
       WHERE to_username = $1`,
      [username]);
    if (results.rows.length === 0) {
      throw new ExpressError("No messages not found", 404);
    }
    const fromUsers = results.rows.map(r => ({ id: r.id, body: r.body, sent_at: r.sent_at, read_at: r.read_at, from_user: { username: r.from_username, first_name: r.first_name, last_name: r.last_name, phone: r.phone } }));
    return fromUsers;
  }

}

module.exports = User;