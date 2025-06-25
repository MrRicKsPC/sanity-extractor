const ID_SEPARATORS = /[\(\[\{\|\)\]\}|,:;\"`'\s]/;
const ID_CHUNKSIZE = 300;
let MULTIFILE_LIMIT = 10;
let __words__ = [null, null, null, null, null];

let domContent = null;
let domContentPending = false;

// TODO: Remove after debugging.
document.getElementById("app-search-replace-ids").value = "28efe934-0344-4119-bd49-ebee0f0e617b, 4292126e-8af0-4c9d-8477-95be545a1ef1, 930025ad-0b9b-4b4b-804d-8c39e6d02f85-en, drafts.f521e8d4-36f3-44d8-bd48-4696432396c7"; // TODO: Remove after debugging.
document.getElementById("app-ai-context").value = `Je crée des modules de formation pour kinésithérapeutes sous forme de synthèses écrites, basées sur la littérature scientifique, couvrant des concepts, pathologies ou techniques en kinésithérapie.
Ces modules doivent aider les kinésithérapeutes à actualiser leurs connaissances et à appliquer des pratiques cliniques fondées sur des preuves.
Mes textes actuels sont trop longs, denses et peu captivants, ce qui peut freiner leur lecture. En revanche, les transcriptions de masterclass vidéo, avec un style oral, familier mais scientifique, sont plus accessibles et engageantes.
Je te fournis un texte que je veux retravailler pour le rendre fluide, attrayant et motivant à lire, tout en restant scientifique et professionnel.`
document.getElementById("app-ai-instructions").value = `Synthétise légèrement pour aller à l’essentiel, sans perdre les idées clés ni les sources citées, qui garantissent la crédibilité.
Rends le texte accrocheur dès le début et engageant jusqu’à la fin, sans utiliser d’émoticônes.
Adopte un ton conversational, comme dans une masterclass orale, qui parle directement au kinésithérapeute : qu’est-ce qui va m’aider dans ma pratique quotidienne ?`

// Display download error to user.
function displayDownloadError(message) {
    document.getElementById("app-document-download").getElementsByClassName("small-loader")[0].style.display = "none";
    let errorMessage = document.getElementById("download-error");
    errorMessage.textContent = message;
    errorMessage.style.display = "";
    return null;
}

// Display upload error to user.
function displayUploadError(message) {
    document.getElementById("app-document-upload").getElementsByClassName("small-loader")[0].style.display = "none";
    let errorMessage = document.getElementById("upload-error");
    errorMessage.textContent = message;
    errorMessage.style.display = "";
    return null;
}

// Display draft fetch error to user.
function displayDraftFetchError(message) {
    document.getElementById("app-en-result-fetch").getElementsByClassName("small-loader")[0].style.display = "none";
    document.getElementById("app-fr-result-fetch").getElementsByClassName("small-loader")[0].style.display = "none";
    let errorMessage = document.getElementById("app-fetch-error");
    errorMessage.textContent = message;
    errorMessage.style.display = "";
    return null;
}

// Display ai action error to user.
function displayAIActionError(message) {
    document.getElementById("app-ai-rewrite").getElementsByClassName("small-loader")[0].style.display = "none";
    document.getElementById("app-ai-compare").getElementsByClassName("small-loader")[0].style.display = "none";
    document.getElementById("app-ai-apply").getElementsByClassName("small-loader")[0].style.display = "none";
    let errorMessage = document.getElementById("app-ai-error");
    errorMessage.textContent = message;
    errorMessage.style.display = "";
    return null;
}

// Display S&R error to user.
function displaySearchReplaceError(message) {
    document.getElementById("app-search-replace-load-en").getElementsByClassName("small-loader")[0].style.display = "none";
    document.getElementById("app-search-replace-load-fr").getElementsByClassName("small-loader")[0].style.display = "none";
    document.getElementById("app-search-replace-apply").getElementsByClassName("small-loader")[0].style.display = "none";
    let errorMessage = document.getElementById("app-search-replace-error");
    errorMessage.textContent = message;
    errorMessage.style.display = "";
    return null;
}

// Download string as file.
function downloadFile(fData, fName, fType) {
    const blob = new Blob([fData], { "type": fType });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.download = fName.trim();
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}

// Read file as string.
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, content: reader.result });
        reader.onerror = () => reject(new Error(`Unable to read file: ${file.name}:`));
        reader.readAsText(file);
    });
}

// Download Translation Files.
async function downloadTranslationFiles(cont_ids, urls, request, single_file) {
    document.getElementById("app-document-download").getElementsByClassName("small-loader")[0].style.display = "";
    try {
        let results = [];
        for (let i = 0; i < urls.length; i++) {
            url = urls[i];
            
            const response = await fetch(url, request);
            if (!response.ok) return displayDownloadError(`Unable to connect to Sanity API (error: ${response.status}).`);

            const data = await response.json();
            results.push(...data["result"]);
        }

        const res_map = {};
        results.forEach(obj => {
            res_map[obj._id] = obj;
        });
        results = cont_ids.map(id => res_map[id]).filter(obj => obj !== undefined);
        
        if (single_file) {
            let hContent = "";
            results.forEach(element => {
                hContent += convertToHTML(element) + "\n\n";
            });
            hContent = applyStyleToHTML(hContent);
            let title = results[0]["title"] ?? "Untitled Sanity Content";
            if (results.length > 1) title = "Multiple Sanity Contents";
            downloadFile(hContent, title.trim() + ".html", "text/html");
        } else {
            if (results.length > MULTIFILE_LIMIT) {
                errorMessage =  `You are trying to download ${results.length} individual Translation Files, which is NOT recommended.` +
                                `\nTo proceed anyway, type (MULTIFILE_LIMIT = 100_000) in the console and retry.`
                return displayDownloadError(errorMessage);
            }
            results.forEach(element => {
                let hContent = applyStyleToHTML(convertToHTML(element));
                let title = element["title"] ?? "Untitled Sanity Content";
                downloadFile(hContent, title.trim() + ".html", "text/html");
            });
        }
    } catch (error) {
        return displayDownloadError("Unable to parse Sanity API response.");
    }
    document.getElementById("app-document-download").getElementsByClassName("small-loader")[0].style.display = "none";
}

