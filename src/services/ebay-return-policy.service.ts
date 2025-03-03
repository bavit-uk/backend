import { getStoredEbayAccessToken } from "@/utils/ebay-helpers.util";

const baseURL = "https://api.ebay.com"; // Ensure this is correct for the eBay environment

export const ebayReturnPolicyService = {
  async createReturnPolicy(data: any) {
    try {
      console.log(
        "📩 Received Return Policy Data:",
        JSON.stringify(data, null, 2)
      );

      if (!data.marketplaceId)
        throw new Error("❌ Missing required field: marketplaceId");

      const accessToken = await getStoredEbayAccessToken();
      // Determine if it's a Motors category
      const isMotorsCategory = data.categoryTypes.some(
        (type: any) => type.name === "MOTORS_VEHICLES"
      );

      // Allowed return methods based on category
      const allowedReturnMethods = isMotorsCategory
        ? ["CASH_ON_PICKUP", "CASHIER_CHECK", "MONEY_ORDER", "PERSONAL_CHECK"]
        : ["CREDIT_CARD", "PAYPAL", "DEBIT_CARD"]; // Adjust based on eBay docs

      // Filter return methods
      const validReturnMethods =
        data.returnMethods?.filter((method: any) =>
          allowedReturnMethods.includes(method.returnMethodType)
        ) || [];
      const requestBody: any = {
        name: data.name,
        description: data.description || "",
        marketplaceId: data.marketplaceId,
        categoryTypes:
          data.categoryTypes?.map((type: any) => ({ name: type.name })) || [],
        immediatePay: data.immediatePay,
        returnMethods: data.returnMethods || [],
      };

      console.log(
        "🚀 Sending Request to eBay API:",
        JSON.stringify(requestBody, null, 2)
      );

      const response = await fetch(
        `${baseURL}/sell/account/v1/return_policy`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        // Check if the error is due to a duplicate policy
        if (result.errors?.[0]?.errorId === 20400) {
          console.warn(
            "⚠️ Duplicate Return Policy Found, Using Existing Policy ID:",
            result.errors?.[0]?.parameters?.[0]?.value
          );
          return {
            message: "Using existing return policy",
            policyId: result.errors?.[0]?.parameters?.[0]?.value,
          };
        }

        console.error("⚠️ eBay API Error:", JSON.stringify(result, null, 2));
        throw new Error(result.errors?.[0]?.message || "eBay API call failed");
      }

      console.log("✅ Return Policy Created Successfully:", result);
      return result;
    } catch (error: any) {
      console.error("❌ Error creating eBay return policy:", error.message);
      throw new Error(error.message);
    }
  },
  async getAllReturnPolicies(_req: unknown, res: unknown) {
    try {
      const accessToken = await getStoredEbayAccessToken();
      const response = await fetch(
        `${baseURL}/sell/account/v1/return_policy?marketplace_id=EBAY_GB`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );
      return await response.json();
    } catch (error) {
      console.error("Error fetching eBay return policies:", error);
      throw new Error("eBay API call failed");
    }
  },

  async deleteReturnPolicy(policyId: string) {
    try {
      const accessToken = await getStoredEbayAccessToken();
      const response = await fetch(
        `${baseURL}/sell/account/v1/return_policy/${policyId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );
      return response.ok;
    } catch (error) {
      console.error("Error deleting eBay return policy:", error);
      throw new Error("eBay API call failed");
    }
  },

  async editReturnPolicy(policyId: string, data: any) {
    try {
      const accessToken = await getStoredEbayAccessToken();
      const response = await fetch(
        `${baseURL}/sell/account/v1/return_policy/${policyId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );
      return await response.json();
    } catch (error) {
      console.error("Error updating eBay return policy:", error);
      throw new Error("eBay API call failed");
    }
  },
};
