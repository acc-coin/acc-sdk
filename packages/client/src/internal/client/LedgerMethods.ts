import { ClientCore, Context } from "../../client-common";
import { ILedgerMethods } from "../../interface/ILedger";
import {
    Ledger,
    Ledger__factory,
    IBridge,
    IBridge__factory,
    LoyaltyConsumer,
    LoyaltyConsumer__factory,
    LoyaltyExchanger,
    LoyaltyExchanger__factory,
    LoyaltyToken,
    LoyaltyToken__factory,
    LoyaltyTransfer,
    LoyaltyTransfer__factory,
    PhoneLinkCollection,
    PhoneLinkCollection__factory
} from "acc-contracts-lib-v2";
import { JsonRpcProvider, Provider } from "@ethersproject/providers";
import { NoProviderError, NoSignerError, UpdateAllowanceError } from "acc-sdk-common-v2";
import { ContractUtils } from "../../utils/ContractUtils";
import { GasPriceManager } from "../../utils/GasPriceManager";
import { NonceManager } from "../../utils/NonceManager";
import {
    ExchangePointToTokenStepValue,
    ChangeToPayablePointStepValue,
    DepositSteps,
    DepositStepValue,
    NormalSteps,
    UpdateAllowanceParams,
    UpdateAllowanceStepValue,
    WithdrawSteps,
    WithdrawStepValue,
    PaymentDetailData,
    ApproveNewPaymentValue,
    LoyaltyPaymentEvent,
    ApproveCancelPaymentValue,
    PaymentDetailTaskStatus,
    MobileType,
    RemovePhoneInfoStepValue,
    DelegatedTransferStepValue,
    DepositViaBridgeStepValue,
    IChainInfo,
    WaiteBridgeStepValue,
    WaiteBridgeSteps,
    LedgerAction,
    IAccountSummary,
    RegisterAssistantStepValue,
    ISystemInfo
} from "../../interfaces";
import {
    AmountMismatchError,
    FailedApprovePayment,
    FailedDepositError,
    FailedPayTokenError,
    FailedRemovePhoneInfoError,
    FailedTransactionError,
    FailedWithdrawError,
    InsufficientBalanceError,
    InternalServerError,
    MismatchedAddressError,
    UnregisteredPhoneError
} from "../../utils/errors";
import { Network } from "../../client-common/interfaces/network";
import { findLog } from "../../client-common/utils";

import { BigNumber } from "@ethersproject/bignumber";
import { ContractTransaction } from "@ethersproject/contracts";
import { AddressZero } from "@ethersproject/constants";
import { BytesLike } from "@ethersproject/bytes";

/**
 * 사용자의 포인트/토큰의 잔고와 제품구매를 하는 기능이 포함되어 있다.
 */
export class LedgerMethods extends ClientCore implements ILedgerMethods {
    constructor(context: Context) {
        super(context);
        Object.freeze(LedgerMethods.prototype);
        Object.freeze(this);
    }

