// import { IEbay } from "@/contracts/ebay.contract";
import { StatusCodes, ReasonPhrases } from "http-status-codes";
import { Request, Response } from "express";
import axios from "axios";
import {
  EbayControllerCreateFulfillmentPolicyRequest,
  EbayControllerCreateLocationRequest,
  EbayControllerCreateOfferRequest,
  EbayControllerCreatePaymentPolicyRequest,
  EbayControllerCreatePolicyRequest,
  EbayControllerCreateProductRequest,
  EbayControllerCreateReturnPolicyRequest,
  EbayControllerUpdateOfferRequest,
} from "@/contracts/ebay.contract";
import {
  exchangeCodeForAccessToken,
  getEbayAuthURL,
  getNormalAccessToken,
  getStoredEbayAccessToken,
  refreshEbayAccessToken,
} from "@/utils/ebay-helpers.util";
import {
  IBodyRequest,
  ICombinedRequest,
  IParamsRequest,
} from "@/contracts/request.contract";
// import { Ebay } from "@/models"; // Import the  ebay model
const baseURL = "https://api.ebay.com";
const ebayApiUrl = "https://api.ebay.com/sell/inventory/v1/inventory_item";
export const ebayService = {
  getApplicationAuthToken: async (req: Request, res: Response) => {
    try {
      const credentials = await getNormalAccessToken();
      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        credentials,
      });
    } catch (error) {
      // console.log(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        error: "Failed to get application token",
        details: error,
      });
    }
  },

  getUserAuthorizationUrl: async (req: Request, res: Response) => {
    try {
      const authUrl = getEbayAuthURL();
      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        authUrl,
      });
    } catch (error) {
      console.log(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        error: "Failed to get user authorization URL",
        details: error,
      });
    }
  },

  handleAuthorizationCallback: async (req: Request, res: Response) => {
    try {
      const { code } = req.query;
      const accessToken = await exchangeCodeForAccessToken(code as string);
      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        accessToken,
      });
    } catch (error) {
      console.log(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        error: "Failed to exchange code for access token",
        details: error,
      });
    }
  },

  handleFallbackCallback: async (req: Request, res: Response) => {
    try {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        status: StatusCodes.UNAUTHORIZED,
        message: ReasonPhrases.UNAUTHORIZED,
        error: "User denied access to eBay account",
      });
    } catch (error) {
      console.log(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        error: "Failed to handle fallback callback",
        details: error,
      });
    }
  },

  handleRefreshToken: async (req: Request, res: Response) => {
    try {
      const credentials = await refreshEbayAccessToken();
      return res.status(StatusCodes.OK).json({
        status: StatusCodes.OK,
        message: ReasonPhrases.OK,
        credentials,
      });
    } catch (error) {
      console.log(error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        message: ReasonPhrases.INTERNAL_SERVER_ERROR,
        error: "Failed to get application token",
        details: error,
      });
    }
  },

  async syncProductWithEbay(product: any): Promise<string> {
    try {
      const token = await getStoredEbayAccessToken();
      if (!token) {
        throw new Error("Missing or invalid eBay access token");
      }

      const ebayApiUrl =
        "https://api.ebay.com/api/sell/inventory/v1/inventory_item";
      const ebayData = product.platformDetails?.ebay;

      if (!ebayData) {
        throw new Error("Missing eBay product details");
      }

      // Category mapping
      const categoryMap: Record<string, number> = {
        "PC Laptops & Netbooks": 177,
        "PC Desktops & All-In-Ones": 179,
        Monitors: 80053,
        Projectors: 25321,
        "Wireless Access Points": 175709,
      };
      const categoryName =
        ebayData.productInfo?.productCategory?.name ||
        "PC Desktops & All-In-Ones";
      const categoryId = categoryMap[categoryName] || 179; // Default category

      // Aspect mapping
      const aspects = this.getCategoryAspects(
        categoryName,
        ebayData.prodTechInfo
      );

      // Validate mandatory fields
      if (!ebayData.productInfo?.title) {
        throw new Error("Missing product title");
      }
      if (!ebayData.productInfo?.productDescription) {
        throw new Error("Missing product description");
      }

      const requestBody = {
        product: {
          title: ebayData.productInfo.title,
          aspects: aspects,
          description: ebayData.productInfo.productDescription,
          upc: ebayData.prodTechInfo?.ean ? [ebayData.prodTechInfo.ean] : [],
          imageUrls:
            ebayData.prodMedia?.images?.map((img: any) => img.url) || [],
        },
        categoryId: categoryId,
        condition: ebayData.prodPricing?.condition || "New",
        packageWeightAndSize: {
          dimensions: {
            height: {
              value: parseFloat(ebayData.prodTechInfo?.height) || 10,
              unit: "CM",
            },
            length: {
              value: parseFloat(ebayData.prodTechInfo?.length) || 10,
              unit: "CM",
            },
            width: {
              value: parseFloat(ebayData.prodTechInfo?.width) || 10,
              unit: "CM",
            },
          },
          weight: {
            value: parseFloat(ebayData.prodTechInfo?.weight) || 5,
            unit: "LB",
          },
        },
        availability: {
          shipToLocationAvailability: {
            quantity: parseInt(ebayData.prodPricing?.quantity) || 1,
          },
        },
        fulfillmentTime: ebayData.prodDelivery?.fulfillmentTime || "2 days",
        shippingOptions: [
          {
            shippingCost: { value: "0.00", currency: "USD" },
            shippingServiceCode: "USPSPriorityMail",
            shipToLocations: [{ countryCode: "US" }],
            packageType: "USPSPriorityMailFlatRateBox",
          },
        ],
        listingPolicies: {
          paymentPolicyId:
            ebayData.prodPricing?.paymentPolicy || "default-payment-id",
          returnPolicyId: "return-policy-id",
          fulfillmentPolicyId: "fulfillment-policy-id",
        },
      };

      const method = product.ebayItemId ? "PUT" : "POST";
      const ebayUrl = product.ebayItemId
        ? `${ebayApiUrl}/${product.ebayItemId}`
        : ebayApiUrl;

      const response = await axios({
        method,
        url: ebayUrl,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: requestBody,
      });

      console.log("eBay API Response:", response.data);

      if (!response.data || !response.data.sku) {
        throw new Error("Failed to sync product with eBay");
      }

      return response.data.sku;
    } catch (error: any) {
      console.error(
        "Error syncing product with eBay:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  getCategoryAspects(categoryName: string, prodTechInfo: any) {
    switch (categoryName) {
      case "PC Laptops & Netbooks":
        return {
          Brand: [prodTechInfo?.brand || "Unbranded"],
          Processor: [prodTechInfo?.processor || "Unknown"],
          RAM: [prodTechInfo?.ramSize || "Unknown"],
          Storage: [prodTechInfo?.storageType || "Unknown"],
        };
      case "PC Desktops & All-In-Ones":
        return {
          Brand: [prodTechInfo?.brand || "Unbranded"],
          FormFactor: [prodTechInfo?.formFactor || "Unknown"],
          GPU: [prodTechInfo?.gpu || "Unknown"],
          RAM: [prodTechInfo?.ramSize || "Unknown"],
          Storage: [prodTechInfo?.storageType || "Unknown"],
        };
      case "Monitors":
        return {
          Brand: [prodTechInfo?.brand || "Unbranded"],
          ScreenSize: [prodTechInfo?.screenSize || "Unknown"],
          Resolution: [prodTechInfo?.resolution || "Unknown"],
        };
      case "Projectors":
        return {
          Brand: [prodTechInfo?.brand || "Unbranded"],
          Lumens: [prodTechInfo?.lumens || "Unknown"],
          Resolution: [prodTechInfo?.resolution || "Unknown"],
        };
      case "Wireless Access Points":
        return {
          Brand: [prodTechInfo?.brand || "Unbranded"],
          Frequency: [prodTechInfo?.frequency || "Unknown"],
          Connectivity: [prodTechInfo?.connectivity || "Unknown"],
        };
      default:
        return {
          Brand: [prodTechInfo?.brand || "Unbranded"],
        };
    }
  },
};
