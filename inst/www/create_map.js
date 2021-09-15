window.onload = function(){
  if(!data.options.hasOwnProperty("entityOpacity")){
    data.options.entityOpacity = 0.2;
  }
  renderMap(data);
}

function renderMap(data){
  var zoomstep = 0.25;

  document.body.innerHTML = '<div id="mapid"></div>';
  document.body.addEventListener("keydown",shortcuts);
  
  var infoPanel = false;
  if(data.options.markerInfo || data.options.entityInfo){
    infoPanel = new InfoPanel();
  }

  var colorManagers = {};

  var map = L.map("mapid",{
    zoomSnap: zoomstep,
    zoomDelta: zoomstep,
    wheelPxPerZoomLevel: 120,
    zoomControl: false,
    maxBounds: [[-90,-180],[90,180]]
  }).setView(data.options.center, data.options.zoom);

  // zoom buttons
  L.Control.zoomButtons = L.Control.extend({
      onAdd: function(map) {
        var zoomButtons = L.DomUtil.create('div', 'leaflet-bar zoom-buttons panel-style');
        panelStopPropagation(zoomButtons);

        var zoomin = L.DomUtil.create('button','zoomin',zoomButtons);
        zoomin.addEventListener("click",function(){ map.setZoom(map.getZoom()+zoomstep); });

        var zoomreset = L.DomUtil.create('button','zoomreset',zoomButtons);
        zoomreset.addEventListener("click",function(){ map.setZoom(data.options.zoom); });

        var zoomout = L.DomUtil.create('button','zoomout',zoomButtons);
        zoomout.addEventListener("click",function(){ map.setZoom(map.getZoom()-zoomstep); });

        return zoomButtons;
      },

      onRemove: function(map) {
        // Nothing to do here
      }
  });

  L.control.zoomButtons = function(opts) {
      return new L.Control.zoomButtons(opts);
  }

  // providers
  L.tileLayer.provider(data.options.provider).addTo(map);

  map.on("click",select_none);

  delete data.storeItems;
  data.storeItems = {};

  var nodes = {};

  // geojson
  if(typeof geojson != "undefined"){
    colorManagers.entityColor = new colorMgmt("entities","entityColor");

    var entities_layer = L.geoJSON(false,{
      onEachFeature: function(feature,layer){
          layer.on("click",function(event){
            if(data.options.entityInfo){
              infoPanel.changeContent(feature.properties[data.options.entityInfo]);
            }

            if(event.originalEvent.ctrlKey || event.originalEvent.metaKey){
              feature._selected = !feature._selected;
            }else{
              geojson.features.forEach(function(feature){
                delete feature._selected;
              });
              feature._selected = true;
            }

            update_items();
            L.DomEvent.stopPropagation(event);
          });
      }
    });

    if(data.hasOwnProperty("entities")){
      if(geojson.type=="Feature"){
        geojson = { features: [geojson], type: "FeatureCollection" };
      }
      if(geojson.type=="FeatureCollection"){
        geojson.features.forEach(function(feature){
          var i = getValuesFromDF("entities","entityName").indexOf(feature.properties[data.options.entityName])
          data.entities.columns.forEach(function(k,j){
            feature.properties[k] = data.entities.data[j][i];
          });
        });
        data.storeItems.entities = geojson.features;
      }else{  
        console.log("incorrect type in geojson");
      }
    }
  }

  // markers
  if(data.hasOwnProperty("markers")){
    colorManagers.markerColor = new colorMgmt("markers","markerColor");

    data.storeItems.markers = [];
    if(typeof data.markers.data[0] != "object"){
      data.markers.data = data.markers.data.map(function(d){ return [d]; });
    }

    for(var i = 0; i<data.markers.data[0].length; i++){
      var item = {};

      item.properties = {};
      data.markers.columns.forEach(function(k,j){
        item.properties[k] = data.markers.data[j][i];
      });

      var name = item.properties[data.options.markerName];
      if(!nodes.hasOwnProperty(name)){
          nodes[name] = data.storeItems.markers.length;
          item.properties[data.options.markerName] = name;
          data.storeItems.markers.push(item);
      }
    }
  }

  if(data.hasOwnProperty("links")){
    colorManagers.linkColor = new colorMgmt("links","linkColor");

    data.storeItems.links = [];
    var linksidx = {};

    if(typeof data.links.data[0] != "object"){
      data.links.data = data.links.data.map(function(d){ return [d]; });
    }

    for(var i = 0; i<data.links.data[0].length; i++){
      var link = {};

      var attributes = {};
      data.links.columns.forEach(function(k,j){
        attributes[k] = data.links.data[j][i];
      });

      link.source = data.links.data[0][i];
      link.target = data.links.data[1][i];
      var linkname = link.source+"_"+link.target;

      if(!linksidx.hasOwnProperty(linkname)){
        link.properties = attributes;

        link.line = L.polyline([]);

        linksidx[linkname] = data.storeItems.links.length;
        data.storeItems.links.push(link);
      }
    }

    function updateLine(link){
      var latlngs = [
          data.storeItems.markers[nodes[link.source]].marker.getLatLng(),
          data.storeItems.markers[nodes[link.target]].marker.getLatLng()
        ];
      link.line.setLatLngs(latlngs);
      link.line.setStyle({color: colorManagers.linkColor.getItemColor(link.properties)});
    }

    var links_layer = L.layerGroup();
  }

  // panel buttons
  if(data.storeItems.markers || data.storeItems.entities){
    L.Control.buttonsPanel = L.Control.extend({
      onAdd: function(map) {
        var panelButtons = L.DomUtil.create('div', 'leaflet-bar buttons-panel panel-style');
        panelStopPropagation(panelButtons);

        var tables = L.DomUtil.create('button','primary tables-button',panelButtons);
        tables.textContent = "Tables";
        tables.addEventListener("click",show_tables);

        var selectall = L.DomUtil.create('button','primary selectall-button',panelButtons);
        selectall.textContent = "Select all";
        selectall.addEventListener("click",select_all);

        var filter = L.DomUtil.create('button','primary filter-button',panelButtons);
        filter.innerHTML = "Filter";
        filter.addEventListener("click",filter_selected);

        var clear = L.DomUtil.create('button','primary-outline clear resetfilter-button',panelButtons);
        clear.innerHTML = "Clear";
        clear.addEventListener("click",remove_filters);

        return panelButtons;
      },

      onRemove: function(map) {
        // Nothing to do here
      }
    });

    L.control.buttonsPanel = function(opts) {
      return new L.Control.buttonsPanel(opts);
    }
  }

  // search
  L.Control.searchPanel = L.Control.extend({
      onAdd: function(map) {
        var searchPanel = createNewPanel("search");

        var searchPadding = L.DomUtil.create('div','search-padding',searchPanel);

        var searchWrapper = L.DomUtil.create('div','search-wrapper',searchPadding);

        var searchBox = L.DomUtil.create('div','search-box',searchWrapper);

        var searchIcon = L.DomUtil.create('button','search-icon disabled',searchWrapper);
        searchIcon.appendChild(getSVG("search"));

        var input = L.DomUtil.create('input','',searchBox);
        input.type = "text";
        input.placeholder = "Search an entity...";
        input.addEventListener("keydown",function(event){
          L.DomEvent.stopPropagation(event);
        });
        input.addEventListener("keyup",function(event){
          var txt = this.value;
          if(txt.length>1){
            txt = new RegExp(txt,'i');
            searchItem("entities",txt);
            searchItem("markers",txt);
            update_items();
          }
        })

        function searchItem(items,txt){
          if(data.storeItems[items]){
            data.storeItems[items].forEach(function(item){
              delete item._selected;
              var i = 0;
              while(!item._selected && i<data[items].columns.length){
                  if(String(item.properties[data[items].columns[i++]]).match(txt)){
                    item._selected = true;
                  }
              }
            });
          }
        }

        return searchPanel;
      },

      onRemove: function(map) {
        // Nothing to do here
      }
    });

  L.control.searchPanel = function(opts) {
      return new L.Control.searchPanel(opts);
  }

  // tools panel
  var tabnames = [];
  if(data.storeItems.markers){
    tabnames.push("markers");
  }
  if(data.storeItems.links){
    tabnames.push("links");
  }
  if(data.storeItems.entities){
    tabnames.push("entities");
  }
  if(tabnames.length){
    L.Control.toolsPanel = L.Control.extend({
      onAdd: function(map) {
        var toolsPanelWrapper = L.DomUtil.create('div', 'tools-panel-wrapper');

        var toolsPanel = createNewPanel("tools","Tools",toolsPanelWrapper);

        var nav = L.DomUtil.create('div','items-nav',toolsPanel);
        var ul = L.DomUtil.create('ul','',nav);
        var tabs = L.DomUtil.create('div','tools-tabs',toolsPanel);

        if(tabnames.indexOf("markers")!=-1){
          var tabMarkers = L.DomUtil.create('div','tools-tab tab-markers',tabs);
          tabMarkers.style.display = "none";
          tabMarkers.setAttribute("tabname","markers");

          var markersChange = L.DomUtil.create('div','items-change markers-change',tabMarkers);
          ["Label","Color"].forEach(function(d){
            addVisualSelector(markersChange,"markers","marker",d,update_items,colorManagers);
          })

          var markersFilter = L.DomUtil.create('div','items-filter markers-filter',tabMarkers);
          displayItemFilter(markersFilter,"markers",filter_selected_markers,remove_markers_filters,update_items);
        }

        if(tabnames.indexOf("links")!=-1){
          var tabLinks = L.DomUtil.create('div','tools-tab tab-links',tabs);
          tabLinks.style.display = "none";
          tabLinks.setAttribute("tabname","links");

          var linksChange = L.DomUtil.create('div','items-change links-change',tabLinks);
          addVisualSelector(linksChange,"links","link","Color",update_items,colorManagers);

          var linkFilter = L.DomUtil.create('div','items-filter links-filter',tabLinks);
          displayItemFilter(linkFilter,"links",filter_selected_links,remove_links_filters,update_items);
        }

        if(tabnames.indexOf("entities")!=-1){
          var tabEntities = L.DomUtil.create('div','tools-tab tab-entities',tabs);
          tabEntities.style.display = "none";
          tabEntities.setAttribute("tabname","entities");

          var entitiesChange = L.DomUtil.create('div','items-change entities-change',tabEntities);
          ["Label","Color"].forEach(function(d){
            addVisualSelector(entitiesChange,"entities","entity",d,update_items,colorManagers);
          });

          var entitiesOpacity = L.DomUtil.create('div','items-opacity entities-opacity',tabEntities);
          L.DomUtil.create('h4','',entitiesOpacity).innerHTML = "Opacity";
          var inputRange = L.DomUtil.create('input','slider',entitiesOpacity);
          inputRange.type = "range";
          inputRange.min = 0;
          inputRange.max = 1;
          inputRange.step = 0.1;
          inputRange.value = data.options.entityOpacity;
          inputRange.addEventListener("click",function(){
            data.options.entityOpacity = this.value;
            update_entities_style();
          });

          var entitiesFilter = L.DomUtil.create('div','items-filter entities-filter',tabEntities);
          displayItemFilter(entitiesFilter,"entities",filter_selected_geometries,remove_geometries_filters,update_items);
        }

        tabnames.forEach(function(name){
            var li = L.DomUtil.create('li','',ul);
            li.addEventListener("click",function(){
              ul.childNodes.forEach(function(li){
                li.classList.remove("active");
              })
              li.classList.add("active");
              tabs.childNodes.forEach(function(tab){
                tab.style.display = (tab.getAttribute("tabname")==name) ? "block" : "none";
              });
              update_valueSelectors();
            });
            li.textContent = name;
        })

        tabs.childNodes[0].style.display = "block";
        ul.childNodes[0].classList.add("active");

        return toolsPanelWrapper;
      },

      onRemove: function(map) {
        // Nothing to do here
      }
    });

    L.control.toolsPanel = function(opts) {
      return new L.Control.toolsPanel(opts);
    }
  }

  // legends panel
  L.Control.legendsPanel = L.Control.extend({
      onAdd: function(map) {
        var legendsPanelWrapper = L.DomUtil.create('div','legends-panel-wrapper');

        var legendsPanel = createNewPanel("legends","Legends",legendsPanelWrapper);
 
        var goBack = L.DomUtil.create('div','goback',legendsPanel);
        goBack.addEventListener("click",remove_filters);
 
        var legendsContent = L.DomUtil.create('div','legends-content',legendsPanel);

        var bottomControls = L.DomUtil.create('div','legend-bottom-controls',legendsPanel);
        var legendSelectAll = L.DomUtil.create('div','legend-selectall',bottomControls);
        var selectAllCheck = L.DomUtil.create('div','legend-check-box',legendSelectAll);
        L.DomUtil.create('span', '',legendSelectAll).textContent = "Select all";
        legendSelectAll.style.cursor = "pointer";
        legendSelectAll.addEventListener("click",function(){
          if(selectAllCheck.classList.contains("checked")){
            select_none();
          }else{
            select_all();
          }
        });
        var filterButton = L.DomUtil.create('button','legend-bottom-button primary',bottomControls);
        filterButton.textContent = "Filter";
        filterButton.addEventListener("click",filter_selected);

        return legendsPanelWrapper;
      },

      onRemove: function(map) {
        // Nothing to do here
      }
  });

  L.control.legendsPanel = function(opts) {
      return new L.Control.legendsPanel(opts);
  }

  // marker Cluster
  if(data.storeItems.markers){
    if(L.hasOwnProperty("markerClusterGroup")){
      var markers_layer = L.markerClusterGroup();
    }else{
      var markers_layer = L.layerGroup();
    }
  }

  var update_items = function(){};

  if(timeApplied()){
    // manage time
    var range = [];
    if(data.periods && !data.options.time){
      data.options.byperiod = true;
    }
    if(data.periods && data.options.byperiod){
        range = getValuesFromDF("periods","periodName");
    }else{
      if(data.periods){
        var starts = getValuesFromDF("periods","periodStart"),
            ends = getValuesFromDF("periods","periodEnd");
        starts.forEach(function(start,i){
          sequence(Math.max(start,+data.options.time.min),Math.min(ends[i],+data.options.time.max)+1).forEach(function(val){
            if(range.indexOf(val)==-1){
              range.push(val);
            }
          });
        });
      }else{
        range = sequence(+data.options.time.min,+data.options.time.max+1);
      }
      data.options.time.range = range;
    }
    range = range.length;
    var min = 0,
        max = range-1,
        miliseconds = range < 15 ? 4000 : (range < 600 ? Math.floor(600/range)*100 : 100),
        step = range > 600 ? Math.floor(range/600) : 1,
        loop = false,
        current = min,
        frameInterval = null,
        visibleItems = 0,
        nextFrame = function(){
          current = current + step;
          if(current>max){
            current = min;
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
          update_items();
        },
        loadPrevFrame = function(){
          prevFrame();
          update_items();
        },
        goTo = function(value){
          if(value>=min && value<=max){
            current = value;
            update_items();
          }
        };

    var updateShowedDates;
    if(data.periods && data.options.byperiod){
      updateShowedDates = function(val){
        dateSpan.textContent = getValuesFromDF("periods","periodStart")[val]+" - "+getValuesFromDF("periods","periodEnd")[val];
        dateDiv.textContent = getCurrentPeriod(val);
        updatePeriodDescription(val);
      }
    }else{
      var getSpanText = String;
      if(data.options.time.type=="POSIXct"){
        getSpanText = function(val){
          return (new Date(val*1000)).toUTCString();
        }
      }else if(data.options.time.type=="Date"){
        getSpanText = function(val){
          var d = new Date(val*86400000);
          return d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate();
        }
      }

      var getDivText = function(t,v){ return t; };
      if(data.periods){
        getDivText = function(text,val){
          return getCurrentPeriod(val);
        }
      }

      updateShowedDates = function(val){
        dateSpan.textContent = getSpanText(data.options.time.range[val]);
        dateDiv.textContent = getDivText(dateSpan.textContent,val);
        updatePeriodDescription(val);
      }
    }

    update_items = function(){
          visibleItems = 0;
          if(data.storeItems.entities){
            entities_layer.clearLayers();
            data.storeItems.entities.forEach(function(feature){
              if(!feature._hidden){
                findEntityAttr(feature,current);
                if(!feature._outoftime){
                  entities_layer.addData(feature);
                  if(timeApplied("entities")){
                    visibleItems++;
                  }
                }
              }
            });
          }
          if(data.storeItems.markers){
            data.storeItems.markers.forEach(function(item){
              if(!item._hidden){
                findMarkerAttr(item,current);
                if(!item._outoftime){
                  updateMarker(item);
                  item.marker.addTo(markers_layer);
                  if(timeApplied("markers")){
                    visibleItems++;
                  }
                }else{
                  removeMarker(item);
                }
              }else{
                removeMarker(item);
              }
            });
            function removeMarker(item){
              if(item.marker){
                item.marker.removeFrom(markers_layer);
              }
            }
          }
          if(data.storeItems.links){
            data.storeItems.links.forEach(function(link){
              delete link._outoftime;
              if(!link._hidden){
                if(!data.storeItems.markers[nodes[link.source]]._outoftime && !data.storeItems.markers[nodes[link.target]]._outoftime){
                  findLinkAttr(link,current);
                  if(!link._outoftime){
                    updateLine(link);
                    link.line.addTo(links_layer);
                    if(timeApplied("links")){
                      visibleItems++;
                    }
                  }else{
                    link.line.removeFrom(links_layer);
                  }
                }else{
                  link._outoftime = true;
                  link.line.removeFrom(links_layer);
                }
              }else{
                link.line.removeFrom(links_layer);
              }
            });
          }
          update_entities_style();
          update_valueSelectors();
          update_legends();
          update_buttons();
          show_tables();

          updateShowedDates(current);
          inputRange.value = current;

          if((data.periods && data.options.byperiod) && ((data.options.periodLatitude && data.options.periodLongitude) || data.options.periodZoom)){
            var center = map.getCenter(),
                zoom  = map.getZoom();
            if(data.options.periodZoom){
              zoom = getValuesFromDF("periods","periodZoom")[current];
            }
            if(data.options.periodLatitude && data.options.periodLongitude){
              center = [getValuesFromDF("periods","periodLatitude")[current],getValuesFromDF("periods","periodLongitude")[current]];
            }
            map.setView(center, zoom);
          }
    };

    var inputRange = L.DomUtil.create('input','slider');
    inputRange.type = "range";
    inputRange.min = min;
    inputRange.max = max;
    inputRange.value = min;
    inputRange.style.width = "150px";
    inputRange.addEventListener("input",function(){
      updateShowedDates(+this.value);
    });
    inputRange.addEventListener("change",function(){
      goTo(+this.value);
    });

    var dateDiv = L.DomUtil.create('div','main-date-viewer',document.body);

    var dateSpan = L.DomUtil.create('span','date-viewer');
    var dateInput = L.DomUtil.create('input','date-input');
    dateInput.type = "text";
    dateInput.style.width = "100px";

    L.Control.timeControl = L.Control.extend({
      onAdd: function(map) {
        var el = L.DomUtil.create('div', 'leaflet-bar time-control panel-style');

        panelStopPropagation(el);

        var prev = L.DomUtil.create('a','leaflet-control-time-control time-control-prev',el);
        prev.href = "#";
        prev.appendChild(getSVG('prev'));
        prev.addEventListener("click",function(event){
          event.preventDefault();
          if(isRunning()){
            pause();
          }
          loadPrevFrame();
        });

        var loopButton = L.DomUtil.create('a','leaflet-control-time-control time-control-loop',el);
        loopButton.href = "#";
        loopButton.appendChild(getSVG('loop'));
        loopButton.addEventListener("click",function(event){
          event.preventDefault();
          loop = !loop;
          if(loop){
            loopButton.classList.add('pressed');
          }else{
            loopButton.classList.remove('pressed');
          }
        })

        var stop = L.DomUtil.create('a','leaflet-control-time-control time-control-stop',el);
        stop.href = "#";
        stop.appendChild(getSVG('stop'));
        stop.addEventListener("click",function(event){
          event.preventDefault();
          if(isRunning()){
            pause();
          }
          goTo(min);
        })

        var pauseButton = L.DomUtil.create('a','leaflet-control-time-control time-control-pause',el);
        pauseButton.href = "#";
        pauseButton.appendChild(getSVG('pause'));
        pauseButton.addEventListener("click",function(event){
          event.preventDefault();
          if(isRunning()){
            pause();
          }
        });

        var play = L.DomUtil.create('a','leaflet-control-time-control time-control-play',el);
        play.href = "#";
        play.appendChild(getSVG('play'));
        play.addEventListener("click",function(event){
          event.preventDefault();
          if(!isRunning()){
            document.querySelector(".tools-panel-wrapper").classList.add("collapse-panel");
            play.classList.add('pressed');
            pauseButton.classList.remove('pressed');
            newInterval();
          }
        });

        var next = L.DomUtil.create('a','leaflet-control-time-control time-control-next',el);
        next.href = "#";
        next.appendChild(getSVG('next'));
        next.addEventListener("click",function(event){
          event.preventDefault();
          if(isRunning()){
            pause();
          }
          loadNextFrame();
        });

        var date = L.DomUtil.create('div','leaflet-control-time-control time-control-date',el);
        date.appendChild(dateSpan);

        dateSpan.addEventListener("click",function(event){
          event.preventDefault();
          dateInput.value = "";
          date.removeChild(dateSpan);
          date.appendChild(dateInput);
          dateInput.focus();
        })

        dateInput.addEventListener("keydown",function(event){
          if(getKey(event)=="Enter"){
            event.preventDefault();
            var value = dateInput.value;
            if(data.options.time.type=="POSIXct"){
              value = (new Date(value).getTime())/1000;
            }else if(data.options.time.type=="Date"){
              value = (new Date(value).getTime())/86400000;
            }else{
              value = Number(dateInput.value);
            }
            if(data.periods && data.options.byperiod){
              var val = -1,
                  cont = 0;
              var starts = getValuesFromDF("periods","periodStart"),
                  ends = getValuesFromDF("periods","periodEnd");
              while(val==-1 && cont<starts.length){
                if(value>=starts[cont] && value<=ends[cont]){
                  val = cont;
                }
                cont++;
              }
              value = val;
            }else{
              value = data.options.time.range.indexOf(value);
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

        var dateslider = L.DomUtil.create('div','leaflet-control-time-control time-control-dateslider',el);
        dateslider.appendChild(inputRange);

        if(!(data.periods && data.options.periodDuration && data.options.byperiod)){
          var speedSelectionDiv = L.DomUtil.create('div','leaflet-control-time-control time-control-speed',el); 
          var speedRange = L.DomUtil.create('input','slider',speedSelectionDiv);
          speedRange.type = "range";
          speedRange.min = miliseconds/10;
          speedRange.max = miliseconds*10;
          speedRange.value = miliseconds;
          speedRange.style.direction = "rtl";
          speedRange.style.width = "50px";
          speedRange.addEventListener("change",function(event){
            miliseconds = +this.value;
            if(isRunning()){
              newInterval();
            }
          });
          var speedSpan = L.DomUtil.create('span','',speedSelectionDiv);
          speedSpan.innerHTML = "&nbsp;speed";
        }

        if(data.periods && data.options.time){
          var periodDiv = L.DomUtil.create('div','leaflet-control-time-control time-control-period',el); 
          var periodCheck = L.DomUtil.create('div','legend-check-box',periodDiv);
          if(data.options.byperiod){
            periodCheck.classList.add("checked");
          }
          L.DomUtil.create('span','',periodDiv).textContent = "period";
          periodDiv.style.cursor = "pointer";
          periodDiv.addEventListener("click",function(event){
            data.options.byperiod = !data.options.byperiod;
            periodCheck.classList[data.options.byperiod ? "add" : "remove"]("checked");
            renderMap(data);
          });
        }

        function newInterval(){
          clearInterval(frameInterval);
          interval();
          function interval(){
            var ms = 0;
            if(data.periods && data.options.periodDuration && data.options.byperiod){
              ms = getValuesFromDF("periods","periodDuration")[current]*1000;
            }else if(visibleItems){
              ms = miliseconds;
            }
            frameInterval = setTimeout(function(){
              if(current+step>max && !loop){
                pause();
              }else{
                loadNextFrame();
                interval();
              }
            }, ms);
          }
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
  }else{
    // timeless map
    update_items = function(){
      if(data.storeItems.entities){
        entities_layer.clearLayers();
        data.storeItems.entities.forEach(function(feature){
          if(!feature._hidden){
            entities_layer.addData(feature);
          }
        });
      }
      if(data.storeItems.links){
        links_layer.clearLayers();
        data.storeItems.links.forEach(function(link){
          updateLine(link);
          if(!link._hidden){
            link.line.addTo(links_layer);
          }
        });
      }
      if(data.storeItems.markers){
        markers_layer.clearLayers();
        data.storeItems.markers.forEach(function(item){
          updateMarker(item);
          if(!item._hidden){
            item.marker.addTo(markers_layer);
          }
        });
      }
      update_entities_style();
      update_valueSelectors();
      update_legends();
      update_buttons();
      show_tables();
    }
  }

  if(data.storeItems.entities){
    map.addLayer(entities_layer);
  }
  if(data.storeItems.links){
    map.addLayer(links_layer);
  }
  if(data.storeItems.markers){
    map.addLayer(markers_layer);
  }

  // display controls
  L.control.searchPanel({ position: 'topleft' }).addTo(map);
  if(L.control.hasOwnProperty("toolsPanel")){
    L.control.toolsPanel({ position: 'topleft' }).addTo(map);
  }
  L.control.zoomButtons({ position: 'bottomright' }).addTo(map);
  if(L.control.hasOwnProperty("timeControl")){
    L.control.timeControl({ position: 'bottomleft' }).addTo(map);
  }
  if(L.control.hasOwnProperty("buttonsPanel")){
    L.control.buttonsPanel({ position: 'bottomleft' }).addTo(map);
  }
  if(L.control.hasOwnProperty("legendsPanel")){
    L.control.legendsPanel({ position: 'topright' }).addTo(map);
  }

  update_items();

  function show_tables(event){
    var itemsList = Object.keys(data.storeItems);

    var tablesContainer = document.querySelector(".tables-section > .tables-container");
    if(!tablesContainer && event){
      var tablesSection = document.createElement("div");
      tablesSection.classList.add("tables-section");

      var tablesSectionHeader = document.createElement("div");
      tablesSectionHeader.classList.add("tables-section-header");
      tablesSection.appendChild(tablesSectionHeader);

      var closeButton = document.createElement("div");
      closeButton.classList.add("close-button");
      closeButton.addEventListener("click", function(){
        document.body.removeChild(tablesSection);
        itemsList.forEach(function(k){
          data.storeItems[k].forEach(function(item){
            delete item._table_selection;
          })
        })
        update_items();
      });
      tablesSectionHeader.appendChild(closeButton);

      var sizeButton = document.createElement("div");
      sizeButton.classList.add("size-button");
      sizeButton.addEventListener("click", function(){ tablesSection.classList.toggle("maximize"); });
      tablesSectionHeader.appendChild(sizeButton);

      var onlySelected = document.createElement("div");
      onlySelected.classList.add("only-selected-data");
      onlySelected.textContent = "Show only selected items ";
      var onlyselectedCheck = document.createElement("div");
      onlyselectedCheck.classList.add("legend-check-box");
      onlyselectedCheck.classList.add("checked");
      onlySelected.addEventListener("click", function(){
        onlyselectedCheck.classList.toggle("checked");
        show_tables();
      });
      onlySelected.appendChild(onlyselectedCheck);
      tablesSectionHeader.appendChild(onlySelected);

      var itemsNav = document.createElement("div");
      itemsNav.classList.add("items-nav");
      tablesSectionHeader.appendChild(itemsNav);
      var ul = document.createElement("ul");
      itemsNav.appendChild(ul);
      itemsList.forEach(function(itemsname){
          var li = document.createElement("li");
          li.textContent = itemsname;
          li.item = itemsname;
          li.addEventListener("click",function(){
            if(!this.classList.contains("active")){
              ul.childNodes.forEach(function(li){
                li.classList.remove("active");
              });
              this.classList.add("active");
            }
            show_tables();
          });
          ul.appendChild(li);
      })
      ul.childNodes[0].classList.add("active");

      tablesContainer = document.createElement("div");
      tablesContainer.classList.add("tables-container");
      tablesSection.appendChild(tablesContainer);
      document.body.appendChild(tablesSection);
    }

    if(tablesContainer){
      var ul = tablesContainer.parentNode.querySelector(".tables-section-header > .items-nav > ul");
      if(ul){
        ul.childNodes.forEach(function(d){
          if(d.classList.contains("active")){
            renderTable(tablesContainer,d.item);
          }else{
            var tab = tablesContainer.getElementsByClassName(d.item+"-table-wrapper")[0];
            if(tab){
              tablesContainer.removeChild(tab);
            }
          }
        });
      }
    }

    function renderTable(container,items){
      if(!container || !data.storeItems[items] || !data.storeItems[items].length){
        return
      }

      var types = [],
          columns = data[items].columns.filter(function(d,i){
              if(items=="markers" && d==data.options.image){
                return false;
              }
              if(items=="markers" && d==data.options.markerInfo){
                return false;
              }
              if(d.charAt(0)!="_"){
                types.push(data[items].types[i]);
                return true;
              }
              return false;
          });

      var tbody = container.querySelector(".table-wrapper."+items+"-table-wrapper > table > tbody");
      if(!tbody){
        var div = document.createElement("div");
        div.classList.add(items+"-table-wrapper");
        div.classList.add("table-wrapper");

        var title = document.createElement("div");
        title.classList.add("table-title");
        title.innerHTML = "<span>" + items + "</span>";
        div.appendChild(title);

        var xlsxButton = document.createElement("img");
        xlsxButton.setAttribute("src", b64Icons.xlsx);
        xlsxButton.setAttribute("alt", "xlsx");
        xlsxButton.style.cursor = "pointer";
        xlsxButton.style.marginLeft = "14px";
        xlsxButton.addEventListener("click",table2xlsx);
        title.appendChild(xlsxButton);

        var matchedButton = document.createElement("button");
        matchedButton.classList.add("primary");
        matchedButton.textContent = "Matched in table";
        matchedButton.style.marginLeft = "14px";
        matchedButton.addEventListener("click",function(){
          data.storeItems[items].forEach(function(item){
            delete item._selected;
            if(item._table_selection){
              delete item._table_selection;
              item._selected = true;
            }
          });
          update_items();
        });
        title.appendChild(matchedButton);

        var table = document.createElement("table");

        // draw header
        var thead = document.createElement("thead");
        var tr = document.createElement("tr");
        var desc0 = columns.map(function(){ return false; }),
            desc = desc0.slice();
        columns.forEach(function(col,i){
          var sort1 = function(a,b){
                if(a.properties[col]==null) return 1;
                if(b.properties[col]==null) return -1;
                return compareFunction(a.properties[col],b.properties[col],desc[i]);
          };
          var th = document.createElement("th");
          th.classList.add("sorting");
          if(types[i]=="number"){
            th.style.textAlign =  "right";
          }
          th.textContent = col;
          th.addEventListener("click",function(){
            renderTableBody(tbody,sort1);
            var desci = desc[i];
            desc = desc0.slice();
            desc[i] = !desci;
            tr.childNodes.forEach(function(th){
              th.classList.remove("sorting_desc");
              th.classList.remove("sorting_asc");
            })
            th.classList.add(desci ? "sorting_desc" : "sorting_asc");
          });
          tr.appendChild(th);
        });
        thead.appendChild(tr);
        table.appendChild(thead);

        // draw body
        tbody = document.createElement("tbody");
        tbody.lastselected = -1;
        table.appendChild(tbody);

        div.appendChild(table);
        container.appendChild(div);
      }

      renderTableBody(tbody);

      function getItemsTable(){
        var onlySelectedItems = container.parentNode.querySelector(".only-selected-data > .legend-check-box.checked") ? true : false;
        return data.storeItems[items].filter(function(item){
          return (!onlySelectedItems || item._selected || item._table_selection) && !item._hidden && !item._outoftime;
        });
      }

      function renderTableBody(tbody,order){
        tbody.innerHTML = "";
        var subitems = getItemsTable();
        if(!subitems.length){
          var tr = document.createElement("tr");
          var td = document.createElement("td");
          td.setAttribute("colspan", columns.length);
          td.textContent = "Select some items in the map to see its attributes";
          tr.appendChild(td);
          tbody.appendChild(tr);
        }else{
          if(order){
            subitems.sort(order);
          }
          subitems.forEach(function(item,j){
            var tr = document.createElement("tr");
            columns.forEach(function(col,i){
              var td = document.createElement("td");
              if(types[i]=="number"){
                td.style.textAlign =  "right";
              }
              td.textContent = renderCell(item.properties[col]);
              td.addEventListener("mousedown",function(event){
                event.preventDefault();
              })
              tr.appendChild(td);
            });
            if(item._table_selection){
              tr.classList.add("selected-row");
            }
            tr.addEventListener("click",function(event){
              var selections = false;
              if(event.shiftKey && tbody.lastselected!=-1){
                selections = sequence(Math.min(tbody.lastselected,this.rowIndex)-1,Math.max(tbody.lastselected,this.rowIndex));
              }
              subitems.forEach(function(item,i){
                var selected = item._table_selection ? true : false;

                if(selections){
                  if(event.ctrlKey || event.metaKey)
                    selected = selected || selections.indexOf(i)!=-1;
                  else
                    selected = selections.indexOf(i)!=-1;
                }else{
                  if(event.ctrlKey || event.metaKey){
                    selected = selected ^ i==j;
                  }else{
                    selected = i==j;
                  }
                }

                if(selected){
                  item._table_selection = true;
                }else{
                  delete item._table_selection;
                }
              });

              tbody.lastselected = item._table_selection ? this.rowIndex : -1;

              update_items();
            })
            tbody.appendChild(tr);
          });
        }
      }

      function table2xlsx(){
        var nodes = [columns];
        getItemsTable().forEach(function(item){
          nodes.push(columns.map(function(col){ return renderCell(item.properties[col]); }));
        })

        var itemsdata = {};
        itemsdata[items] = nodes;

        if(nodes.length == 1){
          var win = displayWindow()
          var p = document.createElement("p");
          p.classList.add("window-message");
          p.textContent = "No "+items;
          win.appendChild(p);
        }else{
          downloadExcel(itemsdata, document.querySelector("head>title").textContent);
        }
      }
    }

    function renderCell(txt){
      if(txt == null){
        return "";
      }
      if(typeof txt == 'object'){
          return txt.join("; ");
      }
      if(typeof txt == 'number'){
        return formatter(txt);
      }
      return String(txt);
    }
  }

  function timeApplied(items){
    if(!items){
      items = Object.keys(data.storeItems);
    }
    if(typeof items == "string"){
      items = [items];
    }
    for(var i=0; i<items.length; i++){
      if(data.hasOwnProperty(items[i])
          && ((data.options.hasOwnProperty("time")
                && data[items[i]].columns.indexOf(data.options.start)!=-1
                && data[items[i]].columns.indexOf(data.options.end)!=-1)
              || (data.periods && data.options.periodInItems
                && data[items[i]].columns.indexOf(data.options.periodInItems)!=-1))){
        return true;
      }
    }
    return false;
  }

  function findEntityAttr(item,current){
    var name = item.properties[data.options.entityName],
        names = getValuesFromDF("entities","entityName");
    findAttributes("entities",item,name,names,current);
  }

  function findMarkerAttr(item,current){
    var name = item.properties[data.options.markerName],
        names = getValuesFromDF("markers","markerName");
    findAttributes("markers",item,name,names,current);
  }

  function findLinkAttr(item,current){
    var name = item.source+"_"+item.target,
        names = data.links.data[0].map(function(d,i){ return d+"_"+data.links.data[1][i]; });
    findAttributes("links",item,name,names,current);
  }

  function findAttributes(items,item,name,names,current){
    if(timeApplied(items)){
      item._outoftime = true;
      if(data.options.periodInItems && data[items].columns.indexOf(data.options.periodInItems)!=-1){
        var periods = getValuesFromDF(items,"periodInItems"),
            period = getCurrentPeriod(current);
        loadAttributes(function(i){ return periods[i]==period; });
      }else{
        var starts = getValuesFromDF(items,"start"),
            ends = getValuesFromDF(items,"end");
        loadAttributes(function(i){ return inTime(starts[i],ends[i],current); });
      }
    }
    function loadAttributes(condition){
        for(var i=names.length-1; i>=0; i--){
          if(names[i]==name){
            if(condition(i)){
              data[items].columns.forEach(function(k,j){
                item.properties[k] = data[items].data[j][i];
              });
              delete item._outoftime;
              return;
            }
          }
        }
    }
    function inTime(start,end,current){
      if(end===null){
        end = +data.options.time.max;
      }
      if(data.periods && data.options.byperiod){
        var periodStart = getValuesFromDF("periods","periodStart")[current],
            periodEnd = getValuesFromDF("periods","periodEnd")[current];
        return !(end<periodStart) && !(start>periodEnd);
      }else{
        var date = data.options.time.range[current];
        return start<=date && end>=date;
      }
    }
  }

  function getCurrentPeriod(val){
    if(data.periods){
      if(data.options.byperiod){
        return getValuesFromDF("periods","periodName")[val];
      }else{
        var starts = getValuesFromDF("periods","periodStart"),
            ends = getValuesFromDF("periods","periodEnd"),
            names = getValuesFromDF("periods","periodName");
        var date = data.options.time.range[val];
        for(var i=0; i<names.length; i++){
          if(date>=starts[i] && date<=ends[i]){
            return names[i];
          }
        }
        return "";
      }
    }
    return false;
  }

  function updatePeriodDescription(val){
    if(data.periods && data.options.periodDescription){
      var periodDescription = document.body.getElementsByClassName("period-description");
      if(periodDescription.length){
        periodDescription = periodDescription[0];
      }else{
        periodDescription = document.createElement("div");
        periodDescription.classList.add("period-description");
        periodDescription.appendChild(document.createElement("span"));
        document.body.appendChild(periodDescription);
      }
      if(data.options.byperiod){
        periodDescription.childNodes[0].textContent = getValuesFromDF("periods","periodDescription")[val];
      }else{
        periodDescription.childNodes[0].textContent = "";
      }
    }
  }

  function updateMarker(item){

    var attr = item.properties;
    if(!item.marker){
      item.marker = new L.Marker();
      item.marker.on("click",function(event){
        item.marker.unbindPopup();
        if(data.options.markerText){
          if(!(event.originalEvent.ctrlKey || event.originalEvent.metaKey)){
            item.marker.bindPopup(attr[data.options.markerText]).openPopup();
          }
        }
        if(item.info){
          if(!(event.originalEvent.ctrlKey || event.originalEvent.metaKey)){
            map.setView(event.target.getLatLng());
          }
          infoPanel.changeContent(item.info);
        }
        if(event.originalEvent.ctrlKey || event.originalEvent.metaKey){
          item._selected = !item._selected;
        }else{
          data.storeItems.markers.forEach(function(item){
            delete item._selected;
          });
          item._selected = true;
        }
        update_items();
      });
    }

    if(data.options.markerInfo){
      if(item.info!=attr[data.options.markerInfo]){
        item.info = attr[data.options.markerInfo];
      }
    }

    if((item.latitude != attr[data.options.markerLatitude]) || (item.longitude != attr[data.options.markerLongitude])){
      item.latitude = attr[data.options.markerLatitude];
      item.longitude = attr[data.options.markerLongitude];
      item.marker.setLatLng([item.latitude,item.longitude]);
    }

    // change color
    if(item.color != colorManagers.markerColor.getItemColor(attr)){
        item.color = colorManagers.markerColor.getItemColor(attr);
        if(!data.options.image || !attr[data.options.image]){
          item.marker.setIcon(getIcon(item.color));
        }else{
          setImageColor(item);
        }
    }

    if(data.options.image && attr[data.options.image]){
      // change image
      if(item.image != attr[data.options.image]){
        var image = new Image();
        image.onload = function(){
          var ratio = getImgRatio(this),
              h = 40,
              w = 40*ratio;
          var icon = L.icon({
            iconUrl: attr[data.options.image],

            iconSize:     [w, h], // size of the icon
            iconAnchor:   [w/2, h/2], // point of the icon which will correspond to marker's location
            popupAnchor:  [0, -h/2] // point from which the popup should open relative to the iconAnchor
          });
          item.marker.setIcon(icon);
          item.marker._icon.classList.add("image-marker");
          setImageColor(item);
        }
        image.src = item.image = attr[data.options.image];
      }
    }

    if(item.marker._icon){
      item.marker._icon.classList[item._selected ? "add" : "remove"]("selected-marker");
      item.marker._icon.classList[item._table_selection ? "add" : "remove"]("table-selected-marker");
    }

    if(data.options.markerLabel){
          var str = String(attr[data.options.markerLabel]);
          if(item.label != str){
            item.label = str;
            item.marker.unbindTooltip();
            item.marker.bindTooltip(str,{
              permanent: true,
              direction: "center",
              className: item.image ? "image-label" : "marker-label"
            }).openTooltip();
          }
    }else{
          item.marker.unbindTooltip();
          delete item.label;
          delete item.text;
    }

    function setImageColor(item){
      if(item.marker._icon){
        if(data.options.markerColor && item.color){
          item.marker._icon.style.borderWidth = "3px";
          item.marker._icon.style.borderColor = item.color;
        }else{
          item.marker._icon.style.borderWidth = 0;
        }
      }
    }
  }

  function update_legends(){
    var legendsPanel = document.querySelector(".legends-panel-wrapper:not(.collapse-panel) > .legends-panel");
    if(legendsPanel){
      var goback = legendsPanel.getElementsByClassName("goback")[0];
      goback.classList[some_filtered() ? "remove" : "add"]("disabled");

      var legendsContent = legendsPanel.getElementsByClassName("legends-content")[0];
      legendsContent.innerHTML = "";
      listLegend(legendsContent,"markers","markerColor","Marker color");
      listLegend(legendsContent,"entities","entityColor","Entity color");
      listLegend(legendsContent,"links","linkColor","Link color");

      var bottom = legendsPanel.getElementsByClassName("legend-bottom-controls")[0];
      if(!legendsContent.getElementsByClassName("legend-check-box").length){
        bottom.style.display = "none";
      }else{
        bottom.style.display = "block";
        var checkbox = bottom
          .getElementsByClassName("legend-selectall")[0]
          .getElementsByClassName("legend-check-box")[0];
        var checked = legendsContent.getElementsByClassName("legend-check-box checked").length;
        checkbox.classList[checked ? "add" : "remove"]("checked");

        var filterButton = bottom.getElementsByClassName("legend-bottom-button")[0];
        filterButton.classList[some_selected()&&!all_selected() ? "remove" : "add"]("disabled");
      }
      legendsPanel.parentNode.style.display = legendsContent.childNodes.length ? "block" : "none";
    }

    function listLegend(container,items,itemVisual,title){
      if(data.storeItems[items] && data.options[itemVisual]){
        var column = data.options[itemVisual],
            idx = data[items].columns.indexOf(column);
        if(idx!=-1){
          if(data[items].types[idx]=="number"){
            var domain = colorManagers[itemVisual].getDomain(),
                range = colorManagers[itemVisual].getRange();

            var legend = L.DomUtil.create('div','legend',container);
            L.DomUtil.create('div','legend-title',legend).textContent = title+" / "+column;
            L.DomUtil.create('div','legend-separator',legend);

            var scaleLinear = L.DomUtil.create('div','legend-scale-gradient',legend);
            scaleLinear.style.height = "10px";
            scaleLinear.style.width = "100%";
            scaleLinear.style.backgroundImage = "linear-gradient(to right, " + range.join(", ") + ")";

            L.DomUtil.create('span','domain1',legend).textContent = formatter(domain[0]);
            L.DomUtil.create('span','domain2',legend).textContent = formatter(domain[domain.length-1]);
          }else{
            var values = data.storeItems[items].filter(function(item){
              return !item._hidden && !item._outoftime;
            }).map(function(item){
              return item.properties[column];
            }).filter(uniqueValues).sort(sortAsc);

            if(values.length){
              var legend = L.DomUtil.create('div','legend',container);
              L.DomUtil.create('div','legend-title',legend).textContent = title+" / "+column;
              L.DomUtil.create('div','legend-separator',legend);
              values.forEach(function(d){
                var legendItem = L.DomUtil.create('div','legend-item',legend);
                var checkbox = L.DomUtil.create('div','legend-check-box',legendItem);
                L.DomUtil.create('div','legend-bullet',legendItem).style.backgroundColor = colorManagers[itemVisual].getColor(d);
                L.DomUtil.create('span','',legendItem).textContent = d;

                legendItem.style.cursor = "pointer";
                legendItem.addEventListener("click",function(){
                  var checked = checkbox.classList.contains("checked");
                  data.storeItems[items].forEach(function(item){
                    if(String(item.properties[column]) == d){
                      item._selected = !checked;
                    }
                  })
                  update_items();
                });

                if(allItemsSelectedByValue(data.storeItems[items],column,d)){
                  checkbox.classList.add("checked");
                }
              })
            }
          }
        }
      }
    }
  }

  function update_buttons(){
    var panel = document.querySelector(".buttons-panel");
    if(panel){
      panel.getElementsByClassName("selectall-button")[0].classList[all_selected()?"add":"remove"]("disabled");
      panel.getElementsByClassName("filter-button")[0].classList[some_selected()&&!all_selected()?"remove":"add"]("disabled");
      panel.getElementsByClassName("resetfilter-button")[0].classList[some_filtered()?"remove":"add"]("disabled");
    }
  }

  function update_entities_style(){
    if(data.storeItems.entities){
      entities_layer.eachLayer(function(layer){
        var fillColor = '#ffff00';
        if(layer.feature._table_selection){
          fillColor = '#ff0000';
        }else if(!layer.feature._selected){
          fillColor = colorManagers.entityColor.getItemColor(layer.feature.properties);
        }
        layer.setStyle({ weight: 1, color: "#777777", fillColor: fillColor, fillOpacity: data.options.entityOpacity });

        if(data.options.entityLabel){
          layer.bindTooltip(String(layer.feature.properties[data.options.entityLabel]),{ sticky: true });
        }
      });
    }
  }

  function update_valueSelectors(){
    var panel = document.querySelector(".tools-panel-wrapper:not(.collapse-panel) > .tools-panel");
    if(panel){
      ["markers","links","entities"].forEach(function(d){
        var tab = panel.getElementsByClassName("tools-tabs")[0].getElementsByClassName("tab-"+d)[0];
        if(tab && tab.style.display!="none"){
          var element = tab.getElementsByClassName("items-filter")[0];
          if(element){
            if(!element.querySelector(".items-filter > .value-selector > .slider-wrapper > .slider")){
              var select = element.querySelector(".items-filter > .select-wrapper > select");
              select.dispatchEvent(new Event('change'));
            }
            var filterButton = element.getElementsByClassName("filter-button")[0];
            filterButton.classList[some_selected() ? "remove" : "add"]("disabled");
            var resetfilterButton = element.getElementsByClassName("resetfilter-button")[0];
            resetfilterButton.classList[some_filtered() ? "remove" : "add"]("disabled");
          }
        }
      });
    }
  }

  function select_none(){
    if(data.storeItems.markers){
      data.storeItems.markers.forEach(function(item){
        delete item._selected;
      });
    }
    if(data.storeItems.entities){
      data.storeItems.entities.forEach(function(f){
        delete f._selected;
      });
    }
    if(data.storeItems.links){
      data.storeItems.links.forEach(function(item){
        delete item._selected;
      });
    }
    update_items();
  }

  function filter_selected(){
    filter_selected_markers();
    filter_selected_geometries();
    update_items();
  }

  function filter_selected_markers(){
    if(data.storeItems.markers){
      data.storeItems.markers.forEach(function(item){
        if(!item._selected){
          item._hidden = true;
        }
      });
    }
    update_items();
  }

  function filter_selected_links(){
    if(data.storeItems.links){
      data.storeItems.links.forEach(function(item){
        if(!item._selected){
          item._hidden = true;
        }
      });
    }
    update_items();
  }

  function filter_selected_geometries(){
    if(data.storeItems.entities){
      data.storeItems.entities.forEach(function(feature){
        if(!feature._selected){
         feature._hidden = true;
        }
      });
    }
    update_items();
  }

  function remove_markers_filters(){
    if(data.storeItems.markers){
      data.storeItems.markers.forEach(function(item){
        delete item._hidden;
      });
    }
    update_items();
  }

  function remove_links_filters(){
    if(data.storeItems.links){
      data.storeItems.links.forEach(function(item){
        delete item._hidden;
      });
    }
    update_items();
  }
  
  function remove_geometries_filters(){
    if(data.storeItems.entities){
      data.storeItems.entities.forEach(function(feature){
        delete feature._hidden;
      });
    }
    update_items();
  }

  function remove_filters(){
    if(data.storeItems.markers){
      data.storeItems.markers.forEach(function(item){
        delete item._hidden;
      });
    }
    if(data.storeItems.entities){
      data.storeItems.entities.forEach(function(feature){
        delete feature._hidden;
      });
    }
    if(data.storeItems.links){
      data.storeItems.links.forEach(function(item){
        delete item._hidden;
      });
    }
    update_items();
  }

  function select_all(){
    if(data.storeItems.markers){
      data.storeItems.markers.forEach(function(item){
          item._selected = true;
      });
    }
    if(data.storeItems.entities){
      data.storeItems.entities.forEach(function(feature){
         feature._selected = true;
      });
    }
    if(data.storeItems.links){
      data.storeItems.links.forEach(function(item){
        item._selected = true;
      });
    }
    update_items();
  }

  function shortcuts(event){
    var key = getKey(event);
    if(event.ctrlKey || event.metaKey){
      switch(key){
        case "+":
          event.preventDefault();
          map.setZoom(map.getZoom()+zoomstep);
          return;
        case "-":
          event.preventDefault();
          map.setZoom(map.getZoom()-zoomstep);
          return;
        case "0":
          event.preventDefault();
          map.setZoom(data.options.zoom);
          return;
        case "f":
          event.preventDefault();
          if(some_selected()){
            filter_selected();
          }
          return;
        case "r":
          event.preventDefault();
          remove_filters();
          return;
        case "s":
          event.preventDefault();
          select_all();
          return;
      }
    }else{
      switch(key){
        case " ":
          event.preventDefault();
          if(timeApplied()){
            var playbutton = document.querySelector("a.time-control-play");
            if(playbutton.classList.contains('pressed')){
              document.querySelector("a.time-control-pause").dispatchEvent(new Event('click'));
            }else{
              playbutton.dispatchEvent(new Event('click'));
            }
          }
          return;
      }
    }
  }

  function some_selected(){
    var a = data.storeItems.markers ? data.storeItems.markers.filter(function(item){ return item._selected; }).length : false,
        b = data.storeItems.entities ? data.storeItems.entities.filter(function(feature){ return feature._selected; }).length : false;
    return a || b;
  }

  function all_selected(){
    var a = data.storeItems.markers ? data.storeItems.markers.filter(function(item){ return !item._selected; }).length : false,
        b = data.storeItems.entities ? data.storeItems.entities.filter(function(feature){ return !feature._selected; }).length : false;
    return !a && !b;
  }

  function some_filtered(){
    var a = data.storeItems.markers ? data.storeItems.markers.filter(function(item){ return item._hidden; }).length : false,
        b = data.storeItems.entities ? data.storeItems.entities.filter(function(feature){ return feature._hidden; }).length : false;
    return a || b;
  }
} // end function onload

// color management
function colorMgmt(items,itemProp){
  this._items = items;
  this._itemProp = itemProp;
  this._itemCol;
  this._scale;
}

colorMgmt.prototype = {
  getItemColor: function(item){
    if(data.options[this._itemProp]!=this._itemCol){
      this.changeLevels(data.options[this._itemProp]);
    }

    return this.getColor(this._itemCol ? item[this._itemCol] : null);
  },
  getColor: function(value){
    var color = data.options.defaultColor;
    if(this._scale){
      color = this._scale(value);
      if(!color){
        color = "#777777";
      }
    }
    return color;
  },
  getDomain: function(){
    if(this._scale){
      return this._scale.domain();
    }
  },
  getRange: function(){
    if(this._scale){
      return this._scale.range();
    }
  },
  changeLevels: function(x){
    this._itemCol = x;
    if(x){
      var col = data[this._items].columns.indexOf(x);
      if(col!=-1){
        var explicitCol = data[this._items].columns.indexOf("_"+this._itemProp+"_"+this._itemCol);
        if(explicitCol!=-1){
          // use explicit colors
          var aux = uniqueRangeDomain(data[this._items].data[col], data[this._items].data[explicitCol]);
          this._scale = d3.scaleOrdinal()
            .domain(aux.domain)
            .range(aux.range)
        }else{
          var type = data[this._items].types[col];
          if(type=="number"){
            if(!data.options["colorScale"+this._itemProp]){
              data.options["colorScale"+this._itemProp] = "WhBu";
            }
            this._scale = d3.scaleLinear()
            .domain(valuesExtent(data[this._items].data[col]))
            .range(data.colors.colorScales[data.options["colorScale"+this._itemProp]])
          }else{
            this._scale = d3.scaleOrdinal()
            .domain(data[this._items].data[col])
            .range(data.colors.categoryColors)
          }
        }
      }else{
        this._scale = undefined;
      }
    }else{
      this._scale = undefined;
    }
  }
}

function uniqueRangeDomain(domainCol,rangeCol){
    var aux = [],
        domain = [],
        range = [];
    for(var i = 0; i<domainCol.length; i++){
      var value = domainCol[i]+"|"+rangeCol[i];
      if(aux.indexOf(value)==-1){
        aux.push(value);
        domain.push(domainCol[i]);
        range.push(rangeCol[i]);
      }
    }
    return {domain: domain, range: range};
}

function valuesExtent(values){
  var min = Infinity, max = -Infinity;
  for(var i=0; i<values.length; i++){
    if(typeof values[i] == "number"){
      if(values[i]<min){
        min = values[i];
      }
      if(values[i]>max){
        max = values[i];
      }
    }
  }
  return [min,max];
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
        next: "m0 0v8l6-4-6-4zm6 4v4h2v-8h-2v4z",
        search: "m3.1978-0.000032c-1.7605 0-3.1978 1.4354-3.1978 3.1936s1.4373 3.1936 3.1978 3.1936c0.59181 0 1.1454-0.1644 1.6218-0.44656 0.0028 0.003 0.0043 0.0064 0.0073 0.0094l1.8824 1.8799c0.22707 0.22676 0.59217 0.22676 0.81923 0l0.30122-0.30083c0.22706-0.22678 0.22706-0.5914 0-0.81816l-1.8803-1.8778c-0.0032-0.0019-0.0071-0.0024-0.01042-0.0042 0.2883-0.47928 0.45652-1.0378 0.45652-1.6353 0-1.7582-1.4373-3.1936-3.1978-3.1936zm0 0.93684c1.2537 0 2.2597 1.0047 2.2597 2.2568s-1.006 2.2578-2.2597 2.2578-2.2597-1.0057-2.2597-2.2578 1.006-2.2568 2.2597-2.2568z"
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

function getKey(event){
  if(typeof event.key != "undefined"){
    var key = event.key;

    // alternative names in Internet Explorer
    var alt = {
      "Esc": "Escape",
      "Spacebar": " ",
      "Left": "ArrowLeft",
      "Up": "ArrowUp",
      "Right": "ArrowRight",
      "Down": "ArrowDown",
      "Del": "Delete"
    }
    if(alt.hasOwnProperty(key)){
      key = alt[key];
    }

    if(key.length==1){
      key = key.toLowerCase();
    }

    return key;
  }else{
    // old browsers
    var key = event.which || event.keyCode;

    // equivalence key codes - names
    var keyCodes = {
  '8': "Backspace",
  '9': "Tab",
  '13': "Enter",
  '16': "Shift",
  '17': "Control",
  '18': "Alt",
  '19': "Pause",
  '20': "CapsLock",
  '27': "Escape",
  '32': " ",
  '33': "PageUp",
  '34': "PageDown",
  '35': "End",
  '36': "Home",
  '37': "ArrowLeft",
  '38': "ArrowUp",
  '39': "ArrowRight",
  '40': "ArrowDown",
  '45': "Insert",
  '46': "Delete",
  '48': "0",
  '49': "1",
  '50': "2",
  '51': "3",
  '52': "4",
  '53': "5",
  '54': "6",
  '55': "7",
  '56': "8",
  '57': "9",
  '60': "<",
  '65': "a",
  '66': "b",
  '67': "c",
  '68': "d",
  '69': "e",
  '70': "f",
  '71': "g",
  '72': "h",
  '73': "i",
  '74': "j",
  '75': "k",
  '76': "l",
  '77': "m",
  '78': "n",
  '79': "o",
  '80': "p",
  '81': "q",
  '82': "r",
  '83': "s",
  '84': "t",
  '85': "u",
  '86': "v",
  '87': "w",
  '88': "x",
  '89': "y",
  '90': "z",
  '96': "0",
  '97': "1",
  '98': "2",
  '99': "3",
  '100': "4",
  '101': "5",
  '102': "6",
  '103': "7",
  '104': "8",
  '105': "9",
  '106': "*",
  '107': "+",
  '108': ".",
  '109': "-",
  '110': ".",
  '111': "/",
  '171': "+",
  '173': "-",
  '187': "+",
  '189': "-",
  '190': "."
    //TODO: complete list
    };

    return keyCodes[String(key)];
  }
}

function allItemsSelectedByValue(items,column,value){
        var checked = false;
        for(var i=0; i<items.length; i++){
          if(!items[i]._hidden && !items[i]._outoftime){
            if(String(items[i].properties[column]) == value){
              if(items[i]._selected){
                checked = true;
              }else{
                checked = false;
                break;
              }
            }
          }
        }
        return checked;
}

function addVisualSelector(sel,items,item,visual,update,colorManagers){
    var wrapper = L.DomUtil.create('div','visual-selector',sel);
    var div = L.DomUtil.create('div','',wrapper);
    div.innerHTML = "<span>"+visual+"</span>";

    var options = data[items].columns.filter(function(d){
        return d.charAt(0)!="_";
      }).map(function(d){
        return [d,d];
      })
    options.unshift(["_none_","-none-"])
    displaySelectWrapper(wrapper,options,function(value){
      if(value=="_none_"){
        delete data.options[item+visual];
      }else{
        data.options[item+visual] = value;
      }
      update();
      if(visual=="Color"){
        var idx = data[items].columns.indexOf(value);
        if(idx!=-1 && data[items].types[idx]=="number"){
            displayScalePicker(item+visual,function(){
              colorManagers[item+visual].changeLevels(value);
              update();
            });
        }
      }
    },data.options[item+visual]);
}

function displayItemFilter(div,items,filter_selected,remove_filters,update_items){
    L.DomUtil.create('h4','',div).innerHTML = "Filter";

    var selectChangeFunction = function(value){
      valueSelector.innerHTML = "";
      var values = data.storeItems[items].filter(function(d){ return !d._hidden && !d._outoftime; }).map(function(d){ return d.properties[value]; }).filter(uniqueValues).sort(sortAsc);
      if(data[items].types[data[items].columns.indexOf(value)]=="number"){
        var extent = valuesExtent(values),
            mid = (extent[0]+extent[1])/2;

        var slider = brushSlider()
          .domain(extent)
          .current([mid,mid])
          .callback(function(selectedValues){
            data.storeItems[items].forEach(function(item){
              delete item._selected;
              if(!(item._hidden || item._outoftime) && (item.properties[value]>=selectedValues[0] && item.properties[value]<=selectedValues[1])){
                item._selected = true;
              }
            });
            update_items();
          })
        slider(valueSelector);
      }else{
        var select = L.DomUtil.create('select','',valueSelector);
        select.setAttribute("multiple","multiple");
        select.setAttribute("size",8);
        values.forEach(function(v){
          var opt = L.DomUtil.create('option','',select);
          opt.innerHTML = v;
          opt.value = v;
          if(allItemsSelectedByValue(data.storeItems[items],value,v)){
            opt.selected = true;
          }
        })
        select.addEventListener("change",function(){
          var values = getSelectValues(this);
          data.storeItems[items].forEach(function(item){
            delete item._selected;
            if(values.indexOf(item.properties[value])!=-1){
              item._selected = true;
            }
          });
          update_items();
        });
      }
    }

    var columns = data[items].columns.filter(function(d){ return d.charAt(0)!="_"; });
    displaySelectWrapper(div,columns,selectChangeFunction,columns[0]);
    var valueSelector = L.DomUtil.create('div','value-selector',div);

    var filter = L.DomUtil.create('button','primary filter-button',div);
    filter.innerHTML = "Filter";
    filter.addEventListener("click",filter_selected);

    var clear = L.DomUtil.create('button','primary-outline clear resetfilter-button',div);
    clear.innerHTML = "Clear";
    clear.addEventListener("click",remove_filters);
}

function displaySelectWrapper(element,options,callback,def){
    var selectWrapper = L.DomUtil.create('div','select-wrapper',element);
    var select = L.DomUtil.create('select','',selectWrapper);
    options.forEach(function(d){
      var opt = L.DomUtil.create('option','',select);
      var text = typeof d == 'object' ? d[1] : d,
          val = typeof d == 'object' ? d[0] : d;
      opt.innerHTML = text;
      opt.value = val;
    });
    select.addEventListener("change",function(){ callback(this.value); });
    if(def){
      select.value = def;
    }
}

function displayScalePicker(option,callback){
    var attr = data.options[option],
        scaleKeys = Object.keys(data.colors.colorScales),
        r = 14,
        itemsPerRow = 8,
        row,
        win = displayWindow((r*2+12)*itemsPerRow);

    var title = document.createElement("h2");
    title.innerHTML = "Select a color scale for \""+attr+"\"";
    win.appendChild(title);

    var picker = document.createElement("div");
    picker.classList.add("picker");
    win.appendChild(picker);

    scaleKeys.forEach(function(d){
      if(!row || row.getElementsByTagName("span").length>=itemsPerRow){
        row = document.createElement("div");
        row.classList.add("row");
        picker.appendChild(row);
      }

      var rowSpan = document.createElement("span");
      rowSpan.style.width = (r*2+1)+"px";
      rowSpan.style.height = (r*2+1)+"px";
      rowSpan.val = d;
      rowSpan.classList[data.options["colorScale"+option]==d ? "add" : "remove"]("active")
      rowSpan.addEventListener("click",function(){
          var spans = picker.getElementsByTagName("span");
          for(var i=0; i<spans.length; i++){
            spans[i].classList.remove("active");
          }
          this.classList.add("active");
      })
      row.appendChild(rowSpan);

      var canvas = document.createElement("canvas");
      canvas.width = r*2;
      canvas.height = r*2;
      canvas.textContent = d;
      rowSpan.appendChild(canvas);

      var ctx = canvas.getContext("2d");

      // Create gradient
      var grd = ctx.createLinearGradient(0,0,canvas.width,0),
          colors = data.colors.colorScales[d];
      colors.forEach(function(c,i){
        grd.addColorStop(i/(colors.length-1),c);
      })

      // Fill with gradient
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(r,r,r,0,2*Math.PI);
      ctx.fill();
    });

    var center = document.createElement("center");
    var button = document.createElement("button");
    button.classList.add("primary");
    button.textContent = "Select";
    button.addEventListener("click",function(){
          data.options["colorScale"+option] = picker.getElementsByClassName("active")[0].val;
          callback();
          var bg = win.parentNode.parentNode;
          bg.parentNode.removeChild(bg);
    })
    center.appendChild(button);
    win.appendChild(center);
}

function displayWindow(w,h){
  var bg = document.createElement("div");
  bg.classList.add("window-background")
  bg.style.width = "100%";
  bg.style.height = "100%";
  document.body.appendChild(bg);

  var win = document.createElement("div");
  win.classList.add("window");
  win.addEventListener("click",function(event){ event.stopPropagation(); });
  win.style.marginTop = "10%";
  win.style.width = w ? w+"px" : "50%";
  bg.appendChild(win);

  var closeButton = document.createElement("div");
  closeButton.classList.add("close-button")
  closeButton.addEventListener("click", function(){ bg.parentNode.removeChild(bg); });
  win.appendChild(closeButton);

  winContent = document.createElement("div");
  winContent.classList.add("window-content");
  win.appendChild(winContent);

  if(h){
    winContent.style.height = h+"px";
  }else{
    winContent.style.maxHeight = "50%";
  }

  return winContent;
}

// create panel functions
function createNewPanel(name,title,parent){
    var panel = L.DomUtil.create('div', 'leaflet-bar '+name+'-panel panel-style',parent);
    panel.style.width = "240px";

    panelStopPropagation(panel);
    if(title){
        createPanelHeader(panel,title);
    }

    return panel;
}

function panelStopPropagation(panel){
        ["click","wheel","mousedown","pointerdown","dblclick"].forEach(function(d){
          panel.addEventListener(d,function(event){
            L.DomEvent.stopPropagation(event);
          });
        });
}

function createPanelHeader(panel,text){
        var header = L.DomUtil.create('div','highlight-header',panel);
        header.textContent = text;
        var closeButton = L.DomUtil.create('div','close-button',header);
        closeButton.addEventListener("click",function(event){
          panel.parentNode.classList.add("collapse-panel");
        });

        panel.parentNode.appendChild(createShowPanelButton(function(){
          panel.parentNode.classList.remove("collapse-panel");
        }));
}

function createShowPanelButton(callback){
    var showPanelButton = document.createElement("div");
    showPanelButton.classList.add("show-panel-button");
    showPanelButton.addEventListener("click",callback);
    showPanelButton.innerHTML = "<span></span><span></span><span></span>";
    return showPanelButton;
}

// order functions
function sortAsc(a,b){
  return compareFunction(a,b);
}

function compareFunction(a,b,rev){
  if(rev){
    var aux = b;
    b = a;
    a = aux;
  }
  if(!isNaN(+a) && !isNaN(+b)){
    a = +a;
    b = +b;
  }
  if(typeof a == "number" && typeof b == "number"){
    return a-b;
  }else{
    return String(a).localeCompare(String(b));
  }
}

function uniqueValues(value, index, self) {
  return value && self.indexOf(value) === index;
}

// apply a format to display numbers
function formatter(d){
  if(typeof d == 'number'){
    var dabs = Math.abs(d);
    if(dabs>0 && dabs<1e-2)
      d = d.toExponential(2);
    else
      d = (d % 1 === 0)?d:d.toFixed(2);
  }
  return d;
}

// Return an array of the selected opion values
// select is an HTML select element
function getSelectValues(select) {
  var result = [];
  var options = select && select.options;
  var opt;

  for (var i=0, iLen=options.length; i<iLen; i++) {
    opt = options[i];

    if (opt.selected) {
      result.push(opt.value || opt.text);
    }
  }
  return result;
}

// brush slider module
function brushSlider(){
  var domain,
      current,
      callback;

  function exports(sel){
    var margin = {top: 36, right: 40, bottom: 0, left: 10},
        width = sel.clientWidth - margin.left - margin.right,
        height = 21;

    if(!current)
      current = valuesExtent(domain);

    var x = d3.scaleLinear()
        .range([0, width])
        .domain(domain)
        .clamp(true);

    var sliderWrapper = document.createElement("div");
    sliderWrapper.classList.add("slider-wrapper");
    sliderWrapper.style.height = height+margin.top+margin.bottom + "px";
    sel.appendChild(sliderWrapper);

    var slider = document.createElement("div");
    slider.classList.add("slider");
    slider.style.width = width + "px";
    slider.style.position = "relative";
    slider.style.top = margin.top+"px";
    slider.style.left = margin.left+"px";
    sliderWrapper.appendChild(slider);
    
    var sliderTray = document.createElement("div");
    sliderTray.classList.add("slider-tray");
    slider.appendChild(sliderTray);
    
    var sliderExtent = document.createElement("div");
    sliderExtent.classList.add("slider-extent");
    slider.appendChild(sliderExtent);

    var span1 = document.createElement("span");
    span1.classList.add("slider-min");
    span1.style.left = "-5px";
    span1.style.top = "-20px";
    span1.textContent = formatter(domain[0]);
    slider.appendChild(span1);

    var span2 = document.createElement("span");
    span2.classList.add("slider-max");
    span2.style.left = (width-5) +"px";
    span2.style.top = "-20px";
    span2.textContent = formatter(domain[1]);
    slider.appendChild(span2);

    var sliderHandlers = [];
    current.forEach(function(d,i){
      var sliderHandle = document.createElement("div");
      sliderHandle.classList.add("slider-handle");
      sliderHandle.style.position = "absolute";
      sliderHandle.style.top = "3px";
      sliderHandle.style.left = x(d) + "px";

      var icon = document.createElement("div");
      icon.classList.add("slider-handle-icon");
      sliderHandle.appendChild(icon);

      var text = document.createElement("span");
      text.classList.add("slider-text");
      text.style.top = "-25px";
      text.style.left = "-4px";
      text.textContent = formatter(d);
      sliderHandle.appendChild(text);

      slider.appendChild(sliderHandle);
      sliderHandlers.push(sliderHandle);

      dragElementX(sliderHandle,icon,slider,function(pos){
        current[i] = x.invert(pos);
        text.textContent = formatter(current[i]);
        updateExtent();
        callback(valuesExtent(current));
      });
    });

    updateExtent();

    function updateExtent(){
      var values = valuesExtent(current);
      sliderExtent.style.width = (x(values[1])-x(values[0]))+"px";
      sliderExtent.style.left = x(values[0])+"px";
    }
  }

  exports.dispatch = function(){
    callback(valuesExtent(current));
  }

  exports.domain = function(x) {
    if (!arguments.length) return domain;
    domain = x;
    return exports;
  };

  exports.current = function(x) {
    if (!arguments.length) return current;
    current = valuesExtent(x);
    return exports;
  };

  exports.callback = function(x) {
    if (!arguments.length) return callback;
    callback = x;
    return exports;
  };

  return exports;
}

function dragElementX(element,handler,parent,callback) {
  if(handler){
    handler.onmousedown = dragMouseDown;
  }else{
    element.onmousedown = dragMouseDown;
  }

  var rect;
  if(parent){
    rect = parent.getBoundingClientRect();
  }else{
    rect = document.body.getBoundingClientRect();
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();

    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();

    // set the element's new position:
    var pos = e.clientX - rect.left;
    if(pos>=0 && pos<=rect.width){
      element.style.left = pos + "px";
      callback(pos);
    }
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function sequence(start, stop, step) {
  start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

  var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);

  while (++i < n) {
    range[i] = start + i * step;
  }

  return range;
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

function fileDownload(blob,name){
  if(window.navigator.msSaveBlob){
    window.navigator.msSaveBlob(blob, name);
  }else{
    var url = window.URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 100);
  }
}

function downloadExcel(data,name){
  var sheets = ["void"],
      contentTypes = [],
      workbook = [],
      workbookRels = [];

  for(var d in data){
    sheets.push(d);
  }

  var zip = new JSZip(),
      rels = zip.folder("_rels"),
      xl = zip.folder("xl"),
      xlrels = xl.folder("_rels"),
      xlworksheets = xl.folder("worksheets");

  rels.file(".rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');

  for(var i = 1; i < sheets.length; i++){
    contentTypes.push('<Override PartName="/xl/worksheets/sheet'+i+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>');
    workbook.push('<sheet name="'+sheets[i]+'" sheetId="'+i+'" r:id="rId'+i+'"/>');
    workbookRels.push('<Relationship Id="rId'+i+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+i+'.xml"/>');
    xlworksheets.file("sheet"+i+".xml", sheetXML(data[sheets[i]]));
  }

  zip.file("[Content_Types].xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="jpeg" ContentType="image/jpeg"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'+contentTypes.join('')+'</Types>');

  xl.file("workbook.xml", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><fileVersion appName="xl" lastEdited="5" lowestEdited="5" rupBuild="24816"/><workbookPr showInkAnnotation="0" autoCompressPictures="0"/><bookViews><workbookView xWindow="0" yWindow="0" windowWidth="25600" windowHeight="19020" tabRatio="500"/></bookViews><sheets>'+workbook.join('')+'</sheets></workbook>');

  xlrels.file("workbook.xml.rels", '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'+workbookRels.join('')+'</Relationships>');

  zip.generateAsync({type:"blob", mimeType:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})
  .then(function(content) {
      fileDownload(content, name + '.xlsx');
  });

  function sheetXML(dat){
        var xml = [];
        dat.forEach(function(d){
          xml.push('<row>');
          d.forEach(function(dd){
            if(typeof dd == 'number')
              xml.push('<c t="n"><v>'+dd+'</v></c>');
            else
              xml.push('<c t="inlineStr"><is><t>'+escapeHtml(dd)+'</t></is></c>');
          });
          xml.push('</row>');
        });
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" mc:Ignorable="x14ac" xmlns:x14ac="http://schemas.microsoft.com/office/spreadsheetml/2009/9/ac"><sheetData>'+xml.join('')+'</sheetData></worksheet>';
  }
}

// images, icons and paths
var b64Icons = {
  netcoin: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBoZWlnaHQ9IjMwIiB3aWR0aD0iNDAiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDQwIDMwIj4KIDxnIHRyYW5zZm9ybT0ibWF0cml4KC4yNSAwIDAgLjI1IC0xOS4wNSAzNS44MjUpIj4KICA8ZyBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2U9IiNjMWMxYzEiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSI+CiAgIDxsaW5lIHkxPSItMTA0LjkiIHgyPSIxMTYuMiIgeDE9IjEyNC4xIiB5Mj0iLTExMy40Ii8+CiAgIDxsaW5lIHkxPSItOTQuNiIgeDI9IjExMy45IiB4MT0iMTIzLjQiIHkyPSItODAuNCIvPgogICA8bGluZSB5MT0iLTc0LjgiIHgyPSIxMjAuOSIgeDE9IjE0OC45IiB5Mj0iLTcwLjgiLz4KICAgPGxpbmUgeTE9Ii04OC45IiB4Mj0iMTYxLjIiIHgxPSIxNjIuMyIgeTI9Ii0xMDcuNCIvPgogICA8bGluZSB5MT0iLTY4LjkiIHgyPSIyMTIuNCIgeDE9IjE3My4zIiB5Mj0iLTQyLjEiLz4KICAgPGxpbmUgeTE9Ii05OC42IiB4Mj0iMTYwIiB4MT0iMTI4LjQiIHkyPSItMTIyLjMiLz4KICA8L2c+CiAgPGNpcmNsZSBjeT0iLTEyMy44IiBjeD0iMTU4LjgiIHI9IjE2LjUiIGZpbGw9IiMzYjkwZGYiLz4KICA8Y2lyY2xlIGN5PSItMTE5LjgiIGN4PSIxMDguNyIgcj0iOS45IiBmaWxsPSIjNGZhNmY3Ii8+CiAgPGNpcmNsZSBjeT0iLTY3LjgiIGN4PSIxMDYuNyIgcj0iMTQuNSIgZmlsbD0iI2Y5MCIvPgogIDxjaXJjbGUgY3k9Ii05OS40IiBjeD0iMTI3LjgiIHI9IjYuNiIgZmlsbD0iI2ZmYjcyYiIvPgogIDxjaXJjbGUgY3k9Ii03NS43IiBjeD0iMTYyLjEiIHI9IjEzLjIiIGZpbGw9IiM0ZmE2ZjYiLz4KICA8Y2lyY2xlIGN5PSItMzYuMyIgY3g9IjIxOS4yIiByPSI5IiBmaWxsPSIjZmZhMjE3Ii8+CiA8L2c+Cjwvc3ZnPg==",

  xlsx: "data:image/svg+xml;base64,PHN2ZyB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgaGVpZ2h0PSIxNCIgd2lkdGg9IjE0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgdmlld0JveD0iMCAwIDE0IDE0Ij4KPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtMTAzOC40KSI+CjxnPgo8cmVjdCBoZWlnaHQ9IjEwLjQ3MiIgc3Ryb2tlPSIjMjA3MjQ1IiBzdHJva2Utd2lkdGg9Ii41MDIwMSIgZmlsbD0iI2ZmZiIgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIuNTM2OTYiIHdpZHRoPSI3Ljg2NDYiIHk9IjEwNDAiIHg9IjUuODc4OCIvPgo8ZyBmaWxsPSIjMjA3MjQ1Ij4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0MS4yIiB4PSIxMC4xNjUiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0Mi45IiB4PSIxMC4xNjUiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0NC43IiB4PSIxMC4xNjUiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0Ni40IiB4PSIxMC4xNjUiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0OC4yIiB4PSIxMC4xNjUiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0MS4yIiB4PSI3LjI0NzgiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0Mi45IiB4PSI3LjI0NzgiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0NC43IiB4PSI3LjI0NzgiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0Ni40IiB4PSI3LjI0NzgiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0OC4yIiB4PSI3LjI0NzgiLz4KPHBhdGggc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIGQ9Im0wIDEwMzkuNyA4LjIzMDEtMS4zN3YxNGwtOC4yMzAxLTEuNHoiLz4KPC9nPgo8L2c+CjxnIGZpbGw9IiNmZmYiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEuMzI1OCAuMDYyNSAtMzM5LjcyKSI+CjxwYXRoIGQ9Im00LjQwNiAxMDQ0LjZsMS4zNzUzIDIuMDU2OC0xLjA3MjUtMC4wNjEtMC44OTAzLTEuMzU2LTAuODQ1NjYgMS4yNTc4LTAuOTQxNTYtMC4wNTMgMS4yMTg3LTEuODU0NC0xLjE3My0xLjgwMDggMC45NDE0MS0wLjAzNSAwLjgwMDE0IDEuMjAxMSAwLjgzMDQzLTEuMjYyNiAxLjA3NzUtMC4wNDFzLTEuMzIwNSAxLjk0ODItMS4zMjA1IDEuOTQ4MiIgZmlsbD0iI2ZmZiIvPgo8L2c+CjwvZz4KPC9zdmc+Cg=="
}

function getValuesFromDF(items,col){
  var idx = data[items].columns.indexOf(data.options[col]);
  if(idx!=-1){
    return data[items].data[idx];
  }
  return false;
}
