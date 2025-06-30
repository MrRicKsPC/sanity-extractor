// Check pseudo validity of html string.
// function endsInTextContentArea(str) {
//     let inTag = false;
//     let inAttrValue = false;
//     let quoteChar = null;
//     let inComment = false;

//     for (let i = 0; i < str.length; i++) {
//         const c = str[i];
//         const nextTwo = str.slice(i, i + 2);
//         const nextThree = str.slice(i, i + 3);

//         // Handle comment start
//         if (!inTag && !inComment && str.slice(i, i + 4) === '<!--') {
//             inComment = true;
//             i += 3;
//             continue;
//         }

//         // Handle comment end
//         if (inComment && nextThree === '-->') {
//             inComment = false;
//             i += 2;
//             continue;
//         }

//         if (inComment) continue;

//         if (!inTag && c === '<') {
//             inTag = true;
//             continue;
//         }

//         if (inTag && !inAttrValue && (c === '"' || c === "'")) {
//             inAttrValue = true;
//             quoteChar = c;
//             continue;
//         }

//         if (inAttrValue && c === quoteChar) {
//             inAttrValue = false;
//             quoteChar = null;
//             continue;
//         }

//         if (inTag && !inAttrValue && c === '>') {
//             inTag = false;
//             continue;
//         }
//     }

//     // Final state check
//     return !inTag && !inAttrValue && !inComment;
// }

// Check validity of XML string.
function isValidXML(str) {

    // Parse string as XML.
    const doc = new DOMParser().parseFromString(str, "text/html");
    const parsed = doc.body.innerHTML;

    // Normalize both strings (remove extra spaces).
    const normalize = s => s.replace(/\s+/g, " ").trim();

    // Compare parsed result to original.
    return normalize(parsed) === normalize(str);
}

// Split html string into the biggest/smallest valid substring possible.
// function splitValidXMLCandidate(str, biggest = true) {
//     if (biggest) {
//         let valid = str;
//         let rest = "";
//         while (valid.length && !isValidXML(valid)) { // NOTE: Use this instead if diff highlighter breaks.
//             // while (valid.length && !endsInTextContentArea(valid)) {
//             rest = valid.slice(-1) + rest;
//             valid = valid.slice(0, -1);
//         }
//         return { valid, rest }
//     } else {
//         if (str.length <= 0) return { "valid": "", "rest": str };
//         let valid = str[0];
//         let rest = str.slice(1);
//         while (valid.length < str.length && !isValidXML(valid)) {
//             valid = valid + rest[0];
//             rest = rest.slice(1);
//         }
//         if (!isValidXML(valid)) {
//             return { "valid": rest, "rest": valid };
//         }
//         return { valid, rest };
//     }
// }

// Split xml string into the biggest/smallest valid substring possible.
// function splitValidXML(str) {
//     let split = splitValidXMLCandidate(str, biggest = false);
//     if (split.valid.length === 1) {
//         split = splitValidXMLCandidate(str, biggest = true);
//     }
//     return split;
// }

// Diff two strings.
// function diffWords(str1, str2) {

//     // Prepare diffs and result buffer.
//     const diff = Diff.diffWords(str1, str2);
//     let res = [];

//     // Buffer added and removed words.
//     let added = "";
//     let removed = "";

//     // For each difference.
//     for (let part of diff) {

//         // Element added.
//         if (part.added) {
//             added += part.value;
//             continue;
//         }

//         // Element removed.
//         if (part.removed) {
//             removed += part.value;
//             continue;
//         }

//         // Push added/removed element.
//         if (added.length || removed.length) {
//             res.push({
//                 "added": (!!added.length && !removed.length),
//                 "removed": (!added.length && !!removed.length),
//                 "replaced": (!!added.length && !!removed.length),
//                 "value": {
//                     "before": removed,
//                     "after": added,
//                 }
//             })
//         }

//         // Push unchanged elements.
//         added = "";
//         removed = "";
//         res.push({
//             "added": false,
//             "removed": false,
//             "replaced": false,
//             "value": {
//                 "before": part.value,
//                 "after": part.value,
//             }
//         })
//     }

//     // Push pending changed elements.
//     res.push({
//         "added": (!!added.length && !removed.length),
//         "removed": (!added.length && !!removed.length),
//         "replaced": (!!added.length && !!removed.length),
//         "value": {
//             "before": removed,
//             "after": added,
//         }
//     })

