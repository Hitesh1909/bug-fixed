const express = require("express");

function createCategoriesRouter(controller) {
  const router = express.Router();
  router.get("/", controller.list);
  return router;
}

function createDashboardRouter(controller) {
  const router = express.Router();
  router.get("/stats", controller.stats);
  return router;
}

module.exports = { createCategoriesRouter, createDashboardRouter };
