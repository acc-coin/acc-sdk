import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { BytesLike } from "@ethersproject/bytes";

export const SignatureZero =
    "0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

export enum NormalSteps {
    PREPARED = "prepare",
    SENT = "sent",
    DONE = "done",
    CREATED = "created",
    APPROVED = "approved",
    DENIED = "denied"
}

export enum PaymentDetailTaskStatus {
    NULL = 0,
    OPENED_NEW = 11,
    APPROVED_NEW_FAILED_TX = 12,
    APPROVED_NEW_REVERTED_TX = 13,
    APPROVED_NEW_SENT_TX = 14,
    APPROVED_NEW_CONFIRMED_TX = 15,
    DENIED_NEW = 16,
    REPLY_COMPLETED_NEW = 17,
    CLOSED_NEW = 18,
    FAILED_NEW = 19,
    OPENED_CANCEL = 51,
    APPROVED_CANCEL_FAILED_TX = 52,
    APPROVED_CANCEL_REVERTED_TX = 53,
    APPROVED_CANCEL_SENT_TX = 54,
    APPROVED_CANCEL_CONFIRMED_TX = 55,
    DENIED_CANCEL = 56,
    REPLY_COMPLETED_CANCEL = 57,
    CLOSED_CANCEL = 58,
    FAILED_CANCEL = 59
}

export interface PaymentDetailData {
    paymentId: BytesLike;
    purchaseId: string;
    amount: BigNumber;
    currency: string;
    shopId: BytesLike;
    account: string;
    paidPoint: BigNumber;
    paidValue: BigNumber;
    feePoint: BigNumber;
    feeValue: BigNumber;
    totalPoint: BigNumber;
    totalValue: BigNumber;
    paymentStatus: PaymentDetailTaskStatus;
}

export enum ShopDetailTaskStatus {
    NULL = 0,
    OPENED = 11,
    FAILED_TX = 12,
    REVERTED_TX = 13,
    SENT_TX = 14,
    DENIED = 15,
    COMPLETED = 16,
    TIMEOUT = 70
}

export interface ShopDetailData {
    taskId: BytesLike;
    shopId: BytesLike;
    name: string;
    account: string;
    currency: string;
    status: number;
    taskStatus: ShopDetailTaskStatus;
    timestamp: number;
}

export type ApproveNewPaymentValue =
    | {
          key: NormalSteps.PREPARED;
          paymentId: BytesLike;
          purchaseId: string;
          amount: BigNumber;
          currency: string;
          shopId: BytesLike;
          approval: boolean;
          account: string;
          signature: BytesLike;
      }
    | {
          key: NormalSteps.SENT;
          paymentId: BytesLike;
          purchaseId: string;
          amount: BigNumber;
          currency: string;
          shopId: BytesLike;
          approval: boolean;
          account: string;
          txHash: BytesLike;
      }
    | {
          key: NormalSteps.APPROVED;
          paymentId: BytesLike;
          purchaseId: string;
          amount: BigNumber;
          currency: string;
          shopId: BytesLike;
          approval: boolean;
          account: string;
          paidPoint: BigNumber;
          paidToken: BigNumber;
          paidValue: BigNumber;
          feePoint: BigNumber;
          feeToken: BigNumber;
          feeValue: BigNumber;
          totalPoint: BigNumber;
          totalToken: BigNumber;
          totalValue: BigNumber;
      }
    | {
          key: NormalSteps.DENIED;
          paymentId: BytesLike;
          purchaseId: string;
          amount: BigNumber;
          currency: string;
          shopId: BytesLike;
          approval: boolean;
          account: string;
      };

export type ApproveCancelPaymentValue =
    | {
          key: NormalSteps.PREPARED;
          paymentId: BytesLike;
          purchaseId: string;
          approval: boolean;
          account: string;
          signature: BytesLike;
      }
    | {
          key: NormalSteps.SENT;
          paymentId: BytesLike;
          purchaseId: string;
          approval: boolean;
          account: string;
          txHash: BytesLike;
      }
    | {
          key: NormalSteps.APPROVED;
          paymentId: BytesLike;
          purchaseId: string;
          approval: boolean;
          account: string;
          paidPoint: BigNumber;
          paidToken: BigNumber;
          paidValue: BigNumber;
          feePoint: BigNumber;
          feeToken: BigNumber;
          feeValue: BigNumber;
          totalPoint: BigNumber;
          totalToken: BigNumber;
          totalValue: BigNumber;
      }
    | {
          key: NormalSteps.DENIED;
          paymentId: BytesLike;
          purchaseId: string;
          approval: boolean;
          account: string;
      };

