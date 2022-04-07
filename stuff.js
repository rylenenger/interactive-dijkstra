//  ================
// ||  VARIABLES   ||
//  ================
var count = 0;
var nodeCreated = false;
var nodes;


//  ================
// ||  CONSTANTS   ||
//  ================
const sceneWidth = 1140;
const sceneHeight = sceneWidth / 2;
const DEFAULT_STROKE_WIDTH = 2;
const MOUSEOVER_STROKE_WIDTH = 6;
// create array to hold the alphabet
const alpha = Array.from(Array(26)).map((e, i) => i + 65);
const alphabet = alpha.map((x) => String.fromCharCode(x));

//  ================
// || APPLICATION  ||
//  ================

var stage = new Konva.Stage({
    container: 'container',
    width: sceneWidth,
    height: sceneHeight,
});

var layer = new Konva.Layer();
stage.add(layer);


stage.on('dblclick dbltap', function () {

    if (count < 26) {

        // create a node group (circle with text)
        
        var node = new Konva.Group({
            x: stage.getRelativePointerPosition().x,
            y: stage.getRelativePointerPosition().y,
            draggable: true,
            name: nextLetter(),
        });

        node.add(new Konva.Circle({
            radius: 40,
            fill: Konva.Util.getRandomColor(),
            stroke: 'black',
            strokeWidth: 2,

        }));

        node.add(new Konva.Text({
            text: node.name(),
            fontSize: 40,
            fontFamily: 'Consolas',
            fill: 'white',
            offsetX: 11,
            offsetY: 18,
            listening: false, // need this to be false for mouseover GFX
        }));

        nodeCreated = true;
        console.log("node created");

        node.on('dragmove', () => {
            const circle = node.getClientRect();
            const absPos = node.getAbsolutePosition();
            const offsetX = circle.x - absPos.x;
            const offsetY = circle.y - absPos.y;

            const newAbsPos = { ...absPos }
            if (circle.x < 0) {
                newAbsPos.x = -offsetX;
            }
            if (circle.y < 0) {
                newAbsPos.y = -offsetY;
            }
            if (circle.x + circle.width > stage.width()) {
                newAbsPos.x = stage.width() - circle.width - offsetX;
            }
            if (circle.y + circle.height > stage.height()) {
                newAbsPos.y = stage.height() - circle.height - offsetY;
            }
            node.setAbsolutePosition(newAbsPos)
        });

        // do something else on right click
        node.on('click', (e) => {
            if (e.evt.button === 2) {
                currentGroup = e.target.getParent();
                // show menu
                menuNode.style.display = 'initial';
                var containerRect = stage.container().getBoundingClientRect();
                menuNode.style.top = stage.getPointerPosition().y + 60 + 'px';
                menuNode.style.left = stage.getPointerPosition().x + 40 + 'px';
            }
        });

        // setup menu
        let currentGroup;
        var menuNode = document.getElementById('menu');
        document.getElementById('setStart-button').addEventListener('click', () => {
            currentGroup.to({
                scaleX: 2,
                scaleY: 2,
                onFinish: () => {
                    currentGroup.to({ scaleX: 1, scaleY: 1 });
                },
            });
        });

        document.getElementById('delete-button').addEventListener('click', () => {
            currentGroup.destroy();
        });

        window.addEventListener('click', () => {
            // hide menu
            menuNode.style.display = 'none';
        });

        layer.add(node);
    }

});


let drawingLine = false;
let line;
node.on('mousedown', (e) => {
    console.log("mousedown on node");
    drawingLine = true;
    const pos = stage.getPointerPosition();
    line = new Konva.Line({
        stroke: 'black',
        // remove line from hit graph, so we can check intersections
        listening: false,
        points: [node.x(), node.y(), pos.x, pos.y]
    });
    layer.add(line);
});

stage.on('mouseover', (e) => {
    if (e.target != stage) {
        if (e.target.getParent()) {
            e.target.strokeWidth(MOUSEOVER_STROKE_WIDTH);
            layer.draw();
        }
    }
});

stage.on('mouseout', (e) => {
    if (e.target != stage) {
        if (e.target.getParent()) {
            e.target.strokeWidth(DEFAULT_STROKE_WIDTH);
            layer.draw();
        }
    }
});

stage.on('mousemove', (e) => {
    if (!line) {
        return;
    }
    const pos = stage.getRelativePointerPosition();
    const points = line.points().slice();
    points[2] = pos.x;
    points[3] = pos.y;
    line.points(points);
    layer.batchDraw();
});

stage.on('mouseup', (e) => {
    if (!line) {
        return;
    }
    if (!e.target.getParent().hasName('B')) {
        line.destroy();
        layer.draw();
        line = null;
    } else {
        let pos = e.target.getClientRect();
        const points = line.points().slice();
        points[2] = pos.x + (e.target.width() / 2);
        points[3] = pos.y + (e.target.height() / 2);;
        line.points(points);
        layer.batchDraw();

        line = null;
    }

});


function nextLetter() {
    return alphabet[count++];
}


stage.on('contextmenu', function (e) {
    // prevent default behavior
    e.evt.preventDefault();
});

var select = document.getElementById('tool');
select.addEventListener('change', function () {
    mode = select.value;
    console.log("mode: " + mode);
});



function fitStageIntoParentContainer() {
    var container = document.querySelector('#stage-parent');

    // now we need to fit stage into parent container
    var containerWidth = container.offsetWidth;

    // but we also make the full scene visible
    // so we need to scale all objects on canvas
    var scale = containerWidth / sceneWidth;

    stage.width(sceneWidth * scale);
    stage.height(sceneHeight * scale);
    stage.scale({ x: scale, y: scale });
}

fitStageIntoParentContainer();
// adapt the stage on any window resize
window.addEventListener('resize', fitStageIntoParentContainer);