// Replace string or regex in an HTML string.
function replaceInInnerHTML(str, tofind, toReplace) {

    // Create temp element for DOM manipulation.
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = str;

    // Use findAndReplaceDOMText to replace string or regex.
    findAndReplaceDOMText(tempDiv, {
        find: tofind,
        replace: toReplace
    });

    // Return the modified innerHTML of the temporary div.
    return tempDiv.innerHTML;
}

// Create replacement node/fragment, optionally wrapped in HTML tags.
function createReplacementNode(replacementValue, wrapWithTags) {

    // Initial text node.
    let contentToInsert = document.createTextNode(replacementValue);

    // User specified marks.
    if (wrapWithTags && wrapWithTags.length > 0) {

        // Create DOM fragment.
        const fragment = document.createDocumentFragment();
        let currentWrapper = null;

        // Reverse iteration through marks for correct nesting.
        for (let i = wrapWithTags.length - 1; i >= 0; i--) {

            // HTML tag for current mark.
            const tag = wrapWithTags[i];
            const newElement = document.createElement(tag);

            // Append current node to new mark element.
            if (currentWrapper) 
                newElement.appendChild(currentWrapper);
            else
                newElement.appendChild(contentToInsert);

            // Update current node for the next iteration.
            currentWrapper = newElement;
        }

        // Return completed node as fragment.
        fragment.appendChild(currentWrapper);
        return fragment;
    }

    // Return plain text if no marks.
    return contentToInsert;
}

// Replace string in an HTML string.
function replaceStringInInnerHTML(innerHTMLString, stringToFind, stringToReplace, wrapWithTags = []) {

    // Create temp element for DOM manipulation.
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = innerHTMLString;

    // Use findAndReplaceDOMText to replace string.
    findAndReplaceDOMText(tempDiv, {
        find: stringToFind,
        replace: function(portion, match) {

            // Try to determine which part replaced in innerHTML.
            let substr;
            if (stringToFind.endsWith(portion.text)) { // Is last portion.
                substr = stringToReplace.substring(portion.indexInMatch);
            } else {
                substr = stringToReplace.substring(portion.indexInMatch, portion.text.length);
            }
            
            // Return replacement node, with or without wrapping.
            return createReplacementNode(substr, wrapWithTags);
        }
    });

    // Return the modified innerHTML of the temporary div.
    return tempDiv.innerHTML;
}

// Replace regex in an HTML string.
function replaceRegexInInnerHTML(innerHTMLString, regexToFind, regexToReplace, wrapWithTags = []) {

    // Create temp element for DOM manipulation.
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = innerHTMLString;

    // Use findAndReplaceDOMText to replace regex.
    findAndReplaceDOMText(tempDiv, {
        find: regexToFind,
        replace: function(portion, match) {

            // Replacement string buffer.
            let actualReplacementString;

            // Determine base string for replacement
            if (typeof regexToReplace === "function")   // regexToReplace is a function.
                actualReplacementString = regexToReplace(match);
            else                                        // regexToReplace is a string.
                actualReplacementString = match.text.replace(regexToFind, regexToReplace);

            // Return replacement node, with or without wrapping.
            return createReplacementNode(actualReplacementString, wrapWithTags);
        }
    });

    // Return result HTML string.
    return tempDiv.innerHTML;
}