import React, { Component } from "react";

import "./App.css";

import "video.js/dist/video-js.css";
import videojs from "video.js";

import WaveSurfer from "wavesurfer.js";

import "videojs-wavesurfer/dist/css/videojs.wavesurfer.css";
import Wavesurfer from "videojs-wavesurfer/dist/videojs.wavesurfer.js";

import { annotations } from "./annotations.js";

import * as RegionsPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions.js";

WaveSurfer.regions = RegionsPlugin;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      zoomValue: 1,
    };
    this.plugin = Wavesurfer;
    this.videoJsOptions = {
      controls: true,
      bigPlayButton: false,
      autoplay: false,
      fluid: false,
      loop: false,
      width: 600,
      height: 300,
      playbackRates: [0.5, 1, 1.5, 2],
      controlBar: {
        children: [
          "playToggle",
          "volumePanel",
          "durationDisplay",
          "timeDivider",
          "currentTimeDisplay",
          "playbackRateMenuButton",
        ],
      },
      plugins: {
        // configure videojs-wavesurfer plugin
        wavesurfer: {
          backend: "MediaElement",
          displayMilliseconds: true,
          debug: true,
          waveColor: "#0100fd",
          progressColor: "black",
          cursorColor: "red",
          hideScrollbar: true,
          plugins: [WaveSurfer.regions.create()],
        },
      },
    };
  }

  componentDidMount() {
    // instantiate Video.js
    this.player = videojs(this.audioNode, this.videoJsOptions, () => {
      // print version information at startup
      const version_info =
        "Using video.js " +
        videojs.VERSION +
        " with videojs-wavesurfer " +
        videojs.getPluginVersion("wavesurfer") +
        ", wavesurfer.js " +
        WaveSurfer.VERSION +
        " and React " +
        React.version;
      videojs.log(version_info);

      // load file
      this.player.src({ src: "sample_3.wav", type: "audio/wav" });
    });

    this.player.on("waveReady", (event) => {
      this.player.wavesurfer().setupPlaybackEvents(true);
      this.player.wavesurfer().surfer.enableDragSelection({
        color: this.randomColor(0.1),
      });
      if (localStorage.regions) {
        this.loadRegions(JSON.parse(localStorage.regions));
      } else {
        this.loadRegions(annotations);
        this.saveRegions();
      }

      this.player.wavesurfer().surfer.on("region-click", (region, e) => {
        e.stopPropagation();
        // Play on click, loop on shift click
        this.player.pause();
        e.shiftKey ? region.playLoop() : region.play();
      });

      this.player.wavesurfer().surfer.on("region-play", function (region) {
        region.once("out", function () {
          this.player.wavesurfer().surfer.play(region.start);
          this.player.wavesurfer().surfer.pause();
        });
      });
    });

    var stopButton = this.player.controlBar.addChild("button", {}, 1);
    var stopButtonDom = stopButton.el();
    stopButtonDom.textContent = "Stop";

    stopButtonDom.onclick = () => {
      this.player.pause();
      this.player.currentTime(0);
    };

    this.player.on("playbackFinish", (event) => {
      console.log("playback finished.");
    });

    // error handling
    this.player.on("error", (element, error) => {
      console.error(error);
    });
  }

  randomColor(alpha) {
    return (
      "rgba(" +
      [
        ~~(Math.random() * 255),
        ~~(Math.random() * 255),
        ~~(Math.random() * 255),
        alpha || 1,
      ] +
      ")"
    );
  }

  loadRegions(regions) {
    regions.forEach((region) => {
      region.color = this.randomColor(0.1);
      this.player.wavesurfer().surfer.addRegion(region);
    });
  }

  saveRegions() {
    localStorage.regions = JSON.stringify(
      Object.keys(this.player.wavesurfer().surfer.regions.list).map((id) => {
        let region = this.player.wavesurfer().surfer.regions.list[id];
        return {
          start: region.start,
          end: region.end,
          attributes: region.attributes,
          data: region.data,
        };
      })
    );
  }

  setZoom = (e) => {
    console.log(this.player);
    this.player.wavesurfer().surfer.zoom(e.currentTarget.value);
    this.setState({ zoomValue: e.currentTarget.value });
  };

  render() {
    return (
      <>
        <div data-vjs-player>
          <audio
            id="myAudio1"
            ref={(node) => (this.audioNode = node)}
            className="video-js vjs-default-skin"
          ></audio>
        </div>
        <div>
          <input
            id="slider"
            type="range"
            min="1"
            max="50"
            value={this.state.zoomValue}
            style={{ width: "35%" }}
            onInput={this.setZoom}
          />
        </div>
      </>
    );
  }
}

export default App;
