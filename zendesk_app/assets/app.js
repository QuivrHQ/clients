const client = ZAFClient.init();
client.invoke("resize", { width: "100%", height: "600px" });
let responseTextHistory = [];
let responseText = null; 
let chat_id = null;

const quivrApiKeyPromise = client.metadata().then(function (metadata) {
  return metadata.settings.quivr_api_key;
});

const defaultPromptPromise = client.metadata().then(function (metadata) {
  return metadata.settings.default_prompt ?? "You are an Agent for customer service, your goal is to satisfy the client. Keep a neutral and informative tone.";
});

function getInput(client) {
  return client.get("ticket.comment").then(function (data) {
    return data["ticket.comment"].text;
  });
}

function getHistoric(client) {
  return client.get("ticket.comments").then(function (data) {
    const comments = data["ticket.comments"].map((comment) => comment.value);
    return comments;
  });
}

async function getNewChat() {
  apiKey = await quivrApiKeyPromise;
  const options = {
    url: "https://api-preview.quivr.app/chat",
    type: "POST",
    contentType: "application/json",
    data: JSON.stringify({ name: "Zendesk Chat" }),
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    cors: false
  };

  try {
    const response = await client.request(options);
    return response;
  } catch (error) {
    console.error("Error creating chat:", error);
    throw error;
  }
}


