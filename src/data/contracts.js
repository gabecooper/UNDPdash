/**
 * @typedef {Object} NormalizedRow
 * @property {string} id
 * @property {Record<string, string>} dimensions
 * @property {Record<string, number>} valuesByYear
 * @property {Record<string, number>} metrics
 * @property {{pageNo: string, source: Record<string, string>}} meta
 */

/**
 * @typedef {Object} NormalizedDataset
 * @property {string} schema
 * @property {string[]} years
 * @property {{key: string, label: string, source?: string}[]} dimensionFields
 * @property {{key: string, label: string, source?: string}[]} metricFields
 * @property {NormalizedRow[]} rows
 */

/**
 * @typedef {Object} PageDefinition
 * @property {string} id
 * @property {string} label
 * @property {string} route
 * @property {string | null} csvFile
 * @property {"a4" | "multiYearSummary" | "climate" | "singleYearRegional" | "datasetIndex" | "placeholder"} componentKey
 * @property {string} templateType
 * @property {boolean} supportsYearFilter
 * @property {boolean} supportsDownload
 * @property {string[]} defaultYears
 * @property {(raw: string) => NormalizedDataset | null} adapter
 * @property {Record<string, unknown>=} viewConfig
 * @property {string} navLabel
 */

export {};
