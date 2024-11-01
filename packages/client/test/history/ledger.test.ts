import { Client, Context, ContractUtils, LedgerAction } from "../../src";

// @ts-ignore
import fs from "fs";
import { NodeInfo } from "../helper/NodeInfo";

interface IUserData {
    idx: number;
    phone: string;
    address: string;
    privateKey: string;
    loyaltyType: number;
}

describe("Integrated test of Ledger", () => {
    const contextParams = NodeInfo.getContextParams();
    describe("Method Check", () => {
        let client: Client;
        const users: IUserData[] = JSON.parse(fs.readFileSync("test/helper/users.json", "utf8"));
        beforeAll(async () => {
            contextParams.privateKey = users[50].privateKey;
            const ctx = new Context(contextParams);
            client = new Client(ctx);
        });

        it("Web3 Health Checking", async () => {
            const isUp = await client.ledger.web3.isUp();
            expect(isUp).toEqual(true);
        });

        it("Server Health Checking", async () => {
            const isUp = await client.ledger.relay.isUp();
            expect(isUp).toEqual(true);
        });

        describe("GraphQL TEST", () => {
            it("GraphQL Server Health Test", async () => {
                const web3IsUp = await client.web3.isUp();
                expect(web3IsUp).toEqual(true);
                await ContractUtils.delay(1000);
            });

            it("Get Save & Use History", async () => {
                for (const user of users) {
                    const res = await client.ledger.getSaveAndUseHistory(user.address, 1, 100);
                    const length = res.items.length;
                    if (length > 0) {
                        expect(res.items[length - 1].account.toUpperCase()).toEqual(user.address.toUpperCase());
                        expect([
                            LedgerAction.SAVED,
                            LedgerAction.USED,
                            LedgerAction.BURNED,
                            LedgerAction.CHANGED_TO_PAYABLE_POINT,
                            LedgerAction.CHANGED_TO_TOKEN,
                            LedgerAction.CHANGED_TO_POINT,
                            LedgerAction.REFUND
                        ]).toContain(res.items[length - 1].action);
                    }
                }
            });

            it("Get Deposit & Withdraw History", async () => {
                for (const user of users) {
                    const res = await client.ledger.getDepositAndWithdrawHistory(user.address, 1, 100);
                    const length = res.items.length;
                    if (length > 0) {
                        expect(res.items[length - 1].account.toUpperCase()).toEqual(user.address.toUpperCase());
                        expect([LedgerAction.DEPOSITED, LedgerAction.WITHDRAWN]).toContain(
                            res.items[length - 1].action
                        );
                    }
                }
            });

            it("Get Transfer History", async () => {
                for (const user of users) {
                    const res = await client.ledger.getTransferHistory(user.address, 1, 100);
                    const length = res.items.length;
                    if (length > 0) {
                        expect(res.items[length - 1].account.toUpperCase()).toEqual(user.address.toUpperCase());
                        expect([LedgerAction.TRANSFER_OUT, LedgerAction.TRANSFER_IN]).toContain(
                            res.items[length - 1].action
                        );
                    }
                }
            });
        });
    });
});
