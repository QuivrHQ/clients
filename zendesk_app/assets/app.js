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
    return comments.join("\n\n");
  });
}

async function getNewChat() {
  const quivrApiKey = await quivrApiKeyPromise;
  const response = await fetch("https://api-gobocom.quivr.app/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${quivrApiKey}`,
      accept: "application/json",
    },
    body: JSON.stringify({
      name: "Zendesk Chat",
    }),
  });

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const data = await response.json();
  return data.chat_id;
}

async function getQuivrResponse(prompt, chat_id) {
  const quivrApiKey = await quivrApiKeyPromise;
  const response = await fetch(
    `https://api-gobocom.quivr.app/chat/${chat_id}/question/stream?brain_id=7890ba8a-d45c-fd1e-3d36-347c61264e15`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${quivrApiKey}`,
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        question: prompt,
        brain_id: "7890ba8a-d45c-fd1e-3d36-347c61264e15",
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
      console.warn("[Streaming] Failed to parse message, possibly partial chunk:", {
        jsonString,
        error,
      });
      buffer = dataPrefix + jsonString;
      break;
    }
  }

  return { buffer, accumulatedMessage, lastResponse };
}

async function reformulate(client, instruction) {
  const historic = await getHistoric(client);
  const input = await getInput(client);

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
7. Concluding phrases:
  - If a concluding phrase is required, keep it simple and inspire yourself from these exemples :
   * Nous espérons que vous trouverez rapidement le logement que vous souhaitez.
   * Nous continuons à transmettre votre candidature aux propriétaires de biens correspondant à vos critères et espérons que vous recevrez rapidement des propositions qui vous conviendront.
   * Nous restons à votre disposition et nous espérons que vous recevrez rapidement des offres qui vous satisferont.
   * Nous vous remercions de votre compréhension et restons à votre disposition.

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
Edit this draft answer: ${draft}

According to these instructions: ${instruction}

Present your reformulated answer without any additional commentary or explanations. The reformulated text should appear as if it's a direct response to the customer in Markdown format.
Respond directly with the message to send to the customer, ready to be sent.
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
    chat_id = await getNewChat();
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


      if (button) {
        button.addEventListener("click", async () => {
          try {
            loader.style.display = "block";
            buttonTextWrapper.style.display = "none";
            button.disabled = true;

            const instructionElement = document.getElementById("instruction");
            const instruction = instructionElement ? instructionElement.value : "";

            if (responseText) {
              responseTextHistory.push(responseText.innerHTML);
              if (responseTextHistory.length > 500) {
                responseTextHistory.shift();
              }

            }

            if (clicked) {
              await reformulate_editor(responseText.innerHTML, instruction);
            } else {
              if (responseWrapper) {
                responseWrapper.style.display = "block";
              }
              await reformulate(client, instruction);
            }

            if (!clicked) {
              buttonText.textContent = "Réécrire";
              button_icon.src = "./ressources/reecrire.svg";
              clicked = true;
            }
          } catch (error) {
            console.error("Error reformulating text:", error);
            if (responseWrapper) {
              responseWrapper.textContent =
                "An error occurred while reformulating the text.";
            }
          } finally {
            button.disabled = false;
            loader.style.display = "none";
            buttonTextWrapper.style.display = "inline";
          }
        });
      } else {
        console.warn("Button with ID 'submit' not found.");
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