export enum DepositSteps {
    CHECKED_ALLOWANCE = "checkedAllowance",
    UPDATING_ALLOWANCE = "updatingAllowance",
    UPDATED_ALLOWANCE = "updatedAllowance",
    DEPOSITING = "depositing",
    DONE = "done"
}

export type UpdateAllowanceStepValue =
    | { key: DepositSteps.CHECKED_ALLOWANCE; allowance: BigNumber }
    | { key: DepositSteps.UPDATING_ALLOWANCE; txHash: BytesLike }
    | { key: DepositSteps.UPDATED_ALLOWANCE; allowance: BigNumber };

export type DepositStepValue =
    | UpdateAllowanceStepValue
    | { key: DepositSteps.DEPOSITING; txHash: BytesLike }
    | { key: DepositSteps.DONE; amount: BigNumber };

export type UpdateAllowanceParams = {
    targetAddress: string;
    amount: BigNumber;
    tokenAddress: string;
};

export enum WithdrawSteps {
    WITHDRAWING = "withdrawing",
    DONE = "done"
}

export type WithdrawStepValue =
    | { key: WithdrawSteps.WITHDRAWING; txHash: BytesLike }
    | { key: WithdrawSteps.DONE; amount: BigNumber };

export type ExchangePointToTokenStepValue =
    | {
          key: NormalSteps.PREPARED;
          account: string;
          amount: BigNumberish;
          signature: BytesLike;
      }
    | { key: NormalSteps.SENT; txHash: BytesLike }
    | {
          key: NormalSteps.DONE;
          account: string;
          amountPoint: BigNumberish;
          amountToken: BigNumberish;
          balancePoint: BigNumberish;
          balanceToken: BigNumberish;
      };

export type ChangeToPayablePointStepValue =
    | {
          key: NormalSteps.PREPARED;
          phone: string;
          phoneHash: BytesLike;
          account: string;
          signature: BytesLike;
          balance: BigNumberish;
      }
    | { key: NormalSteps.SENT; txHash: BytesLike }
    | { key: NormalSteps.DONE };

export type AddShopStepValue =
    | {
          key: NormalSteps.PREPARED;
          shopId: BytesLike;
          name: string;
          currency: string;
          account: string;
          signature: BytesLike;
      }
    | {
          key: NormalSteps.SENT;
          shopId: BytesLike;
          name: string;
          currency: string;
          account: string;
          txHash: BytesLike;
      }
    | {
          key: NormalSteps.DONE;
          shopId: BytesLike;
          name: string;
          currency: string;
          account: string;
      };

export type ApproveShopStepValue =
    | {
          key: NormalSteps.PREPARED;
          taskId: BytesLike;
          shopId: BytesLike;
          approval: boolean;
          account: string;
          signature: BytesLike;
      }
    | {
          key: NormalSteps.SENT;
          taskId: BytesLike;
          shopId: BytesLike;
          approval: boolean;
          account: string;
          txHash: BytesLike;
      }
    | {
          key: NormalSteps.APPROVED;
          taskId: BytesLike;
          shopId: BytesLike;
          approval: boolean;
          account: string;
          name?: string;
          currency?: string;
          status?: ShopStatus;
      }
    | {
          key: NormalSteps.DENIED;
          taskId: BytesLike;
          shopId: BytesLike;
          approval: boolean;
          account: string;
      };

export type RefundShopStepValue =
    | {
          key: NormalSteps.PREPARED;
          shopId: BytesLike;
          amount: BigNumberish;
          account: string;
          signature: BytesLike;
      }
    | { key: NormalSteps.SENT; txHash: BytesLike; shopId: BytesLike }
    | {
          key: NormalSteps.DONE;
          shopId: BytesLike;
          account: string;
          currency: string;
          refundAmount: BigNumberish;
          refundToken: BigNumberish;
      };

export type RemovePhoneInfoStepValue =
    | {
          key: NormalSteps.PREPARED;
          account: string;
          signature: BytesLike;
      }
    | { key: NormalSteps.SENT; txHash: BytesLike }
    | {
          key: NormalSteps.DONE;
          account: string;
      };

export type CreateDelegateStepValue =
    | {
          key: NormalSteps.PREPARED;
          shopId: BytesLike;
          account: string;
          signature: BytesLike;
      }
    | { key: NormalSteps.CREATED; shopId: BytesLike; account: string; delegator: string }
    | { key: NormalSteps.SENT; txHash: BytesLike; shopId: BytesLike; account: string; delegator: string }
    | { key: NormalSteps.DONE; shopId: BytesLike; account: string; delegator: string };

