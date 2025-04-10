function isDict(obj) { return typeof obj === "object" && obj !== null && !Array.isArray(obj) && !(obj instanceof Date) && !(obj instanceof RegExp); }
function isArray(obj) { return Array.isArray(obj); }
function isString(obj) { return typeof obj === "string" || obj instanceof String; }

// Chunk array into subarrays.
function chunkArray(arr, size) {
    let result = [];
    for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size));
    }
    return result;
}

// Simple 6-byte-UUID generation.
function generate6ByteUUID() {
    const bytes = new Uint8Array(6);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Make link from a Sanity image ID.
function makeLink(type, value, suffix=""){
    if (value.includes("-")) {
        [project, dataset, token] = __words__;
        value = value.split("-");
        extension = value.pop();
        value.shift();
        return `https://cdn.sanity.io/${type}/${project}/${dataset}/${value.join("-")}.${extension}${suffix}`;
    } else {
        return "";
    }
}

// Single chunk of raw HTML.
class rawunit {
    constructor(html) {
        this.html = html;
    }
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
        this.content = content; // List of subunits and rawunits.
        this.plaintext = plaintext;
    }
}

// Extract translatable contents from JSON object.
function jsonExtractContent(root, node, units, current="") {
    // Navigate through relevant JSON objects.
    if (isDict(node)) {
        // Relevant paths.
        if (node["_type"] in PATHS) {
            for (let i = 0; i < PATHS[node["_type"]].length; i++) {
                let p = PATHS[node["_type"]][i];
                jsonExtractContent(root, node[p], units, current + "." + p);
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

        // Add image to container.
        if (node["_type"] == "image" && isDict(node["asset"]) && isString(node["asset"]["_ref"])) {
            units.push(new rawunit(`<img src="${makeLink("images", node["asset"]["_ref"])}">`));
        }

        // Add slide to container.
        if (node["_type"] == "slide" && isString(node["slideId"])) {
            let link = "";
            try {
                root["slides"]["slideMap"].forEach(slide => {
                    if (slide["_key"] == node["slideId"]) {
                        link = makeLink("files", slide["pdf"]["asset"]["_ref"], "#toolbar=0&navpanes=0&scrollbar=0");
                        return;
                    }
                });
            } catch (error) {
                link = "";
            }
            console.log(link);
            units.push(new rawunit(`<embed src="${link}" type="application/pdf">`));
        }
    }

    // Navigate through all JSON arrays.
    if (isArray(node)) {
        for (let i = 0; i < node.length; i++) {
            jsonExtractContent(root, node[i], units, current + "[" + String(i) + "]");
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

// Pack translatable contents in HTML object.
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

// Extract translatable contents from HTML object.
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

// Prepend style header to HTML string.
function applyStyleToHTML(hContent) {
    const hStyle = document.createElement("style");
    hStyle.textContent = "* { font-family: \"Segoe UI\", sans-serif; } "
    + "[data-type=\"pt\"] { color: royalblue; } "
    + "[data-list=\"true\"] { position: relative; padding-left: 3em; } "
    + "[data-list=\"true\"]::before { content: \"•\"; position: absolute; left: 1.5em; } "
    + "h1 { font-size: 200%; } h2 { font-size: 185%; } h3 { font-size: 170%; } "
    + "h4 { font-size: 155%; } h5 { font-size: 140%; } h6 { font-size: 125%; } "
    + "h1, h2, h3, h4, h5, h6 { text-align: center; } "
    + "span[data-mark] { color: #007bff; text-decoration: underline; cursor: pointer; } "
    + "div { max-width: 800pt; margin: 0 auto; box-sizing: border-box; border-bottom: 5pt solid black; padding: 20pt; } "
    + "img { border: 2pt solid black; display: block; margin: auto; width: 100%; max-width: 500pt; height: auto; max-height: 100%; } "
    + "embed { display: block; margin: auto; width: 500pt; height: 285pt; }"
    return hStyle.outerHTML + "\n\n" + hContent;
}

// Pack translatable contents in HTML string.
function convertToHTML(jContent) {
    let units = [];
    jsonExtractContent(jContent, jContent, units);

    let hContent = "";
    const hDiv = document.createElement("div");
    hDiv.setAttribute("id", jContent["_id"] ?? "");
    hContent += hDiv.outerHTML.substring(0, hDiv.outerHTML.length - 6) + "\n";

    const nativeStyles = ["h1", "h2", "h3", "h4", "h5", "h6", "blockquote"];
    for (let i = 0; i < units.length; i++) {
        let hElement;
        if (units[i] instanceof unit) {
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
            hContent += "  " + hElement.outerHTML;
            hContent += (i < units.length - 1) ? "\n\n" : "\n</div>";
        } else {
            hContent += `  <a>${units[i].html}</a>`;
            hContent += (i < units.length - 1) ? "\n\n" : "\n</div>";
        }
    }
    return hContent;
}

// Pack translatable contents in JSON object.
function convertToJSON(hContent) {
    let patches = {};
    const nativeStyles = ["P", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE"];
    hContent.childNodes.forEach(element => {
        if (element.nodeType === Node.ELEMENT_NODE && element.nodeName != "A" && nativeStyles.includes(element.nodeName)) { // Element "A" reserved for comments in Translation Files.
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
