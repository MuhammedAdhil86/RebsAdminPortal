// src/services/MasterData.js
import api from "./api"; // <- your shared axios instance (adjust path/name)
import { ENDPOINTS } from "../config/endpoints"; // <- the file that holds your endpoint object (adjust)

/**
 * Works whether your axios interceptor returns the full response
 * or already returns `response.data`.
 */
const unwrap = (res) =>
  res && typeof res === "object" && "status" in res && "config" in res
    ? res.data
    : res;

/** Accepts [..], { items: [..] } or { data: [..] }. */
const toList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

/** Builds list / save / remove for one master-data resource. */
const createResource = ({ list, add, remove }) => ({
  list: async () => toList(unwrap(await api.get(list))),
  // PUT: id 0 = create, id > 0 = update
  save: async ({ id = 0, ...fields }) =>
    unwrap(await api.put(add, { id, ...fields })),
  remove: async (id) => unwrap(await api.delete(remove(id))),
});

export const MASTER_DATA_API = {
  country: createResource({
    list: ENDPOINTS.countryList,
    add: ENDPOINTS.countryAdd,
    remove: ENDPOINTS.countryDelete,
  }),
  organisationType: createResource({
    list: ENDPOINTS.organisationTypeList,
    add: ENDPOINTS.organisationTypeAdd,
    remove: ENDPOINTS.organisationTypeDelete,
  }),
  service: createResource({
    list: ENDPOINTS.serviceList,
    add: ENDPOINTS.serviceAdd,
    remove: ENDPOINTS.serviceDelete,
  }),
};
