const express = require("express");
const controller = require("../controllers/productController");

const router = express.Router();

router.get("/products", controller.listProducts);
router.get("/products/:id", controller.getProduct);

module.exports = router;