export type RemoveDelegateStepValue =
    | {
          key: NormalSteps.PREPARED;
          shopId: BytesLike;
          account: string;
          signature: BytesLike;
      }
    | { key: NormalSteps.SENT; txHash: BytesLike; shopId: BytesLike; account: string; delegator: string }
    | { key: NormalSteps.DONE; shopId: BytesLike; account: string; delegator: string };

export interface LoyaltyPaymentEvent {
    paymentId: BytesLike;
    purchaseId: string;
    currency: string;
    shopId: BytesLike;
    account: string;
    timestamp: BigNumber;
    paidPoint: BigNumber;
    paidToken: BigNumber;
    paidValue: BigNumber;
    feePoint: BigNumber;
    feeToken: BigNumber;
    feeValue: BigNumber;
    totalPoint: BigNumber;
    totalToken: BigNumber;
    totalValue: BigNumber;
}

export interface ShopUpdateEvent {
    shopId: BytesLike;
    name: string;
    currency: string;
    account: string;
    status: ShopStatus;
}

export interface ShopStatusEvent {
    shopId: BytesLike;
    status: ShopStatus;
}

export enum ShopStatus {
    INVALID,
    ACTIVE,
    INACTIVE
}

export type ShopData = {
    shopId: BytesLike;
    name: string;
    currency: string;
    account: string; // 상점주의 지갑주소
    delegator: string;
    providedAmount: BigNumber; // 제공된 포인트 총량
    usedAmount: BigNumber; // 사용된 포인트 총량
    settledAmount: BigNumber; // 사용된 포인트 - 제공된 포인트
    refundedAmount: BigNumber; // 정산이 완료된 포인트 총량
    status: ShopStatus;
};

export type ShopRefundableData = {
    refundableAmount: BigNumber;
    refundableToken: BigNumber;
};

export type ValidatorInfoValue = {
    address: string;
    index: number;
    endpoint: string;
    status: number;
};

export enum PhoneLinkRequestStatus {
    INVALID,
    REQUESTED,
    ACCEPTED
}

export enum PhoneLinkRegisterSteps {
    SENDING = "sending",
    REQUESTED = "requested",
    TIMEOUT = "timeout"
}

export type PhoneLinkRegisterStepValue =
    | { key: PhoneLinkRegisterSteps.SENDING; requestId: BytesLike; phone: string; address: string }
    | {
          key: PhoneLinkRegisterSteps.REQUESTED;
          requestId: BytesLike;
          phone: string;
          address: string;
      }
    | {
          key: PhoneLinkRegisterSteps.TIMEOUT;
          requestId: BytesLike;
          phone: string;
          address: string;
      };

export enum PhoneLinkSubmitSteps {
    SENDING = "sending",
    ACCEPTED = "accepted",
    TIMEOUT = "timeout"
}

export type PhoneLinkSubmitStepValue =
    | { key: PhoneLinkSubmitSteps.SENDING; requestId: BytesLike; code: string }
    | {
          key: PhoneLinkSubmitSteps.ACCEPTED;
          requestId: BytesLike;
      }
    | {
          key: PhoneLinkSubmitSteps.TIMEOUT;
          requestId: BytesLike;
      };

// Delegated Transfer
export type DelegatedTransferStepValue =
    | {
          key: NormalSteps.PREPARED;
          from: string;
          to: string;
          amount: BigNumber;
          expiry: number;
          signature: BytesLike;
      }
    | {
          key: NormalSteps.SENT;
          from: string;
          to: string;
          amount: BigNumber;
          expiry: number;
          signature: BytesLike;
          txHash: BytesLike;
      }
    | {
          key: NormalSteps.DONE;
          from: string;
          to: string;
          amount: BigNumber;
          signature: BytesLike;
      };

// Withdraw Bridge
export type DepositViaBridgeStepValue =
    | {
          key: NormalSteps.PREPARED;
          account: string;
          amount: BigNumber;
          expiry: number;
          signature: BytesLike;
      }
    | {
          key: NormalSteps.SENT;
          account: string;
          amount: BigNumber;
          expiry: number;
          signature: BytesLike;
          tokenId: string;
          depositId: string;
          txHash: BytesLike;
      }
    | {
          key: NormalSteps.DONE;
          account: string;
          amount: BigNumber;
          tokenId: string;
          depositId: string;
          signature: BytesLike;
      };

