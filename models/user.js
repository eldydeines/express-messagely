/** User class for message.ly */



/** User of the site. */

class User {

  /** register new user -- returns {username, password, first_name, last_name, phone} */
  static async register({ username, password, first_name, last_name, phone }) {
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone)
       VALUES($1, $2, $3, $4, $5)
       RETURNING username, password, first_name, last_name, phone`,
      [username, password, first_name, last_name, phone]);
    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */
  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT username, password 
       FROM users
       WHERE username = $1`,
      [username]);
    const currentUser = results.rows[0];

    if (currentUser) {
      if (await bcrypt.compare(password, CurrentUser.password)) {
        return true;
      }
      else
        return false;
    }

  }

  /** Update last_login_at for user */
  static async updateLoginTimestamp(username) {
    let last_login = new Date();
    await db.query(
      `UPDATE users
      SET last_login_at = $1
      WHERE username = $2`,
      [last_login, username]);
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */
  static async all() {
    const results = await db.query(`SELECT username, first_name, last_name, phone FROM users`);
    const allUsers = results.rows.map(r => new User(r.username, r.first_name, r.last_name, r.phone));
    return allUsers;
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
      throw new ExpressError("User not found", 404)
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
      `SELECT m.id, m.body, m.sent_at, m.read_at, u.username, u.first_name, u.last_name, u.phone 
       FROM messages AS m
       INNER JOIN users AS u ON (m.to_user = u.username)
       WHERE from_username = $1`,
      [username]);
    if (results.rows.length === 0) {
      throw new ExpressError("No messages not found", 404);
    }
    const toUsers = results.rows.map(r =>
      new User(r.id, r.body, r.sent_at, r.read_at, r.username, r.first_name, r.last_name, r.phone));
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
      `SELECT m.id, m.body, m.sent_at, m.read_at, u.username, u.first_name, u.last_name, u.phone 
       FROM messages AS m
       INNER JOIN users AS u ON (m.from_user = u.username)
       WHERE to_username = $1`,
      [username]);
    if (results.rows.length === 0) {
      throw new ExpressError("No messages not found", 404);
    }
    const fromUsers = results.rows.map(r =>
      new User(r.id, r.body, r.sent_at, r.read_at, r.username, r.first_name, r.last_name, r.phone));
    return fromUsers;
  }

}

module.exports = User;