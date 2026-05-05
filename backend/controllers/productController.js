// backend / controllers/productcontroller.js
import * as svc from "../services/productService.js";
import { success, created } from "../utils/respond.js";
export const getAll = async (req, res, next) => {
  try {
    success(res, await svc.getAll());
  } catch (e) {
    next(e);
  }
};
export const create = async (req, res, next) => {
  try {
    created(res, await svc.create(req.body));
  } catch (e) {
    next(e);
  }
};
export const update = async (req, res, next) => {
  try {
    success(res, await svc.update(req.params.id, req.body), "Updated");
  } catch (e) {
    next(e);
  }
};
export const remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id);
    success(res, null, "Deleted");
  } catch (e) {
    next(e);
  }
};
