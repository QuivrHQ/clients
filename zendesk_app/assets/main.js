
const client = ZAFClient.init();
client.invoke('resize', { width: '100%', height: '600px' });

const quivrApiKeyPromise = client.metadata().then(function(metadata) {
    return metadata.settings.quivr_api_key;
});

// Function Definition
//--------------------

function getInput(client) {
    return client.get('ticket.comment').then(function (data) {
        return data['ticket.comment'].text;
    });
}


function getHistoric(client) {
    return client.get('ticket.comments').then(function (data) {
        const comments = data['ticket.comments'].map(comment=>comment.value);
        return comments.join('\n\n');
    });
}

async function getNewChat(client) {
    const response = await fetch('https://api.quivr.app/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer 2a0c1a4534922227914a562ab30a166f',
            'accept': 'application/json'
        },
        body: JSON.stringify({
            name: 'Zendesk Chat',
        })
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.chat_id;
}

async function getQuivrResponse(prompt, chat_id) {
    const quivrApiKey = await quivrApiKeyPromise;
    const response = await fetch(`https://api.quivr.app/chat/${chat_id}/question/stream?brain_id=7890ba8a-d45c-fd1e-3d36-347c61264e15`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${quivrApiKey}`,
            'accept': 'application/json'
        },
        body: JSON.stringify({
            question: prompt,
            brain_id: '7890ba8a-d45c-fd1e-3d36-347c61264e15'
        })
    });
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let result = '';
    let done = false;

    while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        result += decoder.decode(value, { stream: true });
    }

    // Extract the final answer from the streamed response
    const matches = result.match(/data: (.+?)(?=data:|$)/g);
    const finalAnswer = matches.map(match => JSON.parse(match.replace('data: ', '')).assistant).join('');

    return finalAnswer;
}

async function reformulate(client, instruction) {
    console.log(instruction);
    const historic = await getHistoric(client);
    const input = await getInput(client);
    console.log(input);

    chat_id = await getNewChat(client);
    const clientName = await getRequesterName(client);
    const agentName = await getUserName(client);

    const prompt = `
    You are reformulation bot, you only reformulate what the agent wrote.
    Here is the tone instruction:\n${instruction}\n
    Stick to the agent content. Client name : ${clientName} \nAgent Name : ${agentName} Here is the chat history: \n\n
    ${historic}\n\nReformulate this agent draft answer \n: ${input} \n\n Respond only with the reformulation in the same language as the draft answer : `;
    return getQuivrResponse(prompt, chat_id);
}

function pasteInEditor(client, reformulatedText) {
    return client.set('ticket.comment.text', reformulatedText)
}

function getUserName(client) {
    return client.get('currentUser').then(function (data) {
        return data.currentUser.name;
    });
}

function getRequesterName(client) {
    return client.get('ticket.requester').then(function (data) {
        return data['ticket.requester'].name;
    });
}

//--------------------
document.addEventListener("DOMContentLoaded", function() {
    // Access the Objects
    const textareaObject = document.querySelector('#textarea-wrapper object');
    const responseBlockObject = document.querySelector('#response_block_wrapper object');
    const buttonObject = document.querySelector('#button-wrapper object');

    // Ensure the Objects are loaded before accessing their content
    textareaObject.addEventListener('load', function() {
        const textareaDoc = textareaObject.contentDocument || textareaObject.contentWindow.document;
        const instructionElement = textareaDoc.getElementById('instruction');

        buttonObject.addEventListener('load', function() {
            const buttonDoc = buttonObject.contentDocument || buttonObject.contentWindow.document;
            const submitButton = buttonDoc.getElementById('submit');
            const buttonTextWrapper = buttonDoc.getElementById('button-text-wrapper');
            const loader = buttonDoc.getElementById('button-loader');

            if (submitButton) {
                submitButton.addEventListener('click', async function() {
                    try {
                        // Show the loader
                        loader.style.display = "inline-block"; // Show the loader
                        buttonTextWrapper.style.display = "none";
                        const instructionValue = instructionElement.value;
                        // Example of using the instruction value in a function
                        const response = await reformulate(client, instructionValue);
                        const responseBlockDoc = responseBlockObject.contentDocument || responseBlockObject.contentWindow.document;
                        const responseWrapper = responseBlockDoc.getElementById('quivr_response');
                        responseWrapper.innerText = response;

                        buttonTextWrapper.textContent = "Regénérer";
                    } catch (error) {
                        console.error("Error reformulating text:", error);
                        const responseBlockDoc = responseBlockObject.contentDocument || responseBlockObject.contentWindow.document;
                        const responseWrapper = responseBlockDoc.getElementById('quivr_response');
                        responseWrapper.textContent = "An error occurred while reformulating the text.";
                    } finally {
                        loader.style.display = "none"; // Hide the loader
                        buttonTextWrapper.style.display = "inline"; // Show the button text again
                        submitButton.disabled = false;
                    }
                });
            }
        });
    });

    responseBlockObject.addEventListener('load', function() {
        const responseBlockDoc = responseBlockObject.contentDocument || responseBlockObject.contentWindow.document;
        const pasteButton = responseBlockDoc.getElementById('paste');

        if (pasteButton) {
            pasteButton.addEventListener('click', async function() {
                try {
                    const responseText = responseBlockDoc.getElementById('quivr_response').innerHTML;
                    console.log("Pasting reformulated text in editor...");
                    await pasteInEditor(client, responseText);
                } catch (error) {
                    console.error("Error pasting text in editor:", error);
                }
            });
        }
    });
});
