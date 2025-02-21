async function generateReaderContent() {
    const documentClone = document.cloneNode(true);

    try {
        /*const url = chrome.runtime.getURL('lib/Readability.js');
        const module = await import(url);
        console.log("Readability library imported successfully", {url, Readability, module, def: module.default});*/

        const article = new Readability(document).parse()
        return article;
    } catch (error) {
        console.error("Error generating reader content: ", error);
        return { error, content: `<p>Error generating reader content!</p><pre>${error}</pre>` };
    }
}