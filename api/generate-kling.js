export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const { prompt, apiKey, imageUrl, duration, ratio, mode } = req.body;

    if (!apiKey) return res.status(400).json({ error: 'Clé API Kling manquante. Configurez-la dans ⚙️ API.' });
    if (!prompt) return res.status(400).json({ error: 'Description de scène manquante.' });

    const endpoint = imageUrl
      ? 'https://api-singapore.klingai.com/v1/videos/image2video'
      : 'https://api-singapore.klingai.com/v1/videos/text2video';

    const body = {
      model_name: 'kling-v2-6',
      prompt: prompt,
      duration: String(duration || 5),
      mode: mode || 'std',
      ...(imageUrl ? { image: imageUrl } : { aspect_ratio: ratio || '16:9' })
    };

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await resp.json();

    if (!resp.ok) {
      return res.status(resp.status).json({ error: data.message || 'Erreur Kling AI', details: data });
    }

    return res.status(200).json({
      taskId: data.data?.task_id || data.task_id,
      status: 'PENDING',
      engine: 'kling'
    });

  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur : ' + err.message });
  }
}
