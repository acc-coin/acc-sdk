import { IClientCore } from "../client-common";
import {
    ApproveCancelPaymentValue,
    ApproveNewPaymentValue,
    ExchangePointToTokenStepValue,
    ChangeToPayablePointStepValue,
    DelegatedTransferStepValue,
    DepositStepValue,
    DepositViaBridgeStepValue,
    IChainInfo,
    MobileType,
    PaymentDetailData,
    RemovePhoneInfoStepValue,
    UpdateAllowanceParams,
    UpdateAllowanceStepValue,
    WaiteBridgeStepValue,
    WithdrawStepValue,
    WithdrawViaBridgeStepValue,
    LedgerAction,
    IAccountSummary,
    RegisterAssistantStepValue, ISystemInfo
} from "../interfaces";
import { BigNumber } from "@ethersproject/bignumber";
import { BytesLike } from "@ethersproject/bytes";
import { JsonRpcProvider } from "@ethersproject/providers";

export interface ILedger {
    ledger: ILedgerMethods;
}

/** Defines the shape of the general purpose Client class */
export interface ILedgerMethods extends IClientCore {
    getAccount: () => Promise<string>;

    // Balance
    getUnPayablePointBalance: (phoneHash: string) => Promise<BigNumber>;
    getPointBalance: (account: string) => Promise<BigNumber>;
    getTokenBalance: (account: string) => Promise<BigNumber>;
    getSummary: (account: string) => Promise<IAccountSummary>;

    // Payment
    getFeeRate: () => Promise<number>;
    getTemporaryAccount: () => Promise<string>;
    getPaymentDetail: (paymentId: BytesLike) => Promise<PaymentDetailData>;
    approveNewPayment: (
        paymentId: BytesLike,
        purchaseId: string,
        amount: BigNumber,
        currency: string,
        shopId: BytesLike,
        approval: boolean
    ) => AsyncGenerator<ApproveNewPaymentValue>;
    approveCancelPayment: (
        paymentId: BytesLike,
        purchaseId: string,
        approval: boolean
    ) => AsyncGenerator<ApproveCancelPaymentValue>;

    // Deposit & Withdrawal
    deposit: (amount: BigNumber) => AsyncGenerator<DepositStepValue>;
    withdraw: (amount: BigNumber) => AsyncGenerator<WithdrawStepValue>;
    updateAllowance: (params: UpdateAllowanceParams) => AsyncGenerator<UpdateAllowanceStepValue>;

    // Change
    changeToPayablePoint: (phone: string) => AsyncGenerator<ChangeToPayablePointStepValue>;
    exchangePointToToken: (amount: BigNumber) => AsyncGenerator<ExchangePointToTokenStepValue>;

    // Transfer
    transfer: (to: string, amount: BigNumber) => AsyncGenerator<DelegatedTransferStepValue>;

    // Deposit & Withdrawal via Bridge
    depositViaBridge: (amount: BigNumber) => AsyncGenerator<DepositViaBridgeStepValue>;
    withdrawViaBridge: (amount: BigNumber) => AsyncGenerator<WithdrawViaBridgeStepValue>;
    waiteDepositViaBridge: (depositId: string, timeout?: number) => AsyncGenerator<WaiteBridgeStepValue>;
    waiteWithdrawViaBridge: (depositId: string, timeout?: number) => AsyncGenerator<WaiteBridgeStepValue>;

    // Mobile
    registerMobileToken: (token: string, language: string, os: string, type: MobileType) => Promise<void>;
    isExistsMobileToken: (type: MobileType) => Promise<boolean>;
    removePhoneInfo: () => AsyncGenerator<RemovePhoneInfoStepValue>;

    // Main Chain
    getChainInfoOfMainChain: () => Promise<IChainInfo>;
    getProviderOfMainChain: () => Promise<JsonRpcProvider>;
    getMainChainBalance: (account: string) => Promise<BigNumber>;
    getBalanceOfMainChainToken: (account: string) => Promise<BigNumber>;
    getNonceOfMainChainToken: (account: string) => Promise<BigNumber>;
    transferInMainChain: (to: string, amount: BigNumber) => AsyncGenerator<DelegatedTransferStepValue>;

    // Side Chain
    getChainInfoOfSideChain: () => Promise<IChainInfo>;
    getProviderOfSideChain: () => Promise<JsonRpcProvider>;
    getSideChainBalance: (account: string) => Promise<BigNumber>;
    getBalanceOfSideChainToken: (account: string) => Promise<BigNumber>;
    getNonceOfSideChainToken: (account: string) => Promise<BigNumber>;
    transferInSideChain: (to: string, amount: BigNumber) => AsyncGenerator<DelegatedTransferStepValue>;

    // History of Ledger
    getAccountHistory: (
        account: string,
        actions: LedgerAction[],
        pageNumber?: number,
        pageSize?: number
    ) => Promise<any>;
    getSaveAndUseHistory: (account: string, pageNumber?: number, pageSize?: number) => Promise<any>;
    getDepositAndWithdrawHistory: (account: string, pageNumber?: number, pageSize?: number) => Promise<any>;
    getTransferHistory: (account: string, pageNumber?: number, pageSize?: number) => Promise<any>;
    getEstimatedSaveHistory: (account: string) => Promise<any>;
    getTotalEstimatedSaveHistory: (account: string) => Promise<any>;

    // History of Main Chain
    getTransferHistoryInMainChain: (account: string, pageNumber?: number, pageSize?: number) => Promise<any>;

    // History of Side Chain
    getTransferHistoryInSideChain: (account: string, pageNumber?: number, pageSize?: number) => Promise<any>;

    // Provider
    isProvider: () => Promise<boolean>;
    registerProvider: () => Promise<void>;
    registerAssistant: (assistant: string) => AsyncGenerator<RegisterAssistantStepValue>;
    unregisterAssistant: () => AsyncGenerator<RegisterAssistantStepValue>;
    getAssistant: () => Promise<string>;

    // System
    getSystemInfo:() => Promise<ISystemInfo>;
}
