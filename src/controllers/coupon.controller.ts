import { Coupon } from "@/models";
import { couponService } from "@/services/coupon.service"; // Importing the coupon service
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes"; // For HTTP status codes

export const couponController = {
  // Create a new coupon
  createCoupon: async (req: Request, res: Response) => {
    try {
      const { code, discount, expiryDate, usageLimit } = req.body;

      const existingCoupon = await Coupon.findOne({ code });
      if (existingCoupon)
        return res.status(400).json({ message: "Coupon code already exists" });

      const newCoupon = new Coupon({ code, discount, expiryDate, usageLimit });
      await newCoupon.save();

      res
        .status(201)
        .json({ message: "Coupon created successfully", coupon: newCoupon });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error });
    }
  },

  // Get all coupons
  getAllCoupons: async (_req: Request, res: Response) => {
    try {
      const coupons = await Coupon.find();
      res.status(200).json(coupons);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error });
    }
  },

  // Get coupon by ID
  getCouponById: async (req: Request, res: Response) => {
    try {
      const coupon = await Coupon.findById(req.params.id);
      if (!coupon) return res.status(404).json({ message: "Coupon not found" });

      res.status(200).json(coupon);
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error });
    }
  },
  
  //update coupon
  updateCoupon: async (req: Request, res: Response) => {
    try {
      const { code, discount, expiryDate, isActive, usageLimit } = req.body;

      const updatedCoupon = await Coupon.findByIdAndUpdate(
        req.params.id,
        { code, discount, expiryDate, isActive, usageLimit },
        { new: true }
      );

      if (!updatedCoupon)
        return res.status(404).json({ message: "Coupon not found" });

      res.status(200).json({
        message: "Coupon updated successfully",
        coupon: updatedCoupon,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error });
    }
  },

  // Delete a coupon
  deleteCoupon: async (req: Request, res: Response) => {
    try {
      const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);
      if (!deletedCoupon)
        return res.status(404).json({ message: "Coupon not found" });

      res.status(200).json({ message: "Coupon deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error });
    }
  },

  // Validate a coupon
  validateCoupon: async (req: Request, res: Response) => {
    try {
      const { code } = req.body;

      const coupon = await Coupon.findOne({ code });
      if (!coupon) return res.status(404).json({ message: "Coupon not found" });

      if (!coupon.isActive || coupon.expiryDate < new Date()) {
        return res
          .status(400)
          .json({ message: "Coupon is expired or inactive" });
      }

      if (coupon.usageCount >= coupon.usageLimit) {
        return res.status(400).json({ message: "Coupon usage limit reached" });
      }

      // Increment usage count
      coupon.usageCount += 1;
      await coupon.save();

      res.status(200).json({
        message: "Coupon applied successfully",
        discount: coupon.discountValue,
      });
    } catch (error) {
      res.status(500).json({ message: "Internal Server Error", error });
    }
  },
};
