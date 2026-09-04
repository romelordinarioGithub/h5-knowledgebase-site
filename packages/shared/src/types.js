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
 * @typedef {'heading'|'paragraph'|'key_value'|'callout'|'list'|'link'} FaqBlockType
 */

/**
 * @typedef {Object} FaqBlock
 * @property {number} order
 * @property {FaqBlockType} type
 * @property {string} title
 * @property {string} content
 * @property {string} variant
 */

/**
 * @typedef {Object} FaqItem
 * @property {string} [id]
 * @property {string} question
 * @property {string} answer
 * @property {string} [answerHtml]
 * @property {FaqBlock[]} [blocks]
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
