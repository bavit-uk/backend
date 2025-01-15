import { FaqsPolicy } from "@/models";

export const faqsPolicyService = {
    createFaqsPolicy: (data: {faqsQuestion: string , faqsAnswer: string  , faqsCategory: string }) => {
        const {faqsQuestion , faqsAnswer , faqsCategory} = data
        const faqsPolicy = new FaqsPolicy({
          faqsQuestion,
          faqsAnswer,
          faqsCategory,
        });
        return faqsPolicy.save();
}
};