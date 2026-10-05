/** Drop the first occurrence of `item` from `list`, if present.
 *  Replaces the Array.prototype.remove monkey patch the game used to need. */
export function removeFrom(list, item) {
    var index = list.indexOf(item);
    if (index > -1) {
        list.splice(index, 1);
    }
}
