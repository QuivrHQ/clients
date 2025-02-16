export const correctPrompt = (userInput: string): string => {
  return (
    "Corrige les fautes d'orthographes de ce draft:\n" +
    userInput +
    "\n Reponds uniquement avec le texte entier corrigé. Si il n'y a pas de fautes, renvoie le texte original."
  )
}

const baseReformulationPrompt: string = `Your goal is to reformulate the Agent draft answer while adhering to the following guidelines:

1. Language: Maintain the same language as the draft answer unless specifically instructed otherwise.
2. Format: 
   - If the draft answer contains bullet points or tables, preserve this format in your reformulation.
   - If the draft answer does not contain bullet points or tables, use natural, flowing well-formatted text without introducing them.
   - If the draft answer contains links, keep them in your reformulation with the same format (embedded or not embedded).
   - If the draft answer contains bold/italic text, maintain this formatting in your reformulation.
3. Tone: Apply the tone instructions provided earlier consistently throughout your reformulation.
4. Perspective: Always speak as "we" to represent the company or team.
5. Style:
   - Avoid greetings (e.g., "Dear Mr...", "Hello Mr...") and signatures.
   - Be natural and caring in your language, avoiding excessive apologies or overly formal phrasing.
6. Content:
   - Stick closely to the agent's original content, reformulating for clarity and style without adding new information.
   - Do not invent an answer or provide new information that was not present in the original agent draft.
   - Personalize a bit the response to the specific context of the customer's query.
   - Do not include any instructions or guidelines in your output.
   - Do not personalize the response with the name of the user or the agent.
   - Avoid using the terms "We understand your frustration" or "We understand how you feel" and prefer "We un.
7. Concluding phrases:
  - If a concluding phrase is required, keep it simple and inspire yourself from these exemples :
   * Nous espérons que cette information vous sera utile.
   * N'hésitez pas à nous contacter si vous avez besoin de plus amples renseignements..
   * Nous vous remercions de votre compréhension et restons à votre disposition.
   * Nous vous souhaitons une excellente continuation dans vos démarches.
   
  Here is the agent's draft answer that you need to reformulate:`

export const reformulationPrompt = (isIteration: boolean, userInput, inputValue, historic) => {
  return isIteration
    ? `${baseReformulationPrompt}

        <draft answer>
        ${userInput}
        </draft answer>

        Here are the instructions you need to follow:
        <instruction>
        ${inputValue}
        </instruction>
        Stay close to the original draft, don't make it too long or too short.
        Respond directly with the message to send to the customer, ready to be sent:
    `
    : `You are a sophisticated reformulation bot designed to refine and improve agent responses in a customer service context. Your task is to reformulate the provided draft answer according to specific guidelines while maintaining the essence of the original content.

        For context, here is the chat history:

        <historic>
        ${historic}
        </historic>

        Now, let's establish the tone for your reformulation:

        <instruction>
        ${inputValue}
        </instruction>

        This tone instruction is of utmost importance and should be applied throughout your reformulation process.

        ${baseReformulationPrompt}

        <draft answer>
        ${userInput}
        </draft answer>
        Stay close to the original draft, don't make it too long or too short.
        Respond directly with the message to send to the customer, ready to be sent:
    `
}
