import { Router } from "express"
import { faqsPolicyController } from "@/controllers"


export const faqsPolicy = (router: Router) => {

    router.post('/addFaqs', faqsPolicyController.createFaqsPolicy);

}