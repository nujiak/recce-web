class Point {
    constructor(name, lat, long) {
        this.name = name;
        this.lat = lat;
        this.long = long;
    }
}

function setup_map() {
    const map = new maplibregl.Map({
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [103.795, 1.376],
        zoom: 9.5,
        container: "map",
    });

    let nav = new maplibregl.NavigationControl();
    map.addControl(nav, 'bottom-right');
}

setup_map();

