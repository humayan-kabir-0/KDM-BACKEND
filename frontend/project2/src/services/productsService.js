// productsService.js
import axios from "axios";
import Product from "../models/Product.js";
const API = "http://localhost:5000/api/products";

import { createError } from "../utils/createError.js";

export const getAll = () =>
  Product.find({ isActive: true }).select("-__v").sort({ createdAt: -1 });
export const create = (data) => Product.create(data);
export const update = async (id, data) => {
  const p = await Product.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
  if (!p) throw createError(404, "Product not found.");
  return p;
};
export const remove = async (id) => {
  const p = await Product.findByIdAndDelete(id);
  if (!p) throw createError(404, "Product not found.");
  return p;
};

export const getProducts = () => axios.get(API);
export const createProduct = (data) => axios.post(API, data);
export const updateProduct = (id, data) => axios.put(`${API}/${id}`, data);
export const deleteProduct = (id) => axios.delete(`${API}/${id}`);
