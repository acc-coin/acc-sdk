import { Helper } from "../utils";
import { Client, Context, ContextBuilder, NormalSteps } from "acc-sdk-client-v2";

async function main() {
    const userInfo = Helper.loadUserInfo();
    const contextParams = ContextBuilder.buildContextParams(Helper.NETWORK, userInfo.wallet.privateKey);
    if (Helper.RELAY_ENDPOINT !== "") contextParams.relayEndpoint = Helper.RELAY_ENDPOINT;
    if (Helper.WEB3_ENDPOINT !== "") contextParams.web3Provider = Helper.WEB3_ENDPOINT;
    const context: Context = new Context(contextParams);
    const client = new Client(context);
    console.log(`client.ledger.getAgentOfRefund() : ${await client.ledger.getAgentOfRefund()}`);
    for await (const step of client.ledger.unregisterAgentOfRefund()) {
        switch (step.key) {
            case NormalSteps.PREPARED:
                console.log("NormalSteps.PREPARED");
                break;
            case NormalSteps.SENT:
                console.log("NormalSteps.SENT");
                break;
            case NormalSteps.DONE:
                console.log("NormalSteps.DONE");
                break;
            default:
                throw new Error("Unexpected change payable point step: " + JSON.stringify(step, null, 2));
        }
    }
    console.log(`client.ledger.getAgentOfRefund() : ${await client.ledger.getAgentOfRefund()}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
