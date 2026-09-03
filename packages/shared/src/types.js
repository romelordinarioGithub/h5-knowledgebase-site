/** @typedef {import('./classifyUrl.js').LinkType} LinkType */

/**
 * @typedef {Object} CatalogRow
 * @property {string} id
 * @property {string} sourceSheet
 * @property {string} title
 * @property {string} url
 * @property {string} lastUpdate
 * @property {number} lastUpdateStamp
 * @property {string} authors
 * @property {string[]} tags
 * @property {boolean} [featured]
 * @property {LinkType} linkType
 * @property {LinkType} provider
 * @property {string | null} embedUrl
 * @property {boolean} canPreview
 */

/**
 * @typedef {Object} FaqItem
 * @property {string} question
 * @property {string} answer
 * @property {string} [answerHtml]
 */

/**
 * @typedef {Object} CatalogPayload
 * @property {string} apiVersion
 * @property {string} updatedAt
 * @property {number} count
 * @property {CatalogRow[]} rows
 * @property {FaqItem[]} faqs
 */

/**
 * @typedef {CatalogPayload & { cachedAt?: number }} CachedCatalogPayload
 */

export {};
