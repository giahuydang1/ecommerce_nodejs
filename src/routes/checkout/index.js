'use strict'

const express = require('express')
const checkoutController = require('../../controllers/checkout.controller')
const { asyncHandler } = require('../../auth/checkAuth')
const { authenticationV2 } = require('../../auth/authUtils')
const router = express.Router()

router.post('/review', asyncHandler(checkoutController.checkoutReview))

// Authentication
// router.use(authenticationV2)



module.exports = router