import mysql from "mysql2/promise";

const g = globalThis;
if (!g._pool) {
  g._pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
    connectionLimit: 5,
    charset: "utf8mb4",
    timezone: "Z",
  });
  g._pool.on("connection", (c) => c.query("SET time_zone = '+00:00'"));
}
export const pool = g._pool;

let ready = g._dbReadyV5;
export async function db() {
  if (!ready) {
    ready = g._dbReadyV4 = (async () => {
      await pool.query(`CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(40) NOT NULL UNIQUE,
        password_hash VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARSET=utf8mb4`);
      await pool.query(`CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(80) NOT NULL,
        owner_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
      ) CHARSET=utf8mb4`);
      await pool.query(`CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_id INT NOT NULL,
        author VARCHAR(40) NOT NULL,
        user_id INT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (room_id, id),
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      ) CHARSET=utf8mb4`);
      await pool.query(`CREATE TABLE IF NOT EXISTS files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        mime VARCHAR(100) NOT NULL,
        data LONGBLOB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
      await pool.query("ALTER TABLE messages ADD COLUMN file_id INT NULL, ADD COLUMN file_mime VARCHAR(100) NULL")
        .catch((e) => { if (e.code !== "ER_DUP_FIELDNAME") throw e; });
      await pool.query(`ALTER TABLE rooms ADD COLUMN is_private TINYINT(1) NOT NULL DEFAULT 0,
        ADD COLUMN hidden TINYINT(1) NOT NULL DEFAULT 0, ADD COLUMN access_code VARCHAR(20) NULL UNIQUE,
        ADD COLUMN invite_token VARCHAR(32) NULL UNIQUE`)
        .catch((e) => { if (e.code !== "ER_DUP_FIELDNAME") throw e; });
      const addCols = (sql) => pool.query(sql).catch((e) => { if (e.code !== "ER_DUP_FIELDNAME") throw e; });
      await addCols("ALTER TABLE rooms ADD COLUMN kind VARCHAR(10) NOT NULL DEFAULT 'chat', ADD COLUMN calls_enabled TINYINT(1) NOT NULL DEFAULT 1, ADD COLUMN call_msg_id INT NULL");
      await addCols("ALTER TABLE messages ADD COLUMN call_kind VARCHAR(10) NULL, ADD COLUMN call_ended_at TIMESTAMP NULL");
      await pool.query(`CREATE TABLE IF NOT EXISTS call_participants (
        room_id INT NOT NULL, peer_id VARCHAR(40) NOT NULL, name VARCHAR(40) NOT NULL, user_id INT NULL,
        cam TINYINT(1) NOT NULL DEFAULT 0, mic TINYINT(1) NOT NULL DEFAULT 0, screen TINYINT(1) NOT NULL DEFAULT 0,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (room_id, peer_id),
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      ) CHARSET=utf8mb4`);
      await pool.query(`CREATE TABLE IF NOT EXISTS call_signals (
        id INT AUTO_INCREMENT PRIMARY KEY, room_id INT NOT NULL, from_peer VARCHAR(40) NOT NULL, to_peer VARCHAR(40) NOT NULL,
        data MEDIUMTEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX (to_peer, id),
        FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
      )`);
      await addCols("ALTER TABLE messages ADD COLUMN reply_to INT NULL");
      await pool.query(`CREATE TABLE IF NOT EXISTS message_likes (
        message_id INT NOT NULL, liker VARCHAR(60) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (message_id, liker),
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
      ) CHARSET=utf8mb4`);
      // arquivos esquecidos (enviados e nunca usados, ou de salas apagadas)
      await pool.query(`DELETE FROM files WHERE created_at < NOW() - INTERVAL 1 DAY
        AND id NOT IN (SELECT file_id FROM messages WHERE file_id IS NOT NULL)`);
      await pool.query("UPDATE rooms SET invite_token = SUBSTRING(MD5(CONCAT(id, RAND())), 1, 24) WHERE invite_token IS NULL");
    })().catch((e) => { ready = g._dbReadyV4 = null; throw e; });
  }
  await ready;
  return pool;
}
