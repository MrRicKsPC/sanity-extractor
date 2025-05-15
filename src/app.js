const ID_SEPARATORS = /[\(\[\{\|\)\]\}|,:;\"`'\s]/;
const ID_CHUNKSIZE = 300;
let MULTIFILE_LIMIT = 10;
let __words__ = [null, null, null];

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

// Display draft fecth error to user.
function displayDraftFetchError(message) {
    document.getElementById("app-en-result-fetch").getElementsByClassName("small-loader")[0].style.display = "none";
    document.getElementById("app-fr-result-fetch").getElementsByClassName("small-loader")[0].style.display = "none";
    let errorMessage = document.getElementById("app-fetch-error");
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
    let [project, dataset, token] = __words__;

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
    const [project, dataset, token] = __words__;
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

// Set tabs to only-one active.
const appTabs = document.getElementById("app-tabs").querySelectorAll(".app-tab");
appTabs.forEach(tab => {
    tab.addEventListener("click", function() {
        appTabs.forEach(t => t.classList.remove("active"));
        this.classList.add("active");
        document.getElementById("app-page").style.display = "none";
        document.getElementById("app-exercises").style.display = "none";
        if (this.id == "tab-translation-files") {
            document.getElementById("app-page").style.display = "";
            document.getElementById("download-error").style.display = "none";
            document.getElementById("upload-error").style.display = "none";
        } else if (this.id == "tab-exercise-revision") {
            document.getElementById("app-exercises").style.display = "";
            document.getElementById("app-fetch-error").style.display = "none";
        }
    });
});

// Set initial active tab.
const initialActiveTab = document.querySelector(".app-tab.active");
if (!initialActiveTab) {
    appTabs[0].classList.add("active");
}

// Toggle manual ID input.
document.getElementById("app-force-id").addEventListener("click", function(event) {
    document.getElementById("upload-error").style.display = "none";
    if (event.target.checked) {
        document.getElementById("app-document-id").style.display = "";
    } else {
        document.getElementById("app-document-id").style.display = "none";
    }
});

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

// Download Translation file.
document.getElementById("app-document-download").addEventListener("click", function(event) {
    if (this.getElementsByClassName("small-loader")[0].style.display == "") return;
    this.getElementsByClassName("small-loader")[0].style.display = "";
    document.getElementById("download-error").style.display = "none";
    let [project, dataset, token] = __words__;
    if (!project || !dataset || !token ) return displayAuthError("Please provide valid Sanity API credentials.");

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
    let [project, dataset, token] = __words__;
    if (!project || !dataset || !token ) return displayAuthError("Please provide valid Sanity API credentials.");

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
    let [project, dataset, token] = __words__;
    if (!project || !dataset || !token ) return displayAuthError("Please provide valid Sanity API credentials.");

    await fetchDrafts("en");

    this.getElementsByClassName("small-loader")[0].style.display = "none";
});

// Fetch draft FR exercises.
document.getElementById("app-fr-result-fetch").addEventListener("click", async function(event) {
    if (document.getElementById("app-en-result-fetch").getElementsByClassName("small-loader")[0].style.display == "") return;
    if (document.getElementById("app-fr-result-fetch").getElementsByClassName("small-loader")[0].style.display == "") return;
    this.getElementsByClassName("small-loader")[0].style.display = "";
    document.getElementById("app-fetch-error").style.display = "none";
    let [project, dataset, token] = __words__;
    if (!project || !dataset || !token ) return displayAuthError("Please provide valid Sanity API credentials.");

    await fetchDrafts("fr");

    this.getElementsByClassName("small-loader")[0].style.display = "none";
});