// Upload Translation Files.
async function uploadTranslationFiles(cont_ids, force_ids, cont_files) {
    let hContents = [];
    const files = Array.from(cont_files);
    const readPromises = files.map(readFile);
    try {
        const allContents = await Promise.all(readPromises);
        allContents.forEach(fileData => { // fileData = { name, content }
            const parser = new DOMParser();
            let hDivs = parser.parseFromString(fileData["content"], "text/html").body.childNodes;
            hDivs.forEach(div => {
                if (div.nodeType === Node.ELEMENT_NODE) {
                    hContents.push(div);
                }
            });
        });
    } catch (error) {
        return displayUploadError(error);
    }
    if (hContents.length == 0) return displayUploadError("Please provide at least one valid Translation File.");
    if (force_ids && hContents.length != 1) return displayUploadError("To prevent any mistakes, you CANNOT specify a Sanity Content ID manually when uploading multiple Translation Files or Contents at once.");
    if (force_ids && cont_ids.length == 0) return displayUploadError("Please provide a valid Sanity Content ID.");
    if (force_ids && cont_ids.length != 1) return displayUploadError("To prevent any mistakes, you CANNOT specify multiple Sanity Content IDs manually when uploading Translation Files or Contents.");

    let url, request = null;
    let [project, dataset, token, automation, secret] = __words__;

    url = `https://${project}.api.sanity.io/v1/data/mutate/${dataset}`;
    request = { "method": "POST", "headers": { "Content-Type": "application/json", "Authorization": `Bearer ${token}`}};
    request["body"] = { "mutations": []};
    hContents.forEach(hContent => {
        if (!hContent.getAttribute("id")) return;
        const patches = convertToJSON(hContent);
        let cont_id = hContent.getAttribute("id") ?? "";
        if (force_ids) cont_id = cont_ids[0];
        request["body"]["mutations"].push({ "patch": { "id": cont_id, "set": patches}});
    });
    request["body"] = JSON.stringify(request["body"]);

    try {
        const response = await fetch(url, request);
        if (!response.ok) return displayUploadError(`Unable to connect to Sanity API (error: ${response.status}).`);

        const data = await response.json();
        if (data["results"][0]["operation"] == "update") {
            alert("Content successfully updated on Sanity.");
        } else {
            return displayUploadError("PATCH error! Please provide valid Sanity credentials.");
        }
    } catch (error) {
        return displayUploadError(`Unable to upload Translation File (error: ${error}).`);
    }
    document.getElementById("app-document-upload").getElementsByClassName("small-loader")[0].style.display = "none";
}

// Fetch Draft Exerices.
async function fetchDrafts(language = "en") {
    const [project, dataset, token, automation, secret] = __words__;
    const textField = document.getElementById("app-result-ids");
    textField.value = "";

    const url = `https://${project}.api.sanity.io/v1/data/query/${dataset}?query=${
        encodeURIComponent(`*[_id in path("drafts.**") && _type=="exercise" && language=="${language}"]{_id}`)
    }`;
    const request = { "method": "GET", "headers": { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }};

    const response = await fetch(url, request);
    if (!response.ok) return displayDraftFetchError(`Unable to connect to Sanity API (error: ${response.status}).`);

    const data = await response.json();
    if (data["result"].length <= 0) displayDraftFetchError(`Could NOT find "${language}" exercise drafts.`);

    data["result"].forEach((exercice) => {
        if (textField.value.length > 0) {
            textField.value = `${textField.value}, ${exercice["_id"]}`;
        } else {
            textField.value = `${exercice["_id"]}`;
        }
    })
}

// Delete all subparts.
function deleteSubParts() {
    const elements = document.querySelectorAll('.app-ai-subparts');
    elements.forEach(element => element.remove());
}

// Push an new subpart.
function pushSubPart(name, id, tokens, callback) {
    const parent = document.getElementById("app-ai");
    
    const divElement = document.createElement("div");
    divElement.setAttribute("class", "app-ai-subparts");
    divElement.setAttribute("title", `${tokens.join(" + ")} tokens`);

    const buttonElement = document.createElement("button");
    buttonElement.setAttribute("id", id);
    buttonElement.textContent = `${name} (${tokens.reduce((accumulator, currentValue) => accumulator + currentValue, 0)} tokens in ${tokens.length} requests)`

    const spanElement = document.createElement("span");
    spanElement.setAttribute("class", "small-loader");
    spanElement.setAttribute("style", "display: none;");
    buttonElement.appendChild(spanElement);

    divElement.appendChild(buttonElement);

    const paragraphElement = document.createElement("button");
    paragraphElement.setAttribute("id", `app-ai-error-${id}`);
    paragraphElement.setAttribute("class", "error-label");
    paragraphElement.setAttribute("style", "display: none;");
    paragraphElement.textContent = "Here is an example of error message that the user may encounter during navigation.";
    divElement.appendChild(paragraphElement);

    parent.appendChild(divElement);

    buttonElement.addEventListener("click", async function() {
        const elements = document.querySelectorAll('div.app-ai-subparts:not(.divider)');
        for (let element of elements) {
            if (element.getElementsByClassName("small-loader")[0].style.display === "") {
                return;
            }
        }
        this.getElementsByClassName("small-loader")[0].style.display = "";
        document.getElementById("app-ai-error").style.display = "none";
        
        await callback()

        this.getElementsByClassName("small-loader")[0].style.display = "none";
    });
}

// Push an new subpart separator.
function pushSubPartSeparator(name, id, tokens, callback) {
    const parent = document.getElementById("app-ai");
    
    const hrElement = document.createElement("div");
    hrElement.setAttribute("class", "divider app-ai-subparts");
    parent.appendChild(hrElement);
}

// Push an new subpart title.
function pushPartTitle(name) {
    const parent = document.getElementById("app-ai");
    
    const textElement = document.createElement("h4");
    textElement.setAttribute("class", "app-ai-subparts");
    textElement.textContent = name;
    parent.appendChild(textElement);
}

