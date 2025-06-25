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

// Split sub part into manageable and relevant paragraphs.
function splitSubPart(subpart) {
    let paragraphs = [];
    let paragraph = [];
    for (let chunk of subpart) {
        if (chunk["_type"] !== "block") {
            if (paragraph.length)
                paragraphs.push(JSON.parse(JSON.stringify(paragraph)));
            paragraphs.push(JSON.parse(JSON.stringify([chunk])));
            paragraph = [];
            continue;
        }
        paragraph.push(chunk);
    }
    if (paragraph.length)
        paragraphs.push(JSON.parse(JSON.stringify(paragraph)));
    return paragraphs;
}

// Rewrite a Sanity block.
async function AI_Rewrite_Simulation(block) {

    // Validate response data.
    await sleep(3000);
    const data = block;

    // Return result.
    return data;
}

// Apply custom prompt on a Sanity JSON/HTML block.
async function AI_Custom_Simulation(format, instructions, context, block) {

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

// Apply custom prompt on a Sanity JSON/HTML block.
async function AI_Custom(format, instructions, context, block) {

    // Sanity Automations API body.
    const body = {
        "function": "custom",
        "args": {
            "format": format,
            "instructions": instructions,
            "context": context,
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