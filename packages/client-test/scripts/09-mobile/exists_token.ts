import { Helper } from "../utils";

import { Client, Context, ContextBuilder, MobileType } from "acc-sdk-client-v2";

async function main() {
    const userInfo = Helper.loadUserInfo();
    const shopInfo = Helper.loadShopInfo();
    const contextParams = ContextBuilder.buildContextParams(Helper.NETWORK, userInfo.wallet.privateKey);
    if (Helper.RELAY_ENDPOINT !== "") contextParams.relayEndpoint = Helper.RELAY_ENDPOINT;
    if (Helper.WEB3_ENDPOINT !== "") contextParams.web3Provider = Helper.WEB3_ENDPOINT;
    const context: Context = new Context(contextParams);
    const client = new Client(context);

    console.log("User App");
    const exists1 = await client.ledger.isExistsMobileAccountToken(userInfo.token, MobileType.USER_APP);
    console.log(`exists: ${exists1}`);

    console.log("Shop App");
    client.usePrivateKey(shopInfo.wallet.privateKey);
    const exists2 = await client.ledger.isExistsMobileAccountToken(shopInfo.token, MobileType.SHOP_APP);
    console.log(`exists: ${exists2}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

process.on("SIGINT", () => {});
