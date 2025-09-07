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

function setup_add_dialog() {
    $add_point_dialog.children( "div" ).on("click", (event) => event.stopPropagation());
    $add_point_dialog.on("click", (event) => $add_point_dialog.get(0).close());
    $add_point_dialog.find( "#add-point-confirm" ).on("click", (event) => {
        const name = $add_point_dialog.find( "[name='name']" ).val();
        const lat = $add_point_dialog.find( "[name='lat']" ).val();
        const lng = $add_point_dialog.find( "[name='lng']" ).val();
        const point = new Point(
            Date.now(),
            name,
            Number(lat),
            Number(lng),
        );
        points.push(point);
        draw_list();
        draw_marker(point);
        $add_point_dialog.get(0).close();
    });
}

function open_add_dialog() {
    const {lng, lat} = map.getCenter();
    $add_point_dialog.find( "[name='name']" ).val("");
    $add_point_dialog.find( "[name='lat']" ).val(lat);
    $add_point_dialog.find( "[name='lng']" ).val(lng);
    $add_point_dialog.get(0).showModal();
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

function draw_marker(point) {
    const marker = new maplibregl.Marker()
        .setLngLat([point.lng, point.lat])
        .addTo(map);
    marker.getElement().addEventListener('click', () => map.flyTo({
        center: [point.lng, point.lat],
    }));
    markers[point.createdAt] = marker;
}

const $coord_display = $( "#coords-display" );
const $point_list = $( "#point-list" );
const $add_point_dialog = $( "#add-point" );
var map;
const points = [];
const markers = {};

setup_map();
setup_coords_display();
setup_add_dialog();
$( "button#add-button" ).on("click", (event) => open_add_dialog());