// Withdraw Bridge
export type WithdrawViaBridgeStepValue =
    | {
          key: NormalSteps.PREPARED;
          account: string;
          amount: BigNumber;
          expiry: number;
          signature: BytesLike;
      }
    | {
          key: NormalSteps.SENT;
          account: string;
          amount: BigNumber;
          expiry: number;
          signature: BytesLike;
          tokenId: string;
          depositId: string;
          txHash: BytesLike;
      }
    | {
          key: NormalSteps.DONE;
          account: string;
          amount: BigNumber;
          signature: BytesLike;
          tokenId: string;
          depositId: string;
      };

export enum WaiteBridgeSteps {
    CREATED = "created",
    EXECUTED = "executed",
    DONE = "done",
    TIMEOUT = "timeout"
}

export type WaiteBridgeStepValue =
    | {
          key: WaiteBridgeSteps.CREATED;
          account: string;
          amount: BigNumber;
          tokenId: string;
      }
    | {
          key: WaiteBridgeSteps.EXECUTED;
          account: string;
          amount: BigNumber;
          tokenId: string;
      }
    | {
          key: WaiteBridgeSteps.DONE;
      }
    | {
          key: WaiteBridgeSteps.TIMEOUT;
      };

export type RegisterAssistantStepValue =
    | {
          key: NormalSteps.PREPARED;
          provider: string;
          assistant: string;
          signature: BytesLike;
      }
    | { key: NormalSteps.SENT; provider: string; assistant: string; txHash: BytesLike }
    | {
          key: NormalSteps.DONE;
          provider: string;
          assistant: string;
      };

export enum LedgerAction {
    NONE = 0,
    SAVED = 1,
    USED = 2,
    BURNED,
    DEPOSITED = 11,
    WITHDRAWN = 12,
    CHANGED_TO_PAYABLE_POINT = 21,
    CHANGED_TO_TOKEN = 22,
    CHANGED_TO_POINT = 23,
    REFUND = 31,
    TRANSFER_IN = 41,
    TRANSFER_OUT = 42
}

export enum ShopAction {
    NONE = 0,
    PROVIDED = 1,
    USED = 2,
    REFUNDED = 3
}

export enum MobileType {
    USER_APP,
    SHOP_APP
}

export enum LoyaltyNetworkID {
    ACC_TESTNET = 1,
    ACC_MAINNET = 2
}

export interface IChainInfo {
    url: string;
    network: {
        name: string;
        chainId: number;
        ensAddress: string;
        chainTransferFee: BigNumber;
        chainBridgeFee: BigNumber;
        loyaltyTransferFee: BigNumber;
        loyaltyBridgeFee: BigNumber;
    };
    contract: {
        token: string;
        chainBridge: string;
        loyaltyBridge: string;
    };
}

export interface ITokenInfo {
    symbol: string;
    name: string;
    decimals: number;
}

export interface IExchangeRate {
    token: {
        symbol: string;
        value: BigNumber;
    };
    currency: {
        symbol: string;
        value: BigNumber;
    };
}

export interface IBalance {
    point: {
        balance: BigNumber;
        value: BigNumber;
    };
    token: {
        balance: BigNumber;
        value: BigNumber;
    };
}

export interface IProtocolFees {
    transfer: BigNumber;
    withdraw: BigNumber;
    deposit: BigNumber;
}

export interface IShopInfo {
    shopId: string;
    name: string;
    currency: string;
    status: number;
    account: string;
    delegator: string;
    providedAmount: BigNumber;
    usedAmount: BigNumber;
    refundedAmount: BigNumber;
    refundableAmount: BigNumber;
    refundableToken: BigNumber;
}

export interface IAccountSummary {
    account: string;
    tokenInfo: ITokenInfo;
    exchangeRate: IExchangeRate;
    ledger: IBalance;
    mainChain: IBalance;
    sideChain: IBalance;
    protocolFees: IProtocolFees;
}

export interface IShopSummary {
    shopInfo: IShopInfo;
    tokenInfo: ITokenInfo;
    exchangeRate: IExchangeRate;
    ledger: IBalance;
    mainChain: IBalance;
    sideChain: IBalance;
    protocolFees: IProtocolFees;
}

export interface ISystemInfo {
    token: {
        symbol: string;
    },
    point: {
        precision: number,
        equivalentCurrency: string;
    },
    language: string,
    support: {
        chainBridge: boolean,
        loyaltyBridge: boolean,
        exchange: boolean
    }
}