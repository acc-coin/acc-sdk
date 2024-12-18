import { ClientCore, Context } from "../../client-common";
import { Shop, Shop__factory } from "acc-contracts-lib-v2";
import { Provider } from "@ethersproject/providers";
import { NoProviderError, NoSignerError } from "acc-sdk-common-v2";
import { ContractUtils } from "../../utils/ContractUtils";
import {
    AddShopStepValue,
    NormalSteps,
    ShopData,
    ShopDetailData,
    ApproveShopStepValue,
    ShopUpdateEvent,
    ShopStatusEvent,
    CreateDelegateStepValue,
    RemoveDelegateStepValue,
    RefundShopStepValue,
    ShopAction,
    ShopRefundableData,
    IShopSummary
} from "../../interfaces";
import { FailedAddShopError, FailedApprovePayment, InternalServerError } from "../../utils/errors";
import { Network } from "../../client-common/interfaces/network";
import { findLog } from "../../client-common/utils";

import { BigNumber } from "@ethersproject/bignumber";
import { ContractTransaction } from "@ethersproject/contracts";
import { IShopMethods } from "../../interface/IShop";
import { BytesLike } from "@ethersproject/bytes";

import { AddressZero } from "@ethersproject/constants";

/**
 * 상점의 정보를 추가/수정하는 기능과 정산의 요청/확인이 포함된 클래스이다.
 */
export class ShopMethods extends ClientCore implements IShopMethods {
    constructor(context: Context) {
        super(context);
        Object.freeze(ShopMethods.prototype);
        Object.freeze(this);
    }

