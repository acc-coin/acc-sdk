import { Helper } from "../utils";
import { Client, Context, ContextBuilder } from "acc-sdk-client-v2";
import { Ledger, Ledger__factory } from "acc-contracts-lib-v2";
import { Wallet } from "ethers";

async function main() {
    const userInfo = Helper.loadUserInfo();
    const contextParams = ContextBuilder.buildContextParams(Helper.NETWORK, userInfo.wallet.privateKey);
    if (Helper.RELAY_ENDPOINT !== "") contextParams.relayEndpoint = Helper.RELAY_ENDPOINT;
    if (Helper.WEB3_ENDPOINT !== "") contextParams.web3Provider = Helper.WEB3_ENDPOINT;
    const context: Context = new Context(contextParams);
    const client = new Client(context);

    const contractOwner = new Wallet(process.env.CONTRACT_OWNER || "", client.web3.getProvider());
    const ledgerContract: Ledger = Ledger__factory.connect(client.web3.getLedgerAddress(), contractOwner);
    await ledgerContract.unregisterProvider(userInfo.wallet.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
