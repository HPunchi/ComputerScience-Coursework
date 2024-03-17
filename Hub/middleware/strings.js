function convertToTitleCase(str) {
    if (!str) {
        return ""
    }
    return str.toLowerCase().replace(/\b\w/g, s => s.toUpperCase()); 
    //converts string into title case (where first letter for each word is capital and rest is lowercase)
}

module.exports = {convertToTitleCase}; //final line to export function


