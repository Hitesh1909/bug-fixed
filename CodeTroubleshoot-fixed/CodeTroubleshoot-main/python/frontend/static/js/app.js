const input = document.querySelector("#image-input");
const preview = document.querySelector("#preview");
const processButton = document.querySelector("#process");
const message = document.querySelector("#message");
const resultPanel = document.querySelector("#result-panel");
const resultText = document.querySelector("#result-text");
const timing = document.querySelector("#timing");
const processed = document.querySelector("#processed");
const copyButton = document.querySelector("#copy-text");
const downloadButton = document.querySelector("#download-text");

let selectedFile = null;
let resultId = null;
let previewUrl = null;

input.addEventListener("change", () => {
  const file = input.files && input.files[0];
  selectedFile = file || null;
  resultId = null;
  resultPanel.hidden = true;
  processed.hidden = true;
  processed.removeAttribute("src");
  message.textContent = "";
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl); // free the previous preview
    previewUrl = null;
  }
  if (!selectedFile) {
    preview.hidden = true;
    preview.removeAttribute("src");
    processButton.disabled = true;
    return;
  }
  previewUrl = URL.createObjectURL(selectedFile);
  preview.src = previewUrl;
  preview.hidden = false;
  processButton.disabled = false;
});

processButton.addEventListener("click", async () => {
  if (!selectedFile) {
    return;
  }
  processButton.disabled = true;
  message.textContent = "";
  try {
    const body = new FormData();
    body.append("file", selectedFile);
    const response = await fetch("/api/recognize", { method: "POST", body });
    const data = await readJson(response);
    if (!response.ok) {
      message.textContent = data.error || "Request failed";
      return;
    }
    resultId = data.id;
    resultText.value = data.text;
    timing.textContent = `${data.processing_ms} ms`;
    processed.src = `/api/results/${data.id}/processed.png?t=${Date.now()}`;
    processed.hidden = false;
    resultPanel.hidden = false;
  } catch {
    message.textContent = "Could not reach the server";
  } finally {
    processButton.disabled = false; // always re-enable, even after an error
  }
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(resultText.value);
    message.textContent = "";
  } catch {
    // Clipboard API needs HTTPS or localhost and user permission; fall back to selection
    resultText.select();
    message.textContent = "Press Ctrl+C to copy the selected text";
  }
});

downloadButton.addEventListener("click", () => {
  if (!resultId) {
    return;
  }
  window.location.href = `/api/results/${resultId}/download`;
});

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return { error: `Request failed (${response.status})` };
  }
}
