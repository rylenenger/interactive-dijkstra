// VARIABLES
var count = 0;
var vertexCreated = false;
var tool = document.getElementById('tool').value;
var contextTarget = null; // used to hold the object that the context menu is used for

// CONSTANTS   
const sceneWidth = 1140;
const sceneHeight = sceneWidth / 2;
const DEFAULT_STROKE_WIDTH = 2;
const DEFAULT_VERTEX_FONT_SIZE = 40;
const MOUSEOVER_STROKE_WIDTH = 6;
const DEFAULT_RADIUS = 40;
// create array to hold the alphabet
const alpha = Array.from(Array(26)).map((e, i) => i + 65);
const alphabet = alpha.map((x) => String.fromCharCode(x));


// APPLICATION 
var stage = new Konva.Stage({
    container: 'container',
    width: sceneWidth,
    height: sceneHeight,
});

stage.on('contextmenu', function (e) {
    // prevent default behavior
    e.evt.preventDefault();
});

var layer = new Konva.Layer();
stage.add(layer);

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

stage.on('mousedown', function (e) {
    if (e.evt.button === 0) {
        console.log('stage left click registered');

        tool = document.getElementById('tool').value;
        console.log('tool:' + tool);

        switch (tool) {
            case "vertex":
                addVertex(e);
                break;
            case "edge":
                addEdge(e);
                break;
            default:
                break;
        }
    }
});

function addVertex(e) {

    if (e.target === stage) {
        var vertex = new Konva.Group({
            x: stage.getRelativePointerPosition().x,
            y: stage.getRelativePointerPosition().y,
            draggable: true,
            name: nextLetter(),
            connectedTo: '1', //can't be null...yet!
            startNode: false,
            endNode: false,
        });

        vertex.add(new Konva.Circle({
            radius: DEFAULT_RADIUS,
            fill: Konva.Util.getRandomColor(),
            stroke: 'black',
            strokeWidth: MOUSEOVER_STROKE_WIDTH,

        }));

        vertex.add(new Konva.Text({
            text: vertex.name(),
            fontSize: DEFAULT_VERTEX_FONT_SIZE,
            fontFamily: 'Consolas',
            fill: 'white',
            offsetX: 11,
            offsetY: 18,
            listening: false, // need this to be false for mouseover GFX
            name: "1",
        }));

        layer.add(vertex);

        // limit the vertex boundaries to the edge of the stage
        vertex.on('dragmove', () => {
            const circle = vertex.getClientRect();
            const absPos = vertex.getAbsolutePosition();
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
            vertex.setAbsolutePosition(newAbsPos)

            updateObjects(vertex);
        });

        // attach a right click listener for the vertex
        vertex.on('click', (e) => {
            if (e.evt.button === 2) {
                // right click context menu options
                var menuVertex = document.getElementById('menu');
                menuVertex.style.display = 'initial';
                menuVertex.style.top = stage.getPointerPosition().y + 60 + 'px';
                menuVertex.style.left = stage.getPointerPosition().x + 40 + 'px';
                // save current taget as the target for the context menu options
                contextTarget = e.target.getParent();
                console.log("setting new contextTarget: " + contextTarget.attrs.name);
                
                // assign a start node
                document.getElementById('setStart-button').addEventListener('click', _setStart);

                // assign an end node
                document.getElementById('setEnd-button').addEventListener('click', _setEnd);

                // need to destroy all associated lines, text, and then the vertex
                document.getElementById('delete-button').addEventListener('click', _destroy);

                // hides context menu when clicking elsewhere
                window.addEventListener('click', () => {
                    menuVertex.style.display = 'none';
                    document.getElementById('delete-button').removeEventListener('click', _destroy);
                    document.getElementById('setEnd-button').removeEventListener('click', _setEnd);
                    document.getElementById('setStart-button').removeEventListener('click', _setStart);
                });
            }
        });
    }
    else {
        console.log("target is not stage");
    }
}