// Push module title.
function pushModuleTitle(name) {
    const parent = document.getElementById("app-ai");
    
    const textElement = document.createElement("h2");
    textElement.setAttribute("class", "app-ai-subparts");
    textElement.textContent = name;
    parent.appendChild(textElement);
}

// Rewrite a specific module subpart.
async function rewriteModuleSubpart(moduleId, part, subpart) {
    const [project, dataset, token, automation, secret] = __words__;
    const aiModuleId = (moduleId.trim().startsWith("drafts.")) ? `${moduleId}-ai` : `drafts.${moduleId}-ai`;

    // Get user prompt from interface.
    const context = document.getElementById("app-ai-context").value.split("\n").filter(str => str.trim() !== "");
    const instructions = document.getElementById("app-ai-instructions").value.split("\n").filter(str => str.trim() !== "");
    if (!instructions.length) return displayAIActionError("Please give instructions to the AI agent.");

    // Fetch source content from Sanity API.
    let url = `https://${project}.api.sanity.io/v1/data/query/${dataset}?query=${
        encodeURIComponent(`*[_id=="${moduleId}"]`)
    }`;
    let request = { "method": "GET", "headers": { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }};

    let response = await fetch(url, request);
    if (!response.ok) return displayAIActionError(`Unable to connect to Sanity API (error: ${response.status}).`);

    let data = await response.json();
    if (data["result"].length <= 0) return displayAIActionError(`Could NOT find Sanity content.`);

    let srcModule = data["result"][0];
    if (srcModule["_type"] !== "ebpModule") return displayAIActionError(`Sanity content is NOT a module.`);

    // Fetch destination content from Sanity API.
    url = `https://${project}.api.sanity.io/v1/data/query/${dataset}?query=${
        encodeURIComponent(`*[_id=="${aiModuleId}"]`)
    }`;
    request = { "method": "GET", "headers": { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }};

    response = await fetch(url, request);
    if (!response.ok) return displayAIActionError(`Unable to connect to Sanity API (error: ${response.status}).`);

    let dstModule = null;

    data = await response.json();
    if (data["result"].length <= 0) {
        dstModule = JSON.parse(JSON.stringify(srcModule));
    } else {
        dstModule = data["result"][0];
    }

    if (dstModule["_type"] !== "ebpModule")
        dstModule = JSON.parse(JSON.stringify(srcModule));

    // Apply prompt on target subsection.
    const paragraphs = splitSubPart(srcModule["parts"][part]["subparts"][subpart]["content"]);
    for (let i = 0; i < paragraphs.length; i++) {
        if (paragraphs[i][0]["_type"] !== "block") continue;
        paragraphs[i] = AI_Custom("json", instructions, context, paragraphs[i]);
    }
    const rewritten = (await Promise.all(paragraphs)).flat();
    // const rewritten = await AI_Custom("json", instructions, context, srcModule["parts"][part]["subparts"][subpart]["content"]);
    dstModule["parts"][part]["subparts"][subpart]["content"] = rewritten;

    // Update copy of content back to Sanity API.
    dstModule["_id"] = aiModuleId;
    dstModule["title"] = `[AI Copy] - ${srcModule["title"]}`;
    delete dstModule["_rev"];
    delete dstModule["_createdAt"];
    delete dstModule["_updatedAt"];
    
    url = `https://${project}.api.sanity.io/v1/data/mutate/${dataset}`;
    request = { "method": "POST", "headers": { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }};
    request["body"] = JSON.stringify({ "mutations": [{ "createOrReplace": dstModule}]});

    response = await fetch(url, request);
    if (!response.ok) return displayAIActionError(`Unable to connect to Sanity API (error: ${response.status}).`);

    console.log("[SUCCESS] - Preview document generated on Sanity.");
}

async function existsOnSanity(id) {
    const [project, dataset, token, automation, secret] = __words__;

    // Fetch content from Sanity API.
    const url = `https://${project}.api.sanity.io/v1/data/query/${dataset}?query=${
        encodeURIComponent(`*[_id=="${id}"]`)
    }`;
    const request = { "method": "GET", "headers": { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }};

    const response = await fetch(url, request);
    if (!response.ok) return false;

    const data = await response.json();
    if (data["result"].length <= 0) return false;

    return true;
}

async function compareOriginalWithAIContent() {
    const [project, dataset, token, automation, secret] = __words__;

    // Parse module ID from field.
    const cont_ids = document.getElementById("app-ai-document-id").value.split(ID_SEPARATORS).map(item => item.trim()).filter(str => str !== "");
    if (cont_ids.length == 0) return displayAIActionError("Please provide a valid Sanity Content ID.");
    if (cont_ids.length != 1) return displayAIActionError("To prevent any mistakes, you CANNOT specify multiple Sanity Content IDs manually for AI actions.");

    const moduleId = cont_ids[0];
    const aiModuleId = (moduleId.trim().startsWith("drafts.")) ? `${moduleId}-ai` : `drafts.${moduleId}-ai`;

    // const compareLink = `https://fullphysio.sanity.studio/structure/knowledge;modulesFr;${moduleId};${aiModuleId}`;
    const compareLink = `https://fullphysio.sanity.studio/structure/__edit__${moduleId}%2Ctype%3DebpModule;${aiModuleId}`;
    window.open(compareLink, "_blank");

    console.log(compareLink);
}