    public async getAccount(): Promise<string> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) throw new NoSignerError();
        return await signer.getAddress();
    }

    // region Balance
    public async getSummary(account: string): Promise<IAccountSummary> {
        const res = await Network.get(await this.relay.getEndpoint(`/v1/summary/account/${account}`));
        if (res.code !== 0 || res.data === undefined) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        return {
            account: String(res.data.account),
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

    /**
     * 포인트의 잔고를 리턴한다
     * @param {string} phoneHash - 전화번호 해시
     * @return {Promise<BigNumber>} 포인트 잔고
     */
    public async getUnPayablePointBalance(phoneHash: string): Promise<BigNumber> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const ledgerInstance: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), provider);
        return await ledgerInstance.unPayablePointBalanceOf(phoneHash);
    }

    /**
     * 포인트의 잔고를 리턴한다
     * @param {string} account - 지갑 주소
     * @return {Promise<BigNumber>} 포인트 잔고
     */
    public async getPointBalance(account: string): Promise<BigNumber> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const ledgerInstance: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), provider);
        return await ledgerInstance.pointBalanceOf(account);
    }

    /**
     * 토큰의 잔고를 리턴한다.
     * @param {string} account - 지갑 주소
     * @return {Promise<BigNumber>} 토큰 잔고
     */
    public async getTokenBalance(account: string): Promise<BigNumber> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const ledgerInstance: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), provider);
        return await ledgerInstance.tokenBalanceOf(account);
    }

    // endregion

    // region Payment
    /**
     * 컨트랙트에 저장된 수수료 율을 리턴한다.
     */
    public async getFeeRate(): Promise<number> {
        const provider = this.web3.getProvider() as Provider;
        if (!provider) throw new NoProviderError();

        const ledgerInstance: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), provider);
        return await ledgerInstance.getPaymentFee();
    }

    public async getTemporaryAccount(): Promise<string> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);

        const account = await signer.getAddress();
        const nonce = await ledgerContract.nonceOf(account);
        const message = ContractUtils.getAccountMessage(account, nonce, this.web3.getChainId());
        const signature = await ContractUtils.signMessage(signer, message);

        const param = {
            account,
            signature
        };

        const res = await Network.post(await this.relay.getEndpoint("/v1/payment/account/temporary"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        return res.data.temporaryAccount;
    }

    public async getPaymentDetail(paymentId: BytesLike): Promise<PaymentDetailData> {
        const res = await Network.get(await this.relay.getEndpoint("/v1/payment/item"), {
            paymentId: paymentId.toString()
        });
        if (res.code !== 0 || res.data === undefined) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        let detail: PaymentDetailData;

        try {
            detail = {
                paymentId: res.data.paymentId,
                purchaseId: res.data.purchaseId,
                amount: BigNumber.from(res.data.amount),
                currency: res.data.currency,
                shopId: res.data.shopId,
                account: res.data.account,
                paidPoint: BigNumber.from(res.data.paidPoint),
                paidValue: BigNumber.from(res.data.paidValue),
                feePoint: BigNumber.from(res.data.feePoint),
                feeValue: BigNumber.from(res.data.feeValue),
                totalPoint: BigNumber.from(res.data.totalPoint),
                totalValue: BigNumber.from(res.data.totalValue),
                paymentStatus: res.data.paymentStatus
            };
        } catch (_) {
            throw new InternalServerError("Error parsing receiving data");
        }

        return detail;
    }

    public async *approveNewPayment(
        paymentId: BytesLike,
        purchaseId: string,
        amount: BigNumber,
        currency: string,
        shopId: BytesLike,
        approval: boolean
    ): AsyncGenerator<ApproveNewPaymentValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);
        const account: string = await signer.getAddress();
        const nonce = await ledgerContract.nonceOf(account);
        const signature = await ContractUtils.signLoyaltyNewPayment(
            signer,
            paymentId,
            purchaseId,
            amount,
            currency,
            shopId,
            nonce,
            this.web3.getChainId()
        );

        const param = {
            paymentId,
            approval,
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            paymentId,
            purchaseId,
            amount,
            currency,
            shopId,
            approval,
            account,
            signature
        };

        const res = await Network.post(await this.relay.getEndpoint("/v1/payment/new/approval"), param);
        if (res.code !== 0 || res.data === undefined) {
            console.log(res.code);
            console.log(res?.error?.message ?? "");
            throw new InternalServerError(res?.error?.message ?? "");
        }
        if (approval) {
            yield {
                key: NormalSteps.SENT,
                paymentId,
                purchaseId,
                amount,
                currency,
                shopId,
                approval,
                account,
                txHash: res.data.txHash
            };

            const consumerContract: LoyaltyConsumer = LoyaltyConsumer__factory.connect(
                this.web3.getLoyaltyConsumerAddress(),
                signer
            );

            let event: LoyaltyPaymentEvent | undefined = undefined;
            event = await this.waitPaymentLoyalty(
                consumerContract,
                (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction
            );
            if (event === undefined) event = await this.waitNewPaymentLoyaltyFromDetail(paymentId);
            if (event === undefined) throw new FailedApprovePayment();

            yield {
                key: NormalSteps.APPROVED,
                paymentId: event.paymentId,
                purchaseId: event.purchaseId,
                amount: event.paidValue,
                currency: event.currency,
                shopId: event.shopId,
                approval,
                account: event.account,
                paidPoint: event.paidPoint,
                paidToken: event.paidToken,
                paidValue: event.paidValue,
                feePoint: event.feePoint,
                feeToken: event.feeToken,
                feeValue: event.feeValue,
                totalPoint: event.totalPoint,
                totalToken: event.totalToken,
                totalValue: event.totalValue
            };
        } else {
            yield {
                key: NormalSteps.DENIED,
                paymentId,
                purchaseId,
                amount,
                currency,
                shopId,
                approval,
                account
            };
        }
    }

    private convertDetailToEvent(detail: PaymentDetailData): LoyaltyPaymentEvent {
        return {
            paymentId: detail.paymentId,
            purchaseId: detail.purchaseId,
            currency: detail.currency,
            shopId: detail.shopId,
            account: detail.account,
            timestamp: BigNumber.from(ContractUtils.getTimeStamp()),
            paidPoint: BigNumber.from(detail.paidPoint),
            paidToken: BigNumber.from(0),
            paidValue: BigNumber.from(detail.paidValue),

            feePoint: BigNumber.from(detail.feePoint),
            feeToken: BigNumber.from(0),
            feeValue: BigNumber.from(detail.feeValue),
            totalPoint: detail.paidPoint.add(detail.feePoint),
            totalToken: BigNumber.from(0),
            totalValue: detail.paidValue.add(detail.feeValue)
        };
    }

    public async *approveCancelPayment(
        paymentId: BytesLike,
        purchaseId: string,
        approval: boolean
    ): AsyncGenerator<ApproveCancelPaymentValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);
        const account: string = await signer.getAddress();
        const nonce = await ledgerContract.nonceOf(account);
        const signature = await ContractUtils.signLoyaltyCancelPayment(
            signer,
            paymentId,
            purchaseId,
            nonce,
            this.web3.getChainId()
        );

        const param = {
            paymentId,
            approval,
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            paymentId,
            purchaseId,
            approval,
            account,
            signature
        };

        const res = await Network.post(await this.relay.getEndpoint("/v1/payment/cancel/approval"), param);
        if (res.code !== 0 || res.data === undefined) {
            throw new InternalServerError(res?.error?.message ?? "");
        }
        if (approval) {
            yield {
                key: NormalSteps.SENT,
                paymentId,
                purchaseId,
                approval,
                account,
                txHash: res.data.txHash
            };

            const consumerContract: LoyaltyConsumer = LoyaltyConsumer__factory.connect(
                this.web3.getLoyaltyConsumerAddress(),
                signer
            );

            let event: LoyaltyPaymentEvent | undefined = undefined;
            event = await this.waitPaymentLoyalty(
                consumerContract,
                (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction
            );
            if (event === undefined) event = await this.waitCancelPaymentLoyaltyFromDetail(paymentId);
            if (event === undefined) throw new FailedApprovePayment();

            yield {
                key: NormalSteps.APPROVED,
                paymentId: event.paymentId,
                purchaseId: event.purchaseId,
                approval,
                account: account,
                paidPoint: event.paidPoint,
                paidToken: event.paidToken,
                paidValue: event.paidValue,
                feePoint: event.feePoint,
                feeToken: event.feeToken,
                feeValue: event.feeValue,
                totalPoint: event.totalPoint,
                totalToken: event.totalToken,
                totalValue: event.totalValue
            };
        } else {
            yield {
                key: NormalSteps.DENIED,
                paymentId,
                purchaseId,
                approval,
                account
            };
        }
    }

    private async waitPaymentLoyalty(
        contract: LoyaltyConsumer,
        tx: ContractTransaction
    ): Promise<LoyaltyPaymentEvent | undefined> {
        const res: any = {};
        const contractReceipt = await tx.wait();
        const log = findLog(contractReceipt, contract.interface, "LoyaltyPaymentEvent");
        if (log !== undefined) {
            const parsedLog = contract.interface.parseLog(log);

            res.paymentId = parsedLog.args.payment.paymentId;
            res.purchaseId = parsedLog.args.payment.purchaseId;
            res.amount = BigNumber.from(parsedLog.args.payment.paidValue);
            res.currency = parsedLog.args.payment.currency;
            res.shopId = parsedLog.args.payment.shopId;
            res.account = parsedLog.args.payment.account;
            res.timestamp = parsedLog.args.payment.timestamp;
            res.paidPoint = BigNumber.from(parsedLog.args.payment.paidPoint);
            res.paidToken = BigNumber.from(parsedLog.args.payment.paidToken);
            res.paidValue = BigNumber.from(parsedLog.args.payment.paidValue);
            res.feePoint = BigNumber.from(parsedLog.args.payment.feePoint);
            res.feeToken = BigNumber.from(parsedLog.args.payment.feeToken);
            res.feeValue = BigNumber.from(parsedLog.args.payment.feeValue);

            res.totalPoint = res.paidPoint.add(res.feePoint);
            res.totalToken = res.paidToken.add(res.feeToken);
            res.totalValue = res.paidValue.add(res.feeValue);

            return res;
        } else return undefined;
    }

    private async waitNewPaymentLoyaltyFromDetail(paymentId: BytesLike): Promise<LoyaltyPaymentEvent | undefined> {
        const startTm = ContractUtils.getTimeStamp();
        while (true) {
            const detail = await this.getPaymentDetail(paymentId);
            if (
                detail.paymentStatus === PaymentDetailTaskStatus.APPROVED_NEW_CONFIRMED_TX ||
                detail.paymentStatus === PaymentDetailTaskStatus.REPLY_COMPLETED_NEW ||
                detail.paymentStatus === PaymentDetailTaskStatus.CLOSED_NEW
            ) {
                return this.convertDetailToEvent(detail);
            } else if (
                detail.paymentStatus === PaymentDetailTaskStatus.APPROVED_NEW_FAILED_TX ||
                detail.paymentStatus === PaymentDetailTaskStatus.APPROVED_NEW_REVERTED_TX
            ) {
                return undefined;
            }
            if (ContractUtils.getTimeStamp() - startTm > 10) break;
            await ContractUtils.delay(1000);
        }

        return undefined;
    }

    private async waitCancelPaymentLoyaltyFromDetail(paymentId: BytesLike): Promise<LoyaltyPaymentEvent | undefined> {
        const startTm = ContractUtils.getTimeStamp();
        while (true) {
            const detail = await this.getPaymentDetail(paymentId);
            if (
                detail.paymentStatus === PaymentDetailTaskStatus.APPROVED_CANCEL_CONFIRMED_TX ||
                detail.paymentStatus === PaymentDetailTaskStatus.REPLY_COMPLETED_CANCEL ||
                detail.paymentStatus === PaymentDetailTaskStatus.CLOSED_CANCEL
            ) {
                return this.convertDetailToEvent(detail);
            } else if (
                detail.paymentStatus === PaymentDetailTaskStatus.APPROVED_CANCEL_FAILED_TX ||
                detail.paymentStatus === PaymentDetailTaskStatus.APPROVED_CANCEL_REVERTED_TX
            ) {
                return undefined;
            }
            if (ContractUtils.getTimeStamp() - startTm > 10) break;
            await ContractUtils.delay(1000);
        }

        return undefined;
    }

    // endregion

    // region Deposit & Withdrawal
    /**
     * 토큰을 예치합니다.
     * @param {BigNumber} amount 금액
     * @return {AsyncGenerator<DepositStepValue>}
     */
    public async *deposit(amount: BigNumber): AsyncGenerator<DepositStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const account: string = await signer.getAddress();

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);
        const tokenContract: LoyaltyToken = LoyaltyToken__factory.connect(this.web3.getTokenAddress(), signer);

        const balance = await tokenContract.balanceOf(account);
        if (amount.gte(balance)) throw new InsufficientBalanceError();

        yield* this.updateAllowance({
            amount: amount,
            targetAddress: this.web3.getLedgerAddress(),
            tokenAddress: this.web3.getTokenAddress()
        });

        const nonceSigner = new NonceManager(new GasPriceManager(signer));
        const depositTx = await ledgerContract.connect(nonceSigner).deposit(amount);
        yield { key: DepositSteps.DEPOSITING, txHash: depositTx.hash };

        const cr = await depositTx.wait();
        const log = findLog(cr, ledgerContract.interface, "Deposited");
        if (!log) {
            throw new FailedDepositError();
        }

        const parsedLog = ledgerContract.interface.parseLog(log);
        if (!amount.eq(parsedLog.args["depositedToken"])) {
            throw new AmountMismatchError(amount, parsedLog.args["depositedToken"]);
        }
        yield { key: DepositSteps.DONE, amount: amount };
    }

    /**
     * 토큰을 인출합니다.
     * @param {BigNumber} amount 금액
     * @return {AsyncGenerator<WithdrawStepValue>}
     */
    public async *withdraw(amount: BigNumber): AsyncGenerator<WithdrawStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const account: string = await signer.getAddress();

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);

        const currentDepositAmount = await ledgerContract.tokenBalanceOf(account);
        if (currentDepositAmount.lt(amount)) throw new InsufficientBalanceError();

        const nonceSigner = new NonceManager(new GasPriceManager(signer));
        const tx = await ledgerContract.connect(nonceSigner).withdraw(amount);
        yield { key: WithdrawSteps.WITHDRAWING, txHash: tx.hash };

        const cr = await tx.wait();
        const log = findLog(cr, ledgerContract.interface, "Withdrawn");
        if (!log) {
            throw new FailedWithdrawError();
        }

        const parsedLog = ledgerContract.interface.parseLog(log);
        if (!amount.eq(parsedLog.args["withdrawnToken"])) {
            throw new AmountMismatchError(amount, parsedLog.args["withdrawnToken"]);
        }
        yield { key: WithdrawSteps.DONE, amount: amount };
    }

    /**
     * 허용된 금액이 충분한지 확인하고 그렇지 않으면 업데이트합니다.
     * @param {UpdateAllowanceParams} params
     * @return {*}  {AsyncGenerator<UpdateAllowanceStepValue>}
     */
    public async *updateAllowance(params: UpdateAllowanceParams): AsyncGenerator<UpdateAllowanceStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const nonceSigner = new NonceManager(new GasPriceManager(signer));
        const tokenInstance = LoyaltyToken__factory.connect(params.tokenAddress, nonceSigner);
        const currentAllowance = await tokenInstance.allowance(await signer.getAddress(), params.targetAddress);

        yield {
            key: DepositSteps.CHECKED_ALLOWANCE,
            allowance: currentAllowance
        };

        if (currentAllowance.gte(params.amount)) return;

        const tx: ContractTransaction = await tokenInstance.approve(
            params.targetAddress,
            BigNumber.from(params.amount)
        );

        yield {
            key: DepositSteps.UPDATING_ALLOWANCE,
            txHash: tx.hash
        };

        const cr = await tx.wait();
        const log = findLog(cr, tokenInstance.interface, "Approval");

        if (!log) {
            throw new UpdateAllowanceError();
        }
        const value = log.data;
        if (!value || BigNumber.from(params.amount).gt(BigNumber.from(value))) {
            throw new UpdateAllowanceError();
        }

        yield {
            key: DepositSteps.UPDATED_ALLOWANCE,
            allowance: params.amount
        };
    }

    // endregion

    // region Change
    /**
     * 전화번호로 적립된 포인트를 사용가능한 지갑주소로 적립된 포인트로 변환한다.
     * @param phone 전화번호
     * @return {AsyncGenerator<ChangeToPayablePointStepValue>}
     */
    public async *changeToPayablePoint(phone: string): AsyncGenerator<ChangeToPayablePointStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);

        const phoneHash = ContractUtils.getPhoneHash(phone.trim());
        const balance = await ledgerContract.unPayablePointBalanceOf(phoneHash);
        if (balance.eq(BigNumber.from(0))) {
            throw new InsufficientBalanceError();
        }

        const linkContract: PhoneLinkCollection = PhoneLinkCollection__factory.connect(
            this.web3.getLinkAddress(),
            signer.provider
        );
        const phoneToAddress: string = await linkContract.toAddress(phoneHash);
        if (phoneToAddress === AddressZero) throw new UnregisteredPhoneError();
        if (phoneToAddress !== (await signer.getAddress())) throw new MismatchedAddressError();

        const account: string = await signer.getAddress();
        let contractTx: ContractTransaction;
        const nonce = await ledgerContract.nonceOf(account);
        const signature = await ContractUtils.signChangePayablePoint(signer, phoneHash, nonce, this.web3.getChainId());

        const param = {
            phone: phoneHash,
            account,
            signature
        };

        yield { key: NormalSteps.PREPARED, phone, phoneHash, account, signature, balance };

        const res = await Network.post(await this.relay.getEndpoint("/v1/ledger/changeToPayablePoint"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

        yield { key: NormalSteps.SENT, txHash: res.data.txHash };
        const txReceipt = await contractTx.wait();

        const exchangerContract: LoyaltyExchanger = LoyaltyExchanger__factory.connect(
            this.web3.getLoyaltyExchangerAddress(),
            signer
        );
        const log = findLog(txReceipt, exchangerContract.interface, "ChangedToPayablePoint");
        if (!log) {
            throw new FailedPayTokenError();
        }
        const parsedLog = exchangerContract.interface.parseLog(log);
        if (!balance.eq(parsedLog.args["changedPoint"])) {
            throw new AmountMismatchError(balance, parsedLog.args["changedPoint"]);
        }

        yield {
            key: NormalSteps.DONE
        };
    }

    /**
     * 포인트를 토큰으로 변환
     * @return {AsyncGenerator<ExchangePointToTokenStepValue>}
     */
    public async *exchangePointToToken(amount: BigNumber): AsyncGenerator<ExchangePointToTokenStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);
        const account: string = await signer.getAddress();
        const adjustedAmount = ContractUtils.zeroGWEI(amount);
        let contractTx: ContractTransaction;
        const nonce = await ledgerContract.nonceOf(account);
        const message = ContractUtils.getChangePointToTokenMessage(
            account,
            adjustedAmount,
            nonce,
            this.web3.getChainId()
        );
        const signature = await ContractUtils.signMessage(signer, message);

        yield { key: NormalSteps.PREPARED, account, amount: adjustedAmount, signature };

        const param = {
            account,
            amount: adjustedAmount.toString(),
            signature
        };
        const res = await Network.post(await this.relay.getEndpoint("/v1/ledger/exchangePointToToken"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

        yield { key: NormalSteps.SENT, txHash: res.data.txHash };
        const txReceipt = await contractTx.wait();

        const exchangerContract: LoyaltyExchanger = LoyaltyExchanger__factory.connect(
            this.web3.getLedgerAddress(),
            signer
        );
        const log = findLog(txReceipt, exchangerContract.interface, "ChangedPointToToken");
        if (!log) {
            throw new FailedPayTokenError();
        }
        const parsedLog = exchangerContract.interface.parseLog(log);

        yield {
            key: NormalSteps.DONE,
            account: parsedLog.args["account"],
            amountToken: parsedLog.args["amountToken"],
            amountPoint: parsedLog.args["amountPoint"],
            balanceToken: parsedLog.args["balanceToken"],
            balancePoint: parsedLog.args["balancePoint"]
        };
    }

    // endregion

    // region Mobile
    /**
     * 모바일의 정보를 등록한다
     * @param token
     * @param language
     * @param os
     * @param type
     */
    public async registerMobileToken(
        token: string,
        language: string,
        os: string,
        type: MobileType = MobileType.USER_APP
    ): Promise<void> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const signature = await ContractUtils.signMobileToken(signer, token);
        const param = {
            account: await signer.getAddress(),
            type,
            token,
            language,
            os,
            signature
        };

        const res = await Network.post(await this.relay.getEndpoint("/v1/mobile/register"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }
    }

    /**
     * 모바일의 정보를 등록한다
     * @param type
     */
    public async isExistsMobileToken(type: MobileType = MobileType.USER_APP): Promise<boolean> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const res = await Network.get(await this.relay.getEndpoint(`/v1/mobile/exists/${await signer.getAddress()}`), {
            type
        });
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        return res.data.exists;
    }

    /**
     * 등록된 모바일의 정보를 폐기한다
     * @return {AsyncGenerator<RemovePhoneInfoStepValue>}
     */
    public async *removePhoneInfo(): AsyncGenerator<RemovePhoneInfoStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);

        const account = await signer.getAddress();
        const nonce = await ledgerContract.nonceOf(account);
        const message = ContractUtils.getRemoveMessage(account, nonce, this.web3.getChainId());
        const signature = await ContractUtils.signMessage(signer, message);
        let contractTx: ContractTransaction;

        const param = {
            account,
            signature
        };

        yield { key: NormalSteps.PREPARED, account, signature };

        const res = await Network.post(await this.relay.getEndpoint("/v1/ledger/removePhoneInfo"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

        yield { key: NormalSteps.SENT, txHash: res.data.txHash };
        const txReceipt = await contractTx.wait();

        const log = findLog(txReceipt, ledgerContract.interface, "RemovedPhoneInfo");
        if (!log) {
            throw new FailedRemovePhoneInfoError();
        }
        yield {
            key: NormalSteps.DONE,
            account
        };
    }
    // endregion

    // region Transfer
    /**
     * 토큰을 다른 주소로 전송한다.
     * @param to 이체할 주소
     * @param amount 금액
     * @return {AsyncGenerator<DelegatedTransferStepValue>}
     */
    public async *transfer(to: string, amount: BigNumber): AsyncGenerator<DelegatedTransferStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const account = await signer.getAddress();
        const adjustedAmount = ContractUtils.zeroGWEI(amount);

        let contractTx: ContractTransaction;
        const nonce = await this.relay.getNonceOfLedger(account);
        const expiry = ContractUtils.getTimeStamp() + 60;
        const message = ContractUtils.getTransferMessage(
            this.web3.getChainId(),
            this.web3.getLoyaltyTransferAddress(),
            account,
            to,
            adjustedAmount,
            nonce,
            expiry
        );
        const signature = await ContractUtils.signMessage(signer, message);

        const param = {
            from: account,
            to,
            amount: adjustedAmount.toString(),
            expiry,
            signature
        };

        yield { key: NormalSteps.PREPARED, from: account, to, amount: adjustedAmount, expiry, signature };

        const res = await Network.post(await this.relay.getEndpoint("/v1/ledger/transfer"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;

        yield {
            key: NormalSteps.SENT,
            from: account,
            to,
            amount: adjustedAmount,
            expiry,
            signature,
            txHash: res.data.txHash
        };
        const txReceipt = await contractTx.wait();

        const transferContract: LoyaltyTransfer = LoyaltyTransfer__factory.connect(
            this.web3.getLoyaltyTransferAddress(),
            signer
        );
        const log = findLog(txReceipt, transferContract.interface, "TransferredLoyaltyToken");
        if (!log) {
            throw new FailedTransactionError();
        }

        yield {
            key: NormalSteps.DONE,
            from: account,
            to,
            amount: adjustedAmount,
            signature
        };
    }
    // endregion

    // region Deposit & Withdrawal via Bridge
    /**
     * 토큰을 브릿지를 경유해서 입금한다
     * @param amount 금액
     * @return {AsyncGenerator<DepositViaBridgeStepValue>}
     */
    public async *depositViaBridge(amount: BigNumber): AsyncGenerator<DepositViaBridgeStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const chainInfo = await this.getChainInfoOfMainChain();
        const account = await signer.getAddress();
        const adjustedAmount = ContractUtils.zeroGWEI(amount);

        const nonce = await this.getNonceOfMainChainToken(account);
        const expiry = ContractUtils.getTimeStamp() + 60;
        const message = ContractUtils.getTransferMessage(
            chainInfo.network.chainId,
            chainInfo.contract.token,
            account,
            chainInfo.contract.loyaltyBridge,
            adjustedAmount,
            nonce,
            expiry
        );
        const signature = await ContractUtils.signMessage(signer, message);

        const param = {
            account,
            amount: adjustedAmount.toString(),
            expiry,
            signature
        };

        yield { key: NormalSteps.PREPARED, account, amount: adjustedAmount, expiry, signature };

        const res = await Network.post(await this.relay.getEndpoint("/v1/ledger/deposit_via_bridge"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        yield {
            key: NormalSteps.SENT,
            account,
            amount: adjustedAmount,
            expiry,
            signature,
            tokenId: res.data.tokenId,
            depositId: res.data.depositId,
            txHash: res.data.txHash
        };
        console.log(`res.data.txHash: ${res.data.txHash}`);
        const provider = await this.getProviderOfMainChain();

        const contractTx = (await provider.getTransaction(res.data.txHash)) as ContractTransaction;
        const txReceipt = await contractTx.wait();

        const bridgeContract: IBridge = IBridge__factory.connect(chainInfo.contract.loyaltyBridge, provider);

        const log = findLog(txReceipt, bridgeContract.interface, "BridgeDeposited");
        if (!log) {
            throw new FailedTransactionError();
        }

        yield {
            key: NormalSteps.DONE,
            account,
            tokenId: res.data.tokenId,
            depositId: res.data.depositId,
            amount: adjustedAmount,
            signature
        };
    }

    public async *waiteDepositViaBridge(depositId: string, timeout: number = 30): AsyncGenerator<WaiteBridgeStepValue> {
        const chainInfo = await this.getChainInfoOfSideChain();
        const provider = await this.getProviderOfSideChain();
        const bridgeContract: IBridge = IBridge__factory.connect(chainInfo.contract.loyaltyBridge, provider);

        const start = ContractUtils.getTimeStamp();
        while (true) {
            const withdrawInfo = await bridgeContract.getWithdrawInfo(depositId);
            if (withdrawInfo.account !== AddressZero) {
                yield {
                    key: WaiteBridgeSteps.CREATED,
                    account: withdrawInfo.account,
                    amount: withdrawInfo.amount,
                    tokenId: withdrawInfo.tokenId
                };
                break;
            }
            if (ContractUtils.getTimeStamp() - start > timeout) {
                yield { key: WaiteBridgeSteps.TIMEOUT };
                return;
            }
            await ContractUtils.delay(1000);
        }

        while (true) {
            const withdrawInfo = await bridgeContract.getWithdrawInfo(depositId);
            if (withdrawInfo.executed) {
                yield {
                    key: WaiteBridgeSteps.EXECUTED,
                    account: withdrawInfo.account,
                    amount: withdrawInfo.amount,
                    tokenId: withdrawInfo.tokenId
                };
                break;
            } else {
                if (ContractUtils.getTimeStamp() - start > timeout) {
                    yield { key: WaiteBridgeSteps.TIMEOUT };
                    return;
                }
                await ContractUtils.delay(1000);
            }
        }
        await ContractUtils.delay(1000);
        yield { key: WaiteBridgeSteps.DONE };
    }

    /**
     * 토큰을 브릿지를 경유해서 출금한다
     * @param amount 금액
     * @return {AsyncGenerator<DepositViaBridgeStepValue>}
     */
    public async *withdrawViaBridge(amount: BigNumber): AsyncGenerator<DepositViaBridgeStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const chainInfo = await this.getChainInfoOfSideChain();
        const account = await signer.getAddress();
        const adjustedAmount = ContractUtils.zeroGWEI(amount);

        const nonce = await this.relay.getNonceOfLedger(account);
        const expiry = ContractUtils.getTimeStamp() + 60;
        const message = ContractUtils.getTransferMessage(
            chainInfo.network.chainId,
            chainInfo.contract.token,
            account,
            chainInfo.contract.loyaltyBridge,
            adjustedAmount,
            nonce,
            expiry
        );
        const signature = await ContractUtils.signMessage(signer, message);

        const param = {
            account,
            amount: adjustedAmount.toString(),
            expiry,
            signature
        };

        yield { key: NormalSteps.PREPARED, account, amount: adjustedAmount, expiry, signature };

        const res = await Network.post(await this.relay.getEndpoint("/v1/ledger/withdraw_via_bridge"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        yield {
            key: NormalSteps.SENT,
            account,
            amount: adjustedAmount,
            expiry,
            signature,
            tokenId: res.data.tokenId,
            depositId: res.data.depositId,
            txHash: res.data.txHash
        };
        const provider = await this.getProviderOfSideChain();
        const contractTx = (await provider.getTransaction(res.data.txHash)) as ContractTransaction;
        const txReceipt = await contractTx.wait();

        const bridgeContract: IBridge = IBridge__factory.connect(chainInfo.contract.loyaltyBridge, provider);

        const log = findLog(txReceipt, bridgeContract.interface, "BridgeDeposited");
        if (!log) {
            throw new FailedTransactionError();
        }

        yield {
            key: NormalSteps.DONE,
            account,
            tokenId: res.data.tokenId,
            depositId: res.data.depositId,
            amount: adjustedAmount,
            signature
        };
    }

    public async *waiteWithdrawViaBridge(
        depositId: string,
        timeout: number = 30
    ): AsyncGenerator<WaiteBridgeStepValue> {
        const chainInfo = await this.getChainInfoOfMainChain();
        const provider = await this.getProviderOfMainChain();
        const bridgeContract: IBridge = IBridge__factory.connect(chainInfo.contract.loyaltyBridge, provider);

        const start = ContractUtils.getTimeStamp();
        while (true) {
            const withdrawInfo = await bridgeContract.getWithdrawInfo(depositId);
            if (withdrawInfo.account !== AddressZero) {
                yield {
                    key: WaiteBridgeSteps.CREATED,
                    account: withdrawInfo.account,
                    amount: withdrawInfo.amount,
                    tokenId: withdrawInfo.tokenId
                };
                break;
            }
            if (ContractUtils.getTimeStamp() - start > timeout) {
                yield { key: WaiteBridgeSteps.TIMEOUT };
                return;
            }
            await ContractUtils.delay(1000);
        }

        while (true) {
            const withdrawInfo = await bridgeContract.getWithdrawInfo(depositId);
            if (withdrawInfo.executed) {
                yield {
                    key: WaiteBridgeSteps.EXECUTED,
                    account: withdrawInfo.account,
                    amount: withdrawInfo.amount,
                    tokenId: withdrawInfo.tokenId
                };
                break;
            } else {
                if (ContractUtils.getTimeStamp() - start > timeout) {
                    yield { key: WaiteBridgeSteps.TIMEOUT };
                    return;
                }
                await ContractUtils.delay(1000);
            }
        }
        yield { key: WaiteBridgeSteps.DONE };
    }
    // endregion

    // region Main Chain

    /**
     * 메인체인의 정보를 제공한다.
     */
    public async getChainInfoOfMainChain(): Promise<IChainInfo> {
        return this.relay.getChainInfoOfMainChain();
    }

    /**
     * 메인체인의 체인아이디를 제공한다.
     */
    public async getChainIdOfMainChain(): Promise<number> {
        return this.relay.getChainIdOfMainChain();
    }

    /**
     * 메인체인의 Provider를 제공한다.
     */
    public async getProviderOfMainChain(): Promise<JsonRpcProvider> {
        return this.relay.getProviderOfMainChain();
    }

    /**
     * 메인체인의 토큰잔고를 제공한다.
     */
    public async getMainChainBalance(account: string): Promise<BigNumber> {
        return this.relay.getBalanceOfMainChainToken(account);
    }

    /**
     * 메인체인의 토큰의 Nonce를 제공한다.
     */
    public async getNonceOfMainChainToken(account: string): Promise<BigNumber> {
        return this.relay.getNonceOfMainChainToken(account);
    }

    /**
     * 메인체인의 토큰잔고를 제공한다. getMainChainBalance 와 동일하다
     */
    public async getBalanceOfMainChainToken(account: string): Promise<BigNumber> {
        return this.relay.getBalanceOfMainChainToken(account);
    }

    /**
     * 메인체인에서 토큰을 다른 주소로 전송한다.
     * @param to 이체할 주소
     * @param amount 금액
     * @return {AsyncGenerator<DelegatedTransferStepValue>}
     */
    public async *transferInMainChain(to: string, amount: BigNumber): AsyncGenerator<DelegatedTransferStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const chainInfo = await this.getChainInfoOfMainChain();
        const account = await signer.getAddress();
        const adjustedAmount = ContractUtils.zeroGWEI(amount);
        const nonce = await this.getNonceOfMainChainToken(account);
        const expiry = ContractUtils.getTimeStamp() + 60;
        const message = ContractUtils.getTransferMessage(
            chainInfo.network.chainId,
            chainInfo.contract.token,
            account,
            to,
            adjustedAmount,
            nonce,
            expiry
        );
        const signature = await ContractUtils.signMessage(signer, message);

        const param = {
            from: account,
            to,
            amount: adjustedAmount.toString(),
            expiry,
            signature
        };

        yield { key: NormalSteps.PREPARED, from: account, to, amount: adjustedAmount, expiry, signature };

        const res = await Network.post(await this.relay.getEndpoint("/v1/token/main/transfer"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        yield {
            key: NormalSteps.SENT,
            from: account,
            to,
            amount: adjustedAmount,
            expiry,
            signature,
            txHash: res.data.txHash
        };

        const provider = await this.getProviderOfMainChain();
        const contractTx = (await provider.getTransaction(res.data.txHash)) as ContractTransaction;
        const contractReceipt = await contractTx.wait();

        const tokenContract: LoyaltyToken = LoyaltyToken__factory.connect(chainInfo.contract.token, provider);
        const log = findLog(contractReceipt, tokenContract.interface, "Transfer");
        if (!log) {
            throw new FailedTransactionError();
        }

        yield {
            key: NormalSteps.DONE,
            from: account,
            to,
            amount: adjustedAmount,
            signature
        };
    }

    // endregion

    // region Side Chain

    /**
     * 사이드체인의 정보를 제공한다.
     */
    public async getChainInfoOfSideChain(): Promise<IChainInfo> {
        return this.relay.getChainInfoOfSideChain();
    }

    /**
     * 사이드체인의 체인아이디를 제공한다.
     */
    public async getChainIdOfSideChain(): Promise<number> {
        return this.relay.getChainIdOfSideChain();
    }

    /**
     * 사이드체인의 Provider 를 제공한다.
     */
    public async getProviderOfSideChain(): Promise<JsonRpcProvider> {
        return this.relay.getProviderOfSideChain();
    }

    /**
     * 사이드체인의 토큰 잔고를 제공한다.
     */
    public async getSideChainBalance(account: string): Promise<BigNumber> {
        return this.relay.getBalanceOfSideChainToken(account);
    }

    /**
     * 사이드체인의 토큰의 Nonce 를 제공한다.
     */
    public async getNonceOfSideChainToken(account: string): Promise<BigNumber> {
        return this.relay.getNonceOfSideChainToken(account);
    }

    /**
     * 사이드체인의 토큰 잔고를 제공한다. getSideChainBalance 와 동일하다
     */
    public async getBalanceOfSideChainToken(account: string): Promise<BigNumber> {
        return this.relay.getBalanceOfSideChainToken(account);
    }

    /**
     * 사이드체인에서 토큰을 다른 주소로 전송한다.
     * @param to 이체할 주소
     * @param amount 금액
     * @return {AsyncGenerator<DelegatedTransferStepValue>}
     */
    public async *transferInSideChain(to: string, amount: BigNumber): AsyncGenerator<DelegatedTransferStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const chainInfo = await this.getChainInfoOfSideChain();
        const account = await signer.getAddress();
        const adjustedAmount = ContractUtils.zeroGWEI(amount);
        const nonce = await this.getNonceOfSideChainToken(account);
        const expiry = ContractUtils.getTimeStamp() + 60;
        const message = ContractUtils.getTransferMessage(
            chainInfo.network.chainId,
            chainInfo.contract.token,
            account,
            to,
            adjustedAmount,
            nonce,
            expiry
        );
        const signature = await ContractUtils.signMessage(signer, message);

        const param = {
            from: account,
            to,
            amount: adjustedAmount.toString(),
            expiry,
            signature
        };

        yield { key: NormalSteps.PREPARED, from: account, to, amount: adjustedAmount, expiry, signature };

        const res = await Network.post(await this.relay.getEndpoint("/v1/token/side/transfer"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        yield {
            key: NormalSteps.SENT,
            from: account,
            to,
            amount: adjustedAmount,
            expiry,
            signature,
            txHash: res.data.txHash
        };

        const provider = await this.getProviderOfSideChain();
        const contractTx = (await provider.getTransaction(res.data.txHash)) as ContractTransaction;
        const contractReceipt = await contractTx.wait();

        const tokenContract: LoyaltyToken = LoyaltyToken__factory.connect(chainInfo.contract.token, provider);
        const log = findLog(contractReceipt, tokenContract.interface, "Transfer");
        if (!log) {
            throw new FailedTransactionError();
        }

        yield {
            key: NormalSteps.DONE,
            from: account,
            to,
            amount: adjustedAmount,
            signature
        };
    }

    // endregion

    // region History of Ledger

    public async getEstimatedSaveHistory(account: string): Promise<any[]> {
        const res = await Network.get(await this.relay.getEndpoint(`/v1/purchase/user/provide/${account}`));
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        return res.data;
    }

    public async getTotalEstimatedSaveHistory(account: string): Promise<any[]> {
        const res = await Network.get(await this.relay.getEndpoint(`/v1/purchase/user/provide/total/${account}`));
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        return res.data;
    }

    /**
     * 사용자 지갑주소의 거래내역을 제공한다.
     * @param account 사용자의 지갑주소
     * @param pageNumber 페이지번호 1부터 시작됨
     * @param pageSize 페이지당 항목의 갯수
     * @param actions 수신하기를 원하는 거래의 유형들이 기록된 배열
     */
    public async getAccountHistory(
        account: string,
        actions: LedgerAction[],
        pageNumber: number = 1,
        pageSize: number = 10
    ): Promise<any> {
        const params = {
            pageNumber,
            pageSize,
            actions: actions.join(",")
        };
        const res = await Network.get(await this.relay.getEndpoint(`/v1/ledger/history/account/${account}`), params);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }
        return res.data;
    }

    /**
     * 사용자의 적립/사용 내역을 제공한다.
     * @param account 사용자의 지갑주소
     * @param pageNumber 페이지번호 1부터 시작됨
     * @param pageSize 페이지당 항목의 갯수
     */
    public async getSaveAndUseHistory(account: string, pageNumber: number = 1, pageSize: number = 10): Promise<any> {
        return await this.getAccountHistory(
            account,
            [
                LedgerAction.SAVED,
                LedgerAction.USED,
                LedgerAction.BURNED,
                LedgerAction.CHANGED_TO_PAYABLE_POINT,
                LedgerAction.CHANGED_TO_TOKEN,
                LedgerAction.CHANGED_TO_POINT,
                LedgerAction.REFUND
            ],
            pageNumber,
            pageSize
        );
    }

    /**
     * 사용자의 입출금 내역을 제공한다.
     * @param account 사용자의 지갑주소
     * @param pageNumber 페이지번호 1부터 시작됨
     * @param pageSize 페이지당 항목의 갯수
     */
    public async getDepositAndWithdrawHistory(
        account: string,
        pageNumber: number = 1,
        pageSize: number = 10
    ): Promise<any> {
        return await this.getAccountHistory(
            account,
            [LedgerAction.DEPOSITED, LedgerAction.WITHDRAWN],
            pageNumber,
            pageSize
        );
    }

    /**
     * 사용자의 이체 내역을 제공한다.
     * @param account 사용자의 지갑주소
     * @param pageNumber 페이지번호 1부터 시작됨
     * @param pageSize 페이지당 항목의 갯수
     */
    public async getTransferHistory(account: string, pageNumber: number = 1, pageSize: number = 10): Promise<any> {
        return await this.getAccountHistory(
            account,
            [LedgerAction.TRANSFER_IN, LedgerAction.TRANSFER_OUT],
            pageNumber,
            pageSize
        );
    }
    // endregion

    // region History of Main Chain
    /**
     * 메인체인에서 사용자의 이체 내역을 제공한다.
     * @param account 사용자의 지갑주소
     * @param pageNumber 페이지번호 1부터 시작됨
     * @param pageSize 페이지당 항목의 갯수
     */
    public async getTransferHistoryInMainChain(
        account: string,
        pageNumber: number = 1,
        pageSize: number = 10
    ): Promise<any> {
        const params = {
            pageNumber,
            pageSize
        };
        const res = await Network.get(await this.relay.getEndpoint(`/v1/token/main/history/${account}`), params);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }
        return res.data;
    }
    // endregion

    // region History of Side Chain
    /**
     * 사이드체인에서 사용자의 이체 내역을 제공한다.
     * @param account 사용자의 지갑주소
     * @param pageNumber 페이지번호 1부터 시작됨
     * @param pageSize 페이지당 항목의 갯수
     */
    public async getTransferHistoryInSideChain(
        account: string,
        pageNumber: number = 1,
        pageSize: number = 10
    ): Promise<any> {
        const params = {
            pageNumber,
            pageSize
        };
        const res = await Network.get(await this.relay.getEndpoint(`/v1/token/side/history/${account}`), params);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }
        return res.data;
    }
    // endregion

    // Provider

    public async isProvider(): Promise<boolean> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }
        const provider: string = await signer.getAddress();
        const res = await Network.get(await this.relay.getEndpoint(`/v1/provider/status/${provider}`));
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        return res.data.enable;
    }

    public async registerProvider(): Promise<void> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);
        const account: string = await signer.getAddress();
        const nonce = await ledgerContract.nonceOf(account);
        const message = ContractUtils.getRegisterProviderMessage(account, nonce, this.web3.getChainId());
        const signature = await ContractUtils.signMessage(signer, message);

        const param = {
            provider: account,
            signature
        };

        const res = await Network.post(await this.relay.getEndpoint("/v1/provider/register"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }
    }

    public async *registerAssistant(assistant: string): AsyncGenerator<RegisterAssistantStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);
        const provider: string = await signer.getAddress();
        const nonce = await ledgerContract.nonceOf(provider);
        const message = ContractUtils.getRegisterAssistanceMessage(provider, assistant, nonce, this.web3.getChainId());
        const signature = await ContractUtils.signMessage(signer, message);

        const param = {
            provider,
            assistant: assistant,
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            provider,
            assistant: assistant,
            signature
        };

        const res = await Network.post(await this.relay.getEndpoint("/v1/provider/assistant/register"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        const contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;
        yield { key: NormalSteps.SENT, txHash: res.data.txHash, provider, assistant: assistant };

        await contractTx.wait();

        yield { key: NormalSteps.DONE, provider, assistant: assistant };
    }

    public async *unregisterAssistant(): AsyncGenerator<RegisterAssistantStepValue> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }

        const ledgerContract: Ledger = Ledger__factory.connect(this.web3.getLedgerAddress(), signer);
        const provider: string = await signer.getAddress();
        const assistant = AddressZero;
        const nonce = await ledgerContract.nonceOf(provider);
        const message = ContractUtils.getRegisterAssistanceMessage(provider, assistant, nonce, this.web3.getChainId());
        const signature = await ContractUtils.signMessage(signer, message);

        const param = {
            provider,
            assistant,
            signature
        };

        yield {
            key: NormalSteps.PREPARED,
            provider,
            assistant,
            signature
        };

        const res = await Network.post(await this.relay.getEndpoint("/v1/provider/assistant/register"), param);
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        const contractTx = (await signer.provider.getTransaction(res.data.txHash)) as ContractTransaction;
        yield { key: NormalSteps.SENT, txHash: res.data.txHash, provider, assistant };

        await contractTx.wait();

        yield { key: NormalSteps.DONE, provider, assistant };
    }

    public async getAssistant(): Promise<string> {
        const signer = this.web3.getConnectedSigner();
        if (!signer) {
            throw new NoSignerError();
        } else if (!signer.provider) {
            throw new NoProviderError();
        }
        const provider: string = await signer.getAddress();
        const res = await Network.get(await this.relay.getEndpoint(`/v1/provider/assistant/${provider}`));
        if (res.code !== 0) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        return res.data.assistant;
    }

    public async getSystemInfo(): Promise<ISystemInfo> {
        const res = await Network.get(await this.relay.getEndpoint(`/v1/system/info`));
        if (res.code !== 0 || res.data === undefined) {
            throw new InternalServerError(res?.error?.message ?? "");
        }

        return res.data;
    }
}
