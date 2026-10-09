const books = [
  ["The Left Hand of Darkness", "Ursula K. Le Guin", "9780441478125", "Fiction", 1969, 14.99, 4],
  ["Dune", "Frank Herbert", "9780441172719", "Fiction", 1965, 18.5, 1],
  ["The Martian", "Andy Weir", "9780553418026", "Fiction", 2011, 16, 6],
  ["Kindred", "Octavia E. Butler", "9780807083697", "Fiction", 1979, 16.95, 5],
  ["A Brief History of Time", "Stephen Hawking", "9780553380163", "Science", 1988, 15, 3],
  ["The Selfish Gene", "Richard Dawkins", "9780198788607", "Science", 1976, 17.25, 0],
  ["Cosmos", "Carl Sagan", "9780345539434", "Science", 1980, 18, 5],
  ["Sapiens", "Yuval Noah Harari", "9780062316097", "History", 2011, 21, 8],
  ["Guns, Germs, and Steel", "Jared Diamond", "9780393317558", "History", 1997, 19.5, 2],
  ["The Silk Roads", "Peter Frankopan", "9781101912379", "History", 2015, 20, 1],
  ["Clean Code", "Robert C. Martin", "9780132350884", "Technology", 2008, 39.99, 7],
  ["The Pragmatic Programmer", "Andrew Hunt", "9780135957059", "Technology", 1999, 42, 3],
  ["Designing Data-Intensive Applications", "Martin Kleppmann", "9781449373320", "Technology", 2017, 49.99, 2],
  ["Steve Jobs", "Walter Isaacson", "9781451648539", "Biography", 2011, 22, 4],
  ["The Diary of a Young Girl", "Anne Frank", "9780553296983", "Biography", 1947, 11, 9],
  ["Long Walk to Freedom", "Nelson Mandela", "9780316548182", "Biography", 1994, 18.99, 0],
];

function seed(db) {
  const insert = db.prepare(
    "INSERT INTO books (title, author, isbn, category, published_year, price, quantity) VALUES (?, ?, ?, ?, ?, ?, ?)"
  );
  db.exec("BEGIN");
  try {
    for (const row of books) {
      insert.run(...row);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

module.exports = { seed };
