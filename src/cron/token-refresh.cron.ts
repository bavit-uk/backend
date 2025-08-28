import cron from "node-cron";
import { getStoredAmazonAccessToken, refreshAmazonAccessToken } from "@/utils/amazon-helpers.util";
import { getStoredEbayAccessToken } from "@/utils/ebay-helpers.util";

export const tokenRefreshCron = () => {
  // Run every 5 minutes to proactively refresh if near expiry
  cron.schedule("*/5 * * * *", async () => {
    try {
      // Amazon
      await getStoredAmazonAccessToken();
    } catch (e) {
      console.error("❌ Amazon token refresh (cron) failed:", e);
    }

    try {
      // eBay: proactively ensure user token is fresh (uses refresh_token internally)
      await getStoredEbayAccessToken();
    } catch (e) {
      console.error("❌ eBay token refresh (cron) failed:", e);
    }
  });

  // console.log("📅 Token refresh cron job scheduled (every 5 minutes)");
};