async function applyAIContentAndOverwrite() {
    const [project, dataset, token, automation, secret] = __words__;

    // Confirm user intentions.
    if (!confirm("Are you sure you want to overwrite the original Sanity document with the AI-generated content?\n\nThis action is NOT reversible.")) return;
    if (!confirm("If you proceed, all content in the original document will be overwritten and may be LOST FOREVER, are you really sure you want to proceed?")) return;

    // Parse module ID from field.
    const cont_ids = document.getElementById("app-ai-document-id").value.split(ID_SEPARATORS).map(item => item.trim()).filter(str => str !== "");
    if (cont_ids.length == 0) return displayAIActionError("Please provide a valid Sanity Content ID.");
    if (cont_ids.length != 1) return displayAIActionError("To prevent any mistakes, you CANNOT specify multiple Sanity Content IDs manually for AI actions.");

    const moduleId = cont_ids[0];
    const aiModuleId = (moduleId.trim().startsWith("drafts.")) ? `${moduleId}-ai` : `drafts.${moduleId}-ai`;
    
    // Fetch source content from Sanity API.
    let url = `https://${project}.api.sanity.io/v1/data/query/${dataset}?query=${
        encodeURIComponent(`*[_id=="${moduleId}"]`)
    }`;
    let request = { "method": "GET", "headers": { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }};

    let response = await fetch(url, request);
    if (!response.ok) return displayAIActionError(`Unable to connect to Sanity API (error: ${response.status}).`);

    let data = await response.json();
    if (data["result"].length <= 0) return displayAIActionError(`Could NOT find Sanity content.`);

    let srcModule = data["result"][0];
    if (srcModule["_type"] !== "ebpModule") return displayAIActionError(`Sanity content is NOT a module.`);

    // Fetch target content from Sanity API.    
    url = `https://${project}.api.sanity.io/v1/data/query/${dataset}?query=${
        encodeURIComponent(`*[_id=="${aiModuleId}"]`)
    }`;
    request = { "method": "GET", "headers": { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }};

    response = await fetch(url, request);
    if (!response.ok) return displayAIActionError(`Unable to connect to Sanity API (error: ${response.status}).`);

    data = await response.json();
    if (data["result"].length <= 0) return displayAIActionError(`Could NOT find AI-generated Sanity content.`);

    let trgModule = data["result"][0];
    if (trgModule["_type"] !== "ebpModule") return displayAIActionError(`AI-generated Sanity content is NOT a module.`);

    // Patch source module with target module.
    srcModule["abstract"] = trgModule["abstract"];
    srcModule["bibliography"] = trgModule["bibliography"];
    srcModule["parts"] = trgModule["parts"];

    url = `https://${project}.api.sanity.io/v1/data/mutate/${dataset}`;
    request = { "method": "POST", "headers": { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }};
    request["body"] = JSON.stringify({ "mutations": [{ "createOrReplace": srcModule}]});

    response = await fetch(url, request);
    if (!response.ok) return displayAIActionError(`Unable to connect to Sanity API (error: ${response.status}).`);

    // Delete AI-generated document.
    url = `https://${project}.api.sanity.io/v1/data/mutate/${dataset}`;
    request = { "method": "POST", "headers": { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }};
    request["body"] = JSON.stringify({ "mutations": [{ "delete": { "id": aiModuleId }}]});

    response = await fetch(url, request);
    if (!response.ok) return displayAIActionError(`Unable to connect to Sanity API (error: ${response.status}).`);

    document.getElementById("app-ai-compare").style.display = "none";
    document.getElementById("app-ai-prompts").style.display = "none";
    document.getElementById("app-ai-apply").style.display = "none";
    console.log("[SUCCESS] - Your original Sanity document was replaced with the content of the AI-generated content.");
}

// Fetch Sanity document for AI action.
async function loadModuleForAI() {
    const [project, dataset, token, automation, secret] = __words__;

    // Fetch content from Sanity API.
    const cont_ids = document.getElementById("app-ai-document-id").value.split(ID_SEPARATORS).map(item => item.trim()).filter(str => str !== "");
    if (cont_ids.length == 0) return displayAIActionError("Please provide a valid Sanity Content ID.");
    if (cont_ids.length != 1) return displayAIActionError("To prevent any mistakes, you CANNOT specify multiple Sanity Content IDs manually for AI actions.");

    let url = `https://${project}.api.sanity.io/v1/data/query/${dataset}?query=${
        encodeURIComponent(`*[_id=="${cont_ids[0]}"]`)
    }`;
    let request = { "method": "GET", "headers": { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }};

    let response = await fetch(url, request);
    if (!response.ok) return displayAIActionError(`Unable to connect to Sanity API (error: ${response.status}).`);

    let data = await response.json();
    if (data["result"].length <= 0) displayAIActionError(`Could NOT find Sanity content.`);

    const sanityContent = data["result"][0];

    const moduleId = sanityContent["_id"];
    const aiModuleId = (moduleId.trim().startsWith("drafts.")) ? `${moduleId}-ai` : `drafts.${moduleId}-ai`;

    // Add subsection AI action buttons.
    document.getElementById("app-ai-compare").style.display = "none";
    document.getElementById("app-ai-apply").style.display = "none";
    document.getElementById("app-ai-prompts").style.display = "none";
    deleteSubParts();
    pushModuleTitle(sanityContent["title"]);
    pushSubPartSeparator();
    if (sanityContent["_type"] !== "ebpModule") return displayAIActionError(`Sanity content is NOT a module.`);
    for (let i = 0; i < sanityContent["parts"].length; i++) {
        const part = sanityContent["parts"][i];
        pushPartTitle(part["title"]);
        for (let j = 0; j < part["subparts"].length; j++) {
            const subpart = part["subparts"][j];
            let tokenCount = [];
            for (let chunk of splitSubPart(subpart["content"])) {
                if (chunk[0]["_type"] !== "block") continue;
                tokenCount.push(countTokens(chunk) + 500);
            }
            pushSubPart(subpart["title"], `${i + 1}_${j + 1}`, tokenCount, async function() {
                await rewriteModuleSubpart(moduleId, i, j);
                document.getElementById("app-ai-compare").style.display = "";
                document.getElementById("app-ai-apply").style.display = "";
            });
        }
        pushSubPartSeparator();
    }
    document.getElementById("app-ai-prompts").style.display = "";
    if (await existsOnSanity(aiModuleId)) {
        document.getElementById("app-ai-compare").style.display = "";
        document.getElementById("app-ai-apply").style.display = "";
    }
}

// Strip unnecessary elements from HTML Translation File.
function stripTranslationFiles(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    const domElement = doc.body.firstChild;
    let result = "";
    for (const child of domElement.children) {
        if (child.tagName.toLowerCase() !== "a") {
            result += `  ${child.outerHTML}\n`;
        }
    }
    domElement.innerHTML = `\n${result}`;
    return domElement.outerHTML;
}