    public async getAccount(): Promise<string> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) throw new NoSignerError();
        return await signer.getAddress();
    }

    // region Common
    /**
     * 상점의 정보를 제공한다.
     * @param shopId
     * @return {Promise<ShopData>} 상점의 정보
     */
    public async getShopInfo(shopId: BytesLike): Promise<ShopData> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), provider);
        const shopInfo = await shopContract.shopOf(shopId);
        const settledAmount = shopInfo.collectedAmount.add(shopInfo.usedAmount).gt(shopInfo.providedAmount)
            ? shopInfo.collectedAmount.add(shopInfo.usedAmount).sub(shopInfo.providedAmount)
            : BigNumber.from(0);
        return {
            shopId: shopInfo.shopId,
            name: shopInfo.name,
            currency: shopInfo.currency,
            account: shopInfo.account,
            delegator: shopInfo.delegator,
            providedAmount: shopInfo.providedAmount,
            usedAmount: shopInfo.usedAmount,
            collectedAmount: shopInfo.collectedAmount,
            settledAmount,
            refundedAmount: shopInfo.refundedAmount,
            status: shopInfo.status
        };
    }

    public async getSummary(shopId: BytesLike): Promise<IShopSummary> {
        const res = await Network.get(await this.relay.getEndpoint(`/v2/summary/shop/${shopId}`));
        if (res.code !== 0 || res.data === undefined) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        return {
            shopInfo: {
                shopId: res.data.shopInfo.shopId,
                name: res.data.shopInfo.name,
                currency: res.data.shopInfo.currency,
                status: res.data.shopInfo.status,
                account: res.data.shopInfo.account,
                delegator: res.data.shopInfo.delegator,
                providedAmount: BigNumber.from(res.data.shopInfo.providedAmount),
                usedAmount: BigNumber.from(res.data.shopInfo.usedAmount),
                collectedAmount: BigNumber.from(res.data.shopInfo.collectedAmount),
                refundedAmount: BigNumber.from(res.data.shopInfo.refundedAmount),
                refundableAmount: BigNumber.from(res.data.shopInfo.refundableAmount),
                refundableToken: BigNumber.from(res.data.shopInfo.refundableToken)
            },
            tokenInfo: {
                symbol: res.data.tokenInfo.symbol,
                name: res.data.tokenInfo.name,
                decimals: res.data.tokenInfo.decimals
            },
            exchangeRate: {
                token: {
                    symbol: res.data.exchangeRate.token.symbol,
                    value: BigNumber.from(res.data.exchangeRate.token.value)
                },
                currency: {
                    symbol: res.data.exchangeRate.currency.symbol,
                    value: BigNumber.from(res.data.exchangeRate.currency.value)
                }
            },
            settlement: {
                manager: res.data.settlement.manager
            },
            agent: {
                provision: res.data.agent.provision,
                refund: res.data.agent.refund,
                withdrawal: res.data.agent.withdrawal
            },
            ledger: {
                point: {
                    balance: BigNumber.from(res.data.ledger.point.balance),
                    value: BigNumber.from(res.data.ledger.point.value)
                },
                token: {
                    balance: BigNumber.from(res.data.ledger.token.balance),
                    value: BigNumber.from(res.data.ledger.token.value)
                }
            },
            mainChain: {
                point: {
                    balance: BigNumber.from(res.data.mainChain.point.balance),
                    value: BigNumber.from(res.data.mainChain.point.value)
                },
                token: {
                    balance: BigNumber.from(res.data.mainChain.token.balance),
                    value: BigNumber.from(res.data.mainChain.token.value)
                }
            },
            sideChain: {
                point: {
                    balance: BigNumber.from(res.data.sideChain.point.balance),
                    value: BigNumber.from(res.data.sideChain.point.value)
                },
                token: {
                    balance: BigNumber.from(res.data.sideChain.token.balance),
                    value: BigNumber.from(res.data.sideChain.token.value)
                }
            },
            protocolFees: {
                transfer: BigNumber.from(res.data.protocolFees.transfer),
                withdraw: BigNumber.from(res.data.protocolFees.withdraw),
                deposit: BigNumber.from(res.data.protocolFees.deposit)
            }
        };
    }
    // endregion

    // region Add

    public async isAvailableId(shopId: BytesLike): Promise<boolean> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), provider);
        return await shopContract.isAvailableId(shopId);
    }

    /**
     * 상점의 정보를 추가한다.
     * @param shopId
     * @param name
     * @param currency
     * @return {AsyncGenerator<AddShopStepValue>}
     */
    public async *add(shopId: BytesLike, name: string, currency: string): AsyncGenerator<AddShopStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), signer);
        let contractTx: ContractTransaction;
        const account: string = await signer.getAddress();
        const nonce = await shopContract.nonceOf(account);
        const message = ContractUtils.getShopAccountMessage(shopId, account, nonce, this.web3.getChainId());
        const signature = await ContractUtils.signMessage(signer, message);

        const param = {
            shopId,
            name,
            currency,
            account,
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            shopId,
            name,
            currency,
            account,
            signature
        };

        const res = await Network.post(await this.relay.getEndpoint("/v1/shop/add"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

        yield { key: NormalSteps.SENT, shopId, name, currency, account, txHash: res.data.txHash };
        const txReceipt = await contractTx.wait();

        const log = findLog(txReceipt, shopContract.interface, "AddedShop");
        if (!log) {
            throw new FailedAddShopError();
        }
        const parsedLog = shopContract.interface.parseLog(log);

        yield {
            key: NormalSteps.DONE,
            shopId: parsedLog.args["shopId"],
            name: parsedLog.args["name"],
            currency: parsedLog.args["currency"],
            account: parsedLog.args["account"]
        };
    }

    // endregion

    // region Update

    public async getTaskDetail(taskId: BytesLike): Promise<ShopDetailData> {
        const res = await Network.get(await this.relay.getEndpoint("/v1/shop/task"), {
            taskId: taskId.toString()
        });
        if (res.code !== 0 || res.data === undefined) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        let detail: ShopDetailData;

        try {
            detail = {
                taskId: res.data.taskId,
                shopId: res.data.shopId,
                name: res.data.name,
                currency: res.data.currency,
                status: res.data.status,
                account: res.data.account,
                taskStatus: res.taskStatus,
                timestamp: res.timestamp
            };
        } catch (_) {
            throw new InternalServerError("Error parsing receiving data");
        }

        return detail;
    }

    public async *approveUpdate(
        taskId: BytesLike,
        shopId: BytesLike,
        approval: boolean
    ): AsyncGenerator<ApproveShopStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), signer);
        let contractTx: ContractTransaction;
        const account: string = await signer.getAddress();
        const nonce = await shopContract.nonceOf(account);
        const message = ContractUtils.getShopAccountMessage(shopId, account, nonce, this.web3.getChainId());
        const signature = await ContractUtils.signMessage(signer, message);

        const param = {
            taskId,
            approval,
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            taskId,
            shopId,
            approval,
            account,
            signature
        };

        const res = await Network.post(await this.relay.getEndpoint("/v1/shop/update/approval"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        if (approval) {
            contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

            yield { key: NormalSteps.SENT, taskId, shopId, approval, account, txHash: res.data.txHash };
            const event = await this.waitAndUpdateEvent(shopContract, contractTx);

            if (event === undefined) throw new FailedApprovePayment();
            yield {
                key: NormalSteps.APPROVED,
                taskId,
                shopId: event.shopId,
                approval,
                account: event.account,
                name: event.name,
                currency: event.currency,
                status: event.status
            };
        } else {
            yield {
                key: NormalSteps.DENIED,
                taskId,
                shopId,
                approval,
                account
            };
        }
    }

    public async *approveStatus(
        taskId: BytesLike,
        shopId: BytesLike,
        approval: boolean
    ): AsyncGenerator<ApproveShopStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), signer);
        let contractTx: ContractTransaction;
        const account: string = await signer.getAddress();
        const nonce = await shopContract.nonceOf(account);
        const message = ContractUtils.getShopAccountMessage(shopId, account, nonce, this.web3.getChainId());
        const signature = await ContractUtils.signMessage(signer, message);

        const param = {
            taskId,
            approval,
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            taskId,
            shopId,
            approval,
            account,
            signature
        };

        let res = await Network.post(await this.relay.getEndpoint("/v1/shop/status/approval"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        if (approval) {
            contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

            yield { key: NormalSteps.SENT, taskId, shopId, approval, account, txHash: res.data.txHash };
            const event = await this.waitAndChangeStatusEvent(shopContract, contractTx);

            if (event === undefined) throw new FailedApprovePayment();
            yield {
                key: NormalSteps.APPROVED,
                taskId,
                shopId: event.shopId,
                approval,
                account,
                status: event.status
            };
        } else {
            yield {
                key: NormalSteps.DENIED,
                taskId,
                shopId,
                approval,
                account
            };
        }
    }

    private async waitAndUpdateEvent(contract: Shop, tx: ContractTransaction): Promise<ShopUpdateEvent | undefined> {
        const contractReceipt = await tx.wait();
        const log = findLog(contractReceipt, contract.interface, "UpdatedShop");
        if (log !== undefined) {
            const parsedLog = contract.interface.parseLog(log);

            return {
                shopId: parsedLog.args.shopId,
                name: parsedLog.args.name,
                currency: parsedLog.args.currency,
                account: parsedLog.args.account,
                status: parsedLog.args.status
            };
        } else return undefined;
    }

    private async waitAndChangeStatusEvent(
        contract: Shop,
        tx: ContractTransaction
    ): Promise<ShopStatusEvent | undefined> {
        const contractReceipt = await tx.wait();
        const log = findLog(contractReceipt, contract.interface, "ChangedShopStatus");
        if (log !== undefined) {
            const parsedLog = contract.interface.parseLog(log);
            return {
                shopId: parsedLog.args.shopId,
                status: parsedLog.args.status
            };
        } else return undefined;
    }

    // endregion

    // region Refund
    /**
     * 반환받을 수 있는 정산금을 제공한다. 금액과 토큰의 량을 제공한다
     * @param shopId 상점의 아이디
     * @return {Promise<ShopRefundableData>} 반환가능금액
     */
    public async getRefundableAmount(shopId: BytesLike): Promise<ShopRefundableData> {
        const res = await Network.get(await this.relay.getEndpoint(`/v1/shop/refundable/${shopId}`));
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }
        return {
            refundableAmount: BigNumber.from(res.data.refundableAmount),
            refundableToken: BigNumber.from(res.data.refundableToken)
        };
    }

    /**
     * 상점의 정산금을 반환한다
     * @param shopId
     * @param amount
     * @return {AsyncGenerator<RefundShopStepValue>}
     */
    public async *refund(shopId: BytesLike, amount: BigNumber): AsyncGenerator<RefundShopStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), signer);
        let contractTx: ContractTransaction;
        const account: string = await signer.getAddress();
        const adjustedAmount = ContractUtils.zeroGWEI(amount);
        const nonce = await shopContract.nonceOf(account);
        const message = ContractUtils.getShopRefundMessage(shopId, adjustedAmount, nonce, this.web3.getChainId());
        const signature = await ContractUtils.signMessage(signer, message);

        const param = {
            shopId,
            account,
            amount: adjustedAmount.toString(),
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            shopId,
            account,
            amount: adjustedAmount,
            signature
        };

        const res = await Network.post(await this.relay.getEndpoint("/v1/shop/refund"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

        yield { key: NormalSteps.SENT, txHash: res.data.txHash, shopId };

        const txReceipt = await contractTx.wait();

        const log = findLog(txReceipt, shopContract.interface, "Refunded");
        if (!log) {
            throw new FailedAddShopError();
        }
        const parsedLog = shopContract.interface.parseLog(log);

        yield {
            key: NormalSteps.DONE,
            shopId: parsedLog.args["shopId"],
            account: parsedLog.args["account"],
            currency: parsedLog.args["currency"],
            refundAmount: parsedLog.args["refundAmount"],
            refundToken: parsedLog.args["amountToken"]
        };
    }

    // endregion

    // region List
    public async getShops(from: number, to: number): Promise<BytesLike[]> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), signer);
        const account: string = await signer.getAddress();
        return await shopContract.getShopsOfAccount(account, BigNumber.from(from), BigNumber.from(to));
    }

    public async getShopsCount(): Promise<BigNumber> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), signer);
        const account: string = await signer.getAddress();
        return await shopContract.getShopsCountOfAccount(account);
    }

    public async getShopsByAccount(account: string, from: number, to: number): Promise<BytesLike[]> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), provider);
        return await shopContract.getShopsOfAccount(account, BigNumber.from(from), BigNumber.from(to));
    }

    public async getShopsCountByAccount(account: string): Promise<BigNumber> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), provider);
        return await shopContract.getShopsCountOfAccount(account);
    }
    // endregion

    // region Delegate
    public async *createDelegate(shopId: BytesLike): AsyncGenerator<CreateDelegateStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), signer);
        let contractTx: ContractTransaction;
        const account: string = await signer.getAddress();
        const nonce = await shopContract.nonceOf(account);
        const message = ContractUtils.getShopAccountMessage(shopId, account, nonce, this.web3.getChainId());
        const signature = await ContractUtils.signMessage(signer, message);

        const param = {
            shopId,
            account,
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            shopId,
            account,
            signature
        };

        const res = await Network.post(await this.relay.getEndpoint("/v1/shop/account/delegator/create"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        const delegator = res.data.delegator;
        const nonce2 = await shopContract.nonceOf(account);
        const message2 = ContractUtils.getShopDelegatorAccountMessage(
            shopId,
            delegator,
            account,
            nonce2,
            this.web3.getChainId()
        );
        const signature2 = await ContractUtils.signMessage(signer, message2);
        const param2 = {
            shopId,
            account,
            delegator,
            signature: signature2
        };

        const res2 = await Network.post(await this.relay.getEndpoint("/v1/shop/account/delegator/save"), param2);
        if (res2.code !== 0) {
            throw new InternalServerError(res2?.error?.message ?? "");
        }

        contractTx = (await signer.provider.getTransaction(res2.data.txHash)) as ContractTransaction;

        yield { key: NormalSteps.SENT, txHash: res2.data.txHash, shopId, account, delegator };

        const txReceipt = await contractTx.wait();

        const log = findLog(txReceipt, shopContract.interface, "ChangedDelegator");
        if (!log) {
            throw new FailedAddShopError();
        }

        yield {
            key: NormalSteps.DONE,
            shopId,
            account,
            delegator
        };
    }

    public async *removeDelegate(shopId: BytesLike): AsyncGenerator<RemoveDelegateStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const shopContract: Shop = Shop__factory.connect(this.web3.getShopAddress(), signer);
        let contractTx: ContractTransaction;
        const account: string = await signer.getAddress();
        const delegator = AddressZero;
        const nonce = await shopContract.nonceOf(account);
        const message = ContractUtils.getShopDelegatorAccountMessage(
            shopId,
            delegator,
            account,
            nonce,
            this.web3.getChainId()
        );
        const signature = await ContractUtils.signMessage(signer, message);

        const param = {
            shopId,
            account,
            delegator,
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            shopId,
            account,
            signature
        };

        const res = await Network.post(await this.relay.getEndpoint("/v1/shop/account/delegator/save"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

        yield { key: NormalSteps.SENT, txHash: res.data.txHash, shopId, account, delegator };

        const txReceipt = await contractTx.wait();

        const log = findLog(txReceipt, shopContract.interface, "ChangedDelegator");
        if (!log) {
            throw new FailedAddShopError();
        }

        yield {
            key: NormalSteps.DONE,
            shopId,
            account,
            delegator
        };
    }
    // endregion

    // region History
    /**
     * 사용자 지갑주소의 거래내역을 제공한다.
     * @param shopId 사용자의 지갑주소
     * @param pageNumber 페이지번호 1부터 시작됨
     * @param pageSize 페이지당 항목의 갯수
     * @param actions 수신하기를 원하는 거래의 유형들이 기록된 배열
     */
    public async getHistory(
        shopId: BytesLike,
        actions: ShopAction[],
        pageNumber: number = 1,
        pageSize: number = 10
    ): Promise<any> {
        const params = {
            pageNumber,
            pageSize,
            actions: actions.join(",")
        };
        const res = await Network.get(await this.relay.getEndpoint(`/v1/shop/history/${shopId}`), params);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }
        return res.data;
    }
    /**
     * 상점의 로얄티 제공/사용 거래내역을 제공한다
     * @param shopId 사용자의 지갑주소
     * @param pageNumber 페이지번호 1부터 시작됨
     * @param pageSize 페이지당 항목의 갯수
     * @return {Promise<any>}
     */
    public async getProvideAndUseTradeHistory(
        shopId: BytesLike,
        pageNumber: number = 1,
        pageSize: number = 10
    ): Promise<any> {
        return await this.getHistory(shopId, [ShopAction.PROVIDED, ShopAction.USED], pageNumber, pageSize);
    }

    /**
     상점의 거래내역들 중 정산금의 인출 거래내역을 제공한다
     @param shopId 사용자의 지갑주소
     @param pageNumber 페이지번호 1부터 시작됨
     @param pageSize 페이지당 항목의 갯수
     * @return {Promise<any>}
     */
    public async getRefundHistory(shopId: BytesLike, pageNumber: number = 1, pageSize: number = 10): Promise<any> {
        return await this.getHistory(shopId, [ShopAction.REFUNDED], pageNumber, pageSize);
    }

    public async getEstimatedProvideHistory(shopId: BytesLike): Promise<any[]> {
        const res = await Network.get(await this.relay.getEndpoint(`/v1/purchase/shop/provide/${shopId.toString()}`));
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        return res.data;
    }

    public async getTotalEstimatedProvideHistory(shopId: BytesLike): Promise<any[]> {
        const res = await Network.get(
            await this.relay.getEndpoint(`/v1/purchase/shop/provide/total/${shopId.toString()}`)
        );
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        return res.data;
    }

    // endregion
}
