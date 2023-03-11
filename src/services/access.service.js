const bycrypt = require("bcrypt");
const crypto = require("node:crypto");
const KeyTokenService = require("./keyToken.service");
const shopModel = require("../models/shop.model");
const { createTokenPair } = require("../auth/authUtil");
const { getInfoData } = require("../utils");

const RoleShop = {
  SHOP: "SHOP",
  WRITER: "WRITER",
  EDITER: "EDITER",
  ADMIN: "ADMIN",
};

class AccessService {
  static signUp = async ({ name, email, password }) => {
    try {
      // step1: check email exists ???
      const holderShop = await shopModel.findOne({ email }).lean();
      if (holderShop) {
        return {
          code: "zzzz",
          message: "Shop already registered",
        };
      }

      const passwordHash = await bycrypt.hash(password, 10);
      const newShop = await shopModel.create({
        name,
        email,
        password: passwordHash,
        roles: [RoleShop.SHOP],
      });

      if (newShop) {
        // created privateKey, publicKey
        // const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
        //   modulusLength: 4096,
        //   publicKeyEncoding: {
        //     type: "pkcs1",
        //     format: "pem",
        //   },
        //   privateKeyEncoding: {
        //     type: "pkcs1",
        //     format: "pem",
        //   },
        // });

        const publicKey = crypto.randomBytes(64).toString("hex");
        const privateKey = crypto.randomBytes(64).toString("hex");

        console.log("newShop", newShop);
        console.log({ privateKey, publicKey }); // save collection KeyStore

        const keyStore = await KeyTokenService.createKeyToken({
          userId: newShop._id,
          publicKey,
          privateKey,
        });

        if (!keyStore) {
          return {
            code: "xxx",
            message: "keyStore error",
          };
        }

        // created token pair
        const tokens = await createTokenPair(
          { userId: newShop._id, email },
          publicKey,
          privateKey
        );

        console.log(`Created Token Success::`, tokens);

        return {
          code: 201,
          metadata: {
            shop: getInfoData({
              fileds: ["_id", "name", "email"],
              object: newShop,
            }),
            tokens,
          },
        };
      }

      return {
        code: 200,
        metadata: null,
      };
    } catch (error) {
      return {
        code: "zzz",
        message: error.message,
        status: "error",
      };
    }
  };
}

module.exports = AccessService;
