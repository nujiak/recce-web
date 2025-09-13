class Point {
    constructor(createdAt, name, lng, lat, id = undefined) {
        this.id = id;
        this.createdAt = createdAt;
        this.name = name;
        this.lng = lng;
        this.lat = lat;
    }
}

class CoordinateConverter {
    static Projection = Object.freeze({
        WGS_84: {
            friendly_name: 'WGS84',
            proj_string: 'EPSG:4326',
            format: ({lng, lat}) => ({lng: lng.toPrecision(6), lat: lat.toPrecision(6)}),
        },
        KERTAU_1948: {
            friendly_name: 'Kertau 1948',
            proj_string: '+proj=omerc +lat_0=4 +lonc=102.25 +alpha=323.0257905 +k=0.99984 +x_0=804670.24 +y_0=0 +no_uoff +gamma=323.1301023611111 +a=6377295.664 +b=6356094.667915204 +units=m +no_defs +towgs84=-11,851,5',
            format: ({x, y}) => ({x: Math.trunc(x), y: Math.trunc(y)}),
        },
    });

    static current_projection = CoordinateConverter.Projection.KERTAU_1948;

    static from_wgs_84(coord, format = false) {
        const {lng, lat} = coord;
        const [x, y] = proj4(CoordinateConverter.current_projection.proj_string, [lng, lat]);
        if (format) {
            return CoordinateConverter.current_projection.format({x, y});
        }
        return {x, y};
    }

    static to_wgs_84(x, y, format = false) {
        const [lng, lat] = proj4(
            CoordinateConverter.current_projection.proj_string,
            CoordinateConverter.Projection.WGS_84.proj_string,
            [x, y]);
        if (format) {
            return CoordinateConverter.Projection.WGS_84.format({lng, lat});
        }
        return {lng, lat};
    }
}

class Db {
    static initialize() {
        db = new Dexie("PointsDatabase");
        db.version(1).stores({
            points: `++id, createdAt, name, lng, lat`,
        });
        db.points.mapToClass(Point);
        (async () => {
            await db.points.each((point) => {
                points.push(point);
                draw_marker(point);
            });
            draw_list();
        })();
    }
}

function setup_map() {
    map = new maplibregl.Map({
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [103.795, 1.376],
        zoom: 9.5,
        container: "map",
    });

    const nav = new maplibregl.NavigationControl();
    map.addControl(nav, 'bottom-right');

    const geolocate = new maplibregl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true,
        },
        trackUserLocation: true,
    });
    map.addControl(geolocate, 'bottom-right');

    geolocate.on("trackuserlocationstart", () =>
        $user_coord_display.show());
    geolocate.on("geolocate", (event) => {
        const {x, y} = CoordinateConverter.from_wgs_84({
            lng: event.coords.longitude,
            lat: event.coords.latitude,
        }, true);
        $user_coord_display.text(`${x}, ${y}`);
    });
}

function setup_coord_display() {
    map.on("move", update_coord_display);

    // Initial update
    update_coord_display();

    function update_coord_display() {
        const {x, y} = CoordinateConverter.from_wgs_84(map.getCenter(), true);
        $coord_display.text(`${x}, ${y}`);
    }
}

function setup_add_dialog() {
    $add_point_dialog.children("div").on("click", (event) => event.stopPropagation());
    $add_point_dialog.on("click", () => $add_point_dialog.get(0).close());
    $add_point_dialog.find("#add-point-confirm").on("click", async () => {
        const name = $add_point_dialog.find("[name='name']").val();
        const x = $add_point_dialog.find("[name='lng']").val();
        const y = $add_point_dialog.find("[name='lat']").val();
        const {lng, lat} = CoordinateConverter.to_wgs_84(Number(x), Number(y));
        const point = add_point(name, lng, lat);
        draw_list();
        await db.points.add(point);

        $add_point_dialog.get(0).close();
    });
}

function add_point(name, lng, lat) {
    const point = new Point(Date.now(), name, lng, lat);
    point.id = points.push(point);
    draw_marker(point);
    return point;
}

async function delete_point(point) {
    const index = points.indexOf(point);
    points.splice(index, 1);
    markers[point.createdAt].remove();
    await db.points.delete(point.id);
}

function open_add_dialog() {
    const {x, y} = CoordinateConverter.from_wgs_84(map.getCenter());
    $add_point_dialog.find("[name='name']").val("");
    $add_point_dialog.find("[name='lng']").val(x);
    $add_point_dialog.find("[name='lat']").val(y);
    $add_point_dialog.get(0).showModal();
}

function draw_list() {
    const template = $("#point-list > template").prop("content");
    const $clonableItem = $(template).find(".list-item");
    $point_list.children().not("template").remove();
    for (const point of points) {
        const $list_item = $clonableItem.clone();
        $list_item.find(".name").text(point.name);
        const {x, y} = CoordinateConverter.from_wgs_84(
            {lng: point.lng, lat: point.lat},
            true,
        );
        $list_item.find(".lng").text(x);
        $list_item.find(".lat").text(y);
        const p = point;
        $list_item.find("button").on("click", async () => {
            await delete_point(p);
            draw_list();
        })
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

const $coord_display = $("#coord-display");
const $user_coord_display = $("#user-coord-display");
const $point_list = $("#point-list");
const $add_point_dialog = $("#add-point");

let map;
const points = [];
const markers = {};
let db;

Db.initialize();
setup_map();
setup_coord_display();
setup_add_dialog();
$("button#add-button").on("click", () => open_add_dialog());

