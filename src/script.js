class Point {
    constructor(createdAt, name, lng, lat) {
        this.createdAt = createdAt;
        this.name = name;
        this.lng = lng;
        this.lat = lat;
    }
}

class CoordinateConverter {
    static Projection = Object.freeze({
        WGS_84: 'EPSG:4326',
        KERTAU_1948: '+proj=omerc +lat_0=4 +lonc=102.25 +alpha=323.0257905 +k=0.99984 +x_0=804670.24 +y_0=0 +no_uoff +gamma=323.1301023611111 +a=6377295.664 +b=6356094.667915204 +units=m +no_defs +towgs84=-11,851,5',
    });

    static current_projection = CoordinateConverter.Projection.KERTAU_1948;

    static friendly_names = {
        [CoordinateConverter.Projection.WGS_84]: "WGS84",
        [CoordinateConverter.Projection.KERTAU_1948]: "Kertau 1948",
    };

    static from_wgs_84(coord) {
        const {lng, lat} = coord;
        const [x, y] = proj4(CoordinateConverter.current_projection, [lng, lat]);
        return {x, y};
    }

    static to_wgs_84(x, y) {
        const [lng, lat] = proj4(
            CoordinateConverter.current_projection,
            CoordinateConverter.Projection.WGS_84,
            [x, y]);
        return {lng, lat};
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

function setup_coord_display() {
    map.on("move", update_coord_display);

    // Initial update
    update_coord_display();

    return;

    function update_coord_display() {
        const {x, y} = CoordinateConverter.from_wgs_84(map.getCenter());
        $coord_display.text(`${x}, ${y}`);
    }
}

function setup_add_dialog() {
    $add_point_dialog.children( "div" ).on("click", (event) => event.stopPropagation());
    $add_point_dialog.on("click", (event) => $add_point_dialog.get(0).close());
    $add_point_dialog.find( "#add-point-confirm" ).on("click", (event) => {
        const name = $add_point_dialog.find( "[name='name']" ).val();
        const x = $add_point_dialog.find( "[name='lng']" ).val();
        const y = $add_point_dialog.find( "[name='lat']" ).val();
        const {lng, lat} = CoordinateConverter.to_wgs_84(Number(x), Number(y));
        const point = new Point(Date.now(), name, lng, lat);
        points.push(point);
        draw_list();
        draw_marker(point);
        $add_point_dialog.get(0).close();
    });
}

function open_add_dialog() {
    const {x, y} = CoordinateConverter.from_wgs_84(map.getCenter());
    $add_point_dialog.find( "[name='name']" ).val("");
    $add_point_dialog.find( "[name='lng']" ).val(x);
    $add_point_dialog.find( "[name='lat']" ).val(y);
    $add_point_dialog.get(0).showModal();
}

function draw_list() {
    const template = $( "#point-list > template" ).prop("content");
    const $clonableItem = $(template).find(".list-item");
    $point_list.children().not( "template" ).remove();
    for (point of points) {
        const $list_item = $clonableItem.clone();EPSG:4326
        $list_item.children( ".name" ).text(point.name);
        const {x, y} = CoordinateConverter.from_wgs_84({lng: point.lng, lat: point.lat});
        $list_item.children( ".lng" ).text(x);
        $list_item.children( ".lat" ).text(y);
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

const $coord_display = $( "#coord-display" );
const $point_list = $( "#point-list" );
const $add_point_dialog = $( "#add-point" );

var map;
const points = [];
const markers = {};

setup_map();
setup_coord_display();
setup_add_dialog();
$( "button#add-button" ).on("click", (event) => open_add_dialog());

