export async function extractText(file) {
    const name = (file.name || "").toLowerCase();

    if (name.endsWith(".pdf") || file.type === "application/pdf") {
        const pdfjsLib = await import("pdfjs-dist");
        const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

        const data = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item) => item.str).join(" ") + "\n";
        }
        return text.replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
    }

    if (name.endsWith(".txt") || name.endsWith(".md") || (file.type || "").startsWith("text/")) {
        return (await file.text()).trim();
    }

    throw new Error("unsupported");
}
