const client = ZAFClient.init();
client.invoke("resize", { width: "100%", height: "600px" });

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
  const response = await fetch("https://api.quivr.app/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer 2a0c1a4534922227914a562ab30a166f",
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
    `https://api.quivr.app/chat/${chat_id}/question/stream?brain_id=7890ba8a-d45c-fd1e-3d36-347c61264e15`,
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

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let result = "";
  let done = false;

  while (!done) {
    const { value, done: doneReading } = await reader.read();
    done = doneReading;
    result += decoder.decode(value, { stream: true });
  }

  const matches = result.match(/data: (.+?)(?=data:|$)/g);
  const finalAnswer = matches
    .map((match) => JSON.parse(match.replace("data: ", "")).assistant)
    .join("");

  return finalAnswer;
}

async function reformulate(client, instruction) {
  const historic = await getHistoric(client);
  const input = await getInput(client);

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
  return client.set("ticket.comment.text", reformulatedText);
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

document.addEventListener("DOMContentLoaded", () => {
  let clicked = false;

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
            "Vous êtes un assistant attentionné de LocService, et votre objectif est de satisfaire la demande du client.";
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

      const dropdown = document.getElementById("action-dropdown");
      const buttonWrapper = document.getElementById("button-wrapper");
      const dropdownContainer = document.getElementById("dropdown-container");
      
      if (dropdown && buttonWrapper) {
        // Handle click on the button wrapper
        buttonWrapper.addEventListener("click", (event) => {
          // Only handle clicks outside the select element
          if (event.target !== dropdown) {
            dropdown.click(); // Trigger dropdown open
          }
        });

        // Handle both change and click on the same option
        let lastSelectedOption = dropdown.value;
        const handleAction = async () => {
          try {
            loader.style.display = "block";
            buttonWrapper.style.pointerEvents = "none";
            dropdown.disabled = true;
            const selectedOption = dropdown.value;
            const instruction = document.getElementById("instruction").value;

            let responseContent;
            if (!clicked) {
              // First step
              if (selectedOption === "reformuler") {
                responseContent = await reformulate(client, instruction);
              } else if (selectedOption === "corriger") {
                const input = await getInput(client);
                chat_id = await getNewChat(client);
                responseContent = await getQuivrResponse(
                  "Corrige les fautes d'orthographes de ce draft:\n" + input,
                  chat_id
                );
              }
              
              // Update dropdown options for second step
              dropdown.innerHTML = `
                <option value="regenerer">Regénérer</option>
                <option value="corriger">Corriger</option>
              `;
              
              if (responseWrapper) {
                responseWrapper.style.display = "block";
                document.getElementById("paste_button_wrapper").style.display = "block";
              }
              clicked = true;
            } else {
              // Second step
              if (selectedOption === "regenerer") {
                responseContent = await reformulate(client, instruction);
              } else if (selectedOption === "corriger") {
                const currentResponse = responseText.innerText;
                chat_id = await getNewChat(client);
                responseContent = await getQuivrResponse(
                  "Corrige les fautes d'orthographes de ce draft:\n" + currentResponse,
                  chat_id
                );
              }
            }

            let formattedText = responseContent.replace(/^/gm, "<br>");
            formattedText = formattedText.replace(/^<br>/, "");
            responseText.innerHTML = formattedText;

          } catch (error) {
            console.error("Error processing text:", error);
            responseWrapper.textContent =
              "An error occurred while processing the text.";
          } finally {
            loader.style.display = "none";
            buttonWrapper.style.pointerEvents = "auto";
            dropdown.disabled = false;
            lastSelectedOption = selectedOption;
          }
        };

        dropdown.addEventListener("change", handleAction);
        dropdown.addEventListener("click", (event) => {
          // If clicking the same option, trigger the action
          if (dropdown.value === lastSelectedOption) {
            handleAction();
          }
        });
      } else {
        console.warn("Dropdown or button wrapper not found.");
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
    });
  }, 1000);
});