//     // Return final result.
//     return res;
// }

// Get first diff of two XML strings without breaking syntax.
// function firstDiffXml(xml1, xml2) {

//     // Prepare difference.
//     const diff = diffWords(xml1, xml2);

//     // Buffer XML until valid.
//     let added = "";
//     let removed = "";

//     // For each difference.
//     for (let part of diff) {

//         // Buffer new diff part.
//         added += part.value.after;
//         removed += part.value.before;
//         const changed = (added !== removed);

//         // Get smallest pseudo valid XML.
//         let splitAdded = splitValidXML(added);
//         let splitRemoved = splitValidXML(removed);

//         // No pseudo valid XML found.
//         if (!splitAdded.valid.length || !splitRemoved.valid.length) continue;

//         // Return element.
//         return {
//             "added": (!!splitAdded.valid.length && !splitRemoved.valid.length && changed),
//             "removed": (!splitAdded.valid.length && !!splitRemoved.valid.length && changed),
//             "replaced": (!!splitAdded.valid.length && !!splitRemoved.valid.length && changed),
//             "value": {
//                 "before": splitRemoved.valid,
//                 "after": splitAdded.valid,
//             }
//         }
//     }

//     // Diff not found (one xml string may be empty).
//     const changed = (xml1 !== xml1);
//     return {
//         "added": (!xml1.length && !!xml2.length),
//         "removed": (!!xml1.length && !xml2.length),
//         "replaced": false,
//         "value": {
//             "before": xml1,
//             "after": xml2,
//         }
//     }
// }

// // Diff two XML strings without breaking XML syntax.
// function diffXML(xml1, xml2) {

//     // Diff result buffer.
//     const diffs = [];

//     // Diff until both strings are empty.
//     while (xml1.length || xml2.length) {
//         const firstDiff = firstDiffXml(xml1, xml2);
//         xml1 = xml1.replace(firstDiff.value.before, "");
//         xml2 = xml2.replace(firstDiff.value.after, "");
//         diffs.push(firstDiff);
//     }

//     // Return final XML diff result.
//     return diffs;
// }

// Example XML string.
// const diff = diffXML(
//     `<b>The statements and slides presented in this subsection were drawn from Anh Phong Nguyen’s masterclass, accessible on Fullphysio. However, recent updates and additional articles have been and will be changed in this module to reflect the most recent scientific advances, and this information is therefore not included in the expert’s initial video.</b>`,
//     `<b>The statements and slides presented in this subsection were drawn from Anh Phong Nguyen’s masterclass, accessible on Fullphysio. However, recent updates and additional articles have been and/or will be added to this module to reflect the most recent scientific advances, and this information is therefore not included in the expert’s initial video.</b>`
// );

// Diff interface.
// const final = { "before": "", "after": "" };
// for (let part of diff) {
//     if (part.added) {
//         console.log(`%c${part.value.after}`, "color: green");
//         final.after += part.value.after;
//     } else if (part.removed) {
//         console.log(`%c${part.value.before}`, "color: red");
//         final.before += part.value.before;
//     } else if (part.replaced) {
//         console.log(`%c${part.value.before}%c\n%c${part.value.after}`, "color: red", "", "color: green");
//         final.after += part.value.after;
//         final.before += part.value.before;
//     } else {
//         console.log(`%c${part.value.after}`, "color: grey");
//         final.after += part.value.after;
//         final.before += part.value.before;
//     }
// }
// console.log(`%c${final.before}`, "color: cyan");
// console.log(`%c${final.after}`, "color: cyan");








































// Tokenize HTML into tags.
function tokenizeHTML(input) {

    const tokens = [];
    let i = 0;

    while (i < input.length) {

        if (input[i] === "<") {

            // We're at a tag start, find the closing ">"
            let tagEnd = input.indexOf(">", i);
            if (tagEnd === -1) {
                // No closing > found, treat rest as normal characters
                tokens.push(...input.slice(i).split(''));
                break;
            }

            // Extract the full tag token
            tokens.push(input.slice(i, tagEnd + 1));
            i = tagEnd + 1;

        } else {

            // Not a tag, push single character token
            tokens.push(input[i]);
            i++;
        }
    }

    return tokens;
}

