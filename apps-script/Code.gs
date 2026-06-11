/**
 * ConnectPro Academy - Entry point
 * Serves the web app UI.
 */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('ConnectPro Academy')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