// Revert a change made to the translation file.
function revertChange(element) {
    const previous = element.getAttribute("title");
    element.setAttribute("title", element.innerHTML);
    element.innerHTML = previous;
    if (element.getAttribute("data-diff") === "yes") {
        element.setAttribute("data-diff", "no");
    } else {
        element.setAttribute("data-diff", "yes");
    }
}































// Strip an html string from diff tags.
function stripDiffTags(str) {

    // Parse HTML string.
    const parser = new DOMParser();
    const content = parser.parseFromString(str, "text/html").body;

    // Replace all spans from the string.
    while (content.querySelectorAll("span[data-diff]").length) {

        const span = content.querySelectorAll("span[data-diff]")[0];
        span.outerHTML = span.innerHTML;
        // const parent = span.parentNode;
        // const fragment = document.createRange().createContextualFragment(span.innerHTML);
        // parent.replaceChild(fragment, span);
    }

    // Return stripped string.
    return content.innerHTML;
}

// Naive search and replace function.
function replaceAllSubstrings(inputString, searchSubstring, replacementSubstring) {
    const escapedSearch = searchSubstring.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(escapedSearch, "g");
    return inputString.replace(regex, replacementSubstring);
}

// Download Translation Files for S&R.
async function loadTranslationFilesForSearchReplace(cont_ids, urls, request) {
    
    if (domContentPending && !confirm("Some of your changes have NOT been applied yet.\nAre you sure you want to reload your Sanity documents?")) return;
    if (domContentPending && !confirm("All pending changes will be lost. Reload documents anyway?")) return;
    document.getElementById("app-search-replace-apply").style.display = "none";
    const rteditor = document.querySelector('#app-search-replace .rteditor');
    rteditor.innerHTML = "";
    domContent = null;
    domContentPending = false;

    try {
        let results = [];
        for (let i = 0; i < urls.length; i++) {
            url = urls[i];
            
            const response = await fetch(url, request);
            if (!response.ok) return displaySearchReplaceError(`Unable to connect to Sanity API (error: ${response.status}).`);

            const data = await response.json();
            results.push(...data["result"]);
        }

        if (results.length <= 0) return displaySearchReplaceError(`Unable to find any Sanity document with specified parameters.`);
        
        let hContent = "";
        results.forEach(element => {
            hContent += `${stripTranslationFiles(convertToHTML(element))}\n`;
        });
        hContent = applyStyleToHTML(hContent);

        const parser = new DOMParser();
        domContent = parser.parseFromString(hContent, "text/html").body;
        domContentPending = false;

        for (const child of domContent.children) {
            for (const grandchild of child.children) {
                if (grandchild.nodeType === 1 && grandchild.hasAttribute("data-source")) {
                    grandchild.setAttribute("contenteditable", "true");
                }
            }
        }

        rteditor.innerHTML = domContent.innerHTML;
    } catch (error) {
        return displaySearchReplaceError("Unable to parse Sanity API response.");
    }
    document.getElementById("app-document-download").getElementsByClassName("small-loader")[0].style.display = "none";
}

// Highlight differences in S&R.
function highlightSRDifferences() {
    if (domContent === null) return displaySearchReplaceError("Could NOT find loaded document, try reloading the document.");

    const rteditor = document.querySelector('#app-search-replace .rteditor');
    domContentPending = true;

    // Clear document from data-diff elements.
    rteditor.innerHTML = stripDiffTags(rteditor.innerHTML);

    // console.log(domContent.children);
    // console.log(rteditor.children);

    if (domContent.children.length !== rteditor.children.length) return displaySearchReplaceError("Could NOT allign loaded document with original, try reloading the document.");
    for (let i = 0; i < rteditor.children.length; i++) {
        const childOriginal = domContent.children[i];
        const childEditor = rteditor.children[i];

        if (childOriginal.children.length !== childEditor.children.length) return displaySearchReplaceError("Could NOT allign loaded document with original, try reloading the document.");
        for (let j = 0; j < childEditor.children.length; j++) {
            const grandchildOriginal = childOriginal.children[j];
            const grandchildEditor = childEditor.children[j];
            
            if (grandchildOriginal.nodeType === 1 && grandchildOriginal.hasAttribute("data-source") && grandchildEditor.nodeType === 1 && grandchildEditor.hasAttribute("data-source")) {
                const diff = diffXML(grandchildOriginal.innerHTML, grandchildEditor.innerHTML);
                let hTemp = "";
                for (let part of diff) {
                    if (part.added) {
                        // console.log(`%c${part.value.after}`, "color: green");
                        hTemp += `<span data-diff="yes">${part.value.after}</span>`;
                        // hTemp += `<span data-diff="yes" title="${"➕"}" onclick="revertChange(this)">${part.value.after}</span>`;
                    } else if (part.removed) {
                        // console.log(`%c${part.value.before}`, "color: red");
                        // hTemp += `<span data-diff="yes" title="${part.value.before}" onclick="revertChange(this)">${"➖"}</span>`;
                    } else if (part.replaced) {
                        // console.log(`%c${part.value.before}%c\n%c${part.value.after}`, "color: red", "", "color: green");
                        hTemp += `<span data-diff="yes" title="${part.value.before}" onclick="revertChange(this)">${part.value.after}</span>`;
                    } else {
                        // console.log(`%c${part.value.after}`, "color: grey");
                        hTemp += part.value.after;
                    }
                }
                grandchildEditor.innerHTML = hTemp;
            }
        }
    }
        
    // downloadFile(hContent, "temp.html", "text/html");
}

// Set tabs to only-one active.
const appTabs = document.getElementById("app-tabs").querySelectorAll(".app-tab");
appTabs.forEach(tab => {
    tab.addEventListener("click", function() {
        appTabs.forEach(t => t.classList.remove("active"));
        this.classList.add("active");
        document.getElementById("app-page").style.display = "none";
        document.getElementById("app-exercises").style.display = "none";
        document.getElementById("app-ai").style.display = "none";
        document.getElementById("app-search-replace").style.display = "none";
        if (this.id == "tab-translation-files") {
            document.getElementById("app-page").style.display = "";
            document.getElementById("download-error").style.display = "none";
            document.getElementById("upload-error").style.display = "none";
        } else if (this.id == "tab-exercise-revision") {
            document.getElementById("app-exercises").style.display = "";
            document.getElementById("app-fetch-error").style.display = "none";
        } else if (this.id == "tab-ai-tools") {
            document.getElementById("app-ai").style.display = "";
            document.getElementById("app-ai-error").style.display = "none";
        } else if (this.id == "tab-search-replace") {
            document.getElementById("app-search-replace").style.display = "";
            document.getElementById("app-search-replace-error").style.display = "none";
        }
    });
});

