import { Helper } from "../utils";
import { Client, Context, ContextBuilder } from "acc-sdk-client-v2";

async function main() {
    const shopInfo = Helper.loadShopInfo();
    console.log(`shopId: ${shopInfo.shopId}`);
    console.log(`wallet.address: ${shopInfo.wallet.address}`);

    const contextParams = ContextBuilder.buildContextParams(Helper.NETWORK, shopInfo.wallet.privateKey);
    if (Helper.RELAY_ENDPOINT !== "") contextParams.relayEndpoint = Helper.RELAY_ENDPOINT;
    if (Helper.WEB3_ENDPOINT !== "") contextParams.web3Provider = Helper.WEB3_ENDPOINT;
    const context: Context = new Context(contextParams);
    const client = new Client(context);

    const accounts = [
        "0x068121F64E3CeC5B747E810c638A3094ae15Fc54",
        "0x14De3f38D8deB7fFc5c15859bA05e4B088F8F631",
        "0x4BbfEd63b19954A357C1Dfc3Ba8820d2eE31Bbcf",
        "0x57D5E271FF8A4d49AE793B8b6Cf005E33FA4FA48",
        "0x6c9982936e5947AbF29ACF427bCCC1F0BfF15aa8",
        "0x75aeC862b56b9deEFb9cd9BE99c1e37cA513D881",
        "0x85e7d7fF87336B4c75D0bb4e126E26622364dd34",
        "0x8C9aa9E37f776bfecCa7fc8a8b725D6f80134D04",
        "0xA9c5559da87A7511D28e87C751dAfE65374Ce59f",
        "0xAAa610aE6711B810921ca06629c42a3E127851cd",
        "0xB6f69F0e9e70034ba0578C542476cC13eF739269",
        "0xD10ADf251463A260242c216c8c7D3e736eBdB398",
        "0xD12e250C8F5C3720297CeBF5A50655A8e2348847",
        "0xF2F884a9EF655B6e4EAA77E963D59063514b8fD1",
        "0xF30550d246df3e23CfB2383f9898f4647905eB35",
        "0xafFe745418Ad24c272175e5B58610A8a35e2EcDa",
        "0xe3812c628b1E0245Eed4A548914e32C9eeFda019",
        "0xe4c63A0e8983D87969eA5E13AbedF8Bd69784FD1",
        "0xea26dF6254d4E54d426f0125Dc02C1A0aCDFB610",
        "0xfD8072e4809BFADd90ad6D60aF31C8dCd7a46990"
    ]

    console.log("처리결과입니다.");
    for (const account of accounts) {
        const length = await client.shop.getShopsCountByAccount(account);
        if (length.toNumber() > 0) {
            const shopIds = await client.shop.getShopsByAccount(account, 0, length.toNumber());
            console.log(`account: ${account}`);
            for (const shopId of shopIds) {
                console.log(`shopId: ${shopId}`);
            }
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
