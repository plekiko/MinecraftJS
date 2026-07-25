<div align="center">
  <img src=".github/mcjs.png" alt="MinecraftJS" />

  <br />

  <p>A 2D Minecraft fan game written entirely in JavaScript using no engines or frameworks!</p>
  <p><em>"The most complete 2D Minecraft fan game you can play in your browser!"</em></p>

  <p><strong>Play here on Itch.io:</strong> <a href="https://plekiko.itch.io/minecraft-js">plekiko.itch.io/minecraft-js</a></p>

  <br />

  <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
    <img src=".github/readme-clip-1.gif" alt="MinecraftJS gameplay clip" width="600" />
    <img src=".github/readme-img-1.png" alt="Gameplay screenshot" width="600" />
    <img src=".github/readme-img-3.png" alt="Gameplay screenshot" width="600" />
    <img src=".github/readme-img-2.png" alt="Gameplay screenshot" width="600" />
  </div>
</div>

> [!IMPORTANT]
> This game is playable but still under development. Expect some minor issues. Please feel free to report any that you come across!

---

## Local Development

### Option 1 - Node.js
To get set up, run `npm install` in both the Client and Server directories.

From the Client directory, run `npm run dev` to start the Vite dev server on `localhost:3000` (hot module reload for the client).

To statically catch missing imports / undefined names (the usual ESM migration failures), run `npm run lint` in the Client directory.

To host a multiplayer server, run `node server.js` from the Server directory. By default, this hosts on port 25565.

Production client build:

```bash
cd Client && npm run build
```

The output is written to `Client/dist/`. Preview it with `npm run preview`.

### Option 2 - Docker
If you wish to build the project with Docker, you can run:
`docker build -t minecraftjs .`. You can then run it with `docker run -p 80:80 minecraftjs`, which will host the game on port 80 (simply `localhost`).
Please be advised that this is a static build and will not update when you modify the code unless you re-run the build command.

> [!NOTE]
> If you are using Docker on Linux in a non-root environment, you may need to use `--network=host` to avoid build and run errors.
