$(document).ready(() => {
  console.log("running script...");
  fetchFiles();
});

function fetchFiles() {
  console.log("fetching files...");
  $.ajax({
    url: "/files",
    method: "GET",
    success: function (data) {
      $("#fileTableBody").empty();

      data.forEach(function (file) {
        var row =
          `<tr><td>${file.name}</td>` +
          `<td><a href="${file.url}" target="_blank">${file.url}</a></td>` +
          `<td><a href="/files/${encodeURIComponent(
            file.name
          )}/download" class="btn btn-primary download-button">Download</a></td></tr>`;
        $("#fileTableBody").append(row);
      });
      attachDownloadHandlers();
      //   attachDeleteHandlers();
    },
    error: function (error) {
      console.log("Error fetching files: ", error);
    },
  });
}

function attachDownloadHandlers() {
  $(".download-button").click(function (e) {
    e.preventDefault();
    var downloadUrl = $(this).attr("href");
    downloadFile(downloadUrl);
  });
}

function downloadFile(url) {
  var link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
