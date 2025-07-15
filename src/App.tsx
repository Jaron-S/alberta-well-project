import "mapbox-gl/dist/mapbox-gl.css";
import React, { useEffect, useRef, useState } from "react";
import Map, { MapRef, Marker, Popup } from "react-map-gl/mapbox";

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

interface GeometryCollection {
	type: "GeometryCollection";
	geometries: Point[];
}

interface Point {
	type: "Point";
	coordinates: [number, number]; // [longitude, latitude]
}

// --- Main App Component ---
const App: React.FC = () => {
	const [wells, setWells] = useState<Point[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [selectedWell, setSelectedWell] = useState<Point | null>(null);

	const mapRef = useRef<MapRef>(null);

	useEffect(() => {
		const fetchWellData = async () => {
			try {
				const response = await fetch("/abandoned_wells.geojson");
				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}
				const data: GeometryCollection = await response.json();

				if (data && data.geometries) {
					setWells(data.geometries);
				} else {
					throw new Error("GeoJSON file is not a valid GeometryCollection.");
				}
			} catch (e) {
				if (e instanceof Error) {
					setError(`Failed to fetch well data: ${e.message}`);
				} else {
					setError("An unknown error occurred.");
				}
			} finally {
				setLoading(false);
			}
		};

		fetchWellData();
	}, []);

	const initialViewState = {
		longitude: -116.5765,
		latitude: 53.9333,
		zoom: 5,
	};

	if (!MAPBOX_TOKEN) {
		return (
			<div
				style={{
					padding: "40px",
					fontFamily: "sans-serif",
					textAlign: "center",
				}}
			>
				<h2>Configuration Error</h2>
				<p>The Mapbox Access Token is missing.</p>
			</div>
		);
	}

	return (
		<div className="App">
			<h1
				style={{
					position: "absolute",
					top: "10px",
					left: "10px",
					zIndex: 1,
					backgroundColor: "rgba(255, 255, 255, 0.8)",
					padding: "10px 15px",
					borderRadius: "8px",
					fontSize: "1.5rem",
					fontFamily: "sans-serif",
					boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
				}}
			>
				Alberta Abandoned Well Finder
			</h1>

			{loading && <p className="loading-message">Loading Well Data...</p>}
			{error && <p className="error-message">{error}</p>}

			<Map
				ref={mapRef}
				mapboxAccessToken={MAPBOX_TOKEN}
				initialViewState={initialViewState}
				style={{ width: "100vw", height: "100vh" }}
				mapStyle="mapbox://styles/mapbox/dark-v11"
			>
				{!loading &&
					!error &&
					wells.map((well, index) => (
						<Marker
							key={`well-${index}`}
							longitude={well.coordinates[0]}
							latitude={well.coordinates[1]}
							onClick={(e) => {
								e.originalEvent.stopPropagation();
								setSelectedWell(well);
								mapRef.current?.flyTo({
									center: [well.coordinates[0], well.coordinates[1]],
									zoom: 10,
								});
							}}
						/>
					))}

				{selectedWell && (
					<Popup
						longitude={selectedWell.coordinates[0]}
						latitude={selectedWell.coordinates[1]}
						onClose={() => setSelectedWell(null)}
						anchor="bottom"
						closeOnClick={false}
					>
						<div>
							<h3>Well Location</h3>
							<p>
								<strong>Longitude:</strong>{" "}
								{selectedWell.coordinates[0].toFixed(4)}
							</p>
							<p>
								<strong>Latitude:</strong>{" "}
								{selectedWell.coordinates[1].toFixed(4)}
							</p>
						</div>
					</Popup>
				)}
			</Map>
		</div>
	);
};

export default App;
