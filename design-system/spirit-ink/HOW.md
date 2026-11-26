# Spirit Week assets (v3)

img/spirit/<id>/NN.webp: four frame sequences, one athlete each, cut out of videos on Wikimedia Commons. js/views/spirit.js draws them on canvases; the scroll position picks the frame.

| id | athlete, sport | Commons video | licence | segment used |
|---|---|---|---|---|
| discus | Tom Reux, discus | Caisse d'épargne - Terre(s) de sport - Tom Reux.webm (Caisse d'Epargne) | CC BY 3.0 | 153.8 s to 157.0 s, every 3rd frame from frame 5 |
| sabre | Sara Balzer, sabre | Caisse d'épargne - Terre(s) de sport - Sara Balzer.webm (Caisse d'Epargne) | CC BY 3.0 | 52.9 s to 54.3 s, frames 6 to 36 |
| bmx | Kieran Reilly, BMX freestyle | Paris2024 - (extra)ordinary - episode 2 kieran reilly.webm (Nthn Creative) | CC0 | 10.2 s to 11.9 s, frames 11 to 41 |
| bball | Laëtitia Guapo, 3x3 basketball | Caisse d'épargne - Terre(s) de sport - Laetitia Guapo.webm (Caisse d'Epargne) | CC BY 3.0 | 104.2 s to 106.0 s, frames 10 to 45 |

The sabre clip shows two fencers; the one cut out is the fencer facing the camera in the French mask. The credit names the video, not a claim about which fencer is which.

Pipeline (kept outside the repo, in C:\temp\spirit\v3):
1. ffmpeg exports every frame of the segment as JPEG.
2. matte.py: BiRefNet (rembg 2.0.85, model birefnet-general-lite) finds the athlete on the frame, then re-runs on a tight crop for a sharp edge; the athlete is tracked frame to frame by overlap, nearby pieces (the ball, the disc, the bike) are kept, and pymatting pulls the background colour out of soft edges.
3. assemble.py: one shared box per athlete (the union of every frame's alpha), scaled, saved as WebP with alpha, 00.webp upwards.
4. fill_data.py copies frame counts and sizes into SPIRIT.athletes in js/data.js.

The v2 pole vault (Sam Kendricks, U.S. Army, CC BY 2.0) and its WebGL module were removed with v2.
