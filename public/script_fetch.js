document.addEventListener("DOMContentLoaded", () => {
  fetchFiles();
});

async function fetchFiles() {
  const response = await fetch("/files");
  const files = await response.json();

  renderFiles(files);
}

function renderFiles(files) {
  const tbody = document.getElementById("fileTableBody");
  tbody.innerHTML = "";

  files.forEach((file) => {
    const row = `
        <tr>
          <td>${file.name}</td>
          <td><a href="${file.url}" target="_blank">${file.url}</a></td> 
          <td>
            <a class="btn btn-primary download-button" 
               href="/files/${encodeURIComponent(file.name)}/download">
              Download  
            </a>
          </td>
        </tr>
      `;

    tbody.innerHTML += row;
  });

  addDownloadListeners();
}

function addDownloadListeners() {
  document.querySelectorAll(".download-button").forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();

      downloadFile(button.getAttribute("href"));
    });
  });
}

async function downloadFile(url) {
  console.log("ssss", url);
  const filename = getFilenameFromUrl(url); // get original name

  const response = await fetch(url);
  const blob = await response.blob();

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename; // set original name
  link.click();

  URL.revokeObjectURL(link.href);
}

function getFilenameFromUrl(url) {
  const parts = url.split("/");
  return parts[parts.length - 2];
}
