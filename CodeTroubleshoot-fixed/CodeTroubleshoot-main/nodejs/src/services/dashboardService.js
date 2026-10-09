function createCategoryService(repository) {
  function listCategories() {
    return repository.listCategories();
  }

  return { listCategories };
}

module.exports = { createCategoryService };
