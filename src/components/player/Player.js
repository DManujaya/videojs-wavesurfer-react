import React, { useEffect, useState, useRef } from "react";

import "./Player.css";

import "video.js/dist/video-js.css";
import videojs from "video.js";

import WaveSurfer from "wavesurfer.js";

import "videojs-wavesurfer/dist/css/videojs.wavesurfer.css";
import Wavesurfer from "videojs-wavesurfer/dist/videojs.wavesurfer.js";

import { annotations } from "../../annotations";

import * as RegionsPlugin from "wavesurfer.js/dist/plugin/wavesurfer.regions.js";

WaveSurfer.regions = RegionsPlugin;

const Player = () => {
  const [zoomValue, setZoomValue] = useState(1);
  // const [plugin, setPlugin] = useState(Wavesurfer);
  const player = useRef();
  const plugin = useRef();

  useEffect(() => {
    const videoJsOptions = {
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
    plugin.current = Wavesurfer;
    // instantiate Video.js
    player.current = videojs(
      document.getElementById("myAudio2"),
      videoJsOptions,
      () => {
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
        player.current.src({ src: "sample_3.wav", type: "audio/wav" });
      }
    );

    player.current.on("waveReady", (event) => {
      player.current.wavesurfer().setupPlaybackEvents(true);
      player.current.wavesurfer().surfer.enableDragSelection({
        color: randomColor(0.1),
      });
      if (localStorage.regions) {
        loadRegions(JSON.parse(localStorage.regions));
      } else {
        loadRegions(annotations);
        saveRegions();
      }

      player.current.wavesurfer().surfer.on("region-click", (region, e) => {
        e.stopPropagation();
        // Play on click, loop on shift click
        player.current.pause();
        e.shiftKey ? region.playLoop() : region.play();
      });

      player.current.wavesurfer().surfer.on("region-play", function (region) {
        region.once("out", function () {
          player.current.wavesurfer().surfer.play(region.start);
          player.current.wavesurfer().surfer.pause();
        });
      });

      // setPlayer(player);
    });

    const stopButton = player.current.controlBar.addChild("button", {}, 1);
    const stopButtonDom = stopButton.el();
    stopButtonDom.textContent = "Stop";

    stopButtonDom.onclick = () => {
      player.current.pause();
      player.current.currentTime(0);
    };

    player.current.on("playbackFinish", (event) => {
      console.log("playback finished.");
    });

    // error handling
    player.current.on("error", (element, error) => {
      console.error(error);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const randomColor = (alpha) => {
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
  };

  const loadRegions = (regions) => {
    regions.forEach((region) => {
      region.color = randomColor(0.1);
      player.current.wavesurfer().surfer.addRegion(region);
    });
  };

  const saveRegions = () => {
    localStorage.regions = JSON.stringify(
      Object.keys(player.current.wavesurfer().surfer.regions.list).map((id) => {
        let region = player.current.wavesurfer().surfer.regions.list[id];
        return {
          start: region.start,
          end: region.end,
          attributes: region.attributes,
          data: region.data,
        };
      })
    );
  };

  const setZoomLevel = (e) => {
    player.current.wavesurfer().surfer.zoom(e.currentTarget.value);
    setZoomValue(e.currentTarget.value);
  };

  return (
    <>
      <div data-vjs-player>
        <audio id="myAudio2" className="video-js vjs-default-skin"></audio>
      </div>
      <div>
        <input
          id="slider"
          type="range"
          min="1"
          max="50"
          value={zoomValue}
          style={{ width: "35%" }}
          onInput={setZoomLevel}
        />
      </div>
    </>
  );
};

export default Player;
