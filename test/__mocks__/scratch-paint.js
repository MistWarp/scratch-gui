// The paint editor needs a real 2D canvas (paper.js) as soon as it is imported,
// which jsdom cannot provide. Unit tests never render it.
const PaintEditor = () => null;
const ScratchPaintReducer = (state = {}) => state;

module.exports = PaintEditor;
module.exports.default = PaintEditor;
module.exports.ScratchPaintReducer = ScratchPaintReducer;
