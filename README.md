# MinecraftJS
A 2D Minecraft fan game written entirely in Javascript using no engines or frameworks!

It is, from my research, the most complete 2D Minecraft fan game you can play in your browser!

<img width="347" height="250" alt="image" src="https://github.com/user-attachments/assets/8887900d-74a3-48fa-8b2b-ed847bfb1542" />
<img width="347" height="164" alt="image" src="https://github.com/user-attachments/assets/e02b5c4a-51d4-4acf-909d-e3fda66dd596" />
<img width="347" height="347" alt="image" src="https://github.com/user-attachments/assets/028fe645-77a4-4078-94c3-c4731c0bc4cf" />
<img width="347" height="198" alt="image" src="https://github.com/user-attachments/assets/425700cd-c5a2-4c3d-9dac-3027e4e04460" />


> [!IMPORTANT]
> This game is playable but still under development. Expect some minor issues. Please feel free to report any that you come across!

## Local Development

### Option 1 - Node.js
To get set up, run `npm install` in both the Client and Server directories.
You can then run `npx serve Client` in the root directory to host the client on `localhost:3000`.
There is no hot-reloading, so any changes will require a page refresh.

### Option 2 - Docker
If you wish to build the project with Docker, you can run:
`docker build -t minecraftjs .`. You can then run it with `docker run minecraftjs`, which will host the game on port 80 (simply `localhost`).
Please be advised that this is a static build and will not update when you modify the code unless you re-run the build command.

>[!NOTE]
> If you are using Docker on Linux in a non-root environment, you may need to use `--network=host` to avoid build and run errors.