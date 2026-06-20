export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  try {
    const { taskId, apiKey, isImage } = req.body;
    if (!apiKey || !taskId) return res.status(400).json({ error: 'taskId ou clé API manquant' });

    const path = isImage ? 'image2video' : 'text2video';
    const resp = await fetch(`https://api-singapore.klingai.com/v1/videos/${path}/${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await resp.json();

    if (!resp.ok) return res.status(resp.status).json({ error: data.message || 'Erreur de vérification' });

    const taskStatus = data.data?.task_status;
    const videoUrl = data.data?.task_result?.videos?.[0]?.url || null;

    return res.status(200).json({
      status: taskStatus,
      videoUrl,
      failureMsg: data.data?.task_status_msg || null
    });

  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur : ' + err.message });
  }
}
