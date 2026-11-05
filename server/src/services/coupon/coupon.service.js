import { couponModel } from "../../models/coupon.model.js";

export const getCouponByCode = async (code) => {
  return await couponModel.findOne({ code: code.toUpperCase() });
};

export const createCoupon = async (couponData) => {
  return await couponModel.create(couponData);
};

export const markCouponAsUsed = async (couponId) => {
  return await couponModel.findByIdAndUpdate(couponId, { isUsed: true }, { new: true });
};