// handler function for setting the start node
var _setStart = function () {
    contextTarget.setAttr('endNode', false);
    contextTarget.setAttr('startNode', true);
    console.log(contextTarget.attrs.name + " set as start node");
    document.getElementById('setStart-button').removeEventListener('click', _setStart);
}

// handler function for setting the end node
var _setEnd = function _setEnd() {
    contextTarget.setAttr('startNode', false);
    contextTarget.setAttr('endNode', true);
    console.log(contextTarget.attrs.name + " set as end node");
    document.getElementById('setEnd-button').removeEventListener('click', _setEnd);
}

// handler function for destroying vertex with all attached lines and text
function _destroy() {
    console.log("trying to destroy: " + contextTarget.attrs.name);
    var lines = stage.find('.connection');
    for (const line of lines) {
        if (typeof (line.attrs) != undefined) {
            if (line.attrs.start.includes(contextTarget.attrs.name) || line.attrs.end.includes(contextTarget.attrs.name)) {
                line.destroy();
            }
        }
    }
    var texts = stage.find('Text');
    for (const text of texts) {
        if (text.attrs.name != undefined) {
            if (text.attrs.name.includes(contextTarget.attrs.name)) {
                text.destroy();
            }
        }
    }
    contextTarget.destroy();
    document.getElementById('delete-button').removeEventListener('click', _destroy);
}


