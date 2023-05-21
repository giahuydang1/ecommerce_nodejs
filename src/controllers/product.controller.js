'use strict'

const ProductService = require("../services/product.service")
const ProductServiceV2 = require("../services/product.service.xxx")

const { SuccessResponse } = require('../core/success.response')

class ProductController {

    // createProduct = async(req, res, next) => {
    //     new SuccessResponse({
    //         message: 'Create new product success!',
    //         metadata: await ProductService.createProduct(req.body.product_type, {
    //             ...req.body,
    //             product_shop: req.user.userId
    //         })
    //     }).send(res)
    // }

    // V2
    createProduct = async(req, res, next) => {
        new SuccessResponse({
            message: 'Create new product success!',
            metadata: await ProductServiceV2.createProduct(req.body.product_type, {
                ...req.body,
                product_shop: req.user.userId
            })
        }).send(res)
    }

    publishProductByShop = async(req, res, next) => {
        new SuccessResponse({
            message: 'publishProductByShop success!',
            metadata: await ProductServiceV2.publishProductByShop({
                product_id: req.params.id,
                product_shop: req.user.userId
            })
        }).send(res)
    }

    unPublishProductByShop = async(req, res, next) => {
        new SuccessResponse({
            message: 'unPublishProductByShop success!',
            metadata: await ProductServiceV2.unPublishProductByShop({
                product_id: req.params.id,
                product_shop: req.user.userId
            })
        }).send(res)
    }

    // Query //
    /**
     * @desc Get all Drafts for shop
     * @param {Number} limit
     * @param {Number} skip
     * @return {JSON} 
     */
    getAllDraftsForShop = async(req, res, next) => {
        new SuccessResponse({
            message: 'Get list Draft success!',
            metadata: await ProductServiceV2.findAllDraftsForShop({
                product_shop: req.user.userId
            })
        }).send(res)
    }

    getAllPublishForShop = async(req, res, next) => {
        new SuccessResponse({
            message: 'Get list getAllPublishForShop success!',
            metadata: await ProductServiceV2.findAllPublishForShop({
                product_shop: req.user.userId
            })
        }).send(res)
    }

    getListSearchProduct = async(req, res, next) => {
        new SuccessResponse({
            message: 'Get list getListSearchProduct success!',
            metadata: await ProductServiceV2.searchProducts(req.params)
        }).send(res)
    }
    // End Query
}

module.exports = new ProductController()