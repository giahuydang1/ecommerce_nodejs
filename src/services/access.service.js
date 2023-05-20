'use strict'

const shopModel = require("../models/shop.model")
const bcrypt = require('bcrypt')
const crypto = require('node:crypto')
const keyTokenService = require("./keyToken.service")
const { createTokenPair, verifyJWT } = require("../auth/authUtils")
const { getInfoData } = require("../utils")
const { BadRequestError, ConflictRequestError, AuthFailureError, ForbiddenError } = require("../core/error.response")
const { findByEmail } = require("./shop.service")
const KeyTokenService = require("./keyToken.service")

const RoleShop = {
    SHOP: 'SHOP',
    WRITER: 'WRITER',
    EDITOR: 'EDITOR',
    ADMIN: 'ADMIN'
}

class AccessService {

    static handleRefreshTokenV2 = async ( {keyStore, user, refreshToken} ) => {

        const { userId, email } = user;
        console.log(keyStore.refreshTokensUsed.includes(refreshToken));
        if(keyStore.refreshTokensUsed.includes(refreshToken)) {
            await keyTokenService.deleteKeyById(userId)
            throw new ForbiddenError('Something wrong happend !! Pls relogin')
        }

        if(keyStore.refreshToken !== refreshToken) throw new AuthFailureError('Shop not registered! 1')

        const foundShop = await findByEmail({ email })
        if(!foundShop) throw new AuthFailureError('Shop not registered! 2')
        const tokens = await createTokenPair({userId, email}, keyStore.publicKey, keyStore.privateKey)

        // update token
        await keyStore.updateOne({
            $set: {
                refreshToken: tokens.refreshToken
            },
            $addToSet: {
                refreshTokensUsed: refreshToken // da duoc su dung de lay token moi
            }
        })

        return {
            user,
            tokens
        }
    }

    /*
        check this token used
    */
    static handleRefreshToken = async ( refreshToken ) => {
        // check token has been used?
        const foundToken = await KeyTokenService.findByRefreshTokenUsed( refreshToken )
        // if used
        if(foundToken) {
            // decode to check
            const { userId, email } = await verifyJWT( refreshToken, foundToken.privateKey )
            console.log({ userId, email });
            // delete all token in keyStore
            await keyTokenService.deleteKeyById(userId)
            throw new ForbiddenError('Something wrong happend !! Pls relogin')
        }

        // No used
        const holderToken = await KeyTokenService.findByRefreshToken( refreshToken )
        if(!holderToken) throw new AuthFailureError('Shop not registered! 1')

        // verifyToken
        const { userId, email } = await verifyJWT( refreshToken, holderToken.privateKey )
        console.log('[2]--', { userId, email })

        // check userId
        const foundShop = await findByEmail({ email })
        if(!foundShop) throw new AuthFailureError('Shop not registered! 2')

        // create new one
        const tokens = await createTokenPair({userId, email}, holderToken.publicKey, holderToken.privateKey)

        // update token
        await holderToken.updateOne({
            $set: {
                refreshToken: tokens.refreshToken
            },
            $addToSet: {
                refreshTokenUsed: refreshToken // da duoc su dung de lay token moi
            }
        })

        return {
            user: { userId, email },
            tokens
        }
    }

    static logout = async(keyStore) => {
        const delKey = await KeyTokenService.removeKeyById(keyStore._id)
        console.log({delKey});
        return delKey
    }
    /*
        1 - check email in dbs
        2 - match password
        3 - create AT vs RT and save
        4 - generate tokens
        5 - get data return login
    */
    static login = async({ email, password, refreshToken = null }) => {
        // 1
        const foundShop = await findByEmail({ email })
        if(!foundShop) throw new BadRequestError('Shop not registered!')

        // 2
        const match = bcrypt.compare( password, foundShop.password )
        if(!match) throw new AuthFailureError('Authentication Error')

        // 3
        const privateKey = crypto.randomBytes(64).toString('hex')
        const publicKey = crypto.randomBytes(64).toString('hex')

        // 4
        const { _id: userId } = foundShop
        const tokens = await createTokenPair({userId: foundShop._id, email}, publicKey, privateKey)

        await KeyTokenService.createKeyToken({
            refreshToken: tokens.refreshToken,
            privateKey,
            publicKey,
            userId
        })
        return {
            metadata: {
                shop: getInfoData({ fields: [ '_id', 'name', 'email' ], object: foundShop}),
                tokens
            }
        }
    }

    static signUp = async ({ name, email, password }) => {
        // try {
            // step1: check email exists

            const holderShop = await shopModel.findOne({ email }).lean()
            if(holderShop){
                throw new BadRequestError('Error: Shop already registered!')
            }

            const passwordHash = await bcrypt.hash(password, 10)

            const newShop = await shopModel.create({
                name, email, password: passwordHash, roles: [RoleShop.SHOP]
            })

            if(newShop) {
                // created privateKey, publicKey
                // const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
                //     modulusLength: 4096,
                //     publicKeyEncoding: {
                //         type: 'pkcs1',
                //         format: 'pem'
                //     },
                //     privateKeyEncoding: {
                //         type: 'pkcs1',
                //         format: 'pem'
                //     },
                // })

                const privateKey = crypto.randomBytes(64).toString('hex')
                const publicKey = crypto.randomBytes(64).toString('hex')

                console.log({ privateKey, publicKey }); // save collection Keystore
                
                const keyStore = await keyTokenService.createKeyToken({
                    userId: newShop._id,
                    publicKey,
                    privateKey
                })

                if(!keyStore){
                    // throw new BadRequestError('Error: Shop already registered!')
                    return {
                        code: 'xxxx',
                        message: 'keyStore error'
                    }
                }
                // console.log(`publicKeyString::`, publicKeyString);
                // const publicKeyObject = crypto.createPublicKey( publicKeyString )

                // console.log(`publicKeyObject::`, publicKeyObject);
                // created token pair
                const tokens = await createTokenPair({userId: newShop._id, email}, publicKey, privateKey)
                console.log('Created Token Success::', tokens)

                return {
                    code: 201,
                    metadata: {
                        shop: getInfoData({ fields: [ '_id', 'name', 'email' ], object: newShop}),
                        tokens
                    }
                }
                // const tokens = await
            }

            return {
                code: 200,
                metadata: null
            }
        // } catch (error) {
        //     return {
        //         code: 'xxx',
        //         message: error.message,
        //         status: 'error'
        //     }
        // }
    }
}

module.exports = AccessService