import * as dotenv from "dotenv";
dotenv.config({ path: "env/.env" });

global.XMLHttpRequest = require("xhr2");

import { Wallet } from "ethers";
import fs from "fs";
import { SupportedNetwork } from "acc-sdk-client-v2";

export interface IUserInfo {
    phone: string;
    wallet: Wallet;
    token: string;
}

export interface IShopInfo {
    shopId: string;
    wallet: Wallet;
    token: string;
}

export class Helper {
    static NETWORK = (process.env.NETWORK || "acc_devnet") as SupportedNetwork;
    static RELAY_ACCESS_KEY = process.env.RELAY_ACCESS_KEY || "";
    static SAVE_ACCESS_KEY = process.env.SAVE_ACCESS_KEY || "";
    static SAVE_ENDPOINT = process.env.SAVE_ENDPOINT || "";
    static RELAY_ENDPOINT = process.env.RELAY_ENDPOINT || "";
    static WEB3_ENDPOINT = process.env.WEB3_ENDPOINT || "";
    static TEST_PK = "0xd09672244a06a32f74d051e5adbbb62ae0eda27832a973159d475da6d53ba5c0";

    public static loadUserInfo(): IUserInfo {
        const data: {
            phone: string;
            privateKey: string;
            token: string;
        } = JSON.parse(fs.readFileSync("./data/user_info.json", "utf8"));
        return {
            phone: data.phone,
            wallet: new Wallet(data.privateKey),
            token: data.token,
        };
    }

    public static loadShopInfo(): IShopInfo {
        const data: {
            shopId: string;
            privateKey: string;
            token: string;
        } = JSON.parse(fs.readFileSync("./data/shop_info.json", "utf8"));
        return {
            shopId: data.shopId,
            wallet: new Wallet(data.privateKey),
            token: data.token,
        };
    }

    public static loadAssistantInfo(): IUserInfo {
        const data: {
            phone: string;
            privateKey: string;
        } = JSON.parse(fs.readFileSync("./data/assistant_info.json", "utf8"));
        return {
            phone: data.phone,
            wallet: new Wallet(data.privateKey),
            token: "",
        };
    }
    static purchaseId = 0;
    public static getPurchaseId(): string {
        const randomIdx = Math.floor(Math.random() * 1000);
        const res = "P" + Helper.purchaseId.toString().padStart(10, "0") + randomIdx.toString().padStart(4, "0");
        Helper.purchaseId++;
        return res;
    }

    public static getPaymentId(): string {
        const data = JSON.parse(fs.readFileSync("./data/storage.json", "utf-8"));
        if (data.paymentId !== undefined) return data.paymentId;
        else throw new Error("이전의 paymentId 를 찾을 수 없습니다.");
    }

    public static setPaymentId(paymentId: string) {
        const data = {
            paymentId,
        };
        fs.writeFileSync("./data/storage.json", JSON.stringify(data), "utf-8");
    }

    public static loadTemporaryAccount(): string {
        const data = JSON.parse(fs.readFileSync("./data/temporary_account.json", "utf-8"));
        if (data.temporaryAccount !== undefined) return data.temporaryAccount;
        else throw new Error("이전의 temporary_account 를 찾을 수 없습니다.");
    }

    public static saveTemporaryAccount(temporaryAccount: string) {
        const data = {
            temporaryAccount,
        };
        fs.writeFileSync("./data/temporary_account.json", JSON.stringify(data), "utf-8");
    }

    public static delay(interval: number): Promise<void> {
        return new Promise<void>((resolve, _) => {
            setTimeout(resolve, interval);
        });
    }

    public static getTimeStamp(): number {
        return Math.floor(new Date().getTime() / 1000);
    }
}
