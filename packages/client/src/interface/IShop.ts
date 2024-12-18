import { IClientCore } from "../client-common";
import { BigNumber } from "@ethersproject/bignumber";
import {
    AddShopStepValue,
    ApproveShopStepValue,
    ShopData,
    ShopDetailData,
    CreateDelegateStepValue,
    RemoveDelegateStepValue,
    RefundShopStepValue,
    ShopAction,
    ShopRefundableData,
    IShopSummary
} from "../interfaces";
import { BytesLike } from "@ethersproject/bytes";

export interface IShop {
    shop: IShopMethods;
}

/** Defines the shape of the general purpose Client class */
export interface IShopMethods extends IClientCore {
    getAccount: () => Promise<string>;
    // Common
    getShopInfo: (shopId: BytesLike) => Promise<ShopData>;

    getSummary: (shopId: BytesLike) => Promise<IShopSummary>;

    // Add
    isAvailableId: (shopId: BytesLike) => Promise<boolean>;
    add: (shopId: BytesLike, name: string, currency: string) => AsyncGenerator<AddShopStepValue>;

    // Update
    getTaskDetail: (taskId: BytesLike) => Promise<ShopDetailData>;
    approveUpdate: (taskId: BytesLike, shopId: BytesLike, approval: boolean) => AsyncGenerator<ApproveShopStepValue>;
    approveStatus: (taskId: BytesLike, shopId: BytesLike, approval: boolean) => AsyncGenerator<ApproveShopStepValue>;

    // Refund
    refund: (shopId: BytesLike, amount: BigNumber) => AsyncGenerator<RefundShopStepValue>;
    getRefundableAmount: (shopId: BytesLike) => Promise<ShopRefundableData>;

    // List
    getShops: (from: number, to: number) => Promise<BytesLike[]>;
    getShopsCount: () => Promise<BigNumber>;

    // List
    getShopsByAccount: (account: string, from: number, to: number) => Promise<BytesLike[]>;
    getShopsCountByAccount: (account: string) => Promise<BigNumber>;

    // Delegate
    createDelegate: (shopId: BytesLike) => AsyncGenerator<CreateDelegateStepValue>;
    removeDelegate: (shopId: BytesLike) => AsyncGenerator<RemoveDelegateStepValue>;

    // History
    getHistory: (shopId: BytesLike, actions: ShopAction[], pageNumber?: number, pageSize?: number) => Promise<any>;
    getProvideAndUseTradeHistory: (shopId: BytesLike, pageNumber?: number, pageSize?: number) => Promise<any>;
    getRefundHistory: (shopId: BytesLike, pageNumber?: number, pageSize?: number) => Promise<any>;

    getEstimatedProvideHistory: (shopId: BytesLike) => Promise<any>;
    getTotalEstimatedProvideHistory: (shopId: BytesLike) => Promise<any>;
}
