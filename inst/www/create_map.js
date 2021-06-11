window.onload = function(){

  var infoPanel = false;
  if(data.options.info){
    infoPanel = new InfoPanel();
  }

  var map = L.map('mapid',{
    zoomSnap: 0.25,
    zoomDelta: 0.25,
    wheelPxPerZoomLevel: 120
  }).setView([0, 0], 3);

  var provider = "OpenStreetMap";
  if(data.options.hasOwnProperty("provider")){
    provider = data.options.provider[0];
  }

  L.tileLayer.provider(provider).addTo(map);

  // geojson
  if(typeof geojson != "undefined"){
    L.geoJSON(geojson).addTo(map);
  }

  // markers
  var items = [];

  for(var i = 0; i<data.markers[0].length; i++){
    var item = {};
    data.markercolnames.forEach(function(col,j){
      item[col] = data.markers[j][i];
    });

    item.marker = new L.Marker([item[data.options.longitude],item[data.options.latitude]],{icon: getIcon(data.options.color ? item[data.options.color] : "#2f7bee")});

    if(data.options.label){
      item.marker.bindPopup(item[data.options.label]);
    }

    if(infoPanel){
      item.marker.itemIndex = i;
      item.marker.on("click",function(event){
        if(!(event.originalEvent.ctrlKey || event.originalEvent.metaKey)){
          map.setView(event.target.getLatLng());
        }
        infoPanel.changeContent(items[event.target.itemIndex][data.options.info]);
      });
    }

    items.push(item);

    if(data.options.image){
      var image = new Image();
      image.onload = function(){
        var item = items[this.itemIndex],
            ratio = getImgRatio(this),
            h = 40,
            w = 40*ratio;
        var icon = L.icon({
          iconUrl: item[data.options.image],

          iconSize:     [w, h], // size of the icon
          iconAnchor:   [w/2, h/2], // point of the icon which will correspond to marker's location
          popupAnchor:  [0, -h/2] // point from which the popup should open relative to the iconAnchor
        });
        item.marker.setIcon(icon);
      }
      image.itemIndex = i;
      image.src = item[data.options.image];
    }
  }

  var links = false;
  if(data.hasOwnProperty("links")){
    links = [];
    for(var i = 0; i<data.links[0].length; i++){
      var link = {};
      link.source = items[data.links[0][i]];
      link.target = items[data.links[1][i]];
      var latlngs = [
          [link.source[options.data.longitude], link.source[options.data.latitude]],
          [link.target[options.data.longitude], link.target[options.data.latitude]]
        ];
      link.line = L.polyline(latlngs, {color: '#2f7bee'})

      links.push(link);
    }

    var lines = L.layerGroup();
  }

  if(L.hasOwnProperty("markerClusterGroup")){
    var markers = L.markerClusterGroup();
  }else{
    var markers = L.layerGroup();
  }
  if(data.options.time){
    var min = +data.options.time[0],
        max = +data.options.time[1],
        range = max - min,
        miliseconds = 100,
        loop = false,
        current,
        step = range > 600 ? Math.floor(range/600) : 1,
        frameInterval = null,
        grabbingInputRange = false,
        updateDateSpan = (data.options.time[2]=="POSIXct") ? function(val){
          dateSpan.innerHTML = (new Date(val*1000)).toUTCString();
        } : function(val){
          dateSpan.innerHTML = String(val);
        },
        nextFrame = function(){
          current = current + step;
          if(current>max){
            current = min;
          }
        },
        updateInputRange = function(val){
          if(!grabbingInputRange){
            inputRange.value = val;
          }
        },
        prevFrame = function(){
          current = current - step;
          if(current<min){
            current = max;
          }
        },
        loadNextFrame = function(){
          nextFrame();
          goToCurrent();
        },
        loadPrevFrame = function(){
          prevFrame();
          goToCurrent();
        },
        goToCurrent = function(){
          items.forEach(function(item){
            if(item[data.options.start]<=current && (item[data.options.end]>=current || item[data.options.end]===null)){
              item.show = true;
              item.marker.addTo(markers);
            }else{
              delete item.show;
              item.marker.removeFrom(markers);
            }
          });
          if(links){
            links.forEach(function(link){
              if(link.source.show && link.target.show){
                link.line.addTo(lines);
              }else{
                link.line.removeFrom(lines);
              }
            });
          }
          updateDateSpan(current);
          updateInputRange(current);
        },
        goTo = function(value){
          if(value>=min && value<=max){
            current = value;
            goToCurrent();
          }
        };

    var inputRange = L.DomUtil.create('input','slider');
    inputRange.type = "range";
    inputRange.min = min;
    inputRange.max = max;
    inputRange.value = min;
    inputRange.addEventListener("change",function(){
      goTo(+this.value);
      grabbingInputRange = false;
    });
    ["mousedown","pointerdown"].forEach(function(d){
      inputRange.addEventListener(d,function(event){
        grabbingInputRange = true;
      });
    });

    var dateSpan = L.DomUtil.create('span','date-viewer');
    var dateInput = L.DomUtil.create('input','date-input');
    dateInput.type = "test";
    dateInput.style.width = "100px";

    goTo(min);

    L.Control.timeControl = L.Control.extend({
      onAdd: function(map) {
        var el = L.DomUtil.create('div', 'leaflet-bar time-control');

        var prev = L.DomUtil.create('a','leaflet-control-time-control time-control-prev',el);
        prev.href = "#";
        prev.appendChild(getSVG('prev'));

        var loopButton = L.DomUtil.create('a','leaflet-control-time-control time-control-loop',el);
        loopButton.href = "#";
        loopButton.appendChild(getSVG('loop'));

        var stop = L.DomUtil.create('a','leaflet-control-time-control time-control-stop',el);
        stop.href = "#";
        stop.appendChild(getSVG('stop'));

        var pauseButton = L.DomUtil.create('a','leaflet-control-time-control time-control-pause',el);
        pauseButton.href = "#";
        pauseButton.appendChild(getSVG('pause'));

        var play = L.DomUtil.create('a','leaflet-control-time-control time-control-play',el);
        play.href = "#";
        play.appendChild(getSVG('play'));

        var next = L.DomUtil.create('a','leaflet-control-time-control time-control-next',el);
        next.href = "#";
        next.appendChild(getSVG('next'));

        var date = L.DomUtil.create('div','leaflet-control-time-control time-control-date',el);
        date.appendChild(dateSpan);

        var dateslider = L.DomUtil.create('div','leaflet-control-time-control time-control-dateslider',el);
        dateslider.appendChild(inputRange);

        var speedSelectionDiv = L.DomUtil.create('div','leaflet-control-time-control time-control-speed',el); 
        var speedRange = L.DomUtil.create('input','slider',speedSelectionDiv);
        speedRange.type = "range";
        speedRange.min = miliseconds/10;
        speedRange.max = miliseconds*10;
        speedRange.value = miliseconds;
        speedRange.style.direction = "rtl";
        speedRange.style.width = "50px";
        var speedSpan = L.DomUtil.create('span','',speedSelectionDiv);
        speedSpan.innerHTML = "&nbsp;speed";

        ["mousedown","pointerdown","dblclick"].forEach(function(d){
          el.addEventListener(d,function(event){
            event.stopPropagation();
          });
        });

        speedRange.addEventListener("change",function(event){
          miliseconds = +this.value;
          if(isRunning()){
            newInterval();
          }
        });

        prev.addEventListener("click",function(event){
          event.preventDefault();
          if(isRunning()){
            pause();
          }
          loadPrevFrame();
        });

        loopButton.addEventListener("click",function(event){
          event.preventDefault();
          loop = !loop;
          if(loop){
            loopButton.classList.add('pressed');
          }else{
            loopButton.classList.remove('pressed');
          }
        })

        stop.addEventListener("click",function(event){
          event.preventDefault();
          if(isRunning()){
            pause();
          }
          goTo(min);
        })

        pauseButton.addEventListener("click",function(event){
          event.preventDefault();
          if(isRunning()){
            pause();
          }
        });

        play.addEventListener("click",function(event){
          event.preventDefault();
          if(!isRunning()){
            play.classList.add('pressed');
            pauseButton.classList.remove('pressed');
            newInterval();
          }
        });

        next.addEventListener("click",function(event){
          event.preventDefault();
          if(isRunning()){
            pause();
          }
          loadNextFrame();
        });

        dateSpan.addEventListener("click",function(event){
          event.preventDefault();
          dateInput.value = "";
          date.removeChild(dateSpan);
          date.appendChild(dateInput);
          dateInput.focus();
        })

        dateInput.addEventListener("keydown",function(event){
          if(pressed_Enter(event)){
            event.preventDefault();
            var value = dateInput.value;
            if(data.options.time[2]=="POSIXct"){
              value = (new Date(value).getTime())/1000;
            }else{
              value = Number(dateInput.value);
            }
            goTo(value);
            date.removeChild(dateInput);
            date.appendChild(dateSpan);
          }
        })

        dateInput.addEventListener("blur",function(event){
          event.preventDefault();
          date.removeChild(dateInput);
          date.appendChild(dateSpan);
        })

        function newInterval(){
          clearInterval(frameInterval);
          frameInterval = setInterval(function(){
            loadNextFrame();
            if(current==min && !loop){
              pause();
            }
          }, miliseconds);
        }

        function pause(){
          play.classList.remove('pressed');
          pauseButton.classList.add('pressed');
          clearInterval(frameInterval);
        }

        function isRunning(){
          return play.classList.contains('pressed');
        }

        return el;
      },

      onRemove: function(map) {
        // Nothing to do here
      }
    });

    L.control.timeControl = function(opts) {
      return new L.Control.timeControl(opts);
    }

    L.control.timeControl({ position: 'bottomleft' }).addTo(map);

  }else{
    if(links){
      links.forEach(function(link){
        link.line.addTo(lines);
      });
    }
    items.forEach(function(item){
      item.marker.addTo(markers);
    });
  }
  if(links){
    map.addLayer(lines);
  }
  map.addLayer(markers);
}