// Set initial active tab.
const initialActiveTab = document.querySelector(".app-tab.active");
if (!initialActiveTab) {
    appTabs[0].classList.add("active");
}

// Toggle manual ID input for upload.
document.getElementById("app-force-id").addEventListener("click", function(event) {
    document.getElementById("upload-error").style.display = "none";
    if (event.target.checked) {
        document.getElementById("app-document-id").style.display = "";
    } else {
        document.getElementById("app-document-id").style.display = "none";
    }
});

// Toggle manual ID input for S&R.
document.getElementById("app-search-replace-toggle-ids").addEventListener("click", function(event) {
    document.getElementById("app-search-replace-error").style.display = "none";
    if (event.target.checked) {
        document.getElementById("app-search-replace-ids").style.display = "";
    } else {
        document.getElementById("app-search-replace-ids").style.display = "none";
    }
});

// Hide error message upon S&R type toggling.
document.getElementById("app-search-replace-toggle-modules").addEventListener("click", function(event) { document.getElementById("app-search-replace-error").style.display = "none";});
document.getElementById("app-search-replace-toggle-exercises").addEventListener("click", function(event) { document.getElementById("app-search-replace-error").style.display = "none";});
document.getElementById("app-search-replace-toggle-clinical-tests").addEventListener("click", function(event) { document.getElementById("app-search-replace-error").style.display = "none";});
document.getElementById("app-search-replace-toggle-masterclasses").addEventListener("click", function(event) { document.getElementById("app-search-replace-error").style.display = "none";});
document.getElementById("app-search-replace-toggle-webinars").addEventListener("click", function(event) { document.getElementById("app-search-replace-error").style.display = "none";});
document.getElementById("app-search-replace-toggle-clinical-practices").addEventListener("click", function(event) { document.getElementById("app-search-replace-error").style.display = "none";});

// Listen for download input field edits.
document.getElementById("app-document-ids").addEventListener("input", function(event) {
    document.getElementById("download-error").style.display = "none";
    const cont_ids = event.target.value.split(ID_SEPARATORS).map(item => item.trim()).filter(str => str !== "");
    if (cont_ids.length > 1) {
        document.getElementById("app-single-file").parentElement.style.display = "";
    } else {
        document.getElementById("app-single-file").parentElement.style.display = "none";
    }
});

// Listen for upload input field edits.
document.getElementById("app-document-id").addEventListener("input", function(event) {
    document.getElementById("upload-error").style.display = "none";
});

// Listen for upload file input field edits.
document.getElementById("app-translation-document").addEventListener("change", function(event) {
    document.getElementById("upload-error").style.display = "none";
});

// Listen for ai input field edits.
document.getElementById("app-ai-document-id").addEventListener("input", function(event) {
    document.getElementById("app-ai-error").style.display = "none";
});

// Listen for S&R input field edits.
document.getElementById("app-search-replace-ids").addEventListener("input", function(event) {
    document.getElementById("app-search-replace-error").style.display = "none";
});

// Download Translation file.
document.getElementById("app-document-download").addEventListener("click", function(event) {
    if (this.getElementsByClassName("small-loader")[0].style.display == "") return;
    this.getElementsByClassName("small-loader")[0].style.display = "";
    document.getElementById("download-error").style.display = "none";
    let [project, dataset, token, automation, secret] = __words__;
    if (!project || !dataset || !token || !automation || !secret ) return displayAuthError("Please provide valid Sanity API & Sanity Automations API credentials.");

    const cont_ids = document.getElementById("app-document-ids").value.split(ID_SEPARATORS).map(item => item.trim()).filter(str => str !== "");
    const single_file = document.getElementById("app-single-file").checked;
    if (cont_ids.length == 0) return displayDownloadError("Please provide at least one Sanity Content ID.");

    let urls = [];
    chunkArray(cont_ids, ID_CHUNKSIZE).forEach(chunk => {
        const query = `*[_id in ${JSON.stringify(chunk)}]`;
        const url = `https://${project}.api.sanity.io/v1/data/query/${dataset}?query=${encodeURIComponent(query)}`;
        urls.push(url);
    });

    const request = { "method": "GET", "headers": { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }};
    downloadTranslationFiles(cont_ids, urls, request, single_file);
});

// Upload Translation file.
document.getElementById("app-document-upload").addEventListener("click", function(event) {
    if (this.getElementsByClassName("small-loader")[0].style.display == "") return;
    this.getElementsByClassName("small-loader")[0].style.display = "";
    document.getElementById("upload-error").style.display = "none";
    let [project, dataset, token, automation, secret] = __words__;
    if (!project || !dataset || !token || !automation || !secret ) return displayAuthError("Please provide valid Sanity API & Sanity Automations API credentials.");

    const cont_ids = document.getElementById("app-document-id").value.split(ID_SEPARATORS).map(item => item.trim()).filter(str => str !== "");
    const force_ids = document.getElementById("app-force-id").checked;
    const cont_files = document.getElementById("app-translation-document").files;
    uploadTranslationFiles(cont_ids, force_ids, cont_files);
});

// Fetch draft EN exercises.
document.getElementById("app-en-result-fetch").addEventListener("click", async function(event) {
    if (document.getElementById("app-en-result-fetch").getElementsByClassName("small-loader")[0].style.display == "") return;
    if (document.getElementById("app-fr-result-fetch").getElementsByClassName("small-loader")[0].style.display == "") return;
    this.getElementsByClassName("small-loader")[0].style.display = "";
    document.getElementById("app-fetch-error").style.display = "none";
    let [project, dataset, token, automation, secret] = __words__;
    if (!project || !dataset || !token || !automation || !secret ) return displayAuthError("Please provide valid Sanity API & Sanity Automations API credentials.");

    await fetchDrafts("en");

    this.getElementsByClassName("small-loader")[0].style.display = "none";
});

