export default class BlockItem {
  constructor(cls, procCode, labelID, y, opcode = null) {
    this.cls = cls;
    this.procCode = procCode;
    this.labelID = labelID;
    this.y = y;
    this.lower = procCode.toLowerCase();
    this.opcode = opcode;
    this.opcodeSearch = opcode ? opcode.toLowerCase() : null;
    /**
     * An Array of block ids
     * @type {Array.<string>}
     */
    this.clones = null;
    this.eventName = null;
  }

  /**
   * True if the blockID matches a black represented by this BlockItem
   * @param id
   * @returns {boolean}
   */
  matchesID(id) {
    if (this.labelID === id) {
      return true;
    }
    if (this.clones) {
      for (const cloneID of this.clones) {
        if (cloneID === id) {
          return true;
        }
      }
    }
    return false;
  }
}
