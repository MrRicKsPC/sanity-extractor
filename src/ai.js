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

    console.log(body);

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

async function testAI() {
    console.log(await AI_Custom(
        format = "html",
        instructions = [
            "Mets les verbe en gras.",
        ],
        context = [
            "Il s'agit d'un bout de module de kinésithérapie",
        ],
        block = "<p data-source=\".description\" data-type=\"pt\" contenteditable=\"true\">Attach an elastic band at about shoulder height in front of you. Stand facing the band's anchor point and get into a lunge position, with the foot of the leg opposite to the working arm in front of you. Hold the end of the band with the hand of the arm you're working and extend your arm towards the anchor point. Then, perform a lunge by bending the front leg, and stand back up by straightening the knee. Simultaneously, execute an archery pulling motion by drawing the elbow back and squeezing the shoulder blade towards the spine, while standing up completely. Keep the other arm aligned with the band and pointing towards the anchor. At the end of the movement, bring the back knee forward and lift it in front of you, as if doing a knee raise. Gently return to the starting position by lunging again, then repeat the movement. Make sure to keep the elbow high and aligned with the other arm throughout the exercise.</p>",
    ));
}