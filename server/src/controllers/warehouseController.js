import { Warehouse } from "../models/Warehouse.js";

export const getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find().sort({ createdAt: -1 });
    res.json(warehouses);
  } catch (error) {
    next(error);
  }
};

export const createWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.create(req.body);
    res.status(201).json(warehouse);
  } catch (error) {
    next(error);
  }
};