function getImgRatio(img){
      var ratio = 1;
      if(img.complete && img.naturalHeight!==0){
        ratio = img.naturalWidth / img.naturalHeight;
      }
      return ratio;
}

function getSVG(name){
  var d = {
        prev: "m0 0v8h2v-4-4h-2zm2 4l6 4v-8l-6 4z",
        loop: "m3.1329 0.11716c1.4338-0.3575 2.8643 0.13082 3.821 1.1291 0.016065-0.012301 0.02753-0.019619 0.044241-0.032512 0.19187-0.16783 0.32621-0.30606 0.34546-0.32639-0.018073 0.019362-0.00687 0.00203 0.015492-0.023997 0.015502-0.021231 0.034417-0.038778 0.055946-0.055555 0.0079-0.00693 0.016534-0.01328 0.023703-0.017987 0.019283-0.011702 0.04117-0.020392 0.061919-0.026211 0.00511-0.001976 0.00913-0.002279 0.015163-0.003784 0.018339-0.004223 0.036004-0.006387 0.054644-0.006941 0.0022 0.00015449 0.00452-0.00048293 0.0066-0.0003508 0.090806-0.00008196 0.18058 0.045761 0.23114 0.13028 0.019144 0.030939 0.028822 0.064832 0.034029 0.098891l0.0003034 0.00121c0.00665 0.029486 0.011777 0.062358 0.012262 0.097616l0.025111 1.5426 0.00786 0.4839 0.00609 0.428 0.00204 0.13782c0.00526 0.28514-0.1953 0.40539-0.44493 0.26661l-0.5562-0.3094-0.1576-0.0883-0.3631-0.202-1.1159-0.621-0.0729-0.0396c-0.00854-0.00477-0.01378-0.00977-0.021154-0.01486l-0.047364-0.02846 0.00223-0.00185c-0.030207-0.020909-0.058561-0.045189-0.078568-0.078338-0.00532-0.0088-0.00821-0.019071-0.012329-0.027845-0.035072-0.065482-0.038349-0.1348-0.00875-0.20186 0.020393-0.056041 0.058174-0.10543 0.11323-0.13822 0 0 0.35195-0.064373 0.82303-0.2844-0.6664-0.601-1.5941-0.879-2.5376-0.6437-1.5201 0.379-2.4368 1.9029-2.0578 3.423 0.379 1.5202 1.9038 2.4354 3.424 2.0563 0.61-0.152 1.0836-0.5201 1.4542-0.9666 0 0 0.12103-0.16311 0.36112-0.058319 0.2402 0.1048 0.3184 0.1446 0.6025 0.2669 0.284 0.1224 0.1453 0.2773 0.1453 0.2773-0.5341 0.768-1.3034 1.3799-2.2784 1.623-2.1373 0.5329-4.317-0.7768-4.8499-2.9141-0.53294-2.1373 0.77677-4.317 2.9141-4.85z",
        stop: "M0,0L8,0L8,8L0,8Z",
        pause: "m1 0v8h2v-8h-2zm4 0v8h2v-8h-2z",
        play: "M1,0L1,8L7,4Z",
        next: "m0 0v8l6-4-6-4zm6 4v4h2v-8h-2v4z"
      };

  var NS = "http://www.w3.org/2000/svg",
      svg = document.createElementNS(NS, "svg");
  svg.classList.add('icon','icon-'+name);
  svg.setAttribute('width',8);
  svg.setAttribute('height',8);
  svg.setAttribute('viewBox',"0 0 8 8");

  var path = document.createElementNS(NS, "path");
  path.setAttribute('d', d[name]);

  svg.appendChild(path);

  return svg;
}

