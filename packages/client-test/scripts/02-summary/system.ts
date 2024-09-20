import { Helper } from "../utils";
import { BOACoin } from "../../src/Amount";
import { Client, Context, ContextBuilder } from "acc-sdk-client-v2";

async function main() {
    const userInfo = Helper.loadUserInfo();
    const contextParams = ContextBuilder.buildContextParams(Helper.NETWORK, userInfo.wallet.privateKey);
    if (Helper.RELAY_ENDPOINT !== "") contextParams.relayEndpoint = Helper.RELAY_ENDPOINT;
    if (Helper.WEB3_ENDPOINT !== "") contextParams.web3Provider = Helper.WEB3_ENDPOINT;
    const context: Context = new Context(contextParams);
    const client = new Client(context);

    const info = await client.ledger.getSystemInfo();
    console.log(`- tokenInfo`);
    console.log(`   - symbol: ${info.token.symbol}`);
    console.log(`- pointInfo`);
    console.log(`   - precision: ${info.point.precision}`);
    console.log(`   - equivalent currency: ${info.point.equivalentCurrency}`);
    console.log(`- language: ${info.language}`);
    console.log(`- support`);
    console.log(`       - chain bridge: ${info.support.chainBridge}`);
    console.log(`       - loyalty bridge: ${info.support.loyaltyBridge}`);
    console.log(`       - exchange: ${info.support.exchange}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
