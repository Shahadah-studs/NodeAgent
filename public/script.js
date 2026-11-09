async function runNodeAgent() {
    const inputEl = document.getElementById('userInput');
    const chatBox = document.getElementById('chatBox');
    const query = inputEl.value.trim();
    if (!query) return;

    // Output User Input
    chatBox.innerHTML += `<div class="user-msg">You: ${query}</div>`;
    inputEl.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    // Step 1: Execute scraping sequence
    chatBox.innerHTML += `<p class="bot-msg" id="node-search">🔍 <strong>NodeAgent:</strong> Crawling live data clusters...</p>`;
    
    try {
        const searchRes = await fetch(`/api/agent?query=${encodeURIComponent(query)}`);
        const searchData = await searchRes.json();
        
        document.getElementById('node-search').remove();

        if(!searchData.results || searchData.results.length === 0) {
            chatBox.innerHTML += `<p class="bot-msg"><strong>NodeAgent:</strong> Query brought back no readable web indexes.</p>`;
            return;
        }

        // Aggregate snippets
        const contextText = searchData.results.map(r => r.snippet).join(" ");
        const sourceLinks = searchData.results.map(r => `<span class="source">📍 Source: <a href="${r.url}" target="_blank" style="color:#38bdf8; text-decoration:none;">${r.url.substring(0, 60)}...</a></span>`).join("");

        // Step 2: Synthesis Engine (Uses free public inference endpoints)
        chatBox.innerHTML += `<p class="bot-msg" id="node-ai">🧠 <strong>NodeAgent:</strong> Re-compiling extraction files into response...</p>`;
        
        const aiRes = await fetch("https://huggingface.co", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                inputs: `Context: ${contextText} Prompt: Based on the true facts above, give a clear summary answering: ${query}` 
            })
        });
        
        const aiData = await aiRes.json();
        document.getElementById('node-ai').remove();

        const answer = aiData?.generated_text || aiData[0]?.generated_text || "NodeAgent extracted data but was unable to build a semantic string response.";

        // Print Completed Answer
        chatBox.innerHTML += `
            <p class="bot-msg"><strong>NodeAgent:</strong> ${answer}</p>
            <div class="source-container">${sourceLinks}</div>
        `;
        
    } catch (err) {
        if(document.getElementById('node-search')) document.getElementById('node-search').remove();
        if(document.getElementById('node-ai')) document.getElementById('node-ai').remove();
        chatBox.innerHTML += `<p class="bot-msg" style="color:#ef4444;">❌ <strong>NodeAgent Error:</strong> Pipeline blocked or execution timeout reached.</p>`;
    }
    
    chatBox.scrollTop = chatBox.scrollHeight;
}
