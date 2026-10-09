function createCategoryController(categoryService) {
  function list(req, res, next) {
    try {
      res.json(categoryService.listCategories());
    } catch (error) {
      next(error);
    }
  }

  return { list };
}

function createDashboardController(statsRepository) {
  function stats(req, res, next) {
    try {
      res.json(statsRepository.getStats());
    } catch (error) {
      next(error);
    }
  }

  return { stats };
}

module.exports = { createCategoryController, createDashboardController };
