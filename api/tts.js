export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text, voiceId, speed, volume, pitch, emotion } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text is required" });
    }

    const response = await fetch("https://api.minimax.io/v1/t2a_v2", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MINIMAX_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "speech-2.8-hd",
        text: text.trim(),
        stream: false,
        voice_setting: {
          voice_id: voiceId || "male-qn-qingse",
          speed: Number(speed) || 1,
          vol: Number(volume) || 1,
          pitch: Number(pitch) || 0,
          emotion: emotion || "calm"
        },
        audio_setting: {
          sample_rate: 32000,
          bitrate: 128000,
          format: "mp3",
          channel: 1
        },
        subtitle_enable: false,
        output_format: "hex"
      })
    });

    const data = await response.json();

    if (!response.ok || data?.base_resp?.status_code !== 0) {
      return res.status(500).json({
        error: data?.base_resp?.status_msg || "MiniMax API error"
      });
    }

    const audioHex = data?.data?.audio;

    if (!audioHex) {
      return res.status(500).json({ error: "No audio returned" });
    }

    const audioBuffer = Buffer.from(audioHex, "hex");

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", 'inline; filename="ks-voice.mp3"');
    res.status(200).send(audioBuffer);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Voice generation failed" });
  }
          }