async function getQuivrResponse(prompt, chat_id, brain_id = "2c0a679c-4bb2-64c9-bb52-480fce08e134") {
  apiKey = await quivrApiKeyPromise;
    const response = await fetch(
    `https://api-preview.quivr.app/chat/${chat_id}/question/stream?brain_id=${brain_id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        question: prompt,
        brain_id: brain_id,
        streaming: true,
      }),
    }
  );

  if (!response.ok || !response.body) {
    throw new Error("Network response not ok or streaming not supported.");
  }

  if (responseText) {
    responseText.contentEditable = "false";
    responseText.textContent = "";
  }
  let quivrResponse = "";
  const { assistant } = await processStream(response.body, (chunk) => {
    if (responseText) {
      responseText.textContent += chunk;
      quivrResponse += chunk;
    }
  });

  if (responseText) {
    responseText.innerHTML = DOMPurify.sanitize(marked.parse(quivrResponse));
    responseTextHistory.push(responseText.innerHTML);
    if (responseTextHistory.length > 500) {
      responseTextHistory.shift();
    }
    responseText.contentEditable = "true";
  }

  return assistant;
}

async function processStream(
  body,
  onStreamMessage
) {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let accumulatedMessage = "";
  let lastResponse = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    ({ buffer, accumulatedMessage, lastResponse } = processBuffer(
      buffer,
      accumulatedMessage,
      lastResponse,
      onStreamMessage
    ));
  }

  reader.releaseLock();
  return (
    lastResponse ?? {
      assistant: accumulatedMessage,
    }
  );
}

function processBuffer(
  buffer,
  accumulatedMessage,
  lastResponse,
  onStreamMessage
) {
  const dataPrefix = "data: ";

  while (true) {
    const startIdx = buffer.indexOf(dataPrefix);
    if (startIdx === -1) {
      break;
    }

    const nextIdx = buffer.indexOf(dataPrefix, startIdx + dataPrefix.length);

    let jsonString;
    if (nextIdx === -1) {
      jsonString = buffer.slice(startIdx + dataPrefix.length);
      buffer = buffer.slice(0, startIdx);
    } else {
      jsonString = buffer.slice(startIdx + dataPrefix.length, nextIdx);
      buffer = buffer.slice(nextIdx);
    }

    try {
      const parsed = JSON.parse(jsonString.trim());
      const newContent = parsed.assistant || "";

      accumulatedMessage = newContent;
      onStreamMessage(newContent);

      lastResponse = {
        assistant: accumulatedMessage,
      };

    } catch (error) {
      // console.warn("[Streaming] Failed to parse message, possibly partial chunk:", {
      //   jsonString,
      //   error,
      // });
      buffer = dataPrefix + jsonString;
      break;
    }
  }

  return { buffer, accumulatedMessage, lastResponse };
}

async function correct(draft) {
  await getQuivrResponse(
    "Corrige les fautes d'orthographes de ce draft:\n" + draft + "\n Reponds uniquement avec le texte entier corrigé. Si il n'y a pas de fautes, renvoie le texte original.",
    chat_id
  );
}
async function generate_response(historic, input) {
  const prompt = historic[historic.length - 1]
  const brain_id = "a56c031d-0dc1-4b31-9ac9-0712ecb42983"
  return getQuivrResponse(prompt, chat_id, brain_id);
}
async function reformulate(historic, input, instruction) {

  const prompt = `
You are a sophisticated reformulation bot designed to refine and improve agent responses in a customer service context. Your task is to reformulate the provided draft answer according to specific guidelines while maintaining the essence of the original content.

For context, here is the chat history:

<historic>
${historic}
</historic>

Now, let's establish the tone for your reformulation:

<instruction>
${instruction}
</instruction>

This tone instruction is of utmost importance and should be applied throughout your reformulation process.

Your goal is to reformulate this answer while adhering to the following guidelines:

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
   - Prefer "We noticed that ..." instead of "We noted that ...". 
   7. Concluding phrases:
  - If a concluding phrase is required, keep it simple and inspire yourself from these exemples :
   * Nous espérons que cette information vous sera utile.
   * Nous restons à votre disposition pour toute question supplémentaire.
   * Nous vous remercions de votre compréhension et restons à votre disposition.
   * Nous vous souhaitons une excellente continuation dans vos démarches.

  Here is the agent's draft answer that you need to reformulate:

<draft answer>
${input}
</draft answer>
Stay close to the original draft, don't make it too long or too short.
Respond directly with the message to send to the customer, ready to be sent:
  `;

  return getQuivrResponse(prompt, chat_id);
}

async function reformulate_editor(draft, instruction) {
  const prompt = `

Your goal is to reformulate the Agent draft answer while adhering to the following guidelines:

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
  
  Here is the agent's draft answer that you need to reformulate:

  <draft answer>
  ${draft}
  </draft answer>

  Here are the instructions you need to follow:
  <instruction>
${instruction}
</instruction>
  Stay close to the original draft, don't make it too long or too short.
  Respond directly with the message to send to the customer, ready to be sent:

  `;
  return getQuivrResponse(prompt, chat_id);
}

function pasteInEditor(client, reformulatedText) {
  return client.set({ "ticket.comment.text": reformulatedText });
}

function getUserName(client) {
  return client.get("currentUser").then(function (data) {
    return data.currentUser.name;
  });
}

function getRequesterName(client) {
  return client.get("ticket.requester").then(function (data) {
    return data["ticket.requester"].name;
  });
}

document.addEventListener("DOMContentLoaded", async function () {
  let clicked = false;

  try {
    chat_id = await getNewChat().then((response) => response.chat_id);

  } catch (error) {
    console.error("Error getting new chat ID:", error);
  }

  function adjustTextareaHeight(textarea) {
    textarea.style.height = "26px";
    textarea.style.height = textarea.scrollHeight + "px";
  }

  function loadComponent(placeholderId, filePath, callback) {
    const placeholder = document.getElementById(placeholderId);
    fetch(filePath)
      .then((response) => response.text())
      .then((data) => {
        placeholder.innerHTML = data;
        if (callback) callback();
      })
      .catch((error) =>
        console.error(`Erreur lors du chargement de ${filePath}:`, error)
      );
  }

  loadComponent(
    "response-block-placeholder",
    "components/response_block/response_block.html"
  );

  loadComponent(
    "textarea-placeholder",
    "components/textarea/textarea.html",
    () => {
      const textarea = document.getElementById("instruction");
      if (textarea) {
        textarea.addEventListener("change", function () {
          adjustTextareaHeight(this);
        });
        textarea.addEventListener("input", function () {
          adjustTextareaHeight(this);
        });

        setTimeout(() => {
          defaultPromptPromise.then((default_prompt) => {
            textarea.value = default_prompt;
            const event = new Event("change");
            textarea.dispatchEvent(event);
          });
          
        }, 1000);
      } else {
        console.warn("Textarea with ID 'instruction' not found.");
      }
    }
  );

  setTimeout(() => {
    loadComponent("button-placeholder", "components/button/button.html", () => {
      const button = document.getElementById("submit");
      const pasteButton = document.getElementById("paste");
      const buttonTextWrapper = document.getElementById("button-icon");
      const buttonText = document.getElementById("button-text");
      const responseWrapper = document.getElementById("response_block_wrapper");
      const loader = document.getElementById("button-loader");
      const button_icon = document.getElementById("button-icon");
      responseText = document.getElementById("quivr_response"); 

      if (responseText) {
        let debounceTimer;
        responseText.addEventListener('input', function() {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            responseTextHistory.push(responseText.innerHTML);
            if (responseTextHistory.length > 500) {
              responseTextHistory.shift(); 
            }
          }, 500); 
        });
      }


      const mainActionButton = document.getElementById("main-action-button");
      const dropdownTrigger = document.getElementById("dropdown-trigger");
      const dropdownMenu = document.getElementById("dropdown-menu");
      const buttonWrapper = document.getElementById("button-wrapper");
      
      let currentOption = "generer"; // Default option
      
      if (mainActionButton && dropdownTrigger && dropdownMenu) {
        // Toggle dropdown visibility
        dropdownTrigger.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          dropdownTrigger.classList.toggle("open");
          dropdownMenu.classList.toggle("open");
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", (event) => {
          if (!dropdownMenu.contains(event.target) && !dropdownTrigger.contains(event.target)) {
            dropdownMenu.classList.remove("open");
            dropdownTrigger.classList.remove("open");
          }
        });

        // Handle dropdown item selection
        dropdownMenu.addEventListener("click", (event) => {
          const item = event.target.closest(".dropdown_item");
          if (item) {
            currentOption = item.dataset.option;
            buttonText.textContent = item.textContent;
            dropdownMenu.classList.remove("open");
            dropdownTrigger.classList.remove("open");
          }
        });

        const handleAction = async () => {
          try {
            const instruction = document.getElementById("instruction").value;

            // Show loading state
            loader.style.display = "block";
            button_icon.style.display = "none";
            buttonWrapper.style.pointerEvents = "none";
            dropdownMenu.style.pointerEvents = "none";
            dropdownMenu.classList.remove("open");
            dropdownTrigger.classList.remove("open");

            if (!clicked) {
              // First step
              if (currentOption === "reformuler") {
                const historic = await getHistoric(client);
                const input = await getInput(client);
                responseWrapper.style.display = "block";

                await reformulate(historic.join("\n\n"), input, instruction);
              } else if (currentOption === "corriger") {
                const input = await getInput(client);
                correct(input);
              } else if (currentOption === "generer") {
                responseWrapper.style.display = "block";
                const historic = await getHistoric(client);
                console.log(historic)
                const input = await getInput(client);
                await generate_response(historic, input);
              }
              
              // Update dropdown items and button text for second step
              dropdownMenu.innerHTML = `
                <button class="dropdown_item" data-option="regenerer" role="menuitem">
                  <span class="dropdown_item_icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M13.5 7H9.5L8 4L6.5 7H2.5L6 9L4.5 13L8 10L11.5 13L10 9L13.5 7Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                  <span class="dropdown_item_text">Regénérer</span>
                </button>
                <button class="dropdown_item" data-option="corriger" role="menuitem">
                  <span class="dropdown_item_icon">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M11.5 4.5L14.5 7.5M1.5 14.5H4.5L13.5 5.5C14.0304 4.96956 14.0304 4.03044 13.5 3.5L12.5 2.5C11.9696 1.96956 11.0304 1.96956 10.5 2.5L1.5 11.5V14.5Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </span>
                  <span class="dropdown_item_text">Corriger</span>
                </button>
              `;
              currentOption = "regenerer";
              buttonText.textContent = "Regénérer";
              
              // Show response and paste button
              if (responseWrapper) {
                responseWrapper.style.display = "block";
                const pasteButtonWrapper = document.getElementById("paste_button_wrapper");
                if (pasteButtonWrapper) {
                  pasteButtonWrapper.style.display = "block";
                }
              }
              clicked = true;
            } else {
              // Second step
              if (currentOption === "regenerer") {
                await reformulate_editor(responseText.innerHTML, instruction);
              } else if (currentOption === "corriger") {
                const currentResponse = responseText.innerText;
                correct(currentResponse);
              } else if (currentOption === "generer") {
                const historic = await getHistoric(client);
                const input = await getInput(client);
                await generate_response(historic, input);
              }
            }

            // Update response history
            if (responseText) {
              responseTextHistory.push(responseText.innerHTML);
              if (responseTextHistory.length > 500) {
                responseTextHistory.shift();
              }
            }
          } catch (error) {
            console.error("Error processing text:", error);
            if (responseWrapper) {
              responseWrapper.textContent =
                "An error occurred while processing the text.";
            }
          } finally {
            // Reset loading state
            loader.style.display = "none";
            button_icon.style.display = "block";
            buttonWrapper.style.pointerEvents = "auto";
            dropdownMenu.style.pointerEvents = "auto";
          }
        };

        // Main button click handler
        mainActionButton.addEventListener("click", (event) => {
          // Only trigger action if clicking the main button area
          if (event.target.closest('.button_content') && !dropdownTrigger.contains(event.target)) {
            handleAction();
          }
        });
      } else {
        console.warn("Dropdown or button wrapper not found.");
      }

      if (pasteButton) {
        pasteButton.addEventListener("click", async () => {
          try {
            let reformulatedText = responseText ? responseText.innerHTML : "";
            reformulatedText = reformulatedText.replace(/<\/p>\s*<p>/g, "</p><br><p>");
            await pasteInEditor(client, reformulatedText);
          } catch (error) {
            console.error("Error pasting text in editor:", error);
          }
        });
      } else {
        console.warn("Paste button with ID 'paste' not found.");
      }

      document.addEventListener("keydown", function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key === "z") {
          event.preventDefault();

          if (responseTextHistory.length > 1 && responseText) {
            const previousResponse = responseTextHistory.pop();
            responseText.innerHTML = previousResponse;
          } else {
            console.warn("No more history to undo or responseText is not available.");
          }
        }
      });
    });
  }, 1000);
});
