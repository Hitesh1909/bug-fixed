const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");
const { seed } = require("./seed");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  published_year INTEGER NOT NULL,
  price REAL NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

function openDatabase(dbPath) {
  if (dbPath !== ":memory:") {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(SCHEMA);
  const count = db.prepare("SELECT COUNT(*) AS count FROM books").get().count;
  if (count === 0) {
    seed(db);
  }
  return db;
}

if (require.main === module) {
  const config = require("../config");
  openDatabase(config.dbPath);
}

module.exports = { openDatabase };
