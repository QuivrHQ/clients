const client = ZAFClient.init();
client.invoke("resize", { width: "100%", height: "600px" });

const quivrApiKeyPromise = client.metadata().then(function (metadata) {
  return metadata.settings.quivr_api_key;
});
// Function Definition
//--------------------

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

async function getNewChat(client) {
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

  // Extract the final answer from the streamed response
  const matches = result.match(/data: (.+?)(?=data:|$)/g);
  const finalAnswer = matches
    .map((match) => JSON.parse(match.replace("data: ", "")).assistant)
    .join("");

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

//--------------------

document.addEventListener("DOMContentLoaded", () => {
  let clicked = false;
  function loadComponent(placeholderId, filePath, callback) {
    const placeholder = document.getElementById(placeholderId);
    fetch(filePath)
      .then((response) => response.text())
      .then((data) => {
        placeholder.innerHTML = data;
        if (callback) callback(); // Exécuter une fonction après le chargement
      })
      .catch((error) =>
        console.error(`Erreur lors du chargement de ${filePath}:`, error)
      );
  }

  // Charger les composants
  loadComponent(
    "textarea-placeholder",
    "components/textarea/textarea.html",
    () => {
      const textarea = document.getElementById("instruction");
      console.info(textarea);
      if (textarea) {
        textarea.addEventListener("input", function () {
          this.style.height = ""; // Reset height
          this.style.height = this.scrollHeight + 100 + "px"; // Adjust height
          console.log(this.scrollHeight);
        });
      } else {
        console.warn("Textarea with ID 'instruction' not found.");
      }
    }
  );

  loadComponent(
    "response-block-placeholder",
    "components/response_block/response_block.html",
    () => {
      console.log("Response block loaded.");
    }
  );

  loadComponent("button-placeholder", "components/button/button.html", () => {
    const button = document.getElementById("submit");
    const pasteButton = document.getElementById("paste");
    const buttonTextWrapper = document.getElementById("button-text-wrapper");
    const buttonText = document.getElementById("button-text");
    const responseWrapper = document.getElementById("response_block_wrapper");
    const responseText = document.getElementById("quivr_response");
    const loader = document.getElementById("button-loader");

    if (button) {
      button.addEventListener("click", async () => {
        try {
          console.log("Reformulating text...");
          loader.style.display = "inline-block"; // Show loader
          buttonTextWrapper.style.display = "none"; // Hide button text
          button.disabled = true;
          const instruction = document.getElementById("instruction").value;

          const reformulatedText = await reformulate(client, instruction);
          let formattedText = reformulatedText.replace(/^/gm, "<br>");
          formattedText = formattedText.replace(/^<br>/, "");
          responseText.innerHTML = formattedText;

          if (!clicked) {
            buttonText.textContent = "Regénérer";
            if (responseWrapper) responseWrapper.style.display = "block";
            clicked = true;
          }
        } catch (error) {
          console.error("Error reformulating text:", error);
          responseWrapper.textContent =
            "An error occurred while reformulating the text.";
        } finally {
          loader.style.display = "none"; // Hide loader
          buttonTextWrapper.style.display = "inline"; // Show button text again
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
          console.log("Pasting reformulated text in editor...");
          await pasteInEditor(client, reformulatedText);
        } catch (error) {
          console.error("Error pasting text in editor:", error);
        }
      });
    } else {
      console.warn("Paste button with ID 'paste' not found.");
    }
  });
});
