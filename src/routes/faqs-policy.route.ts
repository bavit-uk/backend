import { Router } from "express"
import { faqsPolicyController } from "@/controllers"


export const faqsPolicy = (router: Router) => {

    router.post('/', faqsPolicyController.createFaqsPolicy);

    router.get('/', faqsPolicyController.getAllFaqsPolicy);

    router.delete('/:id', faqsPolicyController.deleteFaqs);

    router.patch('/:id', faqsPolicyController.editFaqs)

}