// Helper: split a string into words and non-words (spaces, punctuation)
function splitText(text) {
    const regex = /(\p{L}+|\p{N}+|\s+|[^\p{L}\p{N}\s]+)/gu;
    return text.match(regex) || [];
}

// Tokenize HTML into words and tags.
function tokenizeHTMLByWords(input) {
    const tokens = [];
    let i = 0;

    while (i < input.length) {

        if (input[i] === "<") {

            // Extract full tag token
            const tagEnd = input.indexOf(">", i);
            if (tagEnd === -1) {

                // No closing >, treat rest as normal text
                tokens.push(...splitText(input.slice(i)));
                break;
            }

            tokens.push(input.slice(i, tagEnd + 1));
            i = tagEnd + 1;

        } else {

            // Extract text until next tag or end
            let nextTagStart = input.indexOf("<", i);
            if (nextTagStart === -1) nextTagStart = input.length;

            const textSegment = input.slice(i, nextTagStart);
            tokens.push(...splitText(textSegment));
            i = nextTagStart;
        }
    }

    return tokens;
}

// Diff two XML strings.
function diffXML(xml1, xml2) {

    // Tokenize XML strings.
    const tokens1 = tokenizeHTMLByWords(xml1);
    const tokens2 = tokenizeHTMLByWords(xml2);

    // console.log(tokens1);
    // console.log(tokens2);

    // Prepare diffs and result buffer.
    const diff = Diff.diffArrays(tokens1, tokens2);
    let res = [];

    // Buffer added and removed words.
    let added = "";
    let removed = "";

    // For each difference.
    for (let part of diff) {

        // Element added.
        if (part.added) {
            added += part.value.join("");
            continue;
        }

        // Element removed.
        if (part.removed) {
            removed += part.value.join("");
            continue;
        }

        // Push added/removed element.
        if (added.length || removed.length) {

            while (part.value.length) {
                if (isValidXML(added) && isValidXML(removed)) break;
                const subpart = part.value.shift();
                added += subpart;
                removed += subpart;
            }
            if (!isValidXML(added) || !isValidXML(removed)) continue;

            res.push({
                "added": (!!added.length && !removed.length),
                "removed": (!added.length && !!removed.length),
                "replaced": (!!added.length && !!removed.length),
                "value": {
                    "before": removed,
                    "after": added,
                }
            })
        }

        // Push unchanged elements.
        added = "";
        removed = "";
        for (let subpart of part.value) {
            res.push({
                "added": false,
                "removed": false,
                "replaced": false,
                "value": {
                    "before": subpart,
                    "after": subpart,
                }
            })
        }
    }

    // Push pending changed elements.
    if (added.length || removed.length) {
        res.push({
            "added": (!!added.length && !removed.length),
            "removed": (!added.length && !!removed.length),
            "replaced": (!!added.length && !!removed.length),
            "value": {
                "before": removed,
                "after": added,
            }
        })
    }

    // Return final result.
    return res;
}

// const html1 = `<b>Example amp; <b data-value="someAttribute">bold</b>j text.</b>, <b>FORMAT</b><i>pomme</i>`;
// const html2 = `<b>Example &amp; <b><i>bolded &amp; italic</i></b>j text.</b>, <i>FORMAT</i><b>banane</b>`;

// // Example XML string.
// const arrayDiff = diffXML(html1, html2);

// // Diff interface.
// const final = { "before": "", "after": "" };

// for (let part of arrayDiff) {
//     if (part.added) {
//         console.log(`%c${part.value.after}`, "color: green");
//         final.after += part.value.after;
//     } else if (part.removed) {
//         console.log(`%c${part.value.before}`, "color: red");
//         final.before += part.value.before;
//     } else if (part.replaced) {
//         console.log(`%c${part.value.before}%c\n%c${part.value.after}`, "color: red", "", "color: green");
//         final.after += part.value.after;
//         final.before += part.value.before;
//     } else {
//         console.log(`%c${part.value.after}`, "color: grey");
//         final.after += part.value.after;
//         final.before += part.value.before;
//     }
// }

// console.log(`%c${final.before}`, "color: cyan");
// console.log(`%c${final.after}`, "color: cyan");