function addEdge(e) {

    if (e.target != stage) {
        console.log(e.target.getParent().attrs.name);
    }

    let line;
    var lineTo = null;
    var lineFrom = null;
    tool = document.getElementById('tool').value;
    if (tool == "edge" && e.target != stage && e.target != stage.findOne('.' + lineFrom + lineTo)) {
        console.log("mousedown on vertex");
        drawingLine = true;
        const pos = stage.getRelativePointerPosition();
        lineFrom = e.target.getParent().attrs.name;
        line = new Konva.Line({
            stroke: 'black',
            // remove line from hit graph, so we can check intersections
            listening: false,
            points: [e.target.getParent().x(), e.target.getParent().y(), pos.x, pos.y],
            start: lineFrom,
            end: null,
        });
        layer.add(line);
    }

    stage.on('mousemove', (e) => {
        if (!line || tool != "edge") {
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
        // if target is stage, line, source, or connected with node already, destroy the line
        if (
            e.target == stage                           // can't be stage
            || stage.findOne('.' + lineFrom + lineTo)   // can't be text
            || e.target.getParent().hasName(lineFrom)   // can't be vertex where line started
            || e.target.getParent().attrs.connectedTo.includes(lineFrom)   // destination can't already be connected to source
            || e.target.getParent().attrs.connectedTo.includes(lineTo)   // destination can't already be connected to source
        ) {
            console.log("can't create line!");
            line.destroy();
            layer.draw();
            line = null;
        } else {
            let pos = e.target.getClientRect();
            var points = line.points().slice();
            points[2] = pos.x + (e.target.width() / 2);
            points[3] = pos.y + (e.target.height() / 2);;
            line.points(points);
            layer.batchDraw();
            lineTo = e.target.getParent().attrs.name;
            line.setAttr("end", lineTo);
            line.setAttr("name", "connection");
            line.setAttr("cost", 0);
            //console.log(line);

            var text = new Konva.Text({
                x: ((points[0] + points[2]) / 2) - 20,
                y: ((points[1] + points[3]) / 2) - 15,
                text: '0',
                fontSize: 30,
                fontFamily: 'Consolas',
                fill: 'blue',
                align: 'center',
                verticalAlign: 'middle',
                listening: false,
                width: 60,
                start: lineFrom,
                end: lineTo,
                name: lineFrom + lineTo,
            });

            text.on('dblclick dbltap', () => {
                // at first lets find position of text node relative to the stage:
                var textPosition = text.getAbsolutePosition();

                // then lets find position of stage container on the page:
                var stageBox = stage.container().getBoundingClientRect();

                // so position of input will be the sum of positions above:
                var areaPosition = {
                    x: stageBox.left + textPosition.x,
                    y: stageBox.top + textPosition.y,
                };

                // create input and style it
                var input = document.createElement('input');
                document.body.appendChild(input);

                input.value = text.text();
                input.style.position = 'absolute';
                input.style.top = areaPosition.y - 5 + 'px';
                input.style.left = areaPosition.x - 20 + 'px';
                input.style.width = '120px';
                //input.style.padding = '10px 10px';
                input.style.fontSize = '30px';
                input.style.color = 'blue';
                input.style.fontFamily = 'Consolas';
                input.style.textAlign = 'center';
                input.type = 'number';


                input.focus();

                input.addEventListener('keydown', function (e) {
                    // hide on enter
                    if (e.keyCode === 13) {
                        text.text(input.value);
                        document.body.removeChild(input);
                    }
                });
            });

            layer.add(text);

            updateObjects(e.target.getParent());
            // add source to the connectedTo attribute of the destination vertex
            e.target.getParent().setAttr("connectedTo", e.target.getParent().attrs.connectedTo += lineFrom);
            // need to do source vertex as well
            stage.find('.' + lineFrom)[0].setAttr("connectedTo", stage.find('.' + lineFrom)[0].attrs.connectedTo += lineTo);

            line = null;
        }
    });
}


function updateObjects(vertex) {

    // vertex is the current selected vertex that *has* been moved
    // need to find all connected lines and move whichever end is connected to this vertex with the vertex
    let oldVertex;
    // find all the lines that are connected to the vertex
    var lines = stage.find('.connection');
    //console.log(lines);

    for (const line of lines) {
        if (line.attrs.start.includes(vertex.attrs.name) || line.attrs.end.includes(vertex.attrs.name)) {
            // find the name of the oldVertex
            if (line.attrs.start == vertex.attrs.name) {
                // if start of the line matches current vertex, oldVertex must be end of the line
                oldVertex = stage.findOne('.' + line.attrs.end);
            } else {
                // otherwide oldVertex is the start of the line!
                oldVertex = stage.findOne('.' + line.attrs.start);
            }
            var points = getConnectorPoints(
                oldVertex.position(),
                vertex.position()
            );
            line.points(points);
            points = line.points().slice();
            stage.findOne('.' + line.attrs.start + line.attrs.end).setAttr('x', (((points[0] + points[2]) / 2) - 30));
            stage.findOne('.' + line.attrs.start + line.attrs.end).setAttr('y', (((points[1] + points[3]) / 2) - 32));
        }

    }

}

function getConnectorPoints(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    let angle = Math.atan2(-dy, dx);

    const radius = DEFAULT_RADIUS + 5;

    return [
        from.x + -radius * Math.cos(angle + Math.PI),
        from.y + radius * Math.sin(angle + Math.PI),
        to.x + -radius * Math.cos(angle),
        to.y + radius * Math.sin(angle),
    ];
}


function nextLetter() {
    return alphabet[count++];
}

document.getElementById('tool').addEventListener('change', function () {
    console.log('You selected: ', this.value);
    switch (this.value) {
        case "vertex":
            for (const letter of alphabet) {
                if (stage.find('.' + letter)[0]) {
                    console.log("letter: " + letter.toString());
                    var group = stage.find('.' + letter)[0];
                    group.setDraggable(true);
                }
            }
            var texts = stage.find('Text');
            for (text of texts) {
                text.setListening(false);
            }
            break;
        case "edge":
            for (const letter of alphabet) {
                if (stage.find('.' + letter)[0]) {
                    //console.log("letter: " + letter.toString());
                    var group = stage.find('.' + letter)[0];
                    group.setDraggable(false);
                }
            }
            var texts = stage.find('Text');
            for (text of texts) {
                text.setListening(false);
            }
            break;
        case "cost":
            var texts = stage.find('Text');
            for (text of texts) {
                text.setListening(true);
            }
            break;

    }
    //document.getElementById("container").focus();
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