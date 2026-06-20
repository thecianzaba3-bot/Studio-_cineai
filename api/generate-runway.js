export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const { prompt, apiKey, imageUrl, duration, ratio } = req.body;

    if (!apiKey) return res.status(400).json({ error: 'Clé API Runway manquante. Configurez-la dans ⚙️ API.' });
    if (!prompt) return res.status(400).json({ error: 'Description de scène manquante.' });

    const endpoint = imageUrl
      ? 'https://api.dev.runwayml.com/v1/image_to_video'
      : 'https://api.dev.runwayml.com/v1/text_to_video';

    const body = imageUrl
      ? { model: 'gen4_turbo', promptImage: imageUrl, promptText: prompt, ratio: ratio || '1280:720', duration: duration || 5 }
      : { model: 'gen4_turbo', promptText: prompt, ratio: ratio || '1280:720', duration: duration || 5 };

    const createResp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06'
      },
      body: JSON.stringify(body)
    });

    const createData = await createResp.json();

    if (!createResp.ok) {
      return res.status(createResp.status).json({
        error: createData.error || 'Erreur Runway ML',
        details: createData
      });
    }

    const taskId = createData.id;
    return res.status(200).json({ taskId, status: 'PENDING', engine: 'runway' });

  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur : ' + err.message });
  }
}
