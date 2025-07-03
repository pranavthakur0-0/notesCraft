/**
 * Notebook model for the client-side
 */
export default class Notebook {
  constructor(data) {
    this.id = data._id || data.id;
    this.name = data.name || '';
    this.icon = data.icon || 'FiBook';
    this.owner = data.owner || null;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
    this.latestRawInput = data.latestRawInput || null;
  }

  /**
   * Convert API data to frontend model
   */
  static fromAPI(data) {
    return new Notebook(data);
  }

  /**
   * Convert a collection of API data to frontend models
   */
  static fromAPIList(dataList) {
    return Array.isArray(dataList) ? dataList.map(data => Notebook.fromAPI(data)) : [];
  }

  /**
   * Prepare object for API submission
   */
  toAPI() {
    return {
      name: this.name,
      icon: this.icon
    };
  }
} 