function InfoPanel(){
  var panel = this.panel = document.createElement("div");
  this.panel.classList.add("infopanel");
  this.dragbar = document.createElement("div");
  this.dragbar.classList.add("drag");
  this.closeButton = document.createElement("div");
  this.closeButton.classList.add("close-button");
  this.panelContent = document.createElement("div");
  this.panelContent.classList.add("panel-content");
  this.panelContentDiv = document.createElement("div");

  this.panel.appendChild(this.dragbar);
  this.panel.appendChild(this.closeButton);
  this.panel.appendChild(this.panelContent);
  this.panelContent.appendChild(this.panelContentDiv);
  document.body.appendChild(this.panel);

  resizeInfopanel(panel);

  this.closeButton.onclick = closePanel;

  function closePanel(){
    panel.style.display = "none";
  }
}

InfoPanel.prototype = {
  changeContent: function(content){
    this.panelContentDiv.innerHTML = content;
    this.panel.style.display = "block";
  }
}

function resizeInfopanel(panel) {
  panel.querySelector(".infopanel > .drag").onmousedown = dragMouseDown;
  var contentDiv = panel.querySelector(".infopanel > .panel-content > div");

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();

    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;

    contentDiv.style.display = "none";
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();

    // set the element's new position:
    var pos = (e.clientX - 10);
    if((e.clientX > panel.parentNode.clientWidth*0.5) && (e.clientX < panel.parentNode.clientWidth*0.85)){
      panel.style.left = pos + "px";
    }
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;

    contentDiv.style.display = null;
  }
}

