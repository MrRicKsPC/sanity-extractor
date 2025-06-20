// Sleep function.
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Count how many tokens are in a string.
function countTokens(content) {
    const { encode, decode } = GPTTokenizer_cl100k_base;
    const tokens = encode(JSON.stringify(content));
    return tokens.length;
}

// Rewrite a Sanity block.
async function AI_Rewrite_Simulation(block) {

    // Validate response data.
    await sleep(3000);
    const data = block;

    // Return result.
    return data;
}

// Echo a Sanity block.
async function AI_Echo(block) {

    // Sanity Automations API body.
    const body = {
        "function": "echo",
        "args": {
            "block": block,
        },
    }

    // Sanity Automations API request.
    const [project, dataset, token, automation, secret] = __words__;
    const url = `https://${automation}.europe-west3.run.app`;
    const request = {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${secret}`
        },
        "body": JSON.stringify(body)
    };

    // Sanity Automations API response.
    const response = await fetch(url, request);
    if (!response.ok) {
        console.error(`Unable to connect to Sanity Automation API (error: ${response.status}).`);
        return null;
    }

    // Validate response data.
    const data = await response.json();

    // Return result.
    return data;
}

// Rewrite a Sanity block.
async function AI_Rewrite(block) {

    // Sanity Automations API body.
    const body = {
        "function": "rewrite",
        "args": {
            "block": block,
        },
    }

    // Sanity Automations API request.
    const [project, dataset, token, automation, secret] = __words__;
    const url = `https://${automation}.europe-west3.run.app`;
    const request = {
        "method": "POST",
        "headers": {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${secret}`
        },
        "body": JSON.stringify(body)
    };

    // Sanity Automations API response.
    const response = await fetch(url, request);
    if (!response.ok) {
        console.error(`Unable to connect to Sanity Automation API (error: ${response.status}).`);
        return null;
    }

    // Validate response data.
    const data = await response.json();

    // Return result.
    return data;
}