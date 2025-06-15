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

// Format prompt around subpart.
function formatPrompt(previous = null, current, next = null) {
    let prompt = "";

    // Role.
    prompt += `
        Tu es un kinésithérapeute qui travaille pour l'entreprise Fullphysio.
    `;

    // Goal.
    prompt += `
        Retravailles ces textes pour les rendre plus attrayants afin qu'ils incitent à la lecture, sans que l'on veuille arrêter au bout de la troisième phrase à cause de leur longueur.
        N'utilise pas d’émoticônes ou d'émojis.
        Tu dois bien garder les sources car c’est cela qui crédibilise le texte.
        Ne retourne que le document en version JSON, dans un block de code, et RIEN D'AUTRE (PAS même une phrase de confirmation).
    `;
    
    // Return format.
    prompt += `
        Retourne la partie retravaillée en version JSON et en respectant bien le format du CMS (Sanity), dans un block de code, et RIEN D'AUTRE (PAS même une phrase de confirmation).
    `;

    // Warnings.
    prompt += `
        N'utilise pas d’émoticônes ou d'émojis.
        Tu dois bien garder les sources car c’est cela qui crédibilise le texte.
        Ne retourne QUE le document en version JSON, dans un block de code, et RIEN D'AUTRE (PAS même une phrase de confirmation).
        Ne retourne PAS ta réponse en "pretty JSON", mais plutôt en "compact JSON".
        Ne retourne PAS la partie précédente et la partie suivante, elle ne sont présentes qu'à titre d'information.
    `;

    // Context.
    prompt += `
        -----
        Pour le contexte:
        Je développe des modules de formation pour kinésithérapeutes sous forme de synthèse écrite basée sur la littérature scientifique, couvrant des concepts, pathologies ou techniques en kinésithérapie.
        Ces modules visent à aider les kinésithérapeutes à expérimenter, actualiser leurs connaissances et appliquer des pratiques cliniques fondées sur des preuves scientifiques.
        Malheureusement, je trouve que mes textes sont souvent très longs et un peu barbants, ce qui ne donne pas envie de les lire.
        Parfois, les transcriptions des masterclass, qui sont des vidéos orales, incitent davantage à suivre parce qu'elles utilisent un langage un peu plus oral et familier, tout en restant scientifique et proche de nous.
        J'aimerais reproduire ce style avec les textes que j'ai déjà écrits, qui sont un peu barbants.
    `;

    if (previous) {
        prompt += `
            Voici la partie précédente UNIQUEMENT à titre d'information:
            \`\`\`JSON${JSON.stringify(previous)}\`\`\`
        `;
    }

    prompt += `
        Voici la partie que tu dois retravailler:
        \`\`\`JSON${JSON.stringify(current)}\`\`\`
    `;

    if (previous) {
        prompt += `
            Voici la partie suivante UNIQUEMENT à titre d'information:
            \`\`\`JSON${JSON.stringify(next)}\`\`\`
        `;
    }

    return prompt;
}

// Rewrite a Sanity block.
async function AI_Rewrite_Simulation(block) {

    // Validate response data.
    await sleep(150);
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