const client = ZAFClient.init();
client.invoke("resize", { width: "100%", height: "600px" });
let responseTextHistory = [];

const quivrApiKeyPromise = client.metadata().then(function (metadata) {
  return metadata.settings.quivr_api_key;
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
    `https://api-gobocom.quivr.app/chat/${chat_id}/question?brain_id=7890ba8a-d45c-fd1e-3d36-347c61264e15`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${quivrApiKey}`,
        accept: "application/json",
      },
      body: JSON.stringify({
        question: prompt,
        brain_id: "7890ba8a-d45c-fd1e-3d36-347c61264e15",
      }),
    }
  );
  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const data = await response.json();

  return data.assistant;
}

async function reformulate(client, instruction) {
  const historic = await getHistoric(client);
  const input = await getInput(client);

  //const clientName = await getRequesterName(client);
  //const agentName = await getUserName(client);

  // const prompt = `
  //   You are reformulation bot, you only reformulate what the agent wrote.
  //   Here is the tone instruction, this is rank 0 importance and this instruction must pass before every other ones:\n${instruction}\n
  //   Stick to the agent content. Here is the chat history: \n\n
  //   ${historic}\n\nReformulate this agent draft answer \n: ${input} \n\n 
  //   Respond only with the reformulation in the same language as the draft answer (if not stated otherwised in the instructions), the text must me natural without bullet points, tables UNLESS it appears in the draft answer than keep the same format. Do not greet (Dear Mr ..., Hello Mr. ...) or sign the message.
  //   Always speak as a "we". Avoid being to apologizing or too formal, be natural and caring.\n\n
  //   This text appearing directly after greeting the client and before signing: `;
  const prompt = `
  You are a sophisticated reformulation bot designed to refine and improve agent responses in a customer service context. Your task is to reformulate the provided draft answer according to specific guidelines while maintaining the essence of the original content.

For context, here is the chat history:

<historic>
${historic}
</historic>

Here is the agent's draft answer that you need to reformulate:

<input>
${input}
</input>

Now, let's establish the tone for your reformulation:

<instruction>
${instruction}
</instruction>

This tone instruction is of utmost importance and should be applied throughout your reformulation process.

Your goal is to reformulate this answer while adhering to the following guidelines:

1. Language: Maintain the same language as the draft answer unless specifically instructed otherwise.
2. Format: 
   - If the draft answer contains bullet points or tables, preserve this format in your reformulation.
   - If the draft answer does not contain bullet points or tables, use natural, flowing text without introducing them.
   - If the drft answer contains links, keep them in your reformulation.
3. Tone: Apply the tone instructions provided earlier consistently throughout your reformulation.
4. Perspective: Always speak as "we" to represent the company or team.
5. Style:
   - Avoid greetings (e.g., "Dear Mr...", "Hello Mr...") and signatures.
   - Be natural and caring in your language, avoiding excessive apologies or overly formal phrasing.
6. Content:
   - Stick closely to the agent's original content, reformulating for clarity and style without adding new information.
   - Do not include any instructions or guidelines in your output.
   - Do not personalize the response with the name of the user or the agent.

Present your reformulated answer without any additional commentary or explanations. The reformulated text should appear as if it's a direct response to the customer in html format contained in a <p>, ready to be sent.
  `;

  return getQuivrResponse(prompt, chat_id);
}

async function reformulate_editor(draft, instruction){
  const prompt = `
  Edit this draft answer : ${draft} \n\n
  According to those instructions: \n${instruction}\n\n
Present your reformulated answer without any additional commentary or explanations. The reformulated text should appear as if it's a direct response to the customer in html format contained in a <p>, ready to be sent.
  `;
  return getQuivrResponse(prompt, chat_id);
}

function pasteInEditor(client, reformulatedText) {
  return client.set({"ticket.comment.text": reformulatedText});
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

document.addEventListener("DOMContentLoaded", async function() {
  let clicked = false;

  try {
    chat_id = await getNewChat();
    console.log("New chat ID:", chat_id);
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
          const textarea = document.getElementById("instruction");
          textarea.value =
            "Vous êtes un assistant de LocService, et votre objectif est de satisfaire la demande du client. Ton neutre et informatif.";
          const event = new Event("change");
          textarea.dispatchEvent(event);
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
      const responseText = document.getElementById("quivr_response");
      const loader = document.getElementById("button-loader");
      const button_icon = document.getElementById("button-icon");

      if (button) {
        button.addEventListener("click", async () => {
          try {
            loader.style.display = "block";
            buttonTextWrapper.style.display = "none";
            button.disabled = true;
            const instruction = document.getElementById("instruction").value;
            let reformulatedText;

            if (clicked){
              reformulatedText = await reformulate_editor(responseText.innerHTML, instruction);
            }
            else{
              reformulatedText = await reformulate(client, instruction);
            }

            responseText.innerHTML = reformulatedText;
            responseTextHistory.push(reformulatedText);


            if (!clicked) {
              buttonText.textContent = "Réécrire";
              button_icon.src = "./ressources/reecrire.svg";
              if (responseWrapper) {
                responseWrapper.style.display = "block";
              }
              clicked = true;
            }
          } catch (error) {
            console.error("Error reformulating text:", error);
            responseWrapper.textContent =
              "An error occurred while reformulating the text.";
          } finally {
            loader.style.display = "none";
            buttonTextWrapper.style.display = "inline";
            button.disabled = false;
          }
        });
      } else {
        console.warn("Button with ID 'submit' not found.");
      }

      if (pasteButton) {
        pasteButton.addEventListener("click", async () => {
          try {
            const reformulatedText = responseText.innerHTML;
            await pasteInEditor(client, reformulatedText);
          } catch (error) {
            console.error("Error pasting text in editor:", error);
          }
        });
      } else {
        console.warn("Paste button with ID 'paste' not found.");
      }

      // Add the keydown event listener here
      document.addEventListener('keydown', function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
          event.preventDefault();
          console.log(`Response history ${responseTextHistory}`);


          if (responseTextHistory.length > 0 && responseText) {
            if (responseTextHistory.length > 1) {
              responseTextHistory.pop();
              responseText.innerHTML = responseTextHistory[responseTextHistory.length - 1];
            } else {
              console.warn("No more history to undo.");
            }
          } else {
            console.warn("responseText is not available.");
          }
        }
      });
    });
  }, 1000);
});
