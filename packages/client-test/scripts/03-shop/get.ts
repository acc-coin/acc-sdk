import { Helper } from "../utils";
import { Client, Context, ContextBuilder } from "acc-sdk-client-v2";
import { BOACoin } from "../../src/Amount";

const beautify = require("beautify");

async function main() {
    const shopInfo = Helper.loadShopInfo();
    console.log(`shopId: ${shopInfo.shopId}`);
    console.log(`wallet.address: ${shopInfo.wallet.address}`);

    const contextParams = ContextBuilder.buildContextParams(Helper.NETWORK, shopInfo.wallet.privateKey);
    if (Helper.RELAY_ENDPOINT !== "") contextParams.relayEndpoint = Helper.RELAY_ENDPOINT;
    if (Helper.WEB3_ENDPOINT !== "") contextParams.web3Provider = Helper.WEB3_ENDPOINT;
    const context: Context = new Context(contextParams);
    const client = new Client(context);

    console.log("상점 정보를 요청합니다.");
    const info = await client.shop.getShopInfo(shopInfo.shopId);

    console.log("처리결과입니다.");
    console.log(`shopId: ${info.shopId}`);
    console.log(`name: ${info.name}`);
    console.log(`currency: ${info.currency}`);
    console.log(`account: ${info.account}`);
    console.log(`delegator: ${info.delegator}`);
    console.log(`providedAmount: ${new BOACoin(info.providedAmount).toDisplayString(true, 2)}`);
    console.log(`usedAmount: ${new BOACoin(info.usedAmount).toDisplayString(true, 2)}`);
    console.log(`collectedAmount: ${new BOACoin(info.collectedAmount).toDisplayString(true, 2)}`);
    console.log(`refundedAmount: ${new BOACoin(info.refundedAmount).toDisplayString(true, 2)}`);

    const refundable = await client.shop.getRefundableAmount(shopInfo.shopId);
    console.log(`refundableAmount: ${new BOACoin(refundable.refundableAmount).toDisplayString(true, 2)}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
