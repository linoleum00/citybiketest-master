import React, { Component } from "react";
import socketIOClient from "socket.io-client";
import { Map, TileLayer, Marker, Popup } from "react-leaflet";
import './App.css';

class App extends Component {
  constructor() {
    super();

    this.state = {
      response: false,
      endpoint: "http://127.0.0.1:4001",
      lat: 25.790654,
      lng: -80.1300455,
      zoom: 13,
      stationsHistory: [],
      showingStationAt: 0,
      isBrowsing: false,
    };

  }
  componentDidMount() {
    const { endpoint } = this.state;
    const socket = socketIOClient(endpoint);
    socket.emit("startListening");
    socket.on("gotBikesStations", (stationsResponse) => {
      const gotStationsAt = new Date().getTime();
      this.setState({
        showingStationAt: this.state.isBrowsing ? this.state.showingStationAt : gotStationsAt,
        stationsHistory: [{
          createdAt: gotStationsAt,
          stations: stationsResponse
        }, ...this.state.stationsHistory]
      });
    })
  }

  goBack() {
    const { stationsHistory, showingStationAt } = this.state;
    const isShowingIndex = stationsHistory.findIndex(x => x.createdAt === showingStationAt);
    const nextToShow = stationsHistory[isShowingIndex + 1];
    if (!!nextToShow) {
      this.setState({
        isBrowsing: true,
        showingStationAt: nextToShow.createdAt,
      })
    }
  }

  goLive() {
    const nextToShow = this.state.stationsHistory[0];
    this.setState({
      isBrowsing: false,
      showingStationAt: nextToShow.createdAt,
    })
  }

  renderNavigation() {
    const { stationsHistory, showingStationAt, isBrowsing } = this.state;
    return (
        stationsHistory.length > 0 && <div className="navigation">
          <div className="date"><span>{`${isBrowsing ? 'Now showing' : 'Last Refresh'}:`}</span> {`${new Date(stationsHistory.find(x => x.createdAt === showingStationAt).createdAt).toLocaleString()}`}</div>
          {stationsHistory.length > 1 && <div className="go-back" onClick={() => this.goBack()}>Go Back</div>}
          {isBrowsing && <div className="go-live" onClick={() => this.goLive()}>Go Live</div>}
        </div>)
  }

  render() {
    const { stationsHistory, showingStationAt, lat, lng, zoom } = this.state;
    const position = [lat, lng];
    return (
      <div className="map">
        <h1> City Bikes in Miami </h1>
        {this.renderNavigation()}
        <Map center={position} zoom={zoom}>
          <TileLayer
            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {showingStationAt > 0 && stationsHistory.find(x => x.createdAt === showingStationAt).stations.map(x => (<Marker key={x.id} position={[x.latitude, x.longitude]}>
            <Popup>
              <div className="station-att"><span>Name:</span> {x.name}</div>
              <div className="station-att"><span>Free Bikes:</span> {x.freeBikes}</div>
              <div className="station-att"><span>Empty Slots:</span> {x.emptySlots}</div>
            </Popup>
          </Marker>))}
        </Map>
      </div>
    );
  }
}
export default App;
