import { Request, Response } from "express";
import { productService } from "@/services";

export const handleBulkImport = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    await productService.bulkImportProducts(req.file.path);
    res.status(201).json({ message: "Bulk import successful" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const handleBulkExport = async (req: Request, res: Response) => {
  try {
    const filePath = await productService.exportProducts();
    res.download(filePath);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
