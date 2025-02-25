async function generateReaderContent() {
    const documentClone = document.cloneNode(true);

    try {
        return new Readability(documentClone).parse()
    } catch (error) {
        console.error("Error generating reader content: ", error);
        return { error, content: `<p>Error generating reader content!</p><pre>${error}</pre>` };
    }
}