// This file contains the definition of the low level network clients

import { Signer } from "@ethersproject/abstract-signer";
import { Contract, ContractInterface } from "@ethersproject/contracts";
import { JsonRpcProvider } from "@ethersproject/providers";

export interface IClientWeb3Core {
    usePrivateKey: (privateKey: string) => void;
    useSigner: (signer: Signer) => void;
    shiftProvider: () => void;
    getSigner: () => Signer | null;
    getConnectedSigner: () => Signer;
    getProvider: () => JsonRpcProvider | null;
    isUp: () => Promise<boolean>;
    ensureOnline: () => Promise<void>;
    attachContract: <T>(address: string, abi: ContractInterface) => Contract & T;
    getTokenAddress: () => string;
    getLinkAddress: () => string;
    getValidatorAddress: () => string;
    getCurrencyRateAddress: () => string;
    getShopAddress: () => string;
    getLedgerAddress: () => string;
    getLoyaltyProviderAddress: () => string;
    getLoyaltyConsumerAddress: () => string;
    getLoyaltyExchangerAddress: () => string;
    getLoyaltyTransferAddress: () => string;
    getLoyaltyBridgeAddress: () => string;
}

export interface IClientHttpCore {
    isRelayUp: () => Promise<boolean>;
    getEndpoint: (path: string) => Promise<URL>;
}

export interface IClientCore {
    web3: IClientWeb3Core;
}
