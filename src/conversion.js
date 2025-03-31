function isDict(obj) { return typeof obj === "object" && obj !== null && !Array.isArray(obj) && !(obj instanceof Date) && !(obj instanceof RegExp); }
function isArray(obj) { return Array.isArray(obj); }
function isString(obj) { return typeof obj === "string" || obj instanceof String; }

// Simple 6-byte-UUID generation.
function generate6ByteUUID() {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Single chunk of a Portable Text segment.
class subunit {
    constructor(marks = [], text = "") {
        this.marks = marks; // List of strings.
        this.text = text;
    }
}

// Single Portable Text segment.
class unit {
    constructor(path = "", content = [], plaintext = true, style = "") {
        this.path = path;
        this.style = style;
        this.content = content; // List of subunits.
        this.plaintext = plaintext;
    }
}

function jsonExtractContent(node, units, current="") {
    // Navigate through relevant JSON objects.
    if (isDict(node)) {
        // Relevant paths.
        if (node["_type"] in PATHS) {
            for (let i = 0; i < PATHS[node["_type"]].length; i++) {
                let p = PATHS[node["_type"]][i];
                jsonExtractContent(node[p], units, current + "." + p);
            }
        }

        // Add portable text to container.
        if (node["_type"] == "block" && isArray(node["children"])) {
            let u = new unit("", [], false, "normal");
            u.style = node["style"] ?? "normal";
            for (let i = 0; i < node["children"].length; i++) {
                let child = node["children"][i];

                // Check block integrity.
                if (!isDict(child)) {
                    continue;
                } if (child["_type"] != "span") {
                    continue;
                } if (!isString(child["text"])) {
                    continue;
                } if (!isArray(child["marks"])) {
                    continue;
                }

                // Build unit mark by mark.
                let marks = [];
                for (let i = 0; i < child["marks"].length; i++) {
                    let mark = child["marks"][i];
                    if (isString(mark)) {
                        marks.push(mark);
                    }
                }
                u.content.push(new subunit(marks, child["text"]));
            }
            u.path = current + ".children";
            units.push(u);
        }
    }

    // Navigate through all JSON arrays.
    if (isArray(node)) {
        for (let i = 0; i < node.length; i++) {
            jsonExtractContent(node[i], units, current + "[" + String(i) + "]");
        }
    }

    // Add plain text to container.
    if (isString(node)) {
        let style = "normal";
        const current_split = current.split(".");
        if (current_split.length > 0 && current_split[current_split.length - 1] == "title") {
            style = "h1";
        }
        units.push(new unit(current, [new subunit([], node)], true, style));
    }
}

function htmlNestContent(marks, text) {
    // Format unmarked strings.
    if (!marks.length) {
        let temp = document.createElement("p");
        temp.textContent = text;
        return temp.innerHTML;
    }

    // Format marked strings.
    let mark = null;
    const nativeMarks = { "strong": "b", "em": "i", "underline": "u", "code": "code" };
    for (let i = marks.length - 1; i >= 0; i--) {
        let newmark;
        if (marks[i] in nativeMarks) {
            newmark = document.createElement(nativeMarks[marks[i]]);
        } else {
            newmark = document.createElement("span");
            newmark.setAttribute("data-mark", marks[i]);
        }
        (mark != null) ? newmark.appendChild(mark) : newmark.textContent = text;
        mark = newmark;
    }
    return mark.outerHTML;
}

function htmlUnnestContent(node, children, marks = []) {
    node.childNodes.forEach(subnode => {
        if (subnode.nodeType === Node.ELEMENT_NODE) {
            let mark = "";
            let newmarks = marks.slice();
            const nativeMarks = {
                "B": "strong", "STRONG": "strong",
                "I": "em", "EM": "em",
                "U": "underline", "CODE": "code" };
            if (subnode.nodeName in nativeMarks) {
                mark = nativeMarks[subnode.nodeName] ?? "custom";
            } else {
                if (subnode.nodeName == "SPAN" && subnode.hasAttribute("data-mark")) {
                    mark = subnode.getAttribute("data-mark");
                }
            }
            newmarks.push(mark);
            htmlUnnestContent(subnode, children, newmarks);
        } else {
            let entry = {
                "_key": generate6ByteUUID(),
                "_type": "span",
                "marks": marks.slice(),
                "text": subnode.textContent
            };
            children.push(entry);
        }
    });
}

function convertToHTML(jContent) {
    let units = [];
    jsonExtractContent(jContent, units);

    let hContent = "";
    const hStyle = document.createElement("style");
    hStyle.textContent = "* { font-family: \"Segoe UI\", sans-serif; } "
    + "[data-type=\"pt\"] { color: royalblue; } "
    + "h1 { font-size: 200%; } h2 { font-size: 185%; } h3 { font-size: 170%; } h4 { font-size: 155%; } h5 { font-size: 140%; } h6 { font-size: 125%; } "
    + "h1, h2, h3, h4, h5, h6 { text-align: center; } "
    + "span[data-mark] { color: #007bff; text-decoration: underline; cursor: pointer; }"
    hContent += hStyle.outerHTML + "\n\n";

    const nativeStyles = ["h1", "h2", "h3", "h4", "h5", "h6", "blockquote"];
    for (let i = 0; i < units.length; i++) {
        let hElement;
        if (nativeStyles.includes(units[i].style)) {
            hElement = document.createElement(units[i].style);
        } else {
            hElement = document.createElement("p");
            if (units[i].style != "normal") {
                hElement.setAttribute("data-style", units[i].style);
            }
        }
        hElement.setAttribute("data-source", units[i].path);
        if (units[i].plaintext) {
            hElement.setAttribute("data-type", "pt");
        }
        for (let j = 0; j < units[i].content.length; j++) {
            hElement.innerHTML += htmlNestContent(units[i].content[j].marks, units[i].content[j].text);
        }
        hContent += hElement.outerHTML + "\n\n";
    }
    return hContent;
}

function convertToJSON(hContent) {
    let patches = {};
    hContent.body.childNodes.forEach(element => {
        if (element.nodeType === Node.ELEMENT_NODE) {
            let children = [];
            htmlUnnestContent(element, children);
            if (element.hasAttribute("data-type") && element.getAttribute("data-type") == "pt") {
                plaintext = "";
                for (child of children) {
                    plaintext += child["text"];
                }
                children = plaintext;
            }
            patches[element.getAttribute("data-source")] = children;
        }
    });
    return patches;
}
