import * as dotenv from "dotenv";
import { JsonRpcProvider, Networkish } from "@ethersproject/providers";
import { Wallet } from "@ethersproject/wallet";
import {
    Amount,
    ContractUtils,
    ContextBuilder,
    GasPriceManager,
    ContextParams,
    LIVE_CONTRACTS,
    NonceManager,
    SupportedNetwork,
    SupportedNetworkArray
} from "../../src";
import {
    CurrencyRate,
    CurrencyRate__factory,
    Ledger,
    Ledger__factory,
    LoyaltyBridge,
    LoyaltyBridge__factory,
    LoyaltyConsumer,
    LoyaltyConsumer__factory,
    LoyaltyExchanger,
    LoyaltyExchanger__factory,
    LoyaltyProvider,
    LoyaltyProvider__factory,
    LoyaltyTransfer,
    LoyaltyTransfer__factory,
    PhoneLinkCollection,
    PhoneLinkCollection__factory,
    Shop,
    Shop__factory,
    LoyaltyToken,
    LoyaltyToken__factory,
    Validator,
    Validator__factory
} from "acc-contracts-lib-v2";
import { IShopData } from "./types";
import { Signer } from "@ethersproject/abstract-signer";
import { Network } from "@ethersproject/networks";
import { getNetwork } from "../../src/utils/Utilty";
import { InvalidAddressError, UnsupportedNetworkError } from "acc-sdk-common-v2";
import { isAddress } from "@ethersproject/address";
import { BigNumber } from "@ethersproject/bignumber";
import { AddressZero } from "@ethersproject/constants";

dotenv.config({ path: "env/.env" });

export enum AccountIndex {
    DEPLOYER,
    OWNER,
    FOUNDATION,
    FEE,
    TXFEE,
    CERTIFIER01,
    VALIDATOR01,
    VALIDATOR02,
    VALIDATOR03,
    VALIDATOR04,
    VALIDATOR05,
    VALIDATOR06,
    VALIDATOR07,
    VALIDATOR08,
    VALIDATOR09,
    VALIDATOR10,
    VALIDATOR11,
    VALIDATOR12,
    VALIDATOR13,
    VALIDATOR14,
    VALIDATOR15,
    VALIDATOR16,
    LINK_VALIDATOR1,
    LINK_VALIDATOR2,
    LINK_VALIDATOR3,
    BRIDGE_VALIDATOR1,
    BRIDGE_VALIDATOR2,
    BRIDGE_VALIDATOR3,
    BRIDGE_VALIDATOR4,
    BRIDGE_VALIDATOR5,
    CUSTOM
}

export interface IContractInfo {
    provider: JsonRpcProvider;
    phoneLinkCollection: PhoneLinkCollection;
    token: LoyaltyToken;
    validator: Validator;
    currencyRate: CurrencyRate;
    shop: Shop;
    ledger: Ledger;
    loyaltyProvider: LoyaltyProvider;
    loyaltyConsumer: LoyaltyConsumer;
    loyaltyExchanger: LoyaltyExchanger;
    loyaltyTransfer: LoyaltyTransfer;
    loyaltyBridge: LoyaltyBridge;
}

export class NodeInfo {
    public static initialAccounts: any[];
    public static NETWORK_NAME: SupportedNetwork = (process.env.NETWORK_NAME || "acc_devnet") as SupportedNetwork;
    public static RELAY_ACCESS_KEY = process.env.RELAY_ACCESS_KEY || "";
    public static RELAY_ENDPOINT = process.env.RELAY_ENDPOINT || "";
    public static WEB3_ENDPOINT = process.env.WEB3_ENDPOINT || "";

    public static CreateInitialAccounts(): any[] {
        const accounts: string[] = [];
        const reg_bytes64: RegExp = /^(0x)[0-9a-f]{64}$/i;
        if (
            process.env.DEPLOYER_SIDE_CHAIN !== undefined &&
            process.env.DEPLOYER_SIDE_CHAIN.trim() !== "" &&
            reg_bytes64.test(process.env.DEPLOYER_SIDE_CHAIN)
        ) {
            accounts.push(process.env.DEPLOYER_SIDE_CHAIN);
        } else {
            process.env.DEPLOYER_SIDE_CHAIN = Wallet.createRandom().privateKey;
            accounts.push(process.env.DEPLOYER_SIDE_CHAIN);
        }

        if (process.env.OWNER !== undefined && process.env.OWNER.trim() !== "" && reg_bytes64.test(process.env.OWNER)) {
            accounts.push(process.env.OWNER);
        } else {
            process.env.OWNER = Wallet.createRandom().privateKey;
            accounts.push(process.env.OWNER);
        }

        if (
            process.env.FOUNDATION !== undefined &&
            process.env.FOUNDATION.trim() !== "" &&
            reg_bytes64.test(process.env.FOUNDATION)
        ) {
            accounts.push(process.env.FOUNDATION);
        } else {
            process.env.FOUNDATION = Wallet.createRandom().privateKey;
            accounts.push(process.env.FOUNDATION);
        }

        if (process.env.FEE !== undefined && process.env.FEE.trim() !== "" && reg_bytes64.test(process.env.FEE)) {
            accounts.push(process.env.FEE);
        } else {
            process.env.FEE = Wallet.createRandom().privateKey;
            accounts.push(process.env.FEE);
        }

        if (process.env.TXFEE !== undefined && process.env.TXFEE.trim() !== "" && reg_bytes64.test(process.env.TXFEE)) {
            accounts.push(process.env.TXFEE);
        } else {
            process.env.TXFEE = Wallet.createRandom().privateKey;
            accounts.push(process.env.TXFEE);
        }

        if (
            process.env.CERTIFIER01 !== undefined &&
            process.env.CERTIFIER01.trim() !== "" &&
            reg_bytes64.test(process.env.CERTIFIER01)
        ) {
            accounts.push(process.env.CERTIFIER01);
        } else {
            process.env.CERTIFIER01 = Wallet.createRandom().privateKey;
            accounts.push(process.env.CERTIFIER01);
        }

        if (
            process.env.VALIDATOR01 !== undefined &&
            process.env.VALIDATOR01.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR01)
        ) {
            accounts.push(process.env.VALIDATOR01);
        } else {
            process.env.VALIDATOR01 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR01);
        }

        if (
            process.env.VALIDATOR02 !== undefined &&
            process.env.VALIDATOR02.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR02)
        ) {
            accounts.push(process.env.VALIDATOR02);
        } else {
            process.env.VALIDATOR02 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR02);
        }

        if (
            process.env.VALIDATOR03 !== undefined &&
            process.env.VALIDATOR03.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR03)
        ) {
            accounts.push(process.env.VALIDATOR03);
        } else {
            process.env.VALIDATOR03 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR03);
        }

        if (
            process.env.VALIDATOR04 !== undefined &&
            process.env.VALIDATOR04.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR04)
        ) {
            accounts.push(process.env.VALIDATOR04);
        } else {
            process.env.VALIDATOR04 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR04);
        }

        if (
            process.env.VALIDATOR05 !== undefined &&
            process.env.VALIDATOR05.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR05)
        ) {
            accounts.push(process.env.VALIDATOR05);
        } else {
            process.env.VALIDATOR05 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR05);
        }

        if (
            process.env.VALIDATOR06 !== undefined &&
            process.env.VALIDATOR06.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR06)
        ) {
            accounts.push(process.env.VALIDATOR06);
        } else {
            process.env.VALIDATOR06 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR06);
        }

        if (
            process.env.VALIDATOR07 !== undefined &&
            process.env.VALIDATOR07.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR07)
        ) {
            accounts.push(process.env.VALIDATOR07);
        } else {
            process.env.VALIDATOR07 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR07);
        }

        if (
            process.env.VALIDATOR08 !== undefined &&
            process.env.VALIDATOR08.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR08)
        ) {
            accounts.push(process.env.VALIDATOR08);
        } else {
            process.env.VALIDATOR08 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR08);
        }

        if (
            process.env.VALIDATOR09 !== undefined &&
            process.env.VALIDATOR09.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR09)
        ) {
            accounts.push(process.env.VALIDATOR09);
        } else {
            process.env.VALIDATOR09 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR09);
        }

        if (
            process.env.VALIDATOR10 !== undefined &&
            process.env.VALIDATOR10.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR10)
        ) {
            accounts.push(process.env.VALIDATOR10);
        } else {
            process.env.VALIDATOR10 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR10);
        }

        if (
            process.env.VALIDATOR11 !== undefined &&
            process.env.VALIDATOR11.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR11)
        ) {
            accounts.push(process.env.VALIDATOR11);
        } else {
            process.env.VALIDATOR11 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR11);
        }

        if (
            process.env.VALIDATOR12 !== undefined &&
            process.env.VALIDATOR12.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR12)
        ) {
            accounts.push(process.env.VALIDATOR12);
        } else {
            process.env.VALIDATOR12 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR12);
        }

        if (
            process.env.VALIDATOR13 !== undefined &&
            process.env.VALIDATOR13.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR13)
        ) {
            accounts.push(process.env.VALIDATOR13);
        } else {
            process.env.VALIDATOR13 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR13);
        }

        if (
            process.env.VALIDATOR14 !== undefined &&
            process.env.VALIDATOR14.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR14)
        ) {
            accounts.push(process.env.VALIDATOR14);
        } else {
            process.env.VALIDATOR14 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR14);
        }

        if (
            process.env.VALIDATOR15 !== undefined &&
            process.env.VALIDATOR15.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR15)
        ) {
            accounts.push(process.env.VALIDATOR15);
        } else {
            process.env.VALIDATOR15 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR15);
        }

        if (
            process.env.VALIDATOR16 !== undefined &&
            process.env.VALIDATOR16.trim() !== "" &&
            reg_bytes64.test(process.env.VALIDATOR16)
        ) {
            accounts.push(process.env.VALIDATOR16);
        } else {
            process.env.VALIDATOR16 = Wallet.createRandom().privateKey;
            accounts.push(process.env.VALIDATOR16);
        }

        if (
            process.env.LINK_VALIDATOR1 !== undefined &&
            process.env.LINK_VALIDATOR1.trim() !== "" &&
            reg_bytes64.test(process.env.LINK_VALIDATOR1)
        ) {
            accounts.push(process.env.LINK_VALIDATOR1);
        } else {
            process.env.LINK_VALIDATOR1 = Wallet.createRandom().privateKey;
            accounts.push(process.env.LINK_VALIDATOR1);
        }

        if (
            process.env.LINK_VALIDATOR2 !== undefined &&
            process.env.LINK_VALIDATOR2.trim() !== "" &&
            reg_bytes64.test(process.env.LINK_VALIDATOR2)
        ) {
            accounts.push(process.env.LINK_VALIDATOR2);
        } else {
            process.env.LINK_VALIDATOR2 = Wallet.createRandom().privateKey;
            accounts.push(process.env.LINK_VALIDATOR2);
        }

        if (
            process.env.LINK_VALIDATOR3 !== undefined &&
            process.env.LINK_VALIDATOR3.trim() !== "" &&
            reg_bytes64.test(process.env.LINK_VALIDATOR3)
        ) {
            accounts.push(process.env.LINK_VALIDATOR3);
        } else {
            process.env.LINK_VALIDATOR3 = Wallet.createRandom().privateKey;
            accounts.push(process.env.LINK_VALIDATOR3);
        }

        if (
            process.env.BRIDGE_VALIDATOR1 !== undefined &&
            process.env.BRIDGE_VALIDATOR1.trim() !== "" &&
            reg_bytes64.test(process.env.BRIDGE_VALIDATOR1)
        ) {
            accounts.push(process.env.BRIDGE_VALIDATOR1);
        } else {
            process.env.BRIDGE_VALIDATOR1 = Wallet.createRandom().privateKey;
            accounts.push(process.env.BRIDGE_VALIDATOR1);
        }

        if (
            process.env.BRIDGE_VALIDATOR2 !== undefined &&
            process.env.BRIDGE_VALIDATOR2.trim() !== "" &&
            reg_bytes64.test(process.env.BRIDGE_VALIDATOR2)
        ) {
            accounts.push(process.env.BRIDGE_VALIDATOR2);
        } else {
            process.env.BRIDGE_VALIDATOR2 = Wallet.createRandom().privateKey;
            accounts.push(process.env.BRIDGE_VALIDATOR2);
        }

        if (
            process.env.BRIDGE_VALIDATOR3 !== undefined &&
            process.env.BRIDGE_VALIDATOR3.trim() !== "" &&
            reg_bytes64.test(process.env.BRIDGE_VALIDATOR3)
        ) {
            accounts.push(process.env.BRIDGE_VALIDATOR3);
        } else {
            process.env.BRIDGE_VALIDATOR3 = Wallet.createRandom().privateKey;
            accounts.push(process.env.BRIDGE_VALIDATOR3);
        }

        if (
            process.env.BRIDGE_VALIDATOR4 !== undefined &&
            process.env.BRIDGE_VALIDATOR4.trim() !== "" &&
            reg_bytes64.test(process.env.BRIDGE_VALIDATOR4)
        ) {
            accounts.push(process.env.BRIDGE_VALIDATOR4);
        } else {
            process.env.BRIDGE_VALIDATOR4 = Wallet.createRandom().privateKey;
            accounts.push(process.env.BRIDGE_VALIDATOR4);
        }

        if (
            process.env.BRIDGE_VALIDATOR5 !== undefined &&
            process.env.BRIDGE_VALIDATOR5.trim() !== "" &&
            reg_bytes64.test(process.env.BRIDGE_VALIDATOR5)
        ) {
            accounts.push(process.env.BRIDGE_VALIDATOR5);
        } else {
            process.env.BRIDGE_VALIDATOR5 = Wallet.createRandom().privateKey;
            accounts.push(process.env.BRIDGE_VALIDATOR5);
        }

        while (accounts.length < 70) {
            accounts.push(Wallet.createRandom().privateKey);
        }

        return accounts.map((m) => {
            return {
                balance: "0x100000000000000000000",
                secretKey: m
            };
        });
    }

    public static accounts(): Signer[] {
        if (NodeInfo.initialAccounts === undefined) {
            NodeInfo.initialAccounts = NodeInfo.CreateInitialAccounts();
        }
        return NodeInfo.initialAccounts.map(
            (m) => new NonceManager(new GasPriceManager(new Wallet(m.secretKey).connect(NodeInfo.createProvider())))
        );
    }

    // INTERNAL HELPERS
    private static resolveNetwork(networkish: Networkish, ensRegistryAddress?: string): Network {
        const network = getNetwork(networkish);
        const networkName = network.name as SupportedNetwork;
        if (!SupportedNetworkArray.includes(networkName)) {
            throw new UnsupportedNetworkError(networkName);
        }

        if (ensRegistryAddress) {
            if (!isAddress(ensRegistryAddress)) {
                throw new InvalidAddressError();
            } else {
                network.ensAddress = ensRegistryAddress;
            }
        }

        if (!network.ensAddress) {
            network.ensAddress = AddressZero;
        }
        return network;
    }

    private static resolveWeb3Provider(endpoints: string | JsonRpcProvider, network: Networkish): JsonRpcProvider {
        if (typeof endpoints === "string") {
            const url = new URL(endpoints);
            return new JsonRpcProvider(url.href, this.resolveNetwork(network));
        } else {
            return endpoints;
        }
    }

    public static createProvider(): JsonRpcProvider {
        const networkName = this.NETWORK_NAME;
        return this.resolveWeb3Provider(LIVE_CONTRACTS[networkName].web3Endpoint, LIVE_CONTRACTS[networkName].network);
    }

    public static getContextParams(): ContextParams {
        if (NodeInfo.initialAccounts === undefined) {
            NodeInfo.initialAccounts = NodeInfo.CreateInitialAccounts();
        }
        const networkName = this.NETWORK_NAME;
        const contextParams = ContextBuilder.buildContextParams(networkName, NodeInfo.initialAccounts[0].secretKey);

        if (NodeInfo.RELAY_ENDPOINT !== "") contextParams.relayEndpoint = NodeInfo.RELAY_ENDPOINT;
        if (NodeInfo.WEB3_ENDPOINT !== "") contextParams.web3Provider = NodeInfo.WEB3_ENDPOINT;

        console.log(`RELAY_ENDPOINT : ${contextParams.relayEndpoint}`);
        console.log(`WEB3_ENDPOINT : ${contextParams.web3Provider}`);

        return contextParams;
    }

    public static getChainId(): number {
        const contextParams = NodeInfo.getContextParams();
        return contextParams.network;
    }

    public static getContractInfo(): IContractInfo {
        const provider = NodeInfo.createProvider();
        const contextParams = NodeInfo.getContextParams();

        console.log("Start Attach");

        console.log("Attach Token");
        const tokenContract = LoyaltyToken__factory.connect(contextParams.tokenAddress, provider);

        console.log("Attach Validator");
        const validatorContract: Validator = Validator__factory.connect(contextParams.validatorAddress, provider);

        console.log("Deposit Validator's Amount");
        const linkContract: PhoneLinkCollection = PhoneLinkCollection__factory.connect(
            contextParams.phoneLinkAddress,
            provider
        );

        console.log("Attach CurrencyRate");
        const currencyRateContract: CurrencyRate = CurrencyRate__factory.connect(
            contextParams.currencyRateAddress,
            provider
        );

        console.log("Attach Shop");
        const shopContract: Shop = Shop__factory.connect(contextParams.shopAddress, provider);

        console.log("Attach Ledger");
        const ledgerContract: Ledger = Ledger__factory.connect(contextParams.ledgerAddress, provider);

        console.log("Attach LoyaltyProvider");
        const providerContract: LoyaltyProvider = LoyaltyProvider__factory.connect(
            contextParams.loyaltyProviderAddress,
            provider
        );

        console.log("Attach LoyaltyConsumer");
        const consumerContract: LoyaltyConsumer = LoyaltyConsumer__factory.connect(
            contextParams.loyaltyConsumerAddress,
            provider
        );

        console.log("Attach LoyaltyExchanger");
        const exchangerContract: LoyaltyExchanger = LoyaltyExchanger__factory.connect(
            contextParams.loyaltyExchangerAddress,
            provider
        );

        console.log("Attach LoyaltyTransfer");
        const transferContract: LoyaltyTransfer = LoyaltyTransfer__factory.connect(
            contextParams.loyaltyTransferAddress,
            provider
        );

        console.log("Attach LoyaltyBridge");
        const bridgeContract: LoyaltyBridge = LoyaltyBridge__factory.connect(
            contextParams.loyaltyBridgeAddress,
            provider
        );

        console.log("Complete Attach");
        return {
            provider: provider,
            phoneLinkCollection: linkContract,
            token: tokenContract,
            validator: validatorContract,
            currencyRate: currencyRateContract,
            shop: shopContract,
            ledger: ledgerContract,
            loyaltyProvider: providerContract,
            loyaltyConsumer: consumerContract,
            loyaltyExchanger: exchangerContract,
            loyaltyTransfer: transferContract,
            loyaltyBridge: bridgeContract
        };
    }

    public static async setExchangeRate(currencyRateContract: CurrencyRate, validators: Signer[]) {
        const height = 0;
        const rates = [
            {
                symbol: "ACC",
                rate: BigNumber.from(1761925042)
            },
            {
                symbol: "LYT",
                rate: BigNumber.from(1761925042)
            },
            {
                symbol: "KRW",
                rate: BigNumber.from(42553191)
            },
            {
                symbol: "USD",
                rate: BigNumber.from(58730834752)
            },
            {
                symbol: "PHP",
                rate: BigNumber.from(1000000000)
            },
            {
                symbol: "krw",
                rate: BigNumber.from(42553191)
            },
            {
                symbol: "usd",
                rate: BigNumber.from(58730834752)
            },
            {
                symbol: "php",
                rate: BigNumber.from(1000000000)
            }
        ];
        const chainId = NodeInfo.getChainId();
        const message = ContractUtils.getCurrencyMessage(height, rates, chainId);
        const signatures = await Promise.all(validators.map((m) => ContractUtils.signMessage(m, message)));
        const proposeMessage = ContractUtils.getCurrencyProposeMessage(height, rates, signatures, chainId);
        const proposerSignature = await ContractUtils.signMessage(validators[0], proposeMessage);
        const tx1 = await currencyRateContract.connect(validators[0]).set(height, rates, signatures, proposerSignature);
        await tx1.wait();
    }

    public static async transferBOA(addresses: string[]) {
        console.log("Transfer BOA");
        const sender = NodeInfo.accounts()[AccountIndex.DEPLOYER];
        for (const account of addresses) {
            await sender.sendTransaction({
                to: account,
                value: Amount.make(100, 18).value
            });
        }
    }

    public static async transferToken(contracts: IContractInfo, addresses: string[]) {
        console.log("Transfer token");
        const sender = NodeInfo.accounts()[AccountIndex.OWNER];
        for (const account of addresses) {
            await contracts.token.connect(sender).transfer(account, Amount.make(100000, 18).value);
        }
    }

    public static async addShopData(contracts: IContractInfo, shopData: IShopData[]) {
        console.log("Add Shop Data");
        const sender = NodeInfo.accounts()[AccountIndex.CERTIFIER01];
        for (const shop of shopData) {
            const nonce = await contracts.shop.nonceOf(shop.wallet.address);
            const message = ContractUtils.getShopAccountMessage(
                shop.shopId,
                shop.wallet.address,
                nonce,
                contracts.provider.network.chainId
            );
            const signature = await ContractUtils.signMessage(new Wallet(shop.wallet.privateKey), message);
            await (
                await contracts.shop
                    .connect(sender)
                    .add(shop.shopId, shop.name, shop.currency, shop.wallet.address, signature)
            ).wait();
        }
    }

    public static getRandomPhoneNumber(): string {
        let res = "082999";
        for (let idx = 0; idx < 8; idx++) {
            res += Math.floor(Math.random() * 10).toString(10);
        }
        return res;
    }

    static purchaseId = 0;
    public static getPurchaseId(): string {
        const randomIdx = Math.floor(Math.random() * 1000);
        const res = "P" + NodeInfo.purchaseId.toString().padStart(10, "0") + randomIdx.toString().padStart(4, "0");
        NodeInfo.purchaseId++;
        return res;
    }

    public static getPhoneNumber(): string {
        const randomIdx1 = Math.floor(Math.random() * 1000);
        const randomIdx2 = Math.floor(Math.random() * 1000);
        return "+82 10-" + randomIdx1.toString().padStart(4, "0") + "-" + randomIdx2.toString().padStart(4, "0");
    }
}
