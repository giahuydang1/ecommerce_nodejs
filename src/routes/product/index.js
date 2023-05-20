'use strict'

const express = require('express')
const productController = require('../../controllers/product.controller')
const { asyncHandler } = require('../../auth/checkAuth')
const { authenticationV2 } = require('../../auth/authUtils')
const router = express.Router()

// Authentication
router.use(authenticationV2)

router.post('', asyncHandler(productController.createProduct))

module.exports = router