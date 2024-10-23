GenerateWorld();

setInterval(()=> {
    Update();
    Draw();
    DrawChunks(chunks);
}, 1000/60);


function Update() {
}