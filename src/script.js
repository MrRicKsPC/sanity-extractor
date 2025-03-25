function downloadFile(fData, fName, fType) {
    const blob = new Blob([fData], { "type": fType });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.download = fName.trim();
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
}

function formatSanityDLRequest() {
    let res = [null, null];
    let project = document.getElementById("project").value.split("&").map(item => item.trim());
    if (project.length != 2) return res; // TODO: Error UI feedback.

    [project, dataset] = project;
    let page = document.getElementById("page").value.trim();
    if (!project.length) return res;     // TODO: Error UI feedback.
    if (!dataset.length) return res;     // TODO: Error UI feedback.
    if (!page.length) return res;        // TODO: Error UI feedback.

    res[0] = `https://${project}.api.sanity.io/v1/data/query/${dataset}?query=*[_id=="${page}"]`;
    res[1] = { "method": "GET", "headers": { "Content-Type": "application/json" }};

    let token = document.getElementById("token").value.trim();
    if (!token.length) return res;       // TODO: Error UI feedback.

    res[1]["headers"]["Authorization"] = `Bearer ${token}`;
    
    return res;
}

function formatSanityULRequest(hContent) {
    let res = [null, null];
    let project = document.getElementById("project").value.split("&").map(item => item.trim());
    if (project.length != 2) return res; // TODO: Error UI feedback.

    [project, dataset] = project;
    let page = document.getElementById("page").value.trim();
    let token = document.getElementById("token").value.trim();
    if (!project.length) return res;     // TODO: Error UI feedback.
    if (!dataset.length) return res;     // TODO: Error UI feedback.
    if (!page.length) return res;        // TODO: Error UI feedback.
    if (!token.length) return res;       // TODO: Error UI feedback.

    const patches = convertToJSON(hContent);

    res[0] = `https://${project}.api.sanity.io/v1/data/mutate/${dataset}`;
    res[1] = { "method": "POST", "headers": { "Content-Type": "application/json", "Authorization": `Bearer ${token}`}};
    res[1]["body"] = JSON.stringify({ "mutations": [
        { "patch": { "id": page, "set": patches}}
    ]})
    
    return res;
}

function formatSanityDLResponse(data) {
    try {
        const res = data["result"][0];
        const title = res["title"] ?? "Untitled";
        return [title + ".html", "text/html", convertToHTML(res)];
    } catch (error) {
        throw new Error("PARSE error! Please provide valid Sanity credentials.");
    }
}

function formatSanityULResponse(data) {
    try {
        const res = data["results"][0]["operation"] == "update";
        return res;
    } catch (error) {
        return false;
    }
}

async function downloadTranslationFile() {
    try {
        let [url, request] = formatSanityDLRequest();
        if (!url || !request) return;

        const response = await fetch(url, request);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        const [fName, fType, fData] = formatSanityDLResponse(data);
        if (!fData) throw new Error("PARSE error! Please provide valid Sanity credentials.");

        downloadFile(fData, fName, fType);
    } catch (error) {
        console.error("Unable to download translation file.\n", error); // TODO: Error UI feedback.
    }
}

async function uploadTranslationFile() {
    try {
        const fileInput = document.getElementById("translationFile");
        const fileContent = fileInput.files[0];
        if (!fileContent) return;        // TODO: Error UI feedback.
        const reader = new FileReader();
        reader.onload = function(e) {
            const hParser = new DOMParser();
            const hContent = hParser.parseFromString(e.target.result, 'text/html');

            let [url, request] = formatSanityULRequest(hContent);
            if (!url || !request) return;

            fetch(url, request)
            .then(response => response.json())
            .then(data => {
                const pRes = formatSanityULResponse(data);
                if (!pRes) console.error("PATCH error! Please provide valid Sanity credentials.");  // TODO: Error UI feedback.
            })
            .catch(error => {
                console.error("Unable to upload translation file.\nHTTP error! Status: ", error);   // TODO: Error UI feedback.
            });
        };
        reader.readAsText(fileContent);
    } catch (error) {
        console.error("Unable to upload translation file.\n", error); // TODO: Error UI feedback.
    }
}
