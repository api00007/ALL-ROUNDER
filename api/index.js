export default async function handler(req, res) {
  const { file } = req.query;
  if (!file) {
    return res.status(400).json({ error: "File parameter is required" });
  }

  // ফাইলের নামের শেষে .json থাকলে তা কেটে ফেলা হবে
  let fileName = file;
  if (fileName.toLowerCase().endsWith('.json')) {
    fileName = fileName.slice(0, -5);
  }

  // Vercel Environment Variables থেকে ডাটা নেওয়া হচ্ছে
  const token = process.env.DEST_PAT;
  const owner = process.env.DEST_OWNER;
  const repo = process.env.DEST_REPO;
  
  if (!token || !owner || !repo) {
    return res.status(500).json({ error: "Server configuration missing (DEST_PAT, DEST_OWNER, or DEST_REPO)" });
  }
  
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/main/${fileName}.json`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3.raw'
      }
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: `Failed to fetch ${fileName}.json` });
    }
    const data = await response.json();
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=5');
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
