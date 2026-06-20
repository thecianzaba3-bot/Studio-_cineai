export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const { taskId, apiKey } = req.body;
    if (!apiKey || !taskId) return res.status(400).json({ error: 'taskId ou clé API manquant' });

    const resp = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Runway-Version': '2024-11-06'
      }
    });
    const data = await resp.json();

    if (!resp.ok) return res.status(resp.status).json({ error: data.error || 'Erreur de vérification' });

    return res.status(200).json({
      status: data.status,
      progress: data.progress || null,
      videoUrl: data.output?.[0] || null,
      failure: data.failure || null
    });

  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur : ' + err.message });
  }
  }