// Fetch draft FR exercises.
document.getElementById("app-fr-result-fetch").addEventListener("click", async function(event) {
    if (document.getElementById("app-en-result-fetch").getElementsByClassName("small-loader")[0].style.display == "") return;
    if (document.getElementById("app-fr-result-fetch").getElementsByClassName("small-loader")[0].style.display == "") return;
    this.getElementsByClassName("small-loader")[0].style.display = "";
    document.getElementById("app-fetch-error").style.display = "none";
    let [project, dataset, token, automation, secret] = __words__;
    if (!project || !dataset || !token || !automation || !secret ) return displayAuthError("Please provide valid Sanity API & Sanity Automations API credentials.");

    await fetchDrafts("fr");

    this.getElementsByClassName("small-loader")[0].style.display = "none";
});

// Fetch request document for AI action.
document.getElementById("app-ai-rewrite").addEventListener("click", async function(event) {
    if (document.getElementById("app-ai-rewrite").getElementsByClassName("small-loader")[0].style.display == "") return;
    this.getElementsByClassName("small-loader")[0].style.display = "";
    document.getElementById("app-ai-error").style.display = "none";
    let [project, dataset, token, automation, secret] = __words__;
    if (!project || !dataset || !token || !automation || !secret ) return displayAuthError("Please provide valid Sanity API & Sanity Automations API credentials.");

    await loadModuleForAI();

    this.getElementsByClassName("small-loader")[0].style.display = "none";
});

// Compare source document with AI-generated document.
document.getElementById("app-ai-compare").addEventListener("click", async function(event) {
    if (document.getElementById("app-ai-compare").getElementsByClassName("small-loader")[0].style.display == "") return;
    this.getElementsByClassName("small-loader")[0].style.display = "";
    document.getElementById("app-ai-error").style.display = "none";
    let [project, dataset, token, automation, secret] = __words__;
    if (!project || !dataset || !token || !automation || !secret ) return displayAuthError("Please provide valid Sanity API & Sanity Automations API credentials.");

    await compareOriginalWithAIContent();

    this.getElementsByClassName("small-loader")[0].style.display = "none";
});

// Patch source document using AI-generated content.
document.getElementById("app-ai-apply").addEventListener("click", async function(event) {
    if (document.getElementById("app-ai-apply").getElementsByClassName("small-loader")[0].style.display == "") return;
    this.getElementsByClassName("small-loader")[0].style.display = "";
    document.getElementById("app-ai-error").style.display = "none";
    let [project, dataset, token, automation, secret] = __words__;
    if (!project || !dataset || !token || !automation || !secret ) return displayAuthError("Please provide valid Sanity API & Sanity Automations API credentials.");

    await applyAIContentAndOverwrite();

    this.getElementsByClassName("small-loader")[0].style.display = "none";
});

// Load specified EN documents as Translation files for S&R.
document.getElementById("app-search-replace-load-en").addEventListener("click", async function(event) {
    if (this.getElementsByClassName("small-loader")[0].style.display == "") return;
    this.getElementsByClassName("small-loader")[0].style.display = "";
    document.getElementById("app-search-replace-error").style.display = "none";
    let [project, dataset, token, automation, secret] = __words__;
    if (!project || !dataset || !token || !automation || !secret ) return displayAuthError("Please provide valid Sanity API & Sanity Automations API credentials.");

    const cont_ids = document.getElementById("app-search-replace-ids").value.split(ID_SEPARATORS).map(item => item.trim()).filter(str => str !== "");
    const toggle_ids = document.getElementById("app-search-replace-toggle-ids").checked;
    if (toggle_ids && cont_ids.length == 0) return displaySearchReplaceError("Please provide at least one Sanity Content ID or untick the ID checkbox.");

    const toggle_modules = document.getElementById("app-search-replace-toggle-modules").checked;
    const toggle_exercises = document.getElementById("app-search-replace-toggle-exercises").checked;
    const toggle_clinical_tests = document.getElementById("app-search-replace-toggle-clinical-tests").checked;
    const toggle_masterclasses = document.getElementById("app-search-replace-toggle-masterclasses").checked;
    const toggle_webinars = document.getElementById("app-search-replace-toggle-webinars").checked;
    const toggle_clinical_practices = document.getElementById("app-search-replace-toggle-clinical-practices").checked;
    if (!toggle_ids && !toggle_modules && !toggle_exercises && !toggle_clinical_tests && !toggle_masterclasses && !toggle_webinars && !toggle_clinical_practices)
        return displaySearchReplaceError("Please provide at least one type of Sanity Content by ticking the checkboxes.");

    const contentTypes = [];
    if (toggle_modules) contentTypes.push("ebpModule");
    if (toggle_exercises) contentTypes.push("exercise");
    if (toggle_clinical_tests) contentTypes.push("clinicalTest");
    if (toggle_masterclasses) contentTypes.push("masterclass");
    if (toggle_webinars) contentTypes.push("webinar");
    if (toggle_clinical_practices) contentTypes.push("clinicalPractice");

    let urls = [];
    const query = `*[_type in ${JSON.stringify(contentTypes)} && language == "en"]`;
    const url = `https://${project}.api.sanity.io/v1/data/query/${dataset}?query=${encodeURIComponent(query)}`;
    urls.push(url);

    if (toggle_ids) {
        chunkArray(cont_ids, ID_CHUNKSIZE).forEach(chunk => {
            const query = `*[_id in ${JSON.stringify(chunk)} && language == "en"]`;
            const url = `https://${project}.api.sanity.io/v1/data/query/${dataset}?query=${encodeURIComponent(query)}`;
            urls.push(url);
        });
    }

    const request = { "method": "GET", "headers": { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }};
    await loadTranslationFilesForSearchReplace(cont_ids, urls, request);

    document.getElementById("app-search-replace-apply").style.display = "";

    this.getElementsByClassName("small-loader")[0].style.display = "none";
});

