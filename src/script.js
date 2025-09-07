class Point {
    constructor(createdAt, name, lat, lng) {
        this.createdAt = createdAt;
        this.name = name;
        this.lat = lat;
        this.lng = lng;
    }
}

function setup_map() {
    map = new maplibregl.Map({
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [103.795, 1.376],
        zoom: 9.5,
        container: "map",
    });

    let nav = new maplibregl.NavigationControl();
    map.addControl(nav, 'bottom-right');
}

function setup_coords_display() {
    function update_coords_display() {
        const {lng, lat} = map.getCenter();
        $coord_display.text( `${lat.toPrecision(6)}, ${lng.toPrecision(6)}`);
    }

    map.on("move", () => update_coords_display(map));

    // Initial update
    update_coords_display(map);

}

function open_add_dialog() {
    const {lng, lat} = map.getCenter();
    const name = prompt(`Name for point at ${lat}, ${lng}`);
    const point = new Point(Date.now(), name, lat, lng);
    points.push(point);
    draw_list();
}

function draw_list() {
    const template = $( "#point-list > template" ).prop("content");
    const $clonableItem = $(template).find(".list-item");
    $point_list.children().not( "template" ).remove();
    for (point of points) {
        const $list_item = $clonableItem.clone();
        $list_item.children( ".name" ).text(point.name);
        $list_item.children( ".lat" ).text(point.lat);
        $list_item.children( ".lng" ).text(point.lng);
        $point_list.append($list_item);
    }
}

const $coord_display = $( "#coords-display" );
const $point_list = $( "#point-list" );
var map;
const points = [];


setup_map();
setup_coords_display();
$( "button#add-button" ).on("pointerup", (event) => open_add_dialog());
