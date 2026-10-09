const {
  requiredText,
  requiredYear,
  requiredPrice,
  requiredQuantity,
  parseId,
} = require("../middleware/validate");

function createBookService(repository) {
  function listBooks(query) {
    return repository.findAll(query);
  }

  function getBook(id) {
    const parsed = parseId(id);
    if (parsed === null) {
      return null;
    }
    return repository.findById(parsed);
  }

  function createBook(input) {
    return repository.create(validateBook(input));
  }

  function updateBook(id, title, author, isbn, category, publishedYear, price, quantity) {
    const parsed = parseId(id);
    if (parsed === null) {
      return null;
    }
    const fields = validateBook({
      title,
      author,
      isbn,
      category,
      published_year: publishedYear,
      price,
      quantity,
    });
    return repository.update(parsed, fields);
  }

  function deleteBook(id) {
    const parsed = parseId(id);
    if (parsed === null) {
      return false;
    }
    return repository.remove(parsed);
  }

  function searchBooks(q) {
    if (typeof q !== "string" || q.trim() === "") {
      const error = new Error("Search text is required");
      error.status = 400;
      throw error;
    }
    return repository.search(q.trim());
  }

  return { listBooks, getBook, createBook, updateBook, deleteBook, searchBooks };
}

function validateBook(input) {
  const title = requiredText(input.title, "Title");
  const author = requiredText(input.author, "Author");
  const isbn = requiredText(input.isbn, "ISBN").replace(/-/g, "");
  const category = requiredText(input.category, "Category");
  const publishedYear = requiredYear(input.published_year);
  const price = requiredPrice(input.price);
  const quantity = requiredQuantity(input.quantity);
  if (!/^\d{10}(\d{3})?$/.test(isbn)) {
    const error = new Error("ISBN must contain 10 or 13 digits");
    error.status = 400;
    throw error;
  }
  return {
    title,
    author,
    isbn,
    category,
    published_year: publishedYear,
    price,
    quantity,
  };
}

module.exports = { createBookService };
