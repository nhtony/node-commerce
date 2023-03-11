const express = require("express");
const router = express.Router();
const { apiKey, permission } = require("../auth/checkAuth");

// check apiKey
router.use(apiKey);
// check permission
router.use(permission("0000"));

router.use("/v1/api", require("./access"));

module.exports = router;
