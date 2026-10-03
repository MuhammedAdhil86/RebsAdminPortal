import { PRODUCTION_URL } from "../api/AxiosClient";

/**
 * Asset URLs
 *
 * Final logo URL:
 *   {PRODUCTION_URL}/REBS/Rebs_Black.png
 *   |___ base ___||endpoint||___ file ___|
 */

// Base URL comes from AxiosClient's PRODUCTION_URL
// (VITE_PRODUCTION_API_URL in .env)
export const ASSET_BASE_URL = PRODUCTION_URL;

// Folder (endpoint)
export const ASSET_ENDPOINTS = {
  brand: "/REBS/",
};

// File names
export const ASSET_FILES = {
  logo: "Rebs_Black.png",
};

/**
 * Build a full asset URL.
 * getAssetUrl("Rebs_Black.png") -> {PRODUCTION_URL}/REBS/Rebs_Black.png
 */
export const getAssetUrl = (fileName, endpoint = ASSET_ENDPOINTS.brand) => {
  const folder = `/${endpoint.replace(/^\/+|\/+$/g, "")}/`;
  return `${ASSET_BASE_URL}${folder}${fileName}`;
};

// Ready-to-use logo URL
export const LOGO_URL = getAssetUrl(ASSET_FILES.logo);