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