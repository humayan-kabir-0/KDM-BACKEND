// project / backend / controllers / contactController.js
import * as svc from "../services/contactService.js";
import { success, created, paginated } from "../utils/respond.js";
export const submit = async (req, res, next) => {
  try {
    created(res, await svc.submitContact(req.body, req.ip), "Message sent");
  } catch (e) {
    next(e);
  }
};
export const getAll = async (req, res, next) => {
  try {
    const r = await svc.getAllContacts(req.query);
    paginated(res, r);
  } catch (e) {
    next(e);
  }
};
export const markRead = async (req, res, next) => {
  try {
    success(res, await svc.markContactRead(req.params.id));
  } catch (e) {
    next(e);
  }
};
export const remove = async (req, res, next) => {
  try {
    success(res, null, "Deleted");
    await svc.deleteContact(req.params.id);
  } catch (e) {
    next(e);
  }
};
