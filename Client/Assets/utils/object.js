function CheckCollision(object1, object2) {
    const rect1 = {
        x: object1.x,
        y: object1.y,
        width: object1.width,
        height: object1.height,
    };
    const rect2 = {
        x: object2.x,
        y: object2.y,
        width: object2.width,
        height: object2.height,
    };

    if (rect1.x >= rect2.x + rect2.width) return false;
    else if (rect1.x + rect1.width <= rect2.x) return false;
    else if (rect1.y >= rect2.y + rect2.height) return false;
    else if (rect1.y + rect1.height <= rect2.y) return false;

    return true;
}

function CheckCollisionUsingObjects(object1, object2) {
    const rect1 = {
        x: object1.transform.position.x,
        y: object1.transform.position.y,
        width: object1.transform.size.x,
        height: object1.transform.size.y,
    };
    const rect2 = {
        x: object2.transform.position.x,
        y: object2.transform.position.y,
        width: object2.transform.size.x,
        height: object2.transform.size.y,
    };

    if (rect1.x >= rect2.x + rect2.width) return false;
    else if (rect1.x + rect1.width <= rect2.x) return false;
    else if (rect1.y >= rect2.y + rect2.height) return false;
    else if (rect1.y + rect1.height <= rect2.y) return false;

    return true;
}
