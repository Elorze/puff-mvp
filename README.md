# PUFF

An anti-fast-social prototype in which a recorded voice grows into a dandelion,
breaks into seeds, and reaches another person before any profile labels do.

## Two-user hackathon demo

```bash
npm run demo
```

Open both links before sending:

- User A / recorder: `http://localhost:8787/?room=puff-demo&user=A`
- User B / receiver: `http://localhost:8787/?room=puff-demo&user=B`

User A enters the recording ritual directly. User B enters the empty windowsill
and waits. When A records, grows, and blows the dandelion, B is moved to the
catch screen in real time. The received seed contains the original browser
recording and can be played, accepted, planted, matured, and opened as a bond.

The relay keeps audio in memory only and does not replay old seeds after a page
refresh. Restarting the relay clears all audio immediately.

## Architecture

- React/Vite renders the fixed mobile experience.
- Browser `MediaRecorder` captures the real voice.
- `server.mjs` provides an in-memory audio store and Server-Sent Events room.
- Query parameters select the room and demo user.
- The same audio URL follows the seed into the catch sheet, garden, and chat.

## AI insertion point

AI belongs on the relay, never in the browser, so an API key is not exposed.
The next server-side pipeline is:

1. transcribe the received recording;
2. extract seasonal, timezone, emotional-tempo, and daily-life signals;
3. return only a private wind vector and matching reason;
4. route the seed without sending profile labels to the receiver;
5. discard the transcript or retain it only with explicit consent.

The relay is already the single insertion point for this pipeline. Add the
provider key as a server environment variable; never place it in `VITE_*`.

## Smart ring insertion point

The ring SDK/BLE bridge can map:

- physical button → start/stop voice capture;
- ring microphone → blow strength;
- six-axis IMU → wind direction;
- gesture → catch or release a seed.

The web demo remains usable with a laptop microphone when the ring is absent.
