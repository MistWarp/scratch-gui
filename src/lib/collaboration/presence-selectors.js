/**
 * Reading the collaboration `activity` map (see reducers/collaboration).
 * It only ever holds REMOTE peers, so nothing here has to filter us out.
 */

const EMPTY = [];

const asList = activity => (activity ? Object.values(activity) : EMPTY);

/**
 * Who is in a given sprite, whatever they are doing inside it.
 * @param {object} activity The activity map.
 * @param {string} targetId Sprite id.
 * @returns {Array.<object>} Users, possibly empty.
 */
const usersInSprite = (activity, targetId) =>
    asList(activity).filter(user => user.targetId === targetId);

/**
 * Who is on a given editor tab (code / costumes / sounds).
 * @param {object} activity The activity map.
 * @param {number} tab Tab index.
 * @returns {Array.<object>} Users, possibly empty.
 */
const usersOnTab = (activity, tab) =>
    asList(activity).filter(user => user.tab === tab);

/**
 * Who has a given costume or sound open. The tab disambiguates the two, so
 * one lookup serves both lists.
 * @param {object} activity The activity map.
 * @param {string} targetId Sprite the asset belongs to.
 * @param {number} tab Tab the asset list belongs to.
 * @param {number} assetIndex Index within that list.
 * @returns {Array.<object>} Users, possibly empty.
 */
const usersOnAsset = (activity, targetId, tab, assetIndex) =>
    asList(activity).filter(user =>
        user.targetId === targetId &&
        user.tab === tab &&
        user.assetIndex === assetIndex);

export {usersInSprite, usersOnTab, usersOnAsset};
