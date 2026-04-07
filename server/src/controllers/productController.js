import { Product } from "../models/Product.js";

export const getProducts = async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 }).lean();
    
    // Aggregate absolute stock from inventory
    const { InventoryItem } = await import("../models/InventoryItem.js");
    const agg = await InventoryItem.aggregate([
      { $group: { _id: "$product", total: { $sum: "$quantity" } } }
    ]);
    
    const stockMap = {};
    agg.forEach(a => stockMap[a._id.toString()] = a.total);
    
    const updatedProducts = products.map(p => {
      const stock = stockMap[p._id.toString()] || 0;
      let status = "in-stock";
      if (stock === 0) status = "out-of-stock";
      else if (stock < 20) status = "low-stock";
      
      return { ...p, stock, status };
    });
    
    res.json(updatedProducts);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted" });
  } catch (error) {
    next(error);
  }
};


