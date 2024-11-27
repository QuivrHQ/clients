document.addEventListener("DOMContentLoaded", function () {
    const textarea = document.getElementById("instruction");
    textarea.style.height = ''; // Reset height
    textarea.style.height = textarea.scrollHeight + 'px'; // Adjust height based on content
  });