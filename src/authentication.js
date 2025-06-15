// Display authentication error to user.
function displayAuthError(message) {
    document.getElementById("app-document-download").getElementsByClassName("small-loader")[0].style.display = "none";
    document.getElementById("app-document-upload").getElementsByClassName("small-loader")[0].style.display = "none";
    document.getElementById("download-error").style.display = "none";
    document.getElementById("upload-error").style.display = "none";
    document.getElementById("loader").style.display = "none";
    document.getElementById("auth-page").style.display = "";
    let errorMessage = document.getElementById("auth-error");
    errorMessage.textContent = message;
    errorMessage.style.display = "";
    return null;
}

// Test the validity of a given Sanity API Key.
async function testAPIToken(project, dataset, token, automation, secret) {
    const url = `https://${project}.api.sanity.io/v1/data/query/${dataset}?query=*[false]`;
    const request = { "method": "GET", "headers": { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }};
    if (!url || !request) return displayAuthError("Please provide valid Sanity API credentials.");

    try {
        const response = await fetch(url, request);
        if (!response.ok) return displayAuthError(`Please provide valid Sanity API credentials (error: ${response.status}).`);

    } catch (error) {
        return displayAuthError("Please provide valid Sanity API credentials.");
    }

    __words__ = [project, dataset, token, automation, secret];

    document.getElementById("auth-project").value = "";
    document.getElementById("auth-token").value = "";
    
    document.getElementById("loader").style.display = "none";
    document.getElementById("app-mainpage").style.display = "";
}

// Set authentication form callback.
document.getElementById("auth-form").addEventListener("submit", function(event) {
    event.preventDefault();
    document.getElementById("auth-page").style.display = "none";
    document.getElementById("loader").style.display = "";

    let project = document.getElementById("auth-project").value.split("&").map(item => item.trim());
    if (project.length != 3) return displayAuthError("Please provide a valid Sanity Project ID & Dataset & Sanity Automation Endpoint.");

    let credentials = document.getElementById("auth-token").value.split("&").map(item => item.trim());
    if (credentials.length != 2) return displayAuthError("Please provide a valid Sanity API Key & Sanity Automations API Key.");

    [token, secret] = credentials;
    if (!token.length) return displayAuthError("Please provide a valid Sanity API Key.");
    if (!secret.length) return displayAuthError("Please provide a valid Sanity Automations API Key.");

    [project, dataset, automation] = project;
    if (!project.length) return displayAuthError("Please provide a valid Sanity Project ID.");
    if (!dataset.length) return displayAuthError("Please provide a valid Sanity Dataset.");
    if (!automation.length) return displayAuthError("Please provide a valid Sanity Automation Endpoint.");

    testAPIToken(project, dataset, token, automation, secret);
});

// Display authentication form to user.
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("loader").style.display = "none";
    document.getElementById("auth-page").style.display = "";
});
