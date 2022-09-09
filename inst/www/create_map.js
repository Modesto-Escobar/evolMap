window.onload = function(){
  data = loadMultiVariables(data);
  data = controlsVisibility(data);

  renderMap(data);

  if(typeof tutorialTour != "undefined"){
    tutorialTour(data.options);
  }
}

function renderMap(data){
  var zoomstep = 0.25,
      panstep = 25;

  document.body.innerHTML = '<div id="Wrapper"></div>';
  shortcuts();

  var Wrapper = document.getElementById("Wrapper");

  var mapWrapper = document.createElement("div");
  mapWrapper.id = "mapWrapper";

  if(data.options.hasOwnProperty("description")){
    var description = document.createElement("div");
    description.id = "descriptionWrapper";
    Wrapper.appendChild(description);

    var descriptionWidth = 25;
    if(data.options.hasOwnProperty("descriptionWidth")){
      descriptionWidth = data.options.descriptionWidth;
    }
    mapWrapper.style.width = (100-descriptionWidth) + "%";
    description.style.width = descriptionWidth + "%";

    var descriptionContent = document.createElement("div");
    descriptionContent.innerHTML = data.options.description;
    description.appendChild(descriptionContent);
  }

  Wrapper.appendChild(mapWrapper);

  var mapid = document.createElement("div");
  mapid.id = "mapid";
  mapWrapper.appendChild(mapid);

  var infoPanel = false;
  if(data.options.markerInfo || data.options.entityInfo){
    infoPanel = new InfoPanel();
  }

  var visualManagers = {};

  // custom icons with border styles
  L.CustomIcon = L.Icon.extend({
    _setIconStyles: function(img, name){
  		var options = this.options;
  		var sizeOption = options[name + 'Size'];

  		if (typeof sizeOption === 'number') {
  			sizeOption = [sizeOption, sizeOption];
  		}

  		var size = L.point(sizeOption),
  		    anchor = L.point(name === 'shadow' && options.shadowAnchor || options.iconAnchor ||
  		            size && size.divideBy(2, true));

  		img.className = 'leaflet-marker-' + name + ' ' + (options.className || '');

  		if (anchor) {
  			img.style.marginLeft = (-anchor.x) + 'px';
  			img.style.marginTop  = (-anchor.y) + 'px';
  		}

  		if (size) {
  			img.style.width  = size.x + 'px';
  			img.style.height = size.y + 'px';
  		}
 
   		if (options.borderColor) {
  			img.style.borderColor  = options.borderColor;
  			img.style.borderWidth = '3px';
  		} else {
  			img.style.borderColor  = 'none';
  			img.style.borderWidth = '0';
  		}
    }
  });

  L.customIcon = function(name, options) {
    return new L.CustomIcon(name, options);
  }

  // create a box selector from box zoom
  L.Map.BoxZoom.prototype._onMouseUp = function(e){
      if ((e.which !== 1) && (e.button !== 1)) { return; }

      this._finish();

      if (!this._moved) { return; }
      // Postpone to next JS tick so internal click event handling
      // still see it as "moved".
      this._clearDeferredResetState();
      this._resetStateTimeout = setTimeout(L.bind(this._resetState, this), 0);

      var bounds = L.latLngBounds(
              this._map.containerPointToLatLng(this._startPoint),
              this._map.containerPointToLatLng(this._point));

      this._map.fire('boxzoomend', {boxZoomBounds: bounds});
  };

  // location by url
  var locationurl = window.location.search;
  if(locationurl){
    var pos1 = locationurl.indexOf("@"),
        pos2 = locationurl.indexOf("z",pos1);
    if(pos1!=-1 && pos2!=-1){
      var location = locationurl.substring(pos1+1,pos2).split(",");
      data.options.center = [location[0],location[1]];
      data.options.zoom = location[2];
      delete data.options.periodLatitude;
      delete data.options.periodLongitude;
      delete data.options.periodZoom;
    }else{
      locationurl = false;
    }
  }else{
    locationurl = false;
  }

  // initialize map
  var map = L.map("mapid",{
    zoomSnap: zoomstep,
    zoomDelta: zoomstep,
    wheelPxPerZoomLevel: 120,
    zoomControl: false,
    maxBounds: [[-90,-180],[90,180]]
  }).setView(data.options.center, data.options.zoom);

  L.Control.showLocation = L.Control.extend({
      onAdd: function(map) {
        var div = L.DomUtil.create('div', 'leaflet-control-show-location leaflet-control');
        panelStopPropagation(div);

        map.on('moveend',writeLocation);
        writeLocation();

        function writeLocation(){
          var loc = map.getCenter(),
              zoom = map.getZoom();
          div.textContent = "@"+loc.lat.toFixed(4)+","+loc.lng.toFixed(4)+","+zoom+"z";
        }

        return div;
      },

      onRemove: function(map) {
        // Nothing to do here
      }
  });

  // zoom buttons
  L.Control.zoomButtons = L.Control.extend({
      onAdd: function(map) {
        var zoomButtons = L.DomUtil.create('div', 'leaflet-bar zoom-buttons panel-style');
        panelStopPropagation(zoomButtons);

        var zoomin = L.DomUtil.create('button','zoomin',zoomButtons);
        zoomin.addEventListener("click",function(){ map.setZoom(map.getZoom()+zoomstep); });

        var zoomreset = L.DomUtil.create('button','zoomreset',zoomButtons);
        zoomreset.addEventListener("click",function(){ resetView(map); });

        var zoomout = L.DomUtil.create('button','zoomout',zoomButtons);
        zoomout.addEventListener("click",function(){ map.setZoom(map.getZoom()-zoomstep); });

        return zoomButtons;
      },

      onRemove: function(map) {
        // Nothing to do here
      }
  });

  // providers
  L.tileLayer.provider(data.options.provider,{ noWrap: true }).addTo(map);

  map.on("boxzoomend",function(e){
      var bounds = e.boxZoomBounds;
      if(data.storeItems){
        if(data.storeItems["markers"]){
          data.storeItems["markers"].forEach(function(item){
            delete item._selected;
            if(!item._hidden && !item._outoftime){
              var pt = item.marker ? item.marker.getLatLng() : false;
              if(pt && (bounds.contains(pt) == true)){
                item._selected = true;
              }
            }
          });
        }

        if(data.storeItems["links"]){
          data.storeItems["links"].forEach(function(item){
            delete item._selected;
            if(!item._hidden && !item._outoftime){
              var pt = item.line ? item.line.getLatLngs() : false;
              if(pt && bounds.contains(pt[0]) && bounds.contains(pt[1])){
                item._selected = true;
              }
            }
          });
        }

        if(data.storeItems["entities"]){
          entities_layer.eachLayer(function(layer){
            var item = layer.feature;
            delete item._selected;
            if(!item._hidden && !item._outoftime){
              var entityBounds = layer.getBounds();
              if(entityBounds
                   && bounds.contains(entityBounds.getNorthEast())
                   && bounds.contains(entityBounds.getSouthWest())){
                item._selected = true;
              }
            }
          });
        }

        update_items();
      }
  });

  map.on("click",select_none);

  delete data.storeItems;
  data.storeItems = {};

  var nodes = {};

  // geojson
  if(typeof geojson != "undefined"){
    visualManagers.entityColor = new colorMgmt("entities","entityColor");

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
      },
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng);
      }
    });

    if(data.hasOwnProperty("entities")){
      if(geojson.type=="Feature"){
        geojson = { features: [geojson], type: "FeatureCollection" };
      }
      if(geojson.type=="FeatureCollection"){
        geojson.features.forEach(function(feature){
          var i = getValuesFromDF("entities","entityName").indexOf(feature.properties[data.options.entityName]);
          data.entities.columns.forEach(function(k,j){
            feature.properties[k] = data.entities.data[j][i];
          });
          var point = getGeoCenter(feature.geometry);
          feature.properties._lat = point[0];
          feature.properties._lng = point[1];
        });
        data.storeItems.entities = geojson.features;
      }else{  
        console.log("incorrect type in geojson");
      }
    }
  }

  // markers
  if(data.hasOwnProperty("markers")){
    visualManagers.markerColor = new colorMgmt("markers","markerColor");
    visualManagers.markerShape = new shapeMgmt("markers","markerShape");

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
    visualManagers.linkColor = new colorMgmt("links","linkColor");

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
      var linkname = data.links.data[data.links.columns.indexOf(data.options.linkName)][i];

      if(!linksidx.hasOwnProperty(linkname)){
        link.properties = attributes;

        link.line = L.hasOwnProperty("curve") ? L.curve([]) : L.polyline([]);

        linksidx[linkname] = data.storeItems.links.length;
        data.storeItems.links.push(link);
      }
    }

    function updateLine(link,someselected){
      var source = data.storeItems.markers[nodes[link.source]],
          target = data.storeItems.markers[nodes[link.target]];

      if(link.line.setPath){
        link.line.setPath(['M',[source.latitude,source.longitude],
                         'Q',quadraticPoint(source.latitude,source.longitude,target.latitude,target.longitude),
                         [target.latitude,target.longitude]]);
      }else{
        link.line.setLatLngs([source.marker.getLatLng(),target.marker.getLatLng()]);
      }

      link.line.setStyle({color: link._table_selection ? "#ff0000" : (link._selected ? "#ffff00" : visualManagers.linkColor.getItemColor(link.properties)), opacity: (someselected && !link._selected ? 0.5 : 1) });
    }

    var links_layer = L.layerGroup();
  }

  // panel buttons
  if(data.storeItems.markers || data.storeItems.entities){
    L.Control.buttonsPanel = L.Control.extend({
      onAdd: function(map) {
        var panelButtons = L.DomUtil.create('div', 'leaflet-bar buttons-panel panel-style');
        panelStopPropagation(panelButtons);

        var tableButton = L.DomUtil.create('img','tables-button',panelButtons);
        tableButton.setAttribute("src", b64Icons.table);
        tableButton.setAttribute("alt", "table");
        tableButton.style.cursor = "pointer";
        tableButton.style.verticalAlign = "middle";
        tableButton.addEventListener("click",show_tables);

        var freqButton = L.DomUtil.create('img','frequencies-button',panelButtons);
        freqButton.setAttribute("src", b64Icons.chart);
        freqButton.setAttribute("alt", "frequencies");
        freqButton.style.cursor = "pointer";
        freqButton.style.verticalAlign = "middle";
        freqButton.addEventListener("click",show_frequencies);

        var selectall = L.DomUtil.create('button','primary selectall-button',panelButtons);
        selectall.textContent = texts["selectall"];
        selectall.addEventListener("click",select_all);

        var filter = L.DomUtil.create('button','primary filter-button',panelButtons);
        filter.textContent = texts["filter"];
        filter.addEventListener("click",filter_selected);

        var clear = L.DomUtil.create('button','primary-outline clear resetfilter-button',panelButtons);
        clear.textContent = texts["clear"];
        clear.addEventListener("click",remove_filters);

        return panelButtons;
      },

      onRemove: function(map) {
        // Nothing to do here
      }
    });
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
        searchIcon.addEventListener("click",function(){
            center_selection();
            searchInput.value = "";
            searchIcon.classList.add("disabled");
            L.DomUtil.empty(ul);
        });

        var searchInput = L.DomUtil.create('input','',searchBox);
        searchInput.type = "text";
        searchInput.placeholder = texts['searchsomething'];
        searchInput.addEventListener("keydown",function(event){
          L.DomEvent.stopPropagation(event);
        });
        searchInput.addEventListener("keyup",function(event){
          if(getKey(event)=="Enter"){
            searchIcon.click();
            return;
          }
          var txt = this.value;
          var found = false;
          if(txt.length>1){
            txt = new RegExp(txt,'i');
            searchItem("entities",txt);
            searchItem("markers",txt);
            update_items();
          }else{
            select_none();
          }
          searchIcon.classList[found ? "remove" : "add"]("disabled");
          show_suggestions();

          function visibleItems(d){
            return !d._hidden && !d._outoftime;
          }

          function searchItem(items,txt){
            if(data.storeItems[items]){
              data.storeItems[items].forEach(function(item){
                if(visibleItems(item)){
                  delete item._selected;
                  if(String(item.properties[searchingColumn(items)]).match(txt)){
                    item._selected = found = true;
                  }
                }
              });
            }
          }

          function searchingColumn(items){
            var col = data.options[getItemOption(items,"Label")];
            if(!col){
              col = data.options[getItemOption(items,"Name")];
            }
            return col;
          }

          function show_suggestions(){
            var suggestions = [];
            var itemsIcon = {markers: "location", entities: "hexagon"};
            ["markers","entities"].forEach(function(items){
              if(data.storeItems[items]){
                data.storeItems[items].forEach(function(item,i){
                  if(visibleItems(item)){
                    if(item._selected){
                      suggestions.push([items,i,item.properties[searchingColumn(items)]]);
                    }
                  }
                });
              }
            });
            L.DomUtil.empty(ul);
            if(suggestions.length){
              suggestions.forEach(function(d){
                var li = document.createElement("li");
                li.itemsName = d[0];
                li.itemIndex = d[1];
                var img = document.createElement("img");
                img.setAttribute("src",b64Icons[itemsIcon[d[0]]]);
                img.style.verticalAlign = "middle";
                img.style.marginRight = "5px";
                li.appendChild(img);
                var span = document.createElement("span");
                span.textContent = d[2];
                li.appendChild(span);
                li.addEventListener("click",function(){
                  searchInput.value = "";
                  searchIcon.classList.add("disabled");
                  L.DomUtil.empty(ul);
                  select_none();
                  data.storeItems[d[0]][d[1]]._selected = true;
                  center_selection();
                  update_items();
                });
                ul.appendChild(li);
              })
            }
          }
        })

        var ul = document.createElement("ul");
        ul.classList.add("suggestions-list");
        searchWrapper.appendChild(ul);

        return searchPanel;
      },

      onRemove: function(map) {
        // Nothing to do here
      }
    });

  // tools panel
  var tabnames = Object.keys(data.storeItems);
  if(tabnames.length){
    L.Control.toolsPanel = L.Control.extend({
      onAdd: function(map) {
        var toolsPanelWrapper = L.DomUtil.create('div', 'tools-panel-wrapper');

        var toolsPanel = createNewPanel("tools",data.options.controls,update_tools,toolsPanelWrapper);

        displayItemNav(toolsPanel,tabnames,function(){
          var name = toolsPanel.querySelector(".items-nav > ul > li.active").item;
          tabs.childNodes.forEach(function(tab){
            tab.style.display = (tab.getAttribute("tabname")==name) ? "block" : "none";
          });
          update_tools();
        });

        var tabs = L.DomUtil.create('div','tools-tabs',toolsPanel);

        tabnames.forEach(function(tabname){
        if(tabname=="markers"){
          var tabMarkers = L.DomUtil.create('div','tools-tab tab-markers',tabs);
          tabMarkers.style.display = "none";
          tabMarkers.setAttribute("tabname","markers");

          var markersChange = L.DomUtil.create('div','items-change markers-change',tabMarkers);
          var visuals = ["Label","Color"];
          if(data.options.markerShape!="_none_"){
            visuals.push("Shape");
          }
          visuals.forEach(function(d){
            addVisualSelector(markersChange,"markers",d,applyVisual);
          })

          var markersFilter = L.DomUtil.create('div','items-filter markers-filter',tabMarkers);
          displayItemFilter(markersFilter,"markers",filter_selected,remove_items_filters,update_items);
        }

        if(tabname=="links"){
          var tabLinks = L.DomUtil.create('div','tools-tab tab-links',tabs);
          tabLinks.style.display = "none";
          tabLinks.setAttribute("tabname","links");

          var linksChange = L.DomUtil.create('div','items-change links-change',tabLinks);
          addVisualSelector(linksChange,"links","Color",applyVisual);

          var linkFilter = L.DomUtil.create('div','items-filter links-filter',tabLinks);
          displayItemFilter(linkFilter,"links",filter_selected,remove_items_filters,update_items);
        }

        if(tabname=="entities"){
          var tabEntities = L.DomUtil.create('div','tools-tab tab-entities',tabs);
          tabEntities.style.display = "none";
          tabEntities.setAttribute("tabname","entities");

          var entitiesChange = L.DomUtil.create('div','items-change entities-change',tabEntities);
          ["Label","Color"].forEach(function(d){
            addVisualSelector(entitiesChange,"entities",d,applyVisual);
          });

          var entitiesOpacity = L.DomUtil.create('div','items-opacity entities-opacity',tabEntities);
          L.DomUtil.create('h4','',entitiesOpacity).textContent = texts["opacity"];
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
          displayItemFilter(entitiesFilter,"entities",filter_selected,remove_items_filters,update_items);
        }
        });

        tabs.childNodes[0].style.display = "block";

        return toolsPanelWrapper;
      },

      onRemove: function(map) {
        // Nothing to do here
      }
    });
  }

  // legends panel
  L.Control.legendsPanel = L.Control.extend({
      onAdd: function(map) {
        var legendsPanelWrapper = L.DomUtil.create('div','legends-panel-wrapper');

        var legendsPanel = createNewPanel("legends",data.options.controls,update_legends,legendsPanelWrapper);
 
        var goBack = L.DomUtil.create('div','goback',legendsPanel);
        goBack.addEventListener("click",remove_filters);
 
        var legendsContent = L.DomUtil.create('div','legends-content',legendsPanel);
        legendsContent.style.maxHeight = (mapWrapper.clientHeight-300) + "px";

        var bottomControls = L.DomUtil.create('div','legend-bottom-controls',legendsPanel);
        var legendSelectAll = L.DomUtil.create('div','legend-selectall',bottomControls);
        var selectAllCheck = L.DomUtil.create('div','legend-check-box',legendSelectAll);
        L.DomUtil.create('span', '',legendSelectAll).textContent = texts["selectall"];
        legendSelectAll.style.cursor = "pointer";
        legendSelectAll.addEventListener("click",function(){
          if(selectAllCheck.classList.contains("checked")){
            select_none();
          }else{
            select_all();
          }
        });
        var filterButton = L.DomUtil.create('button','legend-bottom-button primary',bottomControls);
        filterButton.textContent = texts["filter"];
        filterButton.addEventListener("click",filter_selected);

        return legendsPanelWrapper;
      },

      onRemove: function(map) {
        // Nothing to do here
      }
  });

  // marker Cluster
  if(data.storeItems.markers){
    if(L.hasOwnProperty("markerClusterGroup")){
      var markers_layer = L.markerClusterGroup();
    }else{
      var markers_layer = L.layerGroup();
    }
  }

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
          periodView(map);
        },
        loadPrevFrame = function(){
          prevFrame();
          update_items();
          periodView(map);
        },
        goTo = function(value){
          if(value>=min && value<=max){
            current = value;
            update_items();
            periodView(map);
          }
        };

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

    var updateShowedDates;
    if(data.periods && data.options.byperiod){
      updateShowedDates = function(val){
        dateSpan.textContent = getSpanText(getValuesFromDF("periods","periodStart")[val])+" - "+getSpanText(getValuesFromDF("periods","periodEnd")[val]);
        dateSpan.title = dateSpan.textContent;
        dateDiv.textContent = getCurrentPeriod(val);
        updatePeriodDescription(val);
      }
    }else{
      var getDivText = function(t,v){ return t; };
      if(data.periods){
        getDivText = function(text,val){
          return getCurrentPeriod(val);
        }
      }

      updateShowedDates = function(val){
        dateSpan.textContent = getSpanText(data.options.time.range[val]);
        dateSpan.title = dateSpan.textContent;
        dateDiv.textContent = getDivText(dateSpan.textContent,val);
        updatePeriodDescription(val);
      }
    }

    update_items = function(){
          visibleItems = 0;
          var someselected = some_selected();

          if(data.storeItems.entities){
            entities_layer.clearLayers();
            data.storeItems.entities.forEach(function(feature){
              if(!feature._hidden){
                findAttributes("entities",feature,current);
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
                findAttributes("markers",item,current);
                if(!item._outoftime){
                  updateMarker(item,someselected);
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
                if(!data.storeItems.markers[nodes[link.source]]._outoftime
                   && !data.storeItems.markers[nodes[link.source]]._hidden
                   && !data.storeItems.markers[nodes[link.target]]._outoftime
                   && !data.storeItems.markers[nodes[link.target]]._hidden){
                  findAttributes("links",link,current);
                  if(!link._outoftime){
                    updateLine(link,someselected);
                    link.line.addTo(links_layer);
                    if(timeApplied("links")){
                      visibleItems++;
                    }
                  }else{
                    removeLink(link);
                  }
                }else{
                  link._outoftime = true;
                  removeLink(link);
                }
              }else{
                removeLink(link);
              }
            });
            function removeLink(link){
              if(link.line){
                link.line.removeFrom(links_layer);
              }
            }
          }

          update_entities_style();
          update_tools();
          update_legends();
          update_buttons();
          show_tables();
          show_frequencies();

          updateShowedDates(current);
          inputRange.value = current;
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

    var dateDiv = L.DomUtil.create('div','main-date-viewer',mapWrapper);

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
        date.style.width = "150px";
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
          var initial = miliseconds;
          var speedSelectionDiv = L.DomUtil.create('div','leaflet-control-time-control time-control-speed',el); 
          var speedRange = L.DomUtil.create('input','slider',speedSelectionDiv);
          speedRange.type = "range";
          speedRange.min = 0;
          speedRange.max = 10;
          speedRange.value = 5;
          speedRange.style.width = "50px";
          speedRange.addEventListener("change",changeSpeed);
          var speedSpan = L.DomUtil.create('span','',speedSelectionDiv);
          speedSpan.textContent = " " + texts["speed"];
          speedSpan.style.cursor = "pointer";
          speedSpan.addEventListener("click",function(){
            var win = displayWindow(300);
            var h2 = document.createElement("h2");
            h2.textContent = texts["changespeed"];
            win.appendChild(h2);
            var center = document.createElement("center");
            var input = document.createElement("input");
            input.style.width = "6em";
            input.style.marginRight = "10px";
            input.placeholder = speedRange.min+"-"+speedRange.max;
            center.appendChild(input);
            win.appendChild(center);
            var button = document.createElement("button");
            button.classList.add("primary");
            button.textContent = texts["select"];
            center.appendChild(button);
            button.addEventListener("click",function(){
              var val = Math.round(+input.value);
              if(val>=(+speedRange.min) && val<=(+speedRange.max)){
                speedRange.value = val;
                changeSpeed();
              }
              var bg = win.parentNode.parentNode;
              bg.parentNode.removeChild(bg);
            });
          })

          function changeSpeed(){
            miliseconds = initial*(Math.pow(1.6,10-speedRange.value)/Math.pow(1.6,5));
            if(isRunning()){
              newInterval();
            }
          }
        }

        if(data.periods && data.options.time){
          var periodDiv = L.DomUtil.create('div','leaflet-control-time-control time-control-period',el); 
          var periodCheck = L.DomUtil.create('div','legend-check-box',periodDiv);
          if(data.options.byperiod){
            periodCheck.classList.add("checked");
          }
          L.DomUtil.create('span','',periodDiv).textContent = texts["period"];
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
  }else{
    // timeless map
    update_items = function(){
      var someselected = some_selected();

      if(data.storeItems.entities){
        entities_layer.clearLayers();
        data.storeItems.entities.forEach(function(feature){
          if(!feature._hidden){
            entities_layer.addData(feature);
          }
        });
      }

      if(data.storeItems.markers){
        data.storeItems.markers.forEach(function(item){
          updateMarker(item,someselected);
          if(item.marker){
            if(!item._hidden){
              item.marker.addTo(markers_layer);
            }else{
              item.marker.removeFrom(markers_layer);
            }
          }
        });
      }

      if(data.storeItems.links){
        data.storeItems.links.forEach(function(link){
          if(link.line){
            if(!link._hidden
                 && !data.storeItems.markers[nodes[link.source]]._hidden
                 && !data.storeItems.markers[nodes[link.target]]._hidden){
              updateLine(link,someselected);
              link.line.addTo(links_layer);
            }else{
              link.line.removeFrom(links_layer);
            }
          }
        });
      }

      update_entities_style();
      update_tools();
      update_legends();
      update_buttons();
      show_tables();
      show_frequencies();
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
  (new L.Control.searchPanel({ position: 'topleft' })).addTo(map);
  if(data.options.controls.tools !== undefined && L.Control.hasOwnProperty("toolsPanel")){
    (new L.Control.toolsPanel({ position: 'topleft' })).addTo(map);
  }
  (new L.Control.showLocation({ position: 'bottomright' })).addTo(map);
  (new L.Control.zoomButtons({ position: 'bottomright' })).addTo(map);
  if(L.Control.hasOwnProperty("timeControl")){
    (new L.Control.timeControl({ position: 'bottomleft' })).addTo(map);
  }
  if(data.options.controls.buttons && L.Control.hasOwnProperty("buttonsPanel")){
    (new L.Control.buttonsPanel({ position: 'bottomleft' })).addTo(map);
  }
  if(data.options.controls.legends !== undefined && L.Control.hasOwnProperty("legendsPanel")){
    (new L.Control.legendsPanel({ position: 'topright' })).addTo(map);
  }

  update_items();
  periodView(map);

  function update_items(){}

  function applyVisual(items,visual,value){
      var itemVisual = getItemOption(items,visual);
      if(value=="_default_"){
        delete data.options[itemVisual];
      }else{
        data.options[itemVisual] = value;
      }
      update_items();

      if(visual=="Color"){
        if(getDFcolumnType(items,value)=="number"){
            displayScalePicker(itemVisual,function(){
              visualManagers[itemVisual].changeLevels(value);
              update_items();
            });
        }
      }
  }

  function show_tables(event){
    var itemsList = Object.keys(data.storeItems);
    var tablesSection = document.querySelector(".tables-section");
    if(!tablesSection && event){
      tablesSection = document.createElement("div");
      tablesSection.classList.add("tables-section");

      var tablesSectionHeader = document.createElement("div");
      tablesSectionHeader.classList.add("tables-section-header");
      tablesSection.appendChild(tablesSectionHeader);

      var buttonsPanel = document.querySelector(".leaflet-control.buttons-panel");
      buttonsPanel.style.display = "none";

      var closeButton = document.createElement("div");
      closeButton.classList.add("close-button");
      closeButton.addEventListener("click", function(){
        buttonsPanel.style.display = null;
        mapWrapper.removeChild(tablesSection);
        mapWrapper.classList.remove("maximize-table");
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
      sizeButton.addEventListener("click", function(){ mapWrapper.classList.toggle("maximize-table"); });
      tablesSectionHeader.appendChild(sizeButton);

      var onlySelected = document.createElement("div");
      onlySelected.classList.add("only-selected-data");
      onlySelected.textContent = texts["showonlyselecteditems"] + " ";
      var onlyselectedCheck = document.createElement("div");
      onlyselectedCheck.classList.add("legend-check-box");
      onlySelected.addEventListener("click", function(){
        onlyselectedCheck.classList.toggle("checked");
        show_tables();
      });
      onlySelected.appendChild(onlyselectedCheck);
      tablesSectionHeader.appendChild(onlySelected);

      displayItemNav(tablesSectionHeader,itemsList,show_tables);

      var tablesContainer = document.createElement("div");
      tablesContainer.classList.add("tables-container");
      tablesContainer.lastselected = -1;
      tablesSection.appendChild(tablesContainer);
      mapWrapper.appendChild(tablesSection);
    }

    if(tablesSection){
      var active = tablesSection.querySelector(".tables-section-header > .items-nav > ul > li.active");
      if(active){
        renderTable(tablesSection,active.item);
      }
    }

    function renderTable(parent,items){
      var tablesSectionHeader = parent.querySelector(".tables-section-header"),
          tablesContainer = parent.querySelector(".tables-container");

      if(!tablesContainer || !data.storeItems[items] || !data.storeItems[items].length){
        return
      }

      var thead = false,
          tbody = tablesContainer.querySelector("tbody"),
          lastscroll = 0;

      if(tbody && tbody.scrollTop){
        lastscroll = tbody.scrollTop;
      }

      L.DomUtil.empty(tablesContainer);
      tbody = false;

      var columns = getItemsColumns(items);
      var tabletitle = parent.querySelector(".table-title");
      if(tabletitle){
        tabletitle.querySelector("span").textContent = texts[items];
      }else{
        tabletitle = document.createElement("div");
        tabletitle.classList.add("table-title");
        tablesSectionHeader.appendChild(tabletitle);

        var span = document.createElement("span");
        span.textContent = texts[items];
        tabletitle.appendChild(span);

        var xlsxButton = document.createElement("img");
        xlsxButton.setAttribute("src", b64Icons.xlsx);
        xlsxButton.setAttribute("alt", "xlsx");
        xlsxButton.style.cursor = "pointer";
        xlsxButton.style.marginLeft = "14px";
        xlsxButton.addEventListener("click",function(){
          table2xlsx(items,tbody.data,columns);
        });
        tabletitle.appendChild(xlsxButton);

        var searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.placeholder = texts["searchsomething"];
        searchInput.style.marginLeft = "14px";
        searchInput.addEventListener("keydown",function(event){
          event.stopPropagation();
        });
        searchInput.addEventListener("keyup",function(event){
          var txt = this.value;
          if(txt.length>0){
            txt = new RegExp(txt,'i');
            tbody.data.forEach(function(item){
              item._table_selection = false;
              var i = 0;
              while(!item._table_selection && i<columns.length){
                if(String(item.properties[columns[i++]]).match(txt)){
                  item._table_selection = true;
                }
              }
            });
          }
          onlyselectedCheck.classList.add("checked");
          update_items();
        })
        tabletitle.appendChild(searchInput);

        var matchedButton = document.createElement("button");
        matchedButton.classList.add("table-select");
        matchedButton.classList.add("primary");
        matchedButton.textContent = texts["matchedintable"];
        matchedButton.style.marginLeft = "14px";
        matchedButton.addEventListener("click",function(){
          onlyselectedCheck.classList.add("checked");
          selectFromTable(items);
        });
        tabletitle.appendChild(matchedButton);

        var filterButton = document.createElement("button");
        filterButton.classList.add("table-filter");
        filterButton.classList.add("primary");
        filterButton.textContent = texts["filter"];
        filterButton.style.marginLeft = "14px";
        filterButton.addEventListener("click",function(){
          data.storeItems[items].forEach(function(item){
            if(item._table_selection){
              delete item._table_selection;
            }else{
              delete item._selected;
              item._hidden = true;
            }
          });
          update_items();
        });
        tabletitle.appendChild(filterButton);

        var resetButton = document.createElement("button");
        resetButton.classList.add("table-resetfilter");
        resetButton.classList.add("primary-outline");
        resetButton.classList.add("clear");
        resetButton.textContent = texts["clear"];
        resetButton.style.marginLeft = "14px";
        resetButton.addEventListener("click",function(){
          remove_filters(items);
        });
        tabletitle.appendChild(resetButton);
      }

      if(!tbody || !thead){

        var table = document.createElement("table");

        // draw header
        thead = document.createElement("thead");
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
          if(getDFcolumnType(items,col)=="number"){
            th.classList.add("text-right");
          }
          var div = document.createElement("div");
          div.textContent = col;
          th.appendChild(div);
          th.addEventListener("click",function(){
            renderTableBody(tbody,items,tbody.data,columns,sort1);
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

        // draw tbody
        tbody = document.createElement("tbody");
        table.appendChild(tbody);

        tablesContainer.appendChild(table);
      }

      var onlySelectedItems = tablesSection.querySelector(".only-selected-data > .legend-check-box.checked") ? true : false;
      tbody.data = data.storeItems[items].filter(function(item){
        return (!onlySelectedItems || item._selected || item._table_selection) && !item._hidden && !item._outoftime;
      });
      renderTableBody(tbody,items,tbody.data,columns);

      if(lastscroll){
        tbody.scrollTop = lastscroll;
      }

      ["select","filter"].forEach(function(d){
        tablesSection.querySelector("button.table-"+d).classList[tbody.data.filter(function(item){ return item._table_selection; }).length ? "remove" : "add"]("disabled");
      })
      tablesSection.querySelector("button.table-resetfilter").classList[data.storeItems[items].filter(function(item){ return (!onlySelectedItems || item._selected || item._table_selection) && item._hidden && !item._outoftime; }).length ? "remove" : "add"]("disabled");

      function renderTableBody(tbody,items,subitems,columns,order){
        L.DomUtil.empty(tbody);
        if(!subitems.length){
          tbody.textContent = texts["selectsomeitems"];
        }else{
          if(order){
            subitems.sort(order);
          }
          subitems.forEach(function(item,j){
            var tr = document.createElement("tr");
            columns.forEach(function(col){
              var td = document.createElement("td");
              if(getDFcolumnType(items,col)=="number"){
                td.classList.add("text-right");
              }
              var div = document.createElement("div"),
                  text = prepareText(item.properties[col]);              
              div.innerHTML = text ? text : "&nbsp;";
              if(text){
                div.setAttribute("title",text);
              }
              td.appendChild(div);
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
              if(event.shiftKey && tablesContainer.lastselected!=-1){
                selections = sequence(Math.min(tablesContainer.lastselected,this.rowIndex)-1,Math.max(tablesContainer.lastselected,this.rowIndex));
              }
              subitems.forEach(function(item,i){
                var selected = item._table_selection ? true : false;

                if(selections){
                  if(event.ctrlKey || event.metaKey){
                    selected = selected || selections.indexOf(i)!=-1;
                  }else{
                    selected = selections.indexOf(i)!=-1;
                  }
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

              tablesContainer.lastselected = item._table_selection ? this.rowIndex : -1;

              update_items();
            })
            tbody.appendChild(tr);
          });
        }

        computeColumnWidth();
      }

      function computeColumnWidth(){
        var widths = [],
            tbodytr = tbody.querySelectorAll("tr"),
            theadth = thead.querySelectorAll("tr > th");

        theadth.forEach(function(d,i){
          widths[i] = Math.min(d.offsetWidth,300);
        });
        for(var i=0; i<50 && i<tbodytr.length; i++){
          tbodytr[i].querySelectorAll("td").forEach(function(d,i){
            var w = Math.min(d.offsetWidth+10,300);
            if(w > widths[i]){
              widths[i] = w;
            }
          });
        }

        theadth.forEach(function(d,i){
          d.style.width = widths[i]+"px";
        });
        tbodytr.forEach(function(dd){
          dd.querySelectorAll("td").forEach(function(d,i){
            d.style.width =  widths[i]+"px";
          });
        })

        tbody.style.width = widths.reduce(function(p,c){ return p+c; },10)+"px";
      }

      function table2xlsx(items,subitems,columns){
        var nodes = [columns];
        subitems.forEach(function(item){
          nodes.push(columns.map(function(col){ return prepareText(item.properties[col]); }));
        })

        var itemsdata = {};
        itemsdata[items] = nodes;

        if(nodes.length == 1){
          var win = displayWindow()
          var p = document.createElement("p");
          p.classList.add("window-message");
          p.textContent = texts["noitems"]+" "+texts[items];
          win.appendChild(p);
        }else{
          downloadExcel(itemsdata, document.querySelector("head>title").textContent);
        }
      }
    }
  }

  function show_frequencies(event){
    var itemsList = Object.keys(data.storeItems);
    var freqContainer = document.querySelector(".frequencies-section > .frequencies-container");
    if(!freqContainer && event){
      var freqSection = document.createElement("div");
      freqSection.classList.add("frequencies-section");

      var freqSectionHeader = document.createElement("div");
      freqSectionHeader.classList.add("frequencies-section-header");
      freqSection.appendChild(freqSectionHeader);

      var closeButton = document.createElement("div");
      closeButton.classList.add("close-button");
      closeButton.addEventListener("click", function(){
        mapWrapper.removeChild(freqSection);
      });
      freqSectionHeader.appendChild(closeButton);

      if(!data.options.freqMode){
        data.options.freqMode = "relative";
      }
      var modeSelectWrapper = document.createElement("div");
      modeSelectWrapper.classList.add("select-wrapper");
      modeSelectWrapper.style.position = "absolute";
      modeSelectWrapper.style.top = "0";
      modeSelectWrapper.style.right = "30px";
      var modeSelect = document.createElement("select");
      ["relative","absolute"].forEach(function(d){
        var option = document.createElement("option");
        option.value = d;
        option.textContent = texts[d];
        modeSelect.appendChild(option);
      });
      modeSelect.addEventListener("change",function(){
        data.options.freqMode = this.value;
        show_frequencies();
      });
      modeSelect.value = data.options.freqMode;
      modeSelectWrapper.appendChild(modeSelect);
      freqSectionHeader.appendChild(modeSelectWrapper);

      displayItemNav(freqSectionHeader,itemsList,show_frequencies);

      freqContainer = document.createElement("div");
      freqContainer.classList.add("frequencies-container");
      freqSection.appendChild(freqContainer);
      mapWrapper.appendChild(freqSection);
    }

    if(freqContainer){
      var active = freqContainer.parentNode.querySelector(".frequencies-section-header > .items-nav > ul > li.active");
      if(active){
        renderBars(freqContainer,active.item);
      }
    }

    function renderBars(container,items){
      var itemName = getItemOption(items,"Name"),
          itemColor = getItemOption(items,"Color");
      var columns = getItemsColumns(items),
          visibleItems = data.storeItems[items].filter(function(item){ return !item._hidden && !item._outoftime; }),
          renderPercentage = data.options.freqMode=="relative" ? "%" : "";

      var freqBarplots = container.getElementsByClassName(items+"-frequency-wrapper");
      if(freqBarplots.length){
            freqBarplots = freqBarplots[0];
      }else{
            L.DomUtil.empty(container);
            freqBarplots = document.createElement("div");
            freqBarplots.classList.add("frequency-barplots");
            freqBarplots.classList.add(items+"-frequency-wrapper");
            freqBarplots.wordclouds = new Set();
            container.appendChild(freqBarplots);
      }
      if(!visibleItems.length){
        var text = document.createElement("p");
        text.textContent = texts["noitems"]+" "+texts[items]+" "+texts["inthemap"];
        freqBarplots.appendChild(text);
        return;
      }

      columns.forEach(function(col){
        if(col==data.options[itemName]){
          return;
        }
        var type = getDFcolumnType(items,col);
        if(type=="number"){
          var values = [],
              selectedValues = [];

          visibleItems.forEach(function(item){
            if(item.properties[col]!==null){
              values.push(+item.properties[col]);
              if(item._selected){
                selectedValues.push(+item.properties[col]);
              }
            }
          });

          var barplot = getBarPlot(freqBarplots,col);

          // set the dimensions and margins of the graph
          var margin = {top: 10, right: 10, bottom: 30, left: 50},
              w = (container.offsetWidth - 72) - margin.left - margin.right,
              h = 200 - margin.top - margin.bottom;

          // append the histogram div
          var div = document.createElement("div");
          div.classList.add("histo-graph");
          div.style.overflow = "hidden";
          div.style.position = "relative";
          div.style.width = (w + margin.left + margin.right) + "px";
          div.style.height = (h + margin.top + margin.bottom) + "px";
          var g = document.createElement("div");
          g.style.position = "absolute";
          g.style.top = margin.top+"px";
          g.style.left = margin.left+"px";
          div.appendChild(g);
          barplot.appendChild(div);

          // X axis: scale and draw
          var domain = valuesExtent(values);
          // prepare domain for the histogram
          if(domain[0]==domain[1]){
            domain = [domain[0]-1,domain[1]+1];
          }else{
            domain[1] = domain[1] + ((domain[1]-domain[0])/10);
          }
          var x = d3.scaleLinear()
          .domain(domain)
          .range([0, w]);

          var gBottomAxis = document.createElement("div");
          gBottomAxis.classList.add("bottom-axis");
          gBottomAxis.style.position = "absolute";
          gBottomAxis.style.top = h + "px";
          gBottomAxis.style.left = 0;
          gBottomAxis.style.width = w + "px";
          g.appendChild(gBottomAxis);

          var nticks = Math.floor(w/80);

          x.ticks(nticks).forEach(function(t){
            var span = document.createElement("span");
            span.style.left = x(t)+"px";
            span.textContent = formatter(t);
            gBottomAxis.appendChild(span);
          })

          // set the parameters for the histogram
          var histogram = d3.histogram()
          .value(function(d) { return d; })
          .domain(x.domain())
          .thresholds(x.ticks(nticks));

          // And apply this function to data to get the bins
          var bins = histogram(values),
              bins2 = selectedValues.length ? histogram(selectedValues) : [];

          var selectedValues2 = [];
          for(var i = 0; i<bins2.length; i++){
            if(bins2[i].length==bins[i].length){
              visibleItems.forEach(function(d){
                var val = Number(d[col]);
                if(selectedValues2.indexOf(val)==-1 && (val >= bins2[i].x0 && val < bins2[i].x1)){
                  selectedValues2.push(val);
                }
              })
            }
          }

          var yMax = -Infinity;
          for(var i = 0; i<bins.length; i++){
            bins[i].y = data.options.freqMode=="relative" ? bins[i].length/visibleItems.length*100 : bins[i].length;
            if(selectedValues.length){
              bins[i].y2 = data.options.freqMode=="relative" ? bins2[i].length/selectedValues.length*100 : bins2[i].length;
            }
            if(bins[i].y>yMax){
              yMax = bins[i].y;
            }
          }

          // Y axis: scale and draw
          var y = d3.scaleLinear()
          .range([h, 0])
          .domain([0, yMax]);

          var leftAxisOffset = 100;
          var gLeftAxis = document.createElement("div");
          gLeftAxis.classList.add("left-axis");
          gLeftAxis.style.position = "absolute";
          gLeftAxis.style.top = 0;
          gLeftAxis.style.left = -leftAxisOffset + "px";
          gLeftAxis.style.height = h + "px";
          gLeftAxis.style.width = leftAxisOffset + "px";
          g.appendChild(gLeftAxis);

          y.ticks(3).forEach(function(t){
            var span = document.createElement("span");
            span.style.top = y(t)+"px";
            span.style.width = (leftAxisOffset - 10) + "px";
            span.textContent = t + renderPercentage;
            gLeftAxis.appendChild(span);
          })

          // append the bar rectangles to the graph
          var getValue = function(v){
            return formatter(v) + (data.options.freqMode=="relative" ? "%" : "");
          }
          bins.forEach(function(d){
              var freqBar = document.createElement("div");
              freqBar.classList.add("freq-bar");
              freqBar.style.position = "absolute";
              freqBar.style.left = x(d.x0)+"px";
              freqBar.style.top = 0;
              freqBar.style.cursor = "pointer";
              freqBar.addEventListener("click",function(event){
                visibleItems.forEach(function(item){
                  if(!(event.ctrlKey || event.metaKey)){
                    delete item._selected;
                  }
                  if(item.properties[col]>=d.x0 && item.properties[col]<d.x1){
                    item._selected = true;
                  }
                });
                update_items();
              });

              freqBar.setAttribute("title","[" + d.x0 + "," + d.x1 + ")" + ": " + getValue(d.y) + (d.y2 ? "\nSelection: " + getValue(d.y2) : ""));

              var freq1 = document.createElement("div");
              freq1.classList.add("freq1");
              freq1.style.position = "absolute";
              freq1.style.left = 1+"px";
              freq1.style.top = y(d.y)+"px";
              freq1.style.width = (x(d.x1) - x(d.x0) -1)+"px";
              freq1.style.height = (h - y(d.y))+"px";
              freq1.style.backgroundColor = data.options[itemColor]==col ? visualManagers[itemColor].getColor((d.x0+d.x1)/2) : "#cbdefb";
              freqBar.appendChild(freq1);

              if(selectedValues.length){
                var freq2 = document.createElement("div");
                freq2.classList.add("freq2");
                freq2.style.position = "absolute";
                freq2.style.left = 5+"px";
                freq2.style.top = y(d.y2)+"px";
                freq2.style.width = (x(d.x1) - x(d.x0) -9)+"px";
                freq2.style.height = (h - y(d.y2))+"px";
                freq2.style.backgroundColor = "#c6c6c6";
                freqBar.appendChild(freq2);
              }

              g.appendChild(freqBar);
          });
        }else{
          var values = {},
              selectedValues = {},
              maxvalue = -Infinity,
              keyvalues = [];

          var loadValue = function(val,selected){
              var val = String(val);
              if(!values.hasOwnProperty(val)){
                values[val] = 1;
                keyvalues.push(val);
              }else{
                values[val] += 1;
              }
              if(values[val]>maxvalue){
                maxvalue = values[val];
              }
              if(selected){
                if(!selectedValues.hasOwnProperty(val)){
                  selectedValues[val] = 1;
                }else{
                  selectedValues[val] += 1;
                }
              }
          };

          if(type=="object"){
            visibleItems.forEach(function(item){
              item.properties[col].forEach(function(val){
                loadValue(val,item._selected);
              });
            });
          }else{
            visibleItems.forEach(function(item){
              loadValue(item.properties[col],item._selected);
            });
          }

          keyvalues.sort(function(a,b){
                a = values[a];
                b = values[b];
                return a > b ? -1 : a < b ? 1 : a <= b ? 0 : NaN;
              });

          if(data.options.freqMode=="relative"){
            var selectedlength = visibleItems.filter(function(item){ return item._selected; }).length;
            keyvalues.forEach(function(val){
              values[val] = values[val]/visibleItems.length*100;
              if(values[val]>maxvalue){
                maxvalue = values[val];
              }
              if(selectedValues.hasOwnProperty(val)){
                selectedValues[val] = selectedValues[val]/selectedlength*100;
                if(selectedValues[val]>maxvalue){
                  maxvalue = selectedValues[val];
                }
              }
            });
          }

          var barplot = getBarPlot(freqBarplots,col,true);

          // display wordcloud
          if(freqBarplots.wordclouds.has(col)){

        // set the dimensions and margins of the graph
        var w = container.offsetWidth - 72,
            h = 300,
            namespace = "http://www.w3.org/2000/svg";
        // append the svg object
        var svg = document.createElementNS(namespace,"svg");
        svg.setAttribute("width", w);
        svg.setAttribute("height", h);
        var g = document.createElementNS(namespace,"g");
        g.setAttribute("transform", "translate(" + (w/2) + "," + (h/2) + ")");
        svg.appendChild(g);
        barplot.appendChild(svg);

        var font = "sans-serif",
            xScale = d3.scaleLinear()
           .domain([0, maxvalue])
           .range([8,50]);

        var layout = d3.layout.cloud()
        .size([w, h])
        .words(keyvalues.map(function(k){ return {text: k, count: values[k]}; }))
        .padding(2)
        .random(function(){ return 0.5; })
        .rotate(function(d,i){ return (i%2) * 90; })
        .font(font)
        .fontSize(function(d){ return xScale(d.count); })
        .on("end", function(words){
          L.DomUtil.empty(g);
          words.forEach(function(word){
            var text = document.createElementNS(namespace, "text");
            text.textContent = word.text;
            text.setAttribute("text-anchor", "middle");
            text.style.fontSize = word.size + "px";
            text.style.fontFamily = font;
            text.style.fill = data.options[itemColor]==col ? visualManagers[itemColor].getColor(word.text) : "#777777";
            text.setAttribute("transform", "translate(" + [word.x, word.y] + ")rotate(" + word.rotate + ")");
            text.style.cursor = "pointer";
            text.addEventListener("click",function(){
              
            });
            g.appendChild(text);
          });
        });

        layout.start();

          }else{

          keyvalues.forEach(function(v,i){
            var percentage = values[v]/maxvalue*100,
                percentage2 =  0;

            if(selectedValues[v]){
              percentage2 = selectedValues[v]/maxvalue*100;
            }

            var getValue = function(values,value){
              return data.options.freqMode=="relative" ? formatter(values[value])+"%" : values[value];
            }

            var row = document.createElement("div");
            row.classList.add("freq-bar");
            row.style.display = i>9 ? "none" : null;
            row.setAttribute("title",v+": "+getValue(values,v) + (selectedValues[v] ? "\nSelection: "+getValue(selectedValues,v) : ""));
            row.addEventListener("click",function(event){
              visibleItems.forEach(function(item){
                if(!(event.ctrlKey || event.metaKey)){
                  delete item._selected;
                }
                if(isItemSelected(items,item,col,v)){
                  item._selected = true;
                }
              });
              update_items();
            });
            barplot.appendChild(row);

            var freq1 = document.createElement("div");
            freq1.classList.add("freq1");
            freq1.style.width = percentage+"%";
            freq1.style.backgroundColor = data.options[itemColor]==col ? visualManagers[itemColor].getColor(v) : null;
            freq1.innerHTML = "&nbsp;";
            row.appendChild(freq1);

            var freq2 = document.createElement("div");
            freq2.classList.add("freq2");
            freq2.style.width = percentage2+"%";
            freq2.innerHTML = "&nbsp;";
            row.appendChild(freq2);

            var span = document.createElement("span");
            span.textContent = v;
            row.appendChild(span);
          })

          if(keyvalues.length>10){
            var moreLessBars = document.createElement("div");
            moreLessBars.classList.add("show-more-less-bars");
            barplot.appendChild(moreLessBars);

            var moreBars = document.createElement("span");
            moreBars.classList.add("show-more-bars");
            moreBars.style.cursor = "pointer";
            moreBars.textContent = texts["show"] + " " + Math.min(keyvalues.length-10,10) + " " + texts["more"];
            moreBars.addEventListener("click",function(){
              var count = 0;
              barplot.querySelectorAll(".freq-bar").forEach(function(d){
                  if(d.style.display == "none"){
                    if(count>=10){
                      d.style.display = "none";
                    }else{
                      d.style.display = null;
                      count++;
                    }
                  }
              });
              if(count<10){
                moreBars.style.visibility = "hidden";
                moreBars.style.cursor = null;
              }else{
                count = 0;
                barplot.querySelectorAll(".freq-bar").forEach(function(d){
                  if(d.style.display == "none"){
                    count++;
                  }
                });
                moreBars.textContent = texts["show"] + " " + Math.min(count,10) + " " + texts["more"];
              }
              lessBars.style.visibility = null;
              lessBars.style.cursor = "pointer";
            });
            moreLessBars.appendChild(moreBars);

            var lessBars = document.createElement("span");
            lessBars.classList.add("show-less-bars");
            lessBars.style.visibility = "hidden";
            lessBars.textContent = texts["show"] + " " + texts["less"];
            lessBars.addEventListener("click",function(){
              barplot.querySelectorAll(".freq-bar").forEach(function(d,i){
                if(i>9){
                  d.style.display = "none";
                }else{
                  d.style.display = null;
                }
              });
              lessBars.style.visibility = "hidden";
              lessBars.style.cursor = null;
              moreBars.style.visibility = null;
              moreBars.style.cursor = "pointer";
              moreBars.textContent = texts["show"] + " " + Math.min(keyvalues.length-10,10) + " " + texts["more"];
            });
            moreLessBars.appendChild(lessBars);
          }

          var axis = document.createElement("div");
          axis.classList.add("freq-axis");
          barplot.appendChild(axis);

          var x = d3.scaleLinear()
          .domain([0,maxvalue])

          x.ticks(5).forEach(function(t){
            var span = document.createElement("span");
            span.style.left = (t/maxvalue*100)+"%";
            span.textContent = t+renderPercentage;
            axis.appendChild(span);
          })

          }
        }
      });

      function getBarPlot(sel,name,wordcloud){
          var barplot = false;
          sel.childNodes.forEach(function(d){
            if(d.variable==name){
              barplot = d;
            }
          });
          if(!barplot){
            barplot = document.createElement("div");
            barplot.classList.add("bar-plot");
            barplot.variable = name;
            sel.appendChild(barplot);

            var header = document.createElement("h2");
            header.textContent = name;
            barplot.appendChild(header);

            if(wordcloud && d3.hasOwnProperty("layout") && d3.layout.hasOwnProperty("cloud")){
              var img = document.createElement("img");
              img.setAttribute("title","wordcloud");
              img.setAttribute("src",b64Icons.wordcloud);
              img.style.cursor = "pointer";
              img.style.float = "right";
              img.addEventListener("click",function(){
                if(sel.wordclouds.has(name)){
                  sel.wordclouds.delete(name);
                  show_frequencies();
                }else{
                  sel.wordclouds.add(name);
                  applyVisual(items,"Color",name);
                }
              });
              header.appendChild(img);
            }

            var img = document.createElement("img");
            img.setAttribute("title","color");
            img.setAttribute("src",b64Icons.drop);
            img.style.cursor = "pointer";
            img.style.float = "right";
            img.addEventListener("click",function(){
              applyVisual(items,"Color",name);
            });
            header.appendChild(img);
          }else{
            while(barplot.childNodes.length>1){
              barplot.removeChild(barplot.lastChild);
            }
          }
          return barplot;
      }
    }
  }

  function displayItemNav(parent,list,callback){
      var itemsNav = document.createElement("div");
      itemsNav.classList.add("items-nav");
      parent.appendChild(itemsNav);
      var ul = document.createElement("ul");
      itemsNav.appendChild(ul);
      list.forEach(function(items){
          var li = document.createElement("li");
          li.textContent = texts[items];
          li.item = items;
          li.addEventListener("click",function(){
            if(!this.classList.contains("active")){
              ul.childNodes.forEach(function(li){
                li.classList.remove("active");
              });
              this.classList.add("active");
              callback();
            }
          });
          ul.appendChild(li);
      })
      ul.childNodes[0].classList.add("active");
  }

  function timeApplied(items){
    if(typeof items == "string"){
      items = [items];
    }else{
      items = Object.keys(data.storeItems);
    }
    for(var i=0; i<items.length; i++){
      if(data.hasOwnProperty(items[i])
          && ((data.options.hasOwnProperty("time")
                && data[items[i]].columns.indexOf(data.options.start)!=-1
                && data[items[i]].columns.indexOf(data.options.end)!=-1)
              || (data.periods && data.options[getItemOption(items[i],"Period")]))){
        return true;
      }
    }
    return false;
  }

  function findAttributes(items,item,current){
    var itemName = getItemOption(items,"Name"),
        name = item.properties[data.options[itemName]],
        names = getValuesFromDF(items,itemName);
    if(timeApplied(items)){
      item._outoftime = true;
      var callback;
      if(data.periods && data.options[getItemOption(items,"Period")]){
        var periods = getValuesFromDF(items,getItemOption(items,"Period")),
            period = getCurrentPeriod(current);
        if(getDFcolumnType(items,data.options[getItemOption(items,"Period")])=="object"){
          callback = function(i){ return periods[i].indexOf(period)!=-1; };
        }else{
          callback = function(i){ return periods[i]==period; };
        }
      }else{
        var starts = getValuesFromDF(items,"start"),
            ends = getValuesFromDF(items,"end");
        callback = function(i){ return inTime(starts[i],ends[i],current); };
      }
      loadAttributes(callback);
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
      var periodDescription = mapWrapper.getElementsByClassName("period-description");
      if(periodDescription.length){
        periodDescription = periodDescription[0];
      }else{
        periodDescription = document.createElement("div");
        periodDescription.classList.add("period-description");
        periodDescription.appendChild(document.createElement("span"));
        mapWrapper.appendChild(periodDescription);
      }
      if(data.options.byperiod){
        periodDescription.childNodes[0].textContent = getValuesFromDF("periods","periodDescription")[val];
      }else{
        periodDescription.childNodes[0].textContent = "";
      }
    }
  }

  function updateMarker(item,someselected){

    var attr = item.properties;
    if(!item.marker){
      item.marker = new L.Marker();
      item.marker.on("click",function(event){
        item.marker.openPopup();
        if(data.options.markerInfo){
          if(!(event.originalEvent.ctrlKey || event.originalEvent.metaKey)){
            map.setView(event.target.getLatLng());
          }
          infoPanel.changeContent(attr[data.options.markerInfo]);
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
        L.DomEvent.stopPropagation(event);
      });
      item.marker.on("mouseover",function(event){
        item.marker.openPopup();
      });
      item.marker.on("mouseout",function(event){
        item.marker.closePopup();
      });
    }

    // update position
    if((item.latitude != attr[data.options.markerLatitude]) || (item.longitude != attr[data.options.markerLongitude])){
      item.latitude = attr[data.options.markerLatitude];
      item.longitude = attr[data.options.markerLongitude];
      item.marker.setLatLng([item.latitude,item.longitude]);
    }

    // magane label
    if(data.options.markerLabel){
          var str = prepareText(attr[data.options.markerLabel]);
          if(item.label != str){
            item.label = str;
            if(str){
              item.marker.unbindTooltip();
              item.marker.bindTooltip(str,{
                permanent: true,
                direction: "center",
                className: "marker-label"
              }).openTooltip();
            }else{
              item.marker.unbindTooltip();
              delete item.label;
            }
          }
    }else{
      item.marker.unbindTooltip();
      delete item.label;
    }

    var update = false;

    // change color
    var newcolor = data.options.markerColor ? visualManagers.markerColor.getItemColor(attr) : false;
    if(item.color != newcolor){
        item.color = newcolor;
        update = true;
    }

    // change shape
    var newshape = data.options.markerShape ? visualManagers.markerShape.getItemShape(attr) : false;
    if(item.shape != newshape){
        item.shape = newshape;
        update = true;
    }

    if(data.options.image && attr[data.options.image]){
      // change image
      if(item.image != attr[data.options.image]){
        item.image = attr[data.options.image];
        delete item.ratio;
        update = true;
      }
    }

    if(item._selected != item.selected){
      item.selected = item._selected;
      update = true;
    }
    if(item._table_selection != item.table_selection){
      item.table_selection = item._table_selection;
      update = true;
    }
    if((someselected && !(item._selected || item._table_selection)) != item.low_opacity){
      item.low_opacity = someselected && !(item._selected || item._table_selection);
      update = true;
    }

    // update icon
    if(update){
      if(item.image && !item.hasOwnProperty("ratio")){
          var image = new Image();
          image.onload = function(){
            item.ratio = getImgRatio(this);
            setIcon(item);
          }
          image.src = item.image;
      }else{
        setIcon(item);
      }
    }

    item.marker.unbindPopup();
    if(data.options.markerText){
      var text = prepareText(attr[data.options.markerText]);
      text = text.replace('class="auto-color" style="','style="background-color:'+(item.color ? item.color : "#cbdefb")+';');
      item.marker.bindPopup(text, { autoPan: false });
    }

    function setIcon(item){
      var options = {};

      if(item.image){
        var h = 40,
            w = 40 * item.ratio;
        options.iconUrl = item.image;
        options.iconSize = [w, h];
        options.iconAnchor = [w/2, h/2];
        options.popupAnchor = [0, -h/2];
        options.tooltipAnchor = [0, h];
        if(item.color){
          options.borderColor = item.color;
        }
      }else{
        options.iconUrl = getIconMarkerURI(item.color,item.shape);
        options.iconSize = [40, 40];
        options.iconAnchor = [20, 40];
        options.popupAnchor = [0, -40];
        options.tooltipAnchor = [0, 20];
      }
      if(item.selected){
        options.className = "selected-marker";
      }
      if(item.table_selection){
        options.className = "table-selected-marker";
      }
      if(item.low_opacity){
        options.className = "low-opacity";
      }
      if(data.options.roundedIcons){
        options.className = (options.className) ? options.className + " rounded-icon" : "rounded-icon";
      }

      var icon = L.customIcon(options);
      item.marker.setIcon(icon);
    }
  }

  function update_legends(){
    var legendsPanel = document.querySelector(".legends-panel-wrapper:not(.collapse-panel) > .legends-panel");
    if(legendsPanel){
      var goback = legendsPanel.getElementsByClassName("goback")[0];
      goback.classList[some_filtered() ? "remove" : "add"]("disabled");

      var legendsContent = legendsPanel.getElementsByClassName("legends-content")[0];
      L.DomUtil.empty(legendsContent);
      Object.keys(data.storeItems).forEach(function(items){
        listLegend(legendsContent,items,"Color");
        if(items=="markers"){
          listLegend(legendsContent,items,"Shape");
        }
      })

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
      legendsPanel.parentNode.style.display = legendsContent.childNodes.length ? null : "none";
    }

    function listLegend(container,items,visual){
      var itemVisual = getItemOption(items,visual);
      if(data.storeItems[items] && data.options[itemVisual]){
        var column = data.options[itemVisual],
            type = getDFcolumnType(items,column);
        if(type){
          if(type=="number"){
            var domain = visualManagers[itemVisual].getDomain(),
                range = visualManagers[itemVisual].getRange();

            domain = [domain[0],domain[domain.length-1]];

            var legend = displayLegendHeader(container,items,visual,column);
            var scaleWrapper = L.DomUtil.create('div','legend-scale-wrapper',legend);
            var scaleLinear = L.DomUtil.create('div','legend-scale-gradient',scaleWrapper);
            scaleLinear.style.height = "10px";
            scaleLinear.style.width = "100%";
            scaleLinear.style.backgroundImage = "linear-gradient(to right, " + range.join(", ") + ")";

            renderDomain(0);
            renderDomain(1);

            function renderDomain(i){
              var domInput = L.DomUtil.create('input');
              domInput.style.width = "80%";
              domInput.type = "text";
              var container = L.DomUtil.create('div', 'domain'+(i+1), scaleWrapper);
              var span = L.DomUtil.create('span', '', container);
              span.textContent = formatter(domain[i]);
              span.addEventListener("click",function(){
                event.preventDefault();
                domInput.value = "";
                span.parentNode.removeChild(span);
                container.appendChild(domInput);
                domInput.focus();
              })
              domInput.addEventListener("keydown",function(event){
                if(this.parentNode && getKey(event)=="Enter"){
                    domain[i] = +domInput.value;
                    visualManagers[itemVisual].changeDomain(domain);
                    update_items();
                    close(event);
                }
              })
              domInput.addEventListener("blur",close)

              function close(event){
                event.preventDefault();
                if(domInput.parentNode){
                  domInput.parentNode.removeChild(domInput);
                }
                container.appendChild(span);
              }
            }

            var img = L.DomUtil.create('img','edit-legend-scale',legend);
            img.setAttribute("width","24");
            img.setAttribute("height","24");
            img.setAttribute("src",b64Icons.edit);
            img.addEventListener("click",function(){
              displayScalePicker(itemVisual,function(){
                visualManagers[itemVisual].changeLevels(column);
                update_items();
              });
            });
          }else{
            var values = data.storeItems[items].filter(function(item){
              return !item._hidden && !item._outoftime;
            }).map(function(item){
              return item.properties[column];
            });

            if(type=="object"){
              values = multiVariableUniqueValues(values).sort(sortAsc);
            }else{
              values = values.filter(uniqueValues).sort(sortAsc);
            }

            if(values.length){
              var legend = displayLegendHeader(container,items,visual,column);
              values.forEach(function(d){
                var legendItem = L.DomUtil.create('div','legend-item',legend);
                var checkbox = L.DomUtil.create('div','legend-check-box',legendItem);
                var bullet = L.DomUtil.create('div','legend-bullet',legendItem);
                var color = "#000000";
                var shape = "Circle";
                var pickerCallback = function(val){
                      var range = visualManagers[itemVisual].getRange(),
                          domain = visualManagers[itemVisual].getDomain();
                      range[domain.indexOf(d)] = val;
                      visualManagers[itemVisual]._scale.range(range);
                      update_items();
                };
                if(visual=="Color"){
                  color =  visualManagers[itemVisual].getColor(d);
                  bullet.addEventListener("click",function(event){
                    displayColorPicker(d,color,pickerCallback);
                    event.stopPropagation();
                  })
                }else if(visual=="Shape"){
                  shape = visualManagers[itemVisual].getShape(d);
                  bullet.addEventListener("click",function(event){
                    displayShapePicker(d,shape,pickerCallback);
                    event.stopPropagation();
                  })
                }
                displayBullet(bullet,color,shape);
                L.DomUtil.create('span','',legendItem).textContent = d;

                legendItem.style.cursor = "pointer";
                legendItem.addEventListener("click",function(){
                  var checked = checkbox.classList.contains("checked");
                  data.storeItems[items].forEach(function(item){
                    if(isItemSelected(items,item,column,d)){
                      item._selected = !checked;
                    }
                  })
                  update_items();
                });

                if(allItemsSelectedByValue(items,column,d)){
                  checkbox.classList.add("checked");
                }
              })
            }
          }
        }
      }

      function displayBullet(bullet,color,shape){
        var w = 16,
            h = 16,
            namespace = "http://www.w3.org/2000/svg";

        var svg = document.createElementNS(namespace,"svg");
        svg.setAttribute("width", w);
        svg.setAttribute("height", h);
        var g = document.createElementNS(namespace,"g");
        g.setAttribute("transform", "translate(" + (w/2) + "," + (h/2) + ")");
        svg.appendChild(g);
        var path = document.createElementNS(namespace,"path");
        path.setAttribute("d",d3.symbol(d3["symbol"+shape])());
        path.setAttribute("fill",color);
        g.appendChild(path);
        bullet.appendChild(svg);
      }

      function displayLegendHeader(container,items,visual,column){
            var legend = L.DomUtil.create('div','legend',container);
            var legendTitle = L.DomUtil.create('div','legend-title',legend);
            legendTitle.textContent = texts[visual]+" / "+column+" ("+texts[items]+")";
            legendTitle.style.cursor = "pointer";
            legendTitle.addEventListener("click",function(){
              var win = displayWindow(400);
              var h2 = document.createElement("h2");
              h2.textContent = texts.selectattribute+texts[visual];
              win.appendChild(h2)

              var ul = document.createElement("ul");
              ul.classList.add("visual-selector");
              win.appendChild(ul)

              var options = getItemsColumns(items).map(function(d){ return [d,d]; });
              options.unshift(["_default_","-"+texts.default+"-"])
              options.forEach(function(d){
                var value = d[0],
                    text = d[1];
                var li = document.createElement("li");
                li.textContent = text;
                li.value = value;
                if(value==column){
                  li.classList.add("active");
                }
                li.addEventListener("click",function(){
                  ul.childNodes.forEach(function(node){
                    node.classList.remove("active");
                  })
                  this.classList.add("active");
                  applyVisual(items,visual,value);
                  document.body.removeChild(win.parentNode.parentNode);
                });
                ul.appendChild(li);
              });
            });
            L.DomUtil.create('div','legend-separator',legend);
            return legend;
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
      var someselected = some_selected();
      entities_layer.eachLayer(function(layer){
        if(layer.setStyle){
          var fillColor = '#ffff00',
              opacity = data.options.entityOpacity;
          if(layer.feature._table_selection){
            fillColor = '#ff0000';
          }else if(!layer.feature._selected){
            fillColor = visualManagers.entityColor.getItemColor(layer.feature.properties);
            if(someselected){
              opacity = opacity>0.1 ? 0.1 : 0;
            }
          }
          if(layer.feature.geometry.type=="LineString" || layer.feature.geometry.type=="MultiLineString"){
            layer.setStyle({ weight: 2, color: fillColor });
          }else{
            layer.setStyle({ weight: 1, color: "#777777", fillColor: fillColor, fillOpacity: opacity });
          }
        }

        if(layer.label){
          layer.label.removeFrom(entities_layer);
          delete layer.label;
        }
        if(data.options.entityLabel){
          var str = prepareText(layer.feature.properties[data.options.entityLabel]);
          if(str){
            layer.label = L.tooltip({direction: 'center', permanent: true, className: "entity-label"});
            layer.label.setContent(str);
            layer.label.setLatLng(new L.LatLng(layer.feature.properties._lat,layer.feature.properties._lng));
            layer.label.addTo(entities_layer);
          }
        }

        if(layer.text){
          layer.text.removeFrom(entities_layer);
          delete layer.text;
        }
        if(layer.feature._selected && data.options.entityText){
          var str = prepareText(layer.feature.properties[data.options.entityText]);
          if(str){
            layer.text = L.popup({ autoPan: false });
            layer.text.setContent(str);
            layer.text.setLatLng(new L.LatLng(layer.feature.properties._lat,layer.feature.properties._lng));
            layer.text.addTo(entities_layer);
          }
        }
      });
    }
  }

  function update_tools(){
    var panel = document.querySelector(".tools-panel-wrapper:not(.collapse-panel) > .tools-panel");
    if(panel){
      Object.keys(data.storeItems).forEach(function(items){
        var tab = panel.getElementsByClassName("tools-tabs")[0].getElementsByClassName("tab-"+items)[0];
        if(tab && tab.style.display!="none"){
          tab.querySelectorAll(".items-change."+items+"-change > .visual-selector > .select-wrapper > select").forEach(function(select){
            var val = data.options[getItemOption(items,select.parentNode.parentNode.visual)];
            if(!val){
              val = "_default_";
            }
            select.value = val;
          });
          var element = tab.getElementsByClassName("items-filter")[0];
          if(element){
            if(!element.querySelector(".items-filter > .value-selector > .slider-wrapper > .slider")){
              var select = element.querySelector(".items-filter > .select-wrapper > select");
              select.dispatchEvent(new Event('change'));
            }
            var filterButton = element.getElementsByClassName("filter-button")[0];
            filterButton.classList[some_selected(items) ? "remove" : "add"]("disabled");
            var resetfilterButton = element.getElementsByClassName("resetfilter-button")[0];
            resetfilterButton.classList[some_filtered(items) ? "remove" : "add"]("disabled");
          }
        }
      });
    }
  }

  function center_selection(){
    var points = [];
    if(data.storeItems.markers){
      data.storeItems["markers"].forEach(function(item){
        if(item._selected){
          points.push([item.latitude,item.longitude]);
        }
      });
    }
    if(data.storeItems.entities){
      entities_layer.eachLayer(function(layer){
        if(layer.feature && layer.feature._selected){
          points.push([layer.feature.properties._lat,layer.feature.properties._lng]);
        }
      });
    }
    if(data.storeItems.links){
      data.storeItems["links"].forEach(function(item){
        if(item._selected){
          points.push(item.line.getBounds().getCenter());
        }
      });
    }
    center_points(points);
  }

  function center_visibles(){
    var points = [];
    if(data.storeItems.markers){
      data.storeItems["markers"].forEach(function(item){
        if(!item._hidden && !item._outoftime){
          points.push([item.latitude,item.longitude]);
        }
      });
    }
    if(data.storeItems.entities){
      entities_layer.eachLayer(function(layer){
        var item = layer.feature
        if(item && (!item._hidden && !item._outoftime)){
          points.push([item.properties._lat,item.properties._lng]);
        }
      });
    }
    if(data.storeItems.links){
      data.storeItems["links"].forEach(function(item){
        if(!item._hidden && !item._outoftime){
          points.push(item.line.getBounds().getCenter());
        }
      });
    }
    center_points(points);
  }

  function center_points(points){
    if(points.length==0){
      map.setView([0,0],2);
    }else if(points.length==1){
      map.setView(points[0],7);
    }else if(points.length>1){
      var bounds = L.polygon(points).getBounds().pad(0.05);
      map.fitBounds(bounds);
    }
  }

  function select_none(){
    Object.keys(data.storeItems).forEach(function(items){
      data.storeItems[items].forEach(function(item){
        delete item._selected;
      });
    });
    update_items();

    if(infoPanel){
      infoPanel.close();
    }
  }

  function filter_selected(items){
    if(typeof items == "string"){
      items = [items];
    }else{
      items = Object.keys(data.storeItems);
    }
    for(var i=0; i<items.length; i++){
      if(some_selected(items[i])){
        data.storeItems[items[i]].forEach(function(item){
          if(!item._selected){
            item._hidden = true;
          }
        });
      }
    }
    update_items();
  }

  function selectFromTable(items){
    data.storeItems[items].forEach(function(item){
      delete item._selected;
      if(item._table_selection){
        delete item._table_selection;
        item._selected = true;
      }
    });
    update_items();
  }

  function remove_items_filters(items){
    if(data.storeItems[items]){
      data.storeItems[items].forEach(function(item){
        delete item._hidden;
      });
      update_items();
    }
  }

  function remove_filters(){
    Object.keys(data.storeItems).forEach(function(items){
      if(data.storeItems[items]){
        data.storeItems[items].forEach(function(item){
          delete item._hidden;
        });
      }
    });
    update_items();
  }

  function select_all(){
    Object.keys(data.storeItems).forEach(function(items){
      if(data.storeItems[items]){
        data.storeItems[items].forEach(function(item){
          item._selected = true;
        });
      }
    });
    update_items();
  }

  function shortcuts(){
    document.body.onkeydown = function(event){
    var key = getKey(event);
    if(event.ctrlKey || event.metaKey){
      switch(key){
        case "ArrowLeft":
          event.preventDefault();
          if(event.shiftKey){
            return;
          }
          var center = map.getCenter();
          center.lng = center.lng - panstep;
          map.panTo(center);
          return;
        case "ArrowUp":
          event.preventDefault();
          var center = map.getCenter();
          center.lat = center.lat + panstep;
          map.panTo(center);
          return;
        case "ArrowRight":
          event.preventDefault();
          if(event.shiftKey){
            return;
          }
          var center = map.getCenter();
          center.lng = center.lng + panstep;
          map.panTo(center);
          return;
        case "ArrowDown":
          event.preventDefault();
          var center = map.getCenter();
          center.lat = center.lat - panstep;
          map.panTo(center);
          return;
        case "+":
          event.preventDefault();
          map.setZoom(map.getZoom()+zoomstep);
          return;
        case "-":
          event.preventDefault();
          map.setZoom(map.getZoom()-zoomstep);
          return;
        case "0":
        case "1":
        case "2":
        case "3":
        case "c":
        case "f":
        case "o":
        case "r":
        case "s":
        case "x":
          event.preventDefault();
          return;
      }
    }
    }

    document.body.onkeyup = function(event){
    var key = getKey(event);
    if(event.ctrlKey || event.metaKey){
      switch(key){
        case "ArrowLeft":
          event.preventDefault();
          if(event.shiftKey){
            document.querySelector("a.time-control-prev").dispatchEvent(new Event('click'));
          }
          return;
        case "ArrowRight":
          event.preventDefault();
          if(event.shiftKey){
            document.querySelector("a.time-control-next").dispatchEvent(new Event('click'));
          }
          return;
        case "0":
          resetView(map);
          return;
        case "1":
          if(data.options.controls.tools !== undefined){
            data.options.controls.tools = !data.options.controls.tools;
            renderMap(data);
          }
          return;
        case "2":
          if(data.options.controls.buttons !== undefined){
            data.options.controls.buttons = !data.options.controls.buttons;
            renderMap(data);
          }
          return;
        case "3":
          if(data.options.controls.legends !== undefined){
            data.options.controls.legends = !data.options.controls.legends;
            renderMap(data);
          }
          return;
        case "c":
          resetPan(map);
          return;
        case "f":
          if(some_selected()){
            filter_selected();
          }
          return;
        case "o":
          var activetable = document.querySelector(".tables-section > .tables-section-header > .items-nav > ul > li.active");
          if(activetable){
            var items = activetable.item;
            if(data.storeItems[items].filter(function(item){ return item._table_selection; }).length){
              selectFromTable(items);
            }
          }
          return;
        case "r":
          remove_filters();
          return;
        case "s":
          select_all();
          return;
        case "x":
          if(event.shiftKey){
            ["tools","buttons","legends"].forEach(function(d){
              if(data.options.controls[d]){
                data.options.controls[d] = false;
              }
            })
            renderMap(data);
          }else if(infoPanel){
            infoPanel.close();
          }
          return;
      }
    }else{
      switch(key){
        case " ":
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
  }

  function resetView(map){
    checkPeriodView(map,function(){
      map.setView(data.options.center, data.options.zoom);
    });
  }

  function resetPan(map){
    checkPeriodView(map,function(){
      map.panTo(data.options.center);
    });
  }

  function periodView(map){
    checkPeriodView(map,function(){
      if(!locationurl && data.options.autoZoom){
        center_visibles();
      }
    });
  }

  function checkPeriodView(map,callback){
      if((data.periods && data.options.byperiod) && ((data.options.periodLatitude && data.options.periodLongitude) || data.options.periodZoom)){
          var center = map.getCenter(),
              zoom  = map.getZoom();
          if(data.options.periodZoom){
            zoom = getValuesFromDF("periods","periodZoom")[current];
          }
          if(data.options.periodLatitude && data.options.periodLongitude){
            center = [getValuesFromDF("periods","periodLatitude")[current],getValuesFromDF("periods","periodLongitude")[current]];
          }
          map.setView(center,zoom);
      }else if(callback){
        callback();
      }
  }

  function some_selected(items){
    if(typeof items == "string"){
      items = [items];
    }else{
      items = Object.keys(data.storeItems);
    }
    for(var i=0; i<items.length; i++){
      if(data.storeItems[items[i]].filter(function(item){ return item._selected; }).length){
        return true;
      }
    }
    return false;
  }

  function all_selected(items){
    if(typeof items == "string"){
      items = [items];
    }else{
      items = Object.keys(data.storeItems);
    }
    for(var i=0; i<items.length; i++){
      if(data.storeItems[items[i]].filter(function(item){ return !item._selected; }).length){
        return false;
      }
    }
    return true;
  }

  function some_filtered(items){
    if(typeof items == "string"){
      items = [items];
    }else{
      items = Object.keys(data.storeItems);
    }
    for(var i=0; i<items.length; i++){
      if(data.storeItems[items[i]].filter(function(item){ return item._hidden; }).length){
        return true;
      }
    }
    return false;
  }
} // end function onload

// color management
function colorMgmt(items,itemProp){
  this._items = items;
  this._itemProp = itemProp;
  this._itemCol;
  this._scale;
  this._type;
  this.changeLevels(data.options[this._itemProp]);
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
      if(value !== null && typeof value == "object" && value.length){
        value = value[0];
      }
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
  changeDomain: function(x){
    if(this._scale){
      if(typeof x != 'object'){
        x = [x,x];
      }
      if(this._type=="number"){
        if(x.length>2){
          x = [x[0],x[x.length-1]];
        }
        if(this._scale.range().length==3){
          x = [x[0],(x[0]+x[1])/2,x[1]];
        }
      }
      this._scale.domain(x);
    }
  },
  changeLevels: function(x){
    this._itemCol = x;
    if(x){
      var col = data[this._items].columns.indexOf(x);
      if(col!=-1){
        this._type = data[this._items].types[col];
        var explicitCol = data[this._items].columns.indexOf("_"+this._itemProp+"_"+this._itemCol);
        if(explicitCol!=-1){
          // use explicit colors
          var aux = uniqueRangeDomain(data[this._items].data[col], data[this._items].data[explicitCol]);
          this._scale = d3.scaleOrdinal()
            .domain(aux.domain)
            .range(aux.range)
        }else{
          if(this._type=="number"){
            if(!data.options["colorScale"+this._itemProp]){
              data.options["colorScale"+this._itemProp] = "WhBu";
            }
            var domain = valuesExtent(data[this._items].data[col]),
                range = data.colors.colorScales[data.options["colorScale"+this._itemProp]];
            if(range.length==3){
              domain = [domain[0],(domain[0]+domain[1])/2,domain[1]];
            }
            this._scale = d3.scaleLinear()
            .domain(domain)
            .range(range)
            .clamp(true)
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

// shape management
function shapeMgmt(items,itemProp){
  this._items = items;
  this._itemProp = itemProp;
  this._itemCol;
  this._scale;
  this.changeLevels(data.options[this._itemProp]);
}

shapeMgmt.prototype = {
  getItemShape: function(item){
    if(data.options[this._itemProp]=="_none_"){
      return "_none_";
    }

    if(data.options[this._itemProp]!=this._itemCol){
      this.changeLevels(data.options[this._itemProp]);
    }

    return this.getShape(this._itemCol ? item[this._itemCol] : null);
  },
  getShape: function(value){
    var shape = "Circle";
    if(this._scale){
      if(value !== null && typeof value == "object" && value.length){
        value = value[0];
      }
      shape = this._scale(value);
      if(!shape){
        shape = "Circle";
      }
    }
    return shape;
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
          // use explicit shapes
          var aux = uniqueRangeDomain(data[this._items].data[col], data[this._items].data[explicitCol]);
          this._scale = d3.scaleOrdinal()
            .domain(aux.domain)
            .range(aux.range)
        }else{
          if(data[this._items].types[col]!="number"){
            this._scale = d3.scaleOrdinal()
            .domain(data[this._items].data[col])
            .range(data.shapes)
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
  var contentDiv = this.panelContentDiv = document.createElement("div");

  this.panel.appendChild(this.dragbar);
  this.panel.appendChild(this.closeButton);
  this.panel.appendChild(this.panelContent);
  this.panelContent.appendChild(this.panelContentDiv);
  document.body.appendChild(this.panel);

  dragElementX(this.dragbar,function(pos){
    // panel margin and dragbar width offset
    pos = pos - 15;
    // check some bounds
    if((pos > document.body.clientWidth*0.5) && (pos < document.body.clientWidth*0.85)){
      // set panel left position
      panel.style.left = pos + "px";
    }
  },function(){
    contentDiv.style.display = "none";
  },function(){
    contentDiv.style.display = null;
  });

  this.closeButton.onclick = closePanel;

  function closePanel(){
    panel.style.display = "none";
  }
}

InfoPanel.prototype = {
  changeContent: function(content){
    this.panelContentDiv.innerHTML = content;
    this.panel.style.display = "block";
  },
  close: function(){
    this.closeButton.click();
  }
}

function getIconMarkerURI(color,shape){
  color = color ? color : data.options.defaultColor;
  if(shape){
    if(shape=="_none_"){
      return "data:image/svg+xml;base64,"+btoa('<?xml version="1.0" encoding="UTF-8"?><svg width="40" height="40" version="1.1" xmlns="http://www.w3.org/2000/svg"></svg>');
    }else{
      return "data:image/svg+xml;base64,"+btoa('<?xml version="1.0" encoding="UTF-8"?>'+
'<svg width="40" height="40" version="1.1" viewBox="-10 -10 20 20" xmlns="http://www.w3.org/2000/svg">'+
'<path d="'+d3.symbol(d3["symbol"+shape])()+'" fill="'+color+'"/>'+
'</svg>');
    }
  }
  return "data:image/svg+xml;base64,"+btoa('<?xml version="1.0" encoding="UTF-8"?>'+
'<svg width="40" height="40" version="1.1" viewBox="0 0 10.583 10.583" xmlns="http://www.w3.org/2000/svg">'+
'<path d="m8.599 3.3073c-1e-7 1.8266-3.3073 7.276-3.3073 7.276s-3.3073-5.4495-3.3073-7.276c0-1.8266 1.4807-3.3073 3.3073-3.3073 1.8266 5.5228e-8 3.3073 1.4807 3.3073 3.3073z" fill="'+color+'"/>'+
'<path d="m7.276 3.3073a1.9844 1.9844 0 0 1-1.9844 1.9844 1.9844 1.9844 0 0 1-1.9844-1.9844 1.9844 1.9844 0 0 1 1.9844-1.9844 1.9844 1.9844 0 0 1 1.9844 1.9844z" fill="#ffffff"/>'+
'</svg>');
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
        var storeItems = data.storeItems[items];
        for(var i=0; i<storeItems.length; i++){
          if(!storeItems[i]._hidden && !storeItems[i]._outoftime){
            if(isItemSelected(items,storeItems[i],column,value)){
              if(storeItems[i]._selected){
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

function isItemSelected(items,item,column,value){
  var itemValue = item.properties[column];
  if(getDFcolumnType(items,column)=="object"){
    if(typeof value == "object"){
      return intersection(value,itemValue).length;
    }else{
      return itemValue.indexOf(String(value))!=-1;
    }
  }else{
    if(typeof value == "object"){
      return value.indexOf(itemValue)!=-1;
    }else{
      return String(value)==String(itemValue);
    }
  }
}

function addVisualSelector(sel,items,visual,applyVisual){
    var wrapper = L.DomUtil.create('div','visual-selector',sel);
    wrapper.visual = visual;
    var div = L.DomUtil.create('div','',wrapper);
    L.DomUtil.create('span','',div).textContent = texts[visual];

    var options = getItemsColumns(items).map(function(d){ return [d,d]; });
    options.unshift(["_default_","-"+texts.default+"-"])
    displaySelectWrapper(wrapper,options,function(value){
      applyVisual(items,visual,value);
    },data.options[getItemOption(items,visual)]);
}

function displayItemFilter(div,items,filter_selected,remove_filters,update_items){
    L.DomUtil.create('h4','',div).textContent = texts["filter"];

    var selectChangeFunction = function(value){
      L.DomUtil.empty(valueSelector);
      var values = data.storeItems[items].filter(function(d){ return !d._hidden && !d._outoftime; }).map(function(d){ return d.properties[value]; });
      var type = getDFcolumnType(items,value);
      if(type=="number"){
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
        if(type=="object"){
          values = multiVariableUniqueValues(values).sort(sortAsc);
        }else{
          values = values.filter(uniqueValues).sort(sortAsc);
        }
        var select = L.DomUtil.create('select','',valueSelector);
        select.setAttribute("multiple","multiple");
        select.setAttribute("size",8);
        values.forEach(function(v){
          var opt = L.DomUtil.create('option','',select);
          opt.textContent = v;
          opt.value = v;
          if(allItemsSelectedByValue(items,value,v)){
            opt.selected = true;
          }
        })
        select.addEventListener("change",function(){
          var values = getSelectValues(this);
          data.storeItems[items].forEach(function(item){
            delete item._selected;
            if(isItemSelected(items,item,value,values)){
              item._selected = true;
            }
          });
          update_items();
        });
      }
    }

    var columns = getItemsColumns(items);
    displaySelectWrapper(div,columns,selectChangeFunction,columns[0]);
    var valueSelector = L.DomUtil.create('div','value-selector',div);

    var filter = L.DomUtil.create('button','primary filter-button',div);
    filter.textContent = texts["filter"];
    filter.addEventListener("click",function(){
      filter_selected(items);
    });

    var clear = L.DomUtil.create('button','primary-outline clear resetfilter-button',div);
    clear.textContent = texts["clear"];
    clear.addEventListener("click",function(){
      remove_filters(items);
    });
}

function displaySelectWrapper(element,options,callback,def){
    var selectWrapper = L.DomUtil.create('div','select-wrapper',element);
    var select = L.DomUtil.create('select','',selectWrapper);
    options.forEach(function(d){
      var opt = L.DomUtil.create('option','',select);
      var text = typeof d == 'object' ? d[1] : d,
          val = typeof d == 'object' ? d[0] : d;
      opt.textContent = text;
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
    title.textContent = texts["selectacolorscalefor"] + " \""+attr+"\"";
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
    button.textContent = texts["select"];
    button.addEventListener("click",function(){
          data.options["colorScale"+option] = picker.getElementsByClassName("active")[0].val;
          callback();
          var bg = win.parentNode.parentNode;
          bg.parentNode.removeChild(bg);
    })
    center.appendChild(button);
    win.appendChild(center);
}

function displayColorPicker(value, active, callback){
    var r = 14,
        itemsPerRow = 10,
        row,
        win = displayWindow((r*2+12)*itemsPerRow),
        colorPicker = false;

    var title = document.createElement("h2");
    title.textContent = texts["selectacolorfor"] + " \""+value+"\"";
    win.appendChild(title);

    var picker = document.createElement("div");
    picker.classList.add("picker");
    win.appendChild(picker);

    data.colors.categoryColors.forEach(function(d){
      if(!row || row.getElementsByTagName("span").length>=itemsPerRow){
        row = document.createElement("div");
        row.classList.add("row");
        picker.appendChild(row);
      }

      var rowSpan = document.createElement("span");
      rowSpan.style.width = (r*2+1)+"px";
      rowSpan.style.height = (r*2+1)+"px";
      rowSpan.val = d;
      rowSpan.classList[active==d ? "add" : "remove"]("active")
      rowSpan.addEventListener("click",function(){
          deactiveSpans(picker);
          this.classList.add("active");
          active = d;
          if(colorPicker){
            colorPicker.color.hexString = active;
          }
      })
      rowSpan.style.backgroundColor = d;
      row.appendChild(rowSpan);
    });

    if(window.iro){
      var iroContainer;

      var center = document.createElement("center");
      var button = document.createElement("button");
      button.classList.add("custom-color");
      button.textContent = texts["selectcustomcolor"];
      button.addEventListener("click",function(){
        iroContainer.style.display = iroContainer.style.display == "block" ? "none" : "block";
      });
      center.appendChild(button);
      win.appendChild(center);

      var iroContainer = document.createElement("center");
      iroContainer.setAttribute("id","iro-picker");
      iroContainer.style.display = "none";
      win.appendChild(iroContainer);

      colorPicker = new window.iro.ColorPicker('#iro-picker', {
        width: 200,
        color: active
      });

      colorPicker.on('input:change', function(color) {
          deactiveSpans(picker);
          active = color.hexString;
      });
    }

    var center = document.createElement("center");
    var button = document.createElement("button");
    button.classList.add("primary");
    button.textContent = texts["select"];
    button.addEventListener("click",function(){
          callback(active);
          var bg = win.parentNode.parentNode;
          bg.parentNode.removeChild(bg);
    })
    center.appendChild(button);
    win.appendChild(center);

    function deactiveSpans(picker){
        var spans = picker.getElementsByTagName("span");
        for(var i=0; i<spans.length; i++){
          spans[i].classList.remove("active");
        }
    }
}

function displayShapePicker(value, active, callback){
    var r = 14,
        itemsPerRow = 10,
        row,
        win = displayWindow((r*2+12)*itemsPerRow);

    var title = document.createElement("h2");
    title.textContent = texts["selectashapefor"] + " \""+value+"\"";
    win.appendChild(title);

    var picker = document.createElement("div");
    picker.classList.add("picker");
    win.appendChild(picker);

    data.shapes.forEach(function(d){
      if(!row || row.getElementsByTagName("span").length>=itemsPerRow){
        row = document.createElement("div");
        row.classList.add("row");
        picker.appendChild(row);
      }

      var rowSpan = document.createElement("span");
      rowSpan.style.width = (r*2+1)+"px";
      rowSpan.style.height = (r*2+1)+"px";
      rowSpan.val = d;
      rowSpan.classList[active==d ? "add" : "remove"]("active")
      rowSpan.addEventListener("click",function(){
          deactiveSpans(picker);
          this.classList.add("active");
          active = d;
      })
      row.appendChild(rowSpan);

      var canvas = document.createElement("canvas");
      canvas.setAttribute("width",r*2);
      canvas.setAttribute("height",r*2);
      canvas.textContent = d;
      rowSpan.appendChild(canvas);

      var ctx = canvas.getContext("2d");

      ctx.translate(r, r);
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      d3.symbol(d3["symbol"+d]).size(r*10).context(ctx)();
      ctx.closePath();
      ctx.fill();
    });

    var center = document.createElement("center");
    var button = document.createElement("button");
    button.classList.add("primary");
    button.textContent = texts["select"];
    button.addEventListener("click",function(){
          callback(active);
          var bg = win.parentNode.parentNode;
          bg.parentNode.removeChild(bg);
    })
    center.appendChild(button);
    win.appendChild(center);

    function deactiveSpans(picker){
        var spans = picker.getElementsByTagName("span");
        for(var i=0; i<spans.length; i++){
          spans[i].classList.remove("active");
        }
    }
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
  closeButton.addEventListener("click", function(){ document.body.removeChild(bg); });
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
function createNewPanel(name,controls,update,parent){
    var panel = L.DomUtil.create('div', 'leaflet-bar '+name+'-panel panel-style',parent);
    panel.style.width = "240px";

    panelStopPropagation(panel);
    if(controls){
        var header = L.DomUtil.create('div','highlight-header',panel);
        header.textContent = texts[name];
        var closeButton = L.DomUtil.create('div','close-button',header);
        closeButton.addEventListener("click",function(event){
          controls[name] = false;
          parentVisibility();
        });

        panel.parentNode.appendChild(createShowPanelButton(function(){
          controls[name] = true;
          parentVisibility();
          update();
        }));

        parentVisibility();

        function parentVisibility(){
          if(panel.parentNode){
            if(controls[name]){
              panel.parentNode.classList.remove("collapse-panel");
            }else{
              panel.parentNode.classList.add("collapse-panel");
            }
          }
        }
    }

    return panel;
}

function panelStopPropagation(panel){
    L.DomEvent.on(panel, "click dblclick wheel mousedown pointerdown", function(event){
        L.DomEvent.stopPropagation(event);
    })
}

function createShowPanelButton(callback){
    var showPanelButton = document.createElement("div");
    showPanelButton.classList.add("show-panel-button");
    showPanelButton.addEventListener("click",callback);
    for(var i=0; i<3; i++){
      showPanelButton.appendChild(document.createElement("span"));
    }
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
    if(dabs>0 && dabs<1e-2){
      d = d.toExponential(2);
    }else{
      d = (d % 1 === 0)?d:d.toFixed(2);
    }
  }
  return String(d);
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

      var rect = slider.getBoundingClientRect();
      dragElementX(icon,function(pos){
        pos = pos - rect.left;
        if(pos<0){
          pos = 0;
        }
        if(pos>rect.width){
          pos = rect.width;
        }
        sliderHandle.style.left = pos + "px";
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

function dragElementX(handler,drag,start,end) {
  handler.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();

    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;

    if(typeof start == "function"){
      start();
    }
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();

    // set the element's new position:
    drag(e.clientX);
  }

  function closeDragElement() {
    /* stop moving when mouse button is released:*/
    document.onmouseup = null;
    document.onmousemove = null;

    if(typeof end == "function"){
      end();
    }
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

  chart: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path fill="#2F7BEE" d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z"/></svg>'),

  table: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px"><path fill="#2F7BEE" d="M19,7H9C7.9,7,7,7.9,7,9v10c0,1.1,0.9,2,2,2h10c1.1,0,2-0.9,2-2V9C21,7.9,20.1,7,19,7z M19,9v2H9V9H19z M13,15v-2h2v2H13z M15,17v2h-2v-2H15z M11,15H9v-2h2V15z M17,13h2v2h-2V13z M9,17h2v2H9V17z M17,19v-2h2v2H17z M6,17H5c-1.1,0-2-0.9-2-2V5 c0-1.1,0.9-2,2-2h10c1.1,0,2,0.9,2,2v1h-2V5H5v10h1V17z"/></svg>'),

  drop: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path fill="#2F7BEE" d="M12,2c-5.33,4.55-8,8.48-8,11.8c0,4.98,3.8,8.2,8,8.2s8-3.22,8-8.2C20,10.48,17.33,6.55,12,2z M12,20c-3.35,0-6-2.57-6-6.2 c0-2.34,1.95-5.44,6-9.14c4.05,3.7,6,6.79,6,9.14C18,17.43,15.35,20,12,20z M7.83,14c0.37,0,0.67,0.26,0.74,0.62 c0.41,2.22,2.28,2.98,3.64,2.87c0.43-0.02,0.79,0.32,0.79,0.75c0,0.4-0.32,0.73-0.72,0.75c-2.13,0.13-4.62-1.09-5.19-4.12 C7.01,14.42,7.37,14,7.83,14z"/></svg>'),

  location: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z"/><circle cx="12" cy="9" r="2.5"/></svg>'),

  pentagon: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M19.63,9.78L16.56,19H7.44L4.37,9.78L12,4.44L19.63,9.78z M2,9l4,12h12l4-12L12,2L2,9z"/></svg>'),

  hexagon: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><path d="M17.2,3H6.8l-5.2,9l5.2,9h10.4l5.2-9L17.2,3z M16.05,19H7.95l-4.04-7l4.04-7h8.09l4.04,7L16.05,19z"/></svg>'),

  wordcloud: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#2F7BEE"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6m0-2C9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96C18.67 6.59 15.64 4 12 4z"/><path d="m7.2385 10.065h1.6467l1.1513 4.8418 1.1424-4.8418h1.6556l1.1424 4.8418 1.1513-4.8418h1.6333l-1.5708 6.6625h-1.9814l-1.2093-5.065-1.196 5.065h-1.9814z"/></svg>'),

  edit: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" ><path d="M0 0H24V24H0V0Z" fill="none"/><path d="M14.06 9.02L14.98 9.94L5.92 19H5V18.08L14.06 9.02V9.02ZM17.66 3C17.41 3 17.15 3.1 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C18.17 3.09 17.92 3 17.66 3V3ZM14.06 6.19L3 17.25V21H6.75L17.81 9.94L14.06 6.19V6.19Z" fill="#2F7BEE"/></svg>'),

  xlsx: "data:image/svg+xml;base64,PHN2ZyB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgaGVpZ2h0PSIxNCIgd2lkdGg9IjE0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgdmlld0JveD0iMCAwIDE0IDE0Ij4KPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtMTAzOC40KSI+CjxnPgo8cmVjdCBoZWlnaHQ9IjEwLjQ3MiIgc3Ryb2tlPSIjMjA3MjQ1IiBzdHJva2Utd2lkdGg9Ii41MDIwMSIgZmlsbD0iI2ZmZiIgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIuNTM2OTYiIHdpZHRoPSI3Ljg2NDYiIHk9IjEwNDAiIHg9IjUuODc4OCIvPgo8ZyBmaWxsPSIjMjA3MjQ1Ij4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0MS4yIiB4PSIxMC4xNjUiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0Mi45IiB4PSIxMC4xNjUiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0NC43IiB4PSIxMC4xNjUiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0Ni40IiB4PSIxMC4xNjUiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0OC4yIiB4PSIxMC4xNjUiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0MS4yIiB4PSI3LjI0NzgiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0Mi45IiB4PSI3LjI0NzgiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0NC43IiB4PSI3LjI0NzgiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0Ni40IiB4PSI3LjI0NzgiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0OC4yIiB4PSI3LjI0NzgiLz4KPHBhdGggc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIGQ9Im0wIDEwMzkuNyA4LjIzMDEtMS4zN3YxNGwtOC4yMzAxLTEuNHoiLz4KPC9nPgo8L2c+CjxnIGZpbGw9IiNmZmYiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEuMzI1OCAuMDYyNSAtMzM5LjcyKSI+CjxwYXRoIGQ9Im00LjQwNiAxMDQ0LjZsMS4zNzUzIDIuMDU2OC0xLjA3MjUtMC4wNjEtMC44OTAzLTEuMzU2LTAuODQ1NjYgMS4yNTc4LTAuOTQxNTYtMC4wNTMgMS4yMTg3LTEuODU0NC0xLjE3My0xLjgwMDggMC45NDE0MS0wLjAzNSAwLjgwMDE0IDEuMjAxMSAwLjgzMDQzLTEuMjYyNiAxLjA3NzUtMC4wNDFzLTEuMzIwNSAxLjk0ODItMS4zMjA1IDEuOTQ4MiIgZmlsbD0iI2ZmZiIvPgo8L2c+CjwvZz4KPC9zdmc+Cg=="
}

function getValuesFromDF(items,opt){
  var idx = data[items].columns.indexOf(data.options[opt]);
  if(idx!=-1){
    return data[items].data[idx];
  }
  return false;
}

function getDFcolumnType(items,col){
  var idx = data[items].columns.indexOf(col);
  if(idx!=-1){
    return data[items].types[idx];
  }
  return false;
}

function getItemsColumns(items){
  return data[items].columns.filter(function(d,i){
        if(items=="markers" && d==data.options.image){
          return false;
        }
        if(items=="markers" && d==data.options.markerInfo){
          return false;
        }
        if(items=="markers" && d==data.options.markerText){
          return false;
        }
        if(d.charAt(0)!="_"){
          return true;
        }
        return false;
    });
}

function getItemOption(items,opt){
  var dict = {
    "markers": "marker",
    "links": "link",
    "entities": "entity"
  };
  return dict[items]+opt;
}

function loadMultiVariables(data){
  for(var key in data){
    // check if is a data frame
    if(data[key].data && data[key].columns && data[key].types){
      data[key].types.forEach(function(type,i){
        if(type=="object"){
          data[key].data[i] = data[key].data[i].map(function(d){
            if(d){
              d = d.split("|");
            }else{
              d = [];
            }
            return d;
          });
        }
      });
    }
  }
  return data;
}

function multiVariableUniqueValues(values){
  var aux = [];
  values.forEach(function(val){
    val.forEach(function(v){
      aux.push(v);
    });
  });
  return aux.filter(uniqueValues);
}

function intersection(a, b){
    var ai=0, bi=0;
    var result = [];

    while( ai < a.length && bi < b.length ){
       if      (a[ai] < b[bi] ){ ai++; }
       else if (a[ai] > b[bi] ){ bi++; }
       else{
         result.push(a[ai]);
         ai++;
         bi++;
       }
    }

    return result;
}

function prepareText(txt){
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

function controlsVisibility(data){
  var controls = {};

  controls.tools = showControls(data.options,1);
  controls.buttons = showControls(data.options,2);
  controls.legends = showControls(data.options,3);

  data.options.controls = controls;

  return data;

  function showControls(options,n){
    if(options.hasOwnProperty("controls")){
        if(options.controls===0)
          return undefined;
        if(options.controls==-n)
          return undefined;
        if(options.controls==n)
          return true;
        if(Array.isArray(options.controls)){
          if(options.controls.indexOf(-n)!=-1)
            return undefined;
          if(options.controls.indexOf(n)!=-1)
            return true;
        }
    }
    return false;
  }
}

function getGeoCenter(geometry) {
  if(geometry.type=="Point"){
    return [geometry.coordinates[1],geometry.coordinates[0]];
  }

  if(geometry.type=="MultiPoint" || geometry.type=="LineString"){
    return getCentroid(geometry.coordinates).reverse();
  }

  if(geometry.type=="Polygon"){
    return getCentroid(geometry.coordinates[0]).reverse();
  }

  if(geometry.type=="MultiLineString"){
    var j = 0;
    for(var i=0; i<geometry.coordinates.length; i++){
      if(i>0){
        var area1 = L.bounds(geometry.coordinates[i]).getSize(),
            area2 = L.bounds(geometry.coordinates[j]).getSize();
        area1 = area1.x*area1.y;
        area2 = area2.x*area2.y;
        if(area1 > area2){
          j = i;
        }
      }
    }
    return getCentroid(geometry.coordinates[j][0]).reverse();
  }

  if(geometry.type=="MultiPolygon"){
    var j = 0;
    for(var i=0; i<geometry.coordinates.length; i++){
      if(i>0){
        var area1 = L.bounds(geometry.coordinates[i][0]).getSize(),
            area2 = L.bounds(geometry.coordinates[j][0]).getSize();
        area1 = area1.x*area1.y;
        area2 = area2.x*area2.y;
        if(area1 > area2){
          j = i;
        }
      }
    }
    return getCentroid(geometry.coordinates[j][0]).reverse();
  }   
}

function getCentroid(arr) {
    var length = arr.length;

    if(length==2){
      return [(arr[0][0]+arr[1][0])/2,(arr[0][1]+arr[1][1])/2];
    }

    var maxx = -Infinity,
        maxy = -Infinity,
        minx = Infinity,
        miny = Infinity;

    var twoTimesSignedArea = 0;
    var cxTimes6SignedArea = 0;
    var cyTimes6SignedArea = 0;

    var x = function (i) { return arr[i % length][0] };
    var y = function (i) { return arr[i % length][1] };

    for ( var i = 0; i < arr.length; i++) {
        if(x(i)>maxx){
          maxx = x(i);
        }
        if(y(i)>maxy){
          maxy = y(i);
        }
        if(x(i)<minx){
          minx = x(i);
        }
        if(y(i)<miny){
          miny = y(i);
        }

        var twoSA = x(i)*y(i+1) - x(i+1)*y(i);
        twoTimesSignedArea += twoSA;
        cxTimes6SignedArea += (x(i) + x(i+1)) * twoSA;
        cyTimes6SignedArea += (y(i) + y(i+1)) * twoSA;
    }
    var sixSignedArea = 3 * twoTimesSignedArea;

    if(!sixSignedArea){
      return [(minx+maxx)/2,(miny+maxy)/2];
    }

    var res = [cxTimes6SignedArea / sixSignedArea, cyTimes6SignedArea / sixSignedArea];
    if(res[0]>maxx || res[0]<minx || res[1]>maxy || res[1]<miny){
      res = [(minx+maxx)/2,(miny+maxy)/2];
    }
    return res;
}

function quadraticPoint(sx,sy,tx,ty){
      var offSetX,
          offSetY;

      if(sx==tx && sy==ty){
        return [sx,sy];
      }

      var dx = tx - sx,
          dy = ty - sy;

      var dr = Math.sqrt((dx * dx) + (dy * dy));

      var offset = dr/10;

      var midpoint_x = (sx + tx) / 2,
          midpoint_y = (sy + ty) / 2;

      var offSetX = offset*(dy/dr),
          offSetY = offset*(dx/dr);

      offSetX = midpoint_x + offSetX;
      offSetY = midpoint_y - offSetY;

      return [offSetX,offSetY];
}
