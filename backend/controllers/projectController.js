// backend / controllers/projectcontroller.js 
import * as svc from "../services/projectService.js";
import { success, created, paginated } from "../utils/respond.js";
export const getAll = async (req, res, next) => {
  try {
    const r = await svc.getAllProjects(req.query);
    paginated(res, r);
  } catch (e) {
    next(e);
  }
};
export const getById = async (req, res, next) => {
  try {
    success(res, await svc.getProjectById(req.params.id));
  } catch (e) {
    next(e);
  }
};
export const create = async (req, res, next) => {
  try {
    created(res, await svc.createProject(req.body));
  } catch (e) {
    next(e);
  }
};
export const update = async (req, res, next) => {
  try {
    success(res, await svc.updateProject(req.params.id, req.body), "Updated");
  } catch (e) {
    next(e);
  }
};
export const remove = async (req, res, next) => {
  try {
    success(res, await svc.deleteProject(req.params.id), "Deleted");
  } catch (e) {
    next(e);
  }
};
export const adminGetAll = async (req, res, next) => {
  try {
    const r = await svc.getAllProjectsAdmin(req.query);
    paginated(res, r);
  } catch (e) {
    next(e);
  }
};





