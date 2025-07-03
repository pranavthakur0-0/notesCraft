/**
 * Note model for the client-side
 */
export default class Note {
  constructor({
    id,
    title,
    content,
    supporting,
    notebook,
    createdAt,
    updatedAt,
    owner,
    rawInput,
    isArchived = false,
    isFavorite = false,
    tags = []
  }) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.supporting = supporting || '';  // Ensure supporting is never undefined
    this.notebook = notebook;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.owner = owner;
    this.rawInput = rawInput;
    this.isArchived = isArchived;
    this.isFavorite = isFavorite;
    this.tags = tags;
  }

  /**
   * Convert API data to frontend model
   */
  static fromAPI(apiNote) {
    // Debug incoming data
    
    if (!apiNote) {
      console.error("Note.fromAPI received null or undefined data");
      return null;
    }

    const note = new Note({
      id: apiNote._id || apiNote.id,
      title: apiNote.title || '',
      content: apiNote.content || '',
      supporting: apiNote.supporting || '',
      notebook: apiNote.notebook || '',
      createdAt: apiNote.createdAt || new Date(),
      updatedAt: apiNote.updatedAt || new Date(),
      owner: apiNote.owner || null,
      rawInput: apiNote.rawInput || '',
      isArchived: apiNote.isArchived || false,
      isFavorite: apiNote.isFavorite || false,
      tags: apiNote.tags || []
    });
  
    return note;
  }

  /**
   * Convert a collection of API data to frontend models
   */
  static fromAPIList(dataList) {
    return Array.isArray(dataList) ? dataList.map(data => Note.fromAPI(data)) : [];
  }

  /**
   * Prepare object for API submission
   */
  toAPI() {
    return {
      title: this.title,
      content: this.content,
      tags: this.tags,
      isArchived: this.isArchived,
      isFavorite: this.isFavorite,
      notebook: this.notebook
    };
  }
} 