// Load specified FR documents as Translation files for S&R.
document.getElementById("app-search-replace-load-fr").addEventListener("click", async function(event) {
    if (this.getElementsByClassName("small-loader")[0].style.display == "") return;
    this.getElementsByClassName("small-loader")[0].style.display = "";
    document.getElementById("app-search-replace-error").style.display = "none";
    let [project, dataset, token, automation, secret] = __words__;
    if (!project || !dataset || !token || !automation || !secret ) return displayAuthError("Please provide valid Sanity API & Sanity Automations API credentials.");

    const cont_ids = document.getElementById("app-search-replace-ids").value.split(ID_SEPARATORS).map(item => item.trim()).filter(str => str !== "");
    const toggle_ids = document.getElementById("app-search-replace-toggle-ids").checked;
    if (toggle_ids && cont_ids.length == 0) return displaySearchReplaceError("Please provide at least one Sanity Content ID or untick the ID checkbox.");

    const toggle_modules = document.getElementById("app-search-replace-toggle-modules").checked;
    const toggle_exercises = document.getElementById("app-search-replace-toggle-exercises").checked;
    const toggle_clinical_tests = document.getElementById("app-search-replace-toggle-clinical-tests").checked;
    const toggle_masterclasses = document.getElementById("app-search-replace-toggle-masterclasses").checked;
    const toggle_webinars = document.getElementById("app-search-replace-toggle-webinars").checked;
    const toggle_clinical_practices = document.getElementById("app-search-replace-toggle-clinical-practices").checked;
    if (!toggle_ids && !toggle_modules && !toggle_exercises && !toggle_clinical_tests && !toggle_masterclasses && !toggle_webinars && !toggle_clinical_practices)
        return displaySearchReplaceError("Please provide at least one type of Sanity Content by ticking the checkboxes.");

    const contentTypes = [];
    if (toggle_modules) contentTypes.push("ebpModule");
    if (toggle_exercises) contentTypes.push("exercise");
    if (toggle_clinical_tests) contentTypes.push("clinicalTest");
    if (toggle_masterclasses) contentTypes.push("masterclass");
    if (toggle_webinars) contentTypes.push("webinar");
    if (toggle_clinical_practices) contentTypes.push("clinicalPractice");

    let urls = [];
    const query = `*[_type in ${JSON.stringify(contentTypes)} && language == "fr"]`;
    const url = `https://${project}.api.sanity.io/v1/data/query/${dataset}?query=${encodeURIComponent(query)}`;
    urls.push(url);

    if (toggle_ids) {
        chunkArray(cont_ids, ID_CHUNKSIZE).forEach(chunk => {
            const query = `*[_id in ${JSON.stringify(chunk)} && language == "fr"]`;
            const url = `https://${project}.api.sanity.io/v1/data/query/${dataset}?query=${encodeURIComponent(query)}`;
            urls.push(url);
        });
    }

    const request = { "method": "GET", "headers": { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }};
    await loadTranslationFilesForSearchReplace(cont_ids, urls, request);

    document.getElementById("app-search-replace-apply").style.display = "";

    this.getElementsByClassName("small-loader")[0].style.display = "none";
});

// Prevent newline in translation files.
document.addEventListener("keydown", function (event) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    let node = range.startContainer;

    // Traverse up to check if inside a contenteditable element with data-source
    while (node && node !== document) {
        if (
        node.nodeType === 1 && // ELEMENT_NODE
        node.hasAttribute("data-source") &&
        node.getAttribute("contenteditable") === "true"
        ) {
        if (event.key === "Enter") {
            highlightSRDifferences();
            event.preventDefault(); // Prevent <br> or breaking element
            return false;
        }
        }
        node = node.parentNode;
    }
});

// Prevent newline in translation files using copy/paste.
document.addEventListener("paste", function (event) {
    const target = event.target;

    if (
        target.nodeType === 1 &&
        target.hasAttribute("data-source") &&
        target.getAttribute("contenteditable") === "true"
    ) {
        event.preventDefault();

        const text = (event.clipboardData || window.clipboardData)
        .getData("text/plain")
        .replace(/[\r\n]+/g, " "); // Strip line breaks

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        range.deleteContents(); // Remove current selection, if any

        // Create a text node with the pasted text
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);

        // Move the caret to the end of the inserted text
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);

        highlightSRDifferences();
    }
});

// TEMP: Apply some changes to the document.
document.getElementById("app-search-replace-previous").addEventListener("click", function (event) {

    if (domContent === null) return displaySearchReplaceError("Could NOT find loaded document, try reloading the document.");

    const rteditor = document.querySelector('#app-search-replace .rteditor');
    domContentPending = true;

    // Clear document from data-diff elements.
    rteditor.innerHTML = stripDiffTags(rteditor.innerHTML);

    for (const child of rteditor.children) {
        for (const grandchild of child.children) {
            if (grandchild.nodeType === 1 && grandchild.hasAttribute("data-source")) {
                grandchild.innerHTML = replaceAllSubstrings(grandchild.innerHTML, "Iliotibial", "Ilio-Tibial");
                grandchild.innerHTML = replaceAllSubstrings(grandchild.innerHTML, "iliotibial", "ilio-tibial");
                grandchild.innerHTML = replaceAllSubstrings(grandchild.innerHTML, "movement", "motion");
                grandchild.innerHTML = replaceAllSubstrings(grandchild.innerHTML, "available", "accessible");
                grandchild.innerHTML = replaceAllSubstrings(grandchild.innerHTML, "an elastic band", "a resitance band");
                grandchild.innerHTML = replaceAllSubstrings(grandchild.innerHTML, "elastic band", "resitance band");
                grandchild.innerHTML = replaceAllSubstrings(grandchild.innerHTML, "with the", "<b>with the</b>");
                grandchild.innerHTML = replaceAllSubstrings(grandchild.innerHTML, "et al", "<b>et al</b>");
                grandchild.innerHTML = replaceAllSubstrings(grandchild.innerHTML, "Noble test", "Nobles test");
            }
        }
    }
});

// TEMP: Highlight changes on the document.
document.getElementById("app-search-replace-next").addEventListener("click", function (event) {
    highlightSRDifferences();
});

