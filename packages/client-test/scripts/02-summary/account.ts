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

    const summary = await client.ledger.getSummary(userInfo.wallet.address);
    console.log(`- account: ${summary.account}`);
    console.log(`- tokenInfo`);
    console.log(`   - symbol: ${summary.tokenInfo.symbol}`);
    console.log(`   - name: ${summary.tokenInfo.name}`);
    console.log(`   - decimals: ${summary.tokenInfo.decimals}`);

    console.log(`- exchangeRate`);
    console.log(`   - token:`);
    console.log(`       - symbol: ${summary.exchangeRate.token.symbol}`);
    console.log(`       - value: ${new BOACoin(summary.exchangeRate.token.value).toDisplayString(true, 4)}`);
    console.log(`   - currency:`);
    console.log(`       - symbol: ${summary.exchangeRate.currency.symbol}`);
    console.log(`       - value: ${new BOACoin(summary.exchangeRate.currency.value).toDisplayString(true, 4)}`);

    console.log(`- provision`);
    console.log(`   - enable: ${summary.provider.enable}`);
    console.log(`   - assistant: ${summary.provider.assistant}`);

    console.log(`- agent`);
    console.log(`   - provision: ${summary.agent.provision}`);
    console.log(`   - refund: ${summary.agent.refund}`);
    console.log(`   - withdrawal: ${summary.agent.withdrawal}`);

    console.log(`- ledger`);
    console.log(`   - point.balance: ${new BOACoin(summary.ledger.point.balance).toDisplayString(true, 4)}`);
    console.log(`   - point.value: ${new BOACoin(summary.ledger.point.value).toDisplayString(true, 4)}`);
    console.log(`   - token.balance: ${new BOACoin(summary.ledger.token.balance).toDisplayString(true, 4)}`);
    console.log(`   - token.value: ${new BOACoin(summary.ledger.token.value).toDisplayString(true, 4)}`);

    console.log(`- mainChain`);
    console.log(`   - point.balance: ${new BOACoin(summary.mainChain.point.balance).toDisplayString(true, 4)}`);
    console.log(`   - point.value: ${new BOACoin(summary.mainChain.point.value).toDisplayString(true, 4)}`);
    console.log(`   - token.balance: ${new BOACoin(summary.mainChain.token.balance).toDisplayString(true, 4)}`);
    console.log(`   - token.value: ${new BOACoin(summary.mainChain.token.value).toDisplayString(true, 4)}`);

    console.log(`- sideChain`);
    console.log(`   - point.balance: ${new BOACoin(summary.sideChain.point.balance).toDisplayString(true, 4)}`);
    console.log(`   - point.value: ${new BOACoin(summary.sideChain.point.value).toDisplayString(true, 4)}`);
    console.log(`   - token.balance: ${new BOACoin(summary.sideChain.token.balance).toDisplayString(true, 4)}`);
    console.log(`   - token.value: ${new BOACoin(summary.sideChain.token.value).toDisplayString(true, 4)}`);

    console.log(`- protocolFees`);
    console.log(`   - transfer: ${new BOACoin(summary.protocolFees.transfer).toDisplayString(true, 4)}`);
    console.log(`   - withdraw: ${new BOACoin(summary.protocolFees.withdraw).toDisplayString(true, 4)}`);
    console.log(`   - deposit: ${new BOACoin(summary.protocolFees.deposit).toDisplayString(true, 4)}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