function getIconMarkerURI(color){
  return "data:image/svg+xml;base64,"+btoa('<?xml version="1.0" encoding="UTF-8"?>'+
'<svg width="40" height="40" version="1.1" viewBox="0 0 10.583 10.583" xmlns="http://www.w3.org/2000/svg">'+
'<path d="m8.599 3.3073c-1e-7 1.8266-3.3073 7.276-3.3073 7.276s-3.3073-5.4495-3.3073-7.276c0-1.8266 1.4807-3.3073 3.3073-3.3073 1.8266 5.5228e-8 3.3073 1.4807 3.3073 3.3073z" fill="'+color+'"/>'+
'<path d="m7.276 3.3073a1.9844 1.9844 0 0 1-1.9844 1.9844 1.9844 1.9844 0 0 1-1.9844-1.9844 1.9844 1.9844 0 0 1 1.9844-1.9844 1.9844 1.9844 0 0 1 1.9844 1.9844z" fill="#ffffff"/>'+
'</svg>');
}

function getIcon(color){
  return L.icon({
        iconUrl: getIconMarkerURI(color),

        iconSize:     [40, 40], // size of the icon
        iconAnchor:   [20, 40], // point of the icon which will correspond to marker's location
        popupAnchor:  [0, -40] // point from which the popup should open relative to the iconAnchor
      });
}

function pressed_Enter(event){
  return event.key=="Enter" || event.keyCode == 13 || event.which==13;
}
