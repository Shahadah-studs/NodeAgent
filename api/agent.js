// api/agent.js
import https from 'https';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    // Accessing raw HTML interface without javascript barriers
    const url = `https://duckduckgo.com{encodeURIComponent(query)}`;
    
    const html = await new Promise((resolve, reject) => {
      https.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NodeAgent/1.0' }
      }, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => resolve(data));
      }).on('error', reject);
    });

    const results = [];
    // Regular expression targets duckduckgo's static list structure
    const regex = /<a class="result__url"[\s\S]*?href="([\s\S]*?)"[\s\S]*?<a class="result__snippet"[\s\S]*?>([\s\S]*?)<\/a>/g;
    let match;
    
    while ((match = regex.exec(html)) !== null && results.length < 4) {
      const cleanUrl = match[1].replace(/.*?uddg=/, '').split('&')[0];
      const snippet = match[2].replace(/<[^>]*>/g, '').trim();
      results.push({ url: decodeURIComponent(cleanUrl), snippet });
    }

    return res.status(200).json({ results });
  } catch (error) {
    return res.status(500).json({ error: 'Search extraction failed', details: error.message });
  }
}
