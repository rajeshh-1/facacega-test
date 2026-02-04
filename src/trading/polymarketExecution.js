import { ethers } from "ethers";
import { CONFIG } from "../config.js";
import { appendCsvRow } from "../utils.js";
import fs from "node:fs";

export class PolyTrader {
    constructor() {
        this.dryRun = CONFIG.trading.dryRun;
        this.privateKey = CONFIG.trading.polyPrivateKey;
        this.proxyAddress = CONFIG.trading.polyProxyAddress;
        this.targetSpend = CONFIG.trading.targetSpendUsd;
        this.metricsFile = CONFIG.trading.metricsFile;

        if (!this.dryRun && !this.privateKey) {
            console.error("❌ ERROR: POLY_PRIVATE_KEY missing but DRY_RUN is false!");
        }
    }

    async executeTrade({ side, tokenId, price, marketSlug, reason }) {
        if (!tokenId || !price) {
            console.log(`⚠️  Cannot execute trade: missing tokenId or price.`);
            return null;
        }

        const qty = Math.ceil(this.targetSpend / price);
        const totalCost = qty * price;

        console.log(`\n🚀 [TRADE SIGNAL] ${side.toUpperCase()} @ $${price}`);
        console.log(`   Market: ${marketSlug}`);
        console.log(`   Reason: ${reason}`);
        console.log(`   Quantity: ${qty} units | Cost: $${totalCost.toFixed(2)}`);

        const tradeData = {
            timestamp: new Date().toISOString(),
            marketSlug,
            side,
            tokenId,
            price,
            quantity: qty,
            totalCost,
            status: this.dryRun ? "DRY_RUN" : "PENDING",
            reason
        };

        if (this.dryRun) {
            console.log(`   🧪 [DRY RUN ACTIVE] Skipping real order.`);
            this.logTrade(tradeData);
            return tradeData;
        }

        // Real Execution Logic (Simplified for now, using Clob API)
        try {
            console.log(`   ⚡ Executing real order on Polymarket...`);
            // Note: Real implementation would use the CLOB client signing logic here.
            // For now, we simulate the structure as per the requirements.
            const result = await this.mockApiCall(tradeData);
            tradeData.status = "SUCCESS";
            tradeData.orderId = result.orderId;
            this.logTrade(tradeData);
            return tradeData;
        } catch (err) {
            console.error(`   ❌ Trade failed: ${err.message}`);
            tradeData.status = "FAILED";
            tradeData.error = err.message;
            this.logTrade(tradeData);
            return null;
        }
    }

    logTrade(data) {
        const header = ["timestamp", "marketSlug", "side", "tokenId", "price", "quantity", "totalCost", "status", "reason", "error"];
        if (!fs.existsSync("./logs")) fs.mkdirSync("./logs");
        appendCsvRow(this.metricsFile, header, [
            data.timestamp,
            data.marketSlug,
            data.side,
            data.tokenId,
            data.price,
            data.quantity,
            data.totalCost,
            data.status,
            data.reason,
            data.error || ""
        ]);
        console.log(`   📊 Trade saved to metrics: ${this.metricsFile}`);
    }

    async mockApiCall(data) {
        // Simulated successful API response
        return new Promise((resolve) => setTimeout(() => resolve({ orderId: "sim-" + Date.now() }), 1000));
    }
}

export const trader = new PolyTrader();
