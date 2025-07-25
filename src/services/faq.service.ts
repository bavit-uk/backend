// src/services/faq.service.ts
import { FaqModel } from "@/models/faq.model";

export const FaqService = {
  createFaq: (category: string, question: string, answer: string) => {
    const newFaq = new FaqModel({ category, question, answer });
    return newFaq.save();
  },

  updateFaq: (id: string, data: { 
    category?: string; 
    question?: string; 
    answer?: string; 
    isBlocked?: boolean 
  }) => {
    return FaqModel.findByIdAndUpdate(id, data, { new: true }).populate('category', 'title _id');
  },

  deleteFaq: (id: string) => {
    return FaqModel.findByIdAndDelete(id).populate('category', 'title _id');
  },

  getAllFaqs: (category?: string) => {
    const filter: { category?: string } = {};
    if (category) filter.category = category;
    return FaqModel.find(filter).populate('category', 'title _id');
  },

  getFaqById: (id: string) => {
    return FaqModel.findById(id).populate('category', 'title _id');
  },

  getByCategory: (category: string) => {
    return FaqModel.find({ category, isBlocked: false }).populate('category', 'title _id');
  }
};