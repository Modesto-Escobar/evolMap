window.onload = function(){
  b64Icons = b64IconsColor(data.options.defaultColor,32);
  colorScheme(data.options.defaultColor);
  data = loadMultiVariables(data);
  data = controlsVisibility(data);

  renderMap(data);

  if(typeof tutorialTour != "undefined"){
    tutorialTour(data.options);
  }
}

var filter_criteria = {
  selection: new Set(),
  filter: new Set()
};

function colorScheme(defaultColor){
    var contrast = contrastColor(defaultColor);
    var style = document.createElement("style");
    style.textContent =
'button.primary { background-color: '+defaultColor+'; color: '+contrast+'; } '+
'button.primary-outline { background-color: '+contrast+'; color: '+defaultColor+'; border-color: '+defaultColor+'; } '+
'#Wrapper > .footer-note { background-color: '+defaultColor+'; color: '+contrast+'; } '+
'.time-control .leaflet-control-time-control svg.icon { fill: '+defaultColor+'; } '+
'input.slider::-webkit-slider-thumb { background-color: '+defaultColor+'; } '+
'input.slider::-moz-range-thumb { background-color: '+defaultColor+'; } '+
'.highlight-header { background-color: '+defaultColor+'; color: '+contrast+'; } '+
'.highlight-header > .close-button:before, .highlight-header > .close-button:after { background-color: '+contrast+'; } '+
'.items-nav > ul > li { background-color: '+defaultColor+'; color: '+contrast+'; } '+
'.items-nav2 > ul > li { background-color: '+defaultColor+'; color: '+contrast+'; } '+
'.zoom-buttons > button.zoomreset { background-color: '+defaultColor+'; color: '+contrast+'; } '+
'.picker li.active > * { background-color: '+defaultColor+'; } '+
'.search-panel > .search-padding > .search-wrapper > .search-icon > svg { fill: '+defaultColor+'; } '+
'.show-panel-button { background-color: '+defaultColor+'; } '+
'.show-panel-button > span { background-color: '+contrast+'; } '+
'.legend-check-box { border-color: '+defaultColor+'; } '+
'.legend-check-box.checked { background-color: '+defaultColor+'; border-color: '+defaultColor+'; } '+
'.tables-section > .tables-container > table > thead > tr > th.sorting_asc:after, .tables-section > .tables-container > table > thead > tr > th.sorting_desc:after { color: '+defaultColor+'; } '+
'.frequencies-section > .frequencies-container > .frequency-barplots > .bar-plot > .show-more-less-bars { color: '+defaultColor+'; } '+
'.frequencies-section > .frequencies-container > .frequency-barplots > .bar-plot > .show-more-less-bars > span:after { background-image: url('+b64Icons.chevron+'); } '+
'.main-date-viewer > .main-date-next { border-left-color: '+defaultColor+'; } '+
'.main-date-viewer > .main-date-prev { border-right-color: '+defaultColor+'; } '+
'.show-panel-button >  span { background-color: '+contrast+'; color: '+defaultColor+'; }' +
'div.tutorial span.highlight { color: '+defaultColor+'; } '+
'div.tutorial-arrow:before { background-color: '+defaultColor+'; } '+
'div.tutorial-arrow:after { border-bottom-color: '+defaultColor+'; } '+
'div.tutorial > .img-and-text > img:first-child { border-color: '+defaultColor+'; } '+
'div.tutorial-icon { background-color: '+defaultColor+'; } '+
'div.tutorial-icon:after { color: '+contrast+'; }';

    document.querySelector("html > head").appendChild(style);
}

function contrastColor(color){
  return d3.hsl(color).l > 0.66 ? '#000000' : '#ffffff';
}

function renderMap(data){
  var zoomstep = data.options.zoomstep,
      panstep = 25;

  document.body.innerHTML = '<div id="Wrapper"></div>';
  shortcuts();

  var Wrapper = document.getElementById("Wrapper");

  var contentWrapper = document.createElement("div");
  contentWrapper.id = "contentWrapper";

  var mapWrapper = document.createElement("div");
  mapWrapper.id = "mapWrapper";

  if(data.options.hasOwnProperty("description")){
    var description = document.createElement("div");
    description.id = "descriptionWrapper";
    contentWrapper.appendChild(description);

    var descriptionWidth = 25;
    if(data.options.hasOwnProperty("descriptionWidth")){
      descriptionWidth = data.options.descriptionWidth;
    }
    mapWrapper.style.width = (100-descriptionWidth) + "%";
    description.style.width = descriptionWidth + "%";

    descriptionContent();

    function emptyDescription(){
      for (var i = description.childNodes.length - 1; i >= 0; i--) {
          description.removeChild(description.childNodes[i]);
      }
    }
  
    function descriptionCloseButton(){
      var close = document.createElement("div");
      close.classList.add("close-button");
      close.addEventListener("click",function(){
        descriptionContent();
      });
      description.appendChild(close);
    }

    function descriptionContent(content){
      emptyDescription();
      var div = document.createElement("div");
      div.classList.add("description-content");
      div.innerHTML = content ? content : data.options.description;
      description.appendChild(div);

      if(content){
        descriptionCloseButton();
      }
    }

    function frameInDescription(){
      var iframe = document.createElement("iframe");
      iframe.name = "leftframe";
      description.appendChild(iframe);

      descriptionCloseButton();
    }
  }

  if(data.options.main || data.options.multipages || data.options.multigraph || typeof tutorialTour != "undefined"){
    var topbar = document.createElement("div");
    topbar.classList.add("topbar");
    topbar.style.backgroundColor = "#ffffff";
    topbar.style.padding = "6px 40px";
    topbar.style.display = "flex";
    topbar.style.minHeight = "24px";
    Wrapper.appendChild(topbar);

    if(data.options.multipages){
      var button = document.createElement("button");
      button.classList.add("primary","home");
      button.textContent = "home";
      button.style.minWidth = "unset";
      button.style.color = "transparent";
      button.style.width = "2.2em";
      button.style.backgroundRepeat = "no-repeat";
      button.style.backgroundPosition = "center";
      button.style.backgroundImage = "url("+b64Icons.homeContrast+")";
      button.style.backgroundSize = "24px 24px";
      topbar.appendChild(button);

      button.addEventListener("click",function(){
        window.location.href = "../../index.html";
      })
    }

    if(data.options.multigraph){
      var sel = document.createElement("div");
      sel.classList.add("multi-select");
      topbar.appendChild(sel);

      var multiSelect = document.createElement("select");
      sel.appendChild(multiSelect);
      if(!Array.isArray(data.options.multigraph.names)){
        data.options.multigraph.names = [data.options.multigraph.names];
      }
      data.options.multigraph.names.forEach(function(item,i){
        var option = document.createElement("option");
        option.textContent = item;
        option.value = i;
        if(i==data.options.multigraph.idx){
          option.selected = true;
        }
        multiSelect.appendChild(option);
      });
      multiSelect.addEventListener("change",function(){
        window.location.href = "../../index.html?"+this.value;
      });

      var img = document.createElement("img");
      img.src = b64Icons.menu;
      sel.appendChild(img);

      var span = document.createElement("span");
      span.textContent = data.options.multigraph.names[data.options.multigraph.idx];
      sel.appendChild(span);

      var style = document.createElement("style");
      style.innerHTML = 
    ".multi-select { display: inline-block; position: relative; }"+
    ".multi-select > img { vertical-align: text-bottom; margin-bottom: -2px; }"+
    ".multi-select > span { font-weight: bold; font-size: 1.6em; margin-left: 10px; }"+
    ".multi-select > select { position: absolute; width: 100%; opacity: 0; cursor: pointer; }";
      document.head.appendChild(style);

      function changeMultiGraph(step){
        var idx = multiSelect.selectedIndex;
        idx = idx + step;
        if(idx<0){
          idx = data.options.multigraph.names.length-1;
        }
        if(idx>=data.options.multigraph.names.length){
          idx = 0;
        }
        window.location.href = "../../index.html?"+idx;
      }
    }

    if(data.options.main || typeof tutorialTour != "undefined"){
      var div = document.createElement("div");
      if(data.options.main){
        div.innerHTML = data.options.main;
      }
      div.style.margin = "0 1em";
      div.style.fontSize = "2em";
      div.style.fontWeight = "bold";
      div.style.flexGrow = 1;
      topbar.appendChild(div);
    }
  }

  contentWrapper.appendChild(mapWrapper);
  Wrapper.appendChild(contentWrapper);

  if(data.options.hasOwnProperty("note")){
    var note = document.createElement("div");
    note.classList.add("footer-note");
    note.innerHTML = data.options.note;
    Wrapper.appendChild(note);
  }

  var mapid = document.createElement("div");
  mapid.id = "mapid";
  mapWrapper.appendChild(mapid);

  var infoPanel = false,
      mainframe = false;
  if(data.options.markerInfo || data.options.entityInfo){
    infoPanel = new InfoPanel();

    mainframe = document.createElement("iframe");
    mainframe.name = "mainframe";
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

  map.attributionControl.setPosition('bottomleft');

  var n_markers = false;

  var showLocation = L.DomUtil.create('div', 'show-location',mapWrapper);
  panelStopPropagation(showLocation);

  map.on('moveend',writeLocation);
  writeLocation();

  function writeLocation(){
    var loc = map.getCenter(),
        zoom = map.getZoom();
    showLocation.textContent = (n_markers===false?"":"n="+n_markers+" ")+"@"+loc.lat.toFixed(4)+","+loc.lng.toFixed(4)+","+zoom+"z";
  }

  // zoom buttons
  L.Control.zoomButtons = L.Control.extend({
      onAdd: function(map) {
        var zoomButtons = L.DomUtil.create('div', 'leaflet-bar zoom-buttons panel-style');
        panelStopPropagation(zoomButtons);

        var zoomin = L.DomUtil.create('button','zoomin',zoomButtons);
        zoomin.addEventListener("click",function(){ map.setZoom(map.getZoom()+zoomstep); });

        var zoomreset = L.DomUtil.create('button','zoomreset',zoomButtons);
        zoomreset.style.backgroundImage = "url("+b64Icons.zoomreset+")";
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

  var attribution = mapid.querySelector(".leaflet-control-attribution");
  attribution.innerHTML =  '<a href="https://CRAN.R-project.org/package=evolMap">evolMap</a> | ' + attribution.innerHTML;

  delete data.storeItems;
  data.storeItems = {};

  var nodes = {};

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

      item["_index"] = i;
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

  // geojson
  if(typeof geojson != "undefined"){
    visualManagers.entityColor = new colorMgmt("entities","entityColor");

    var entities_layer = L.geoJSON(false,{
      onEachFeature: function(feature,layer){
          layer.on("click",function(event){
            if(data.options.entityInfo){
              displayInfo("entities",data.options.entityInfo,feature["_index"]);
            }

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

  // links
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

  // minicharts
  var minicharts = false;
  if(data.hasOwnProperty("minicharts")){
    var types = data.minicharts.columns.filter(function(d){
        return d!="_lat" && d!="_lng";
      });
    var chartColor = d3.scaleOrdinal()
      .domain(types)
      .range(data.colors.categoryColors)

    minicharts = [];

    for(var i = 0; i<data.minicharts.data[0].length; i++){
      var item = {};

      item.properties = {};

      data.minicharts.columns.forEach(function(k,j){
        item.properties[k] = data.minicharts.data[j][i];
      });

      minicharts.push(item);
    }

    function updateChart(item){
      var values = types.map(function(d){
        return item.properties[d];
      });
      var colors = types.map(function(d){
        return chartColor(d);
      });
      var size = data.options.minichartsSize;
      item.chart = L.minichart([item.properties["_lat"],item.properties["_lng"]], {data: values, type:"pie", width: size, height: size, color: colors});
    }

    if(L.hasOwnProperty("markerClusterGroup")){
      var minicharts_layer = L.markerClusterGroup();
    }else{
      var minicharts_layer = L.layerGroup();
    }
  }

  // panel buttons
  L.Control.buttonsPanel = L.Control.extend({
      onAdd: function(map) {
        var panelButtons = L.DomUtil.create('div', 'buttons-panel');
        panelStopPropagation(panelButtons);

        if((data.storeItems.markers || data.storeItems.entities) && (data.options.controls.buttons && L.Control.hasOwnProperty("buttonsPanel"))){
          panelButtons.classList.add('leaflet-bar','panel-style');

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

          var toolsButton = L.DomUtil.create('img','tools-button',panelButtons);
          toolsButton.setAttribute("src", b64Icons.settings);
          toolsButton.setAttribute("alt", "tools");
          toolsButton.style.cursor = "pointer";
          toolsButton.style.verticalAlign = "middle";
          toolsButton.addEventListener("click",function(){
            document.querySelector(".leaflet-control.tools-panel").style.display = "block";
          });
        }

        return panelButtons;
      },

      onRemove: function(map) {
        // Nothing to do here
      }
  });

  // search
  L.Control.searchPanel = L.Control.extend({
      onAdd: function(map) {
        var searchPanel = L.DomUtil.create('div', 'leaflet-bar search-panel panel-style');
        panelStopPropagation(searchPanel);

        var datalength = 0;
        if(data.storeItems["markers"]){
          datalength += data.storeItems["markers"].length;
        }
        if(data.storeItems["entities"]){
          datalength +=  data.storeItems["entities"].length;
        }
        var typingTimer;
        var typingInterval = datalength > 1000 ? 1000 : 500;

        var searchPadding = L.DomUtil.create('div','search-padding',searchPanel);
        if(data.options.controls.filter === undefined){
          searchPadding.style.padding = 0;
        }

        var searchWrapper = L.DomUtil.create('div','search-wrapper',searchPadding);

        var searchBox = L.DomUtil.create('div','search-box',searchWrapper);

        var searchIcon = L.DomUtil.create('button','search-icon disabled',searchWrapper);
        searchIcon.appendChild(getSVG("search"));
        searchIcon.addEventListener("click",function(){
          if(searchInput.value!=""){
            center_selection();
            searchInput.value = "";
            searchIcon.classList.add("disabled");
            L.DomUtil.empty(ul);

            var item = false;
            if(data.storeItems["markers"] && (data.options.markerInfo || L.hasOwnProperty("markerClusterGroup"))){
              for(var i=0; i<data.storeItems["markers"].length; i++){
                if(data.storeItems["markers"][i]._selected){
                  if(item){
                    item = false;
                    break;
                  }
                  item = data.storeItems["markers"][i];
                }
              }
              if(item){
                if(L.hasOwnProperty("markerClusterGroup")){
                  open_marker_cluster(item);
                }
                if(data.options.markerInfo){
                  displayInfo("markers",data.options.markerInfo,item["_index"]);
                }
              }
            }
            if(!item && data.options.entityInfo && data.storeItems["entities"]){
              for(var i=0; i<data.storeItems["entities"].length; i++){
                if(data.storeItems["entities"][i]._selected){
                  if(item){
                    item = false;
                    break;
                  }
                  item = data.storeItems["entities"][i];
                }
              }
              if(item){
                displayInfo("entites",data.options.entityInfo,item["_index"]);
              }
            }
          }
        });

        var searchInput = L.DomUtil.create('input','',searchBox);
        searchInput.type = "text";
        searchInput.placeholder = texts['searchsomething'];
        searchInput.addEventListener("keydown",function(event){
          clearTimeout(typingTimer);
          L.DomEvent.stopPropagation(event);
        });
        searchInput.addEventListener("keyup",function(event){
          clearTimeout(typingTimer);
          L.DomEvent.stopPropagation(event);
          if(getKey(event)=="Enter"){
            doneTyping();
            searchIcon.click();
            return;
          }
          typingTimer = setTimeout(doneTyping, typingInterval);
        })

        function doneTyping(){
          var txt = searchInput.value;
          var found = false;
          if(txt.length > (datalength > 1000 ? 3 : 1)){
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
                  var item = data.storeItems[d[0]][d[1]];
                  item._selected = true;
                  center_selection();
                  if(d[0]=="markers"){
                    if(L.hasOwnProperty("markerClusterGroup")){
                      open_marker_cluster(item);
                    }
                    if(data.options.markerInfo){
                      displayInfo("markers",data.options.markerInfo,item["_index"]);
                    }
                  }
                  if(d[0]=="entities" && data.options.entityInfo){
                    displayInfo("entities",data.options.entityInfo,item["_index"]);
                  }
                  update_items();
                });
                ul.appendChild(li);
              })
            }
          }
        }

        var ul = document.createElement("ul");
        ul.classList.add("suggestions-list");
        searchWrapper.appendChild(ul);

        return searchPanel;
      },

      onRemove: function(map) {
        // Nothing to do here
      }
    });

  var tabnames = Object.keys(data.storeItems);
  if(tabnames.length){

    // filter panel
    L.Control.filterPanel = L.Control.extend({
      onAdd: function(map) {
        var filterPanelWrapper = L.DomUtil.create('div', 'filter-panel-wrapper');

        var filterPanel = createCollapsiblePanel("filter",data.options.controls,update_tools,filterPanelWrapper);

        var showPanelButton = filterPanelWrapper.querySelector(".show-panel-button");
        showPanelButton.textContent = ''
        var img = L.DomUtil.create('img','show-filters-button',showPanelButton);
        img.setAttribute("src",b64Icons.filterContrast);
        var showPanelButtonSpan = L.DomUtil.create('span','',showPanelButton);
        showPanelButtonSpan.style.display = "none";

        displayItemNav2(filterPanel,tabnames,function(){
          var name = filterPanel.querySelector(".items-nav2 > ul > li.active").item;
          tabs.childNodes.forEach(function(tab){
            tab.style.display = (tab.getAttribute("tabname")==name) ? "block" : "none";
          });
          update_tools();
        });

        var tabs = L.DomUtil.create('div','tools-tabs',filterPanel);

        tabnames.forEach(function(tabname){
        if(tabname=="markers"){
          var tabMarkers = L.DomUtil.create('div','tools-tab tab-markers',tabs);
          tabMarkers.style.display = "none";
          tabMarkers.setAttribute("tabname","markers");

          var markersFilter = L.DomUtil.create('div','items-filter markers-filter',tabMarkers);
          displayItemFilter(markersFilter,"markers",filter_selected,remove_filters,update_items,select_none,center_selection);
        }

        if(tabname=="links"){
          var tabLinks = L.DomUtil.create('div','tools-tab tab-links',tabs);
          tabLinks.style.display = "none";
          tabLinks.setAttribute("tabname","links");

          var linkFilter = L.DomUtil.create('div','items-filter links-filter',tabLinks);
          displayItemFilter(linkFilter,"links",filter_selected,remove_filters,update_items,select_none,center_selection);
        }

        if(tabname=="entities"){
          var tabEntities = L.DomUtil.create('div','tools-tab tab-entities',tabs);
          tabEntities.style.display = "none";
          tabEntities.setAttribute("tabname","entities");

          var entitiesFilter = L.DomUtil.create('div','items-filter entities-filter',tabEntities);
          displayItemFilter(entitiesFilter,"entities",filter_selected,remove_filters,update_items,select_none,center_selection);
        }
        });

        tabs.childNodes[0].style.display = "block";

        return filterPanelWrapper;
      },

      onRemove: function(map) {
        // Nothing to do here
      }
    });

    // tools panel
    L.Control.toolsPanel = L.Control.extend({
      onAdd: function(map) {
        var toolsPanel = L.DomUtil.create('div', 'leaflet-bar tools-panel panel-style');
        panelStopPropagation(toolsPanel);

        var header = L.DomUtil.create('div','highlight-header',toolsPanel);
        var span = L.DomUtil.create('span','',header);
        span.textContent = texts['tools'];
        var closeButton = L.DomUtil.create('div','close-button',header);
        closeButton.addEventListener("click",function(event){
          toolsPanel.style.display = '';
        });

        displayItemNav2(toolsPanel,tabnames,function(){
          var name = toolsPanel.querySelector(".items-nav2 > ul > li.active").item;
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
          if(data.options.markerShape!="_none_" && !data.options.image){
            visuals.push("Shape");
          }
          visuals.forEach(function(d){
            addVisualSelector(markersChange,"markers",d,applyVisual);
          })
        }

        if(tabname=="links"){
          var tabLinks = L.DomUtil.create('div','tools-tab tab-links',tabs);
          tabLinks.style.display = "none";
          tabLinks.setAttribute("tabname","links");

          var linksChange = L.DomUtil.create('div','items-change links-change',tabLinks);
          addVisualSelector(linksChange,"links","Color",applyVisual);
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
        }
        });

        tabs.childNodes[0].style.display = "block";

        return toolsPanel;
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

        var legendsPanel = createCollapsiblePanel("legends",data.options.controls,update_legends,legendsPanelWrapper);
 
        var legendsContent = L.DomUtil.create('div','legends-content',legendsPanel);
        var top = document.querySelector(".leaflet-control.zoom-buttons").getBoundingClientRect().top;
        legendsContent.style.maxHeight = (top-200)+"px";

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

      var clickedMarker = "";
      map.on('zoomend', function() {
        if(clickedMarker!==""){
          map.setZoom(map.getZoom()-0.25);
          clickedMarker = "";
        }
      });

      markers_layer.on('clusterclick', function (a) {
        if(a.layer._childCount>0){
          clusterMarkers = a.layer.getAllChildMarkers();
          clickedMarker = clusterMarkers[0];
        }
      });

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
        dateDivSpan.textContent = getCurrentPeriod(val);
        updatePeriodDescription(val);
        updateMainDateViewerNav(val);
      }
    }else{
      var getDivText = function(t,v){ return t; };
      if(data.periods){
        getDivText = function(text,val){
          return getCurrentPeriod(val) + " (" + text + ")";
        }
      }

      updateShowedDates = function(val){
        dateSpan.textContent = getSpanText(data.options.time.range[val]);
        dateSpan.title = dateSpan.textContent;
        dateDivSpan.textContent = getDivText(dateSpan.textContent,val);
        updatePeriodDescription(val);
        updateMainDateViewerNav(val);
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

          if(minicharts){
            minicharts.forEach(function(item){
              updateChart(item);
              if(item.chart){
                if(!item._hidden){
                  item.chart.addTo(minicharts_layer);
                }else{
                  item.chart.removeFrom(minicharts_layer);
                }
              }
            });
          }

          update_entities_style();
          update_tools();
          update_legends();
          update_nmarkers();
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

    var dateDiv = L.DomUtil.create('div','main-date-viewer',mapWrapper),
        dateDivPrev = L.DomUtil.create('span','main-date-prev',dateDiv),
        dateDivSpan = L.DomUtil.create('span','main-date-text',dateDiv),
        dateDivNext = L.DomUtil.create('span','main-date-next',dateDiv);

    var dateSpan = L.DomUtil.create('span','date-viewer');
    var dateInput = L.DomUtil.create('input','date-input');
    dateInput.type = "text";
    dateInput.style.width = "100px";

    L.Control.timeControl = L.Control.extend({
      onAdd: function(map) {
        var el = L.DomUtil.create('div', 'leaflet-bar time-control panel-style');

        panelStopPropagation(el);

        var prev = L.DomUtil.create('a','leaflet-control-time-control time-control-prev',el),
            fnPrev = function(event){
              event.preventDefault();
              if(isRunning()){
                pause();
              }
              if(current-step>=min || loop){
                loadPrevFrame();
              }
            };
        prev.href = "#";
        prev.appendChild(getSVG('prev'));
        prev.addEventListener("click",fnPrev);
        document.querySelector(".main-date-viewer > .main-date-prev").addEventListener("click",fnPrev);

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
            var filterpanel = document.querySelector(".filter-panel-wrapper");
            if(filterpanel){
              filterpanel.classList.add("collapse-panel");
            }
            play.classList.add('pressed');
            pauseButton.classList.remove('pressed');
            newInterval();
          }
        });

        var next = L.DomUtil.create('a','leaflet-control-time-control time-control-next',el),
            fnNext = function(event){
              event.preventDefault();
              if(isRunning()){
                pause();
              }
              if(current+step<=max || loop){
                loadNextFrame();
              }
            };
        next.href = "#";
        next.appendChild(getSVG('next'));
        next.addEventListener("click",fnNext);
        document.querySelector(".main-date-viewer > .main-date-next").addEventListener("click",fnNext);

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

      if(minicharts){
        minicharts.forEach(function(item){
          updateChart(item);
          if(item.chart){
            if(!item._hidden){
              item.chart.addTo(minicharts_layer);
            }else{
              item.chart.removeFrom(minicharts_layer);
            }
          }
        });
      }

      update_entities_style();
      update_tools();
      update_legends();
      update_nmarkers();
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
  if(minicharts){
    map.addLayer(minicharts_layer);
  }

  // display controls
  if(data.options.controls.search && L.Control.hasOwnProperty("searchPanel")){
    (new L.Control.searchPanel({ position: 'topleft' })).addTo(map);
  }
  if(data.options.controls.filter !== undefined && L.Control.hasOwnProperty("filterPanel")){
    (new L.Control.filterPanel({ position: 'topleft' })).addTo(map);
  }
  (new L.Control.buttonsPanel({ position: 'bottomright' })).addTo(map);
  (new L.Control.zoomButtons({ position: 'bottomright' })).addTo(map);
  if(L.Control.hasOwnProperty("toolsPanel")){
    (new L.Control.toolsPanel({ position: 'bottomright' })).addTo(map);
  }
  if(L.Control.hasOwnProperty("timeControl")){
    (new L.Control.timeControl({ position: 'bottomleft' })).addTo(map);
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
      if(!tabletitle){
        tabletitle = document.createElement("div");
        tabletitle.classList.add("table-title");
        tablesSectionHeader.appendChild(tabletitle);

        var xlsxButton = document.createElement("img");
        xlsxButton.setAttribute("src", b64Icons.xlsx);
        xlsxButton.setAttribute("alt", "xlsx");
        xlsxButton.style.cursor = "pointer";
        xlsxButton.style.marginLeft = "16px";
        xlsxButton.addEventListener("click",function(){
          table2xlsx(items,tbody.data,columns);
        });
        tabletitle.appendChild(xlsxButton);

        var searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.placeholder = texts["searchsomething"];
        searchInput.style.marginLeft = "16px";
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
        matchedButton.textContent = texts["select"];
        matchedButton.style.marginLeft = "16px";
        matchedButton.addEventListener("click",function(){
          onlyselectedCheck.classList.add("checked");
          selectFromTable(items);
        });
        tabletitle.appendChild(matchedButton);

        var filterButton = document.createElement("button");
        filterButton.classList.add("table-filter");
        filterButton.classList.add("primary");
        filterButton.textContent = texts["filter"];
        filterButton.style.marginLeft = "16px";
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
        resetButton.style.marginLeft = "16px";
        resetButton.addEventListener("click",remove_filters);
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

      var img = document.createElement("img");
      img.setAttribute("title","remove filters");
      img.setAttribute("src",b64Icons.removefilter);
      img.style.cursor = "pointer";
      img.style.float = "right";
      img.style.marginRight = "20px";
      img.addEventListener("click",remove_filters);
      freqSectionHeader.appendChild(img);

      if(!data.options.freqMode){
        data.options.freqMode = "relative";
      }
      var modeSelectWrapper = document.createElement("div");
      modeSelectWrapper.classList.add("select-wrapper");
      modeSelectWrapper.style.position = "absolute";
      modeSelectWrapper.style.top = "0";
      modeSelectWrapper.style.right = "60px";
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

            var img = document.createElement("img");
            img.setAttribute("title","filter");
            img.setAttribute("src",b64Icons.filter);
            img.style.cursor = "pointer";
            img.style.float = "right";
            img.addEventListener("click",function(){
              filter_selected();
              center_selection();
              select_none();
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
      if(list.length<2){
        itemsNav.style.display = "none";
      }
  }

  function displayItemNav2(parent,list,callback){
      var iconsDict = {"markers":"location","links":"links","entities":"hexagon"};
      var itemsNav = document.createElement("div");
      itemsNav.classList.add("items-nav2");
      parent.querySelector(".highlight-header").prepend(itemsNav);
      var ul = document.createElement("ul");
      itemsNav.appendChild(ul);
      list.forEach(function(items){
          var li = document.createElement("li");
          li.setAttribute("title",texts[items])
          var img = document.createElement("img");
          img.setAttribute("src",b64Icons[iconsDict[items]]);
          li.appendChild(img);
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
      if(list.length<2){
        itemsNav.style.visibility = "hidden";
      }
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
      var periodDescription = mapWrapper.getElementsByClassName("period-description"),
          periodPopup;
      if(periodDescription.length){
        periodDescription = periodDescription[0];
        periodPopup = periodDescription.childNodes[0];
      }else{
        periodDescription = document.createElement("div");
        periodDescription.classList.add("period-description");
        periodPopup = document.createElement("div");
        periodPopup.classList.add("period-popup");
        periodDescription.appendChild(periodPopup);
        mapWrapper.appendChild(periodDescription);

        var popupContent = document.createElement("div");
        popupContent.classList.add("period-popup-content");
        periodPopup.appendChild(popupContent);

        if(data.options.periodPopup){
          periodDescription.style.top = 0;
          periodDescription.style.marginTop = "50px";
          periodDescription.style.display = "none";
          periodPopup.style.pointerEvents = "all";
          dateDivSpan.style.pointerEvents = "all";
          dateDivSpan.style.cursor = "pointer";
          dateDivSpan.addEventListener("click",function(){
            periodDescription.style.display = "block";
          });

          var close = document.createElement("span");
          close.classList.add("period-popup-close");
          close.textContent = "×";
          close.addEventListener("click",function(){
            periodDescription.style.display = "none";
          });
          periodPopup.appendChild(close);
        }
      }
      if(data.options.byperiod){
        periodPopup.childNodes[0].innerHTML = getValuesFromDF("periods","periodDescription")[val];
      }else{
        periodPopup.childNodes[0].textContent = "";
      }
    }
  }

  function updateMainDateViewerNav(val){
    dateDivPrev.style.visibility = val<=min && !loop ? "hidden" : "visible";
    dateDivNext.style.visibility = val>=max && !loop ? "hidden" : "visible";
  }

  function updateMarker(item,someselected){

    var attr = item.properties;
    if(!item.marker){
      item.marker = new L.Marker();
      item.marker.on("click",function(event){
        if(data.options.markerInfo){
          displayInfo("markers",data.options.markerInfo,item["_index"]);
        }
        L.DomEvent.stopPropagation(event);
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

  function update_nmarkers(){
    n_markers = data.storeItems && data.storeItems.markers ? data.storeItems.markers.filter(function(d){
      return !d._hidden && !d._outoftime;
    }).length : false;
    writeLocation();
  }

  function update_legends(){
    var legendsPanel = document.querySelector(".legends-panel-wrapper:not(.collapse-panel) > .legends-panel");
    if(legendsPanel){
      var legendsContent = legendsPanel.getElementsByClassName("legends-content")[0];
      L.DomUtil.empty(legendsContent);
      chartLegend(legendsContent);
      Object.keys(data.storeItems).forEach(function(items){
        listLegend(legendsContent,items,"Color");
        if(items=="markers"){
          listLegend(legendsContent,items,"Shape");
        }
      })

      legendsPanel.parentNode.style.display = legendsContent.childNodes.length ? null : "none";
    }

    function chartLegend(container){
      if(minicharts){
        var legend = L.DomUtil.create('div','legend',container);
        var legendTitle = L.DomUtil.create('div','legend-title',legend);
        legendTitle.textContent = texts["Color"]+" (minicharts)";
        L.DomUtil.create('div','legend-separator',legend);
        chartColor.domain().forEach(function(d){
                var legendItem = L.DomUtil.create('div','legend-item',legend);
                var bullet = L.DomUtil.create('div','legend-bullet',legendItem);
                var color = "#000000";
                var shape = "Circle";
                color =  chartColor(d);
                displayBullet(bullet,color,shape);
                L.DomUtil.create('span','',legendItem).textContent = d;
        })
      }
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
                  bullet.style.cursor = "pointer";
                }else if(visual=="Shape"){
                  shape = visualManagers[itemVisual].getShape(d);
                  bullet.addEventListener("click",function(event){
                    displayShapePicker(d,shape,pickerCallback);
                    event.stopPropagation();
                  })
                }
                displayBullet(bullet,color,shape);
                L.DomUtil.create('span','',legendItem).textContent = d;
              })
            }
          }
        }
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

  function open_marker_cluster(item){
        if(!map.hasLayer(item.marker)){
          var parent = markers_layer.getVisibleParent(item.marker);
          if(parent){
            setTimeout(function(){
              parent.spiderfy();
            }, 1000);
          }
        }
  }

  function update_tools(){
    var panel = document.querySelector(".filter-panel-wrapper:not(.collapse-panel) > .filter-panel");
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
            if(!element.querySelector(".items-filter > .list-variables > .value-selector > .slider-wrapper > .slider")){
              var select = element.querySelector(".items-filter > .select-wrapper > select");
              select.dispatchEvent(new Event('change'));
            }
            var filterButton = element.getElementsByClassName("filter-button")[0];
            filterButton.classList[some_selected(items)&&!all_selected(items) ? "remove" : "add"]("disabled");
            var resetfilterButton = element.getElementsByClassName("resetfilter-button")[0];
            resetfilterButton.classList[some_filtered(items) ? "remove" : "add"]("disabled");
          }
        }
      });

      var timecontrol = document.querySelector(".leaflet-control.time-control"),
          topbar = document.querySelector("#Wrapper > .topbar"),
          top = contentWrapper.offsetHeight;
      if(timecontrol){
        top = timecontrol.getBoundingClientRect().top;
      }
      if(topbar){
        top = top - topbar.getBoundingClientRect().height;
      }
      Array.from(panel.querySelectorAll(".items-filter > .list-variables")).forEach(function(d){
        d.style.maxHeight = (top-180)+"px";
      })
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
      map.setView(points[0],7,{animate:false});
    }else if(points.length>1){
      var bounds = L.polygon(points).getBounds().pad(0.5);
      map.fitBounds(bounds);
    }
  }

  function select_none(){
    Object.keys(data.storeItems).forEach(function(items){
      data.storeItems[items].forEach(function(item){
        delete item._selected;
      });
    });
    filter_criteria.selection.clear();
    update_items();

    if(infoPanel){
      infoPanel.close();
    }

    if(typeof descriptionContent == "function"){
      descriptionContent();
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
    filter_criteria.filter.clear();
    filter_criteria.selection.forEach(function(v){
      filter_criteria.filter.add(v);
    });
    updateFiltersButtonCounter();
    update_items();
  }

  function selectFromTable(items){
    data.storeItems[items].forEach(function(item){
      delete item._selected;
      if(item._table_selection){
        item._selected = true;
      }
    });
    update_items();
  }

  function remove_filters(){
    Object.keys(data.storeItems).forEach(function(items){
      if(data.storeItems[items]){
        data.storeItems[items].forEach(function(item){
          delete item._hidden;
        });
      }
    });
    filter_criteria.filter.clear();
    updateFiltersButtonCounter();
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
          if(data.options.controls.filter !== undefined){
            data.options.controls.filter = !data.options.controls.filter;
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
            select_none();
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
            ["filter","buttons","legends"].forEach(function(d){
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

  function displayInfo(items,infocolumn,index){
    var dataitems = data.storeItems[items];
    if(data.options.infoFrame=="left"){
      if(description){
        descriptionContent(dataitems[index].properties[infocolumn]);
        checkTemplateInDescription(dataitems[index].image ? dataitems[index].image : false);
      }
    }else{
      var navigation = data.storeItems[items].filter(function(d){
          return !d["_hidden"] && !d["_outoftime"];
        }).map(function(d){
          return d["_index"];
        });
      infoPanel.openNavigation(dataitems,index,navigation,infocolumn,checkTemplateInInfoPanel,function(item){
        select_none();
        item._selected = true;
        center_selection();
        if(L.hasOwnProperty("markerClusterGroup")){
          open_marker_cluster(item);
        }
        update_items();
      });
    }
  }

  function checkTemplateInDescription(image){
    var content = document.querySelector("#descriptionWrapper > .description-content");
    if(content){
      var template = content.querySelector(":scope > .info-template");
      if(template){
        var links = template.querySelectorAll("a[target=mainframe]");
        if(links.length){
          for(var i=0; i<links.length; i++){
            links[i].addEventListener("mouseup",function(e){
              infoPanel.open(mainframe);
            });
          }
        }
        var links = template.querySelectorAll("a[target=leftframe]");
        if(links.length){
          for(var i=0; i<links.length; i++){
            links[i].addEventListener("mousedown",function(e){
              frameInDescription();
            });
            links[i].addEventListener("mouseup",function(e){
              content.style.display = "none";
            });
          }
        }
        autoImage(image,template);
      }
    }
  }

  function checkTemplateInInfoPanel(obj,image){
    var content = document.querySelector(".infopanel > .panel-content > div");
    if(content){
      var template = content.querySelector(":scope > .info-template");
      if(template){
        var links = template.querySelectorAll("a[target=mainframe]");
        if(links.length){
            for(var i=0; i<links.length; i++){
              links[i].addEventListener("mouseup",function(e){
                template.style.display = "none";
                content.appendChild(mainframe);
                obj.left2Button.onclick = function(){
                  content.removeChild(mainframe);
                  template.style.display = "block";
                  obj.left2Button.style.display = "";
                }
                obj.left2Button.style.display = "block";
              });
            }
        }
        if(description){
          var links = template.querySelectorAll("a[target=leftframe]");
          if(links.length){
            for(var i=0; i<links.length; i++){
              links[i].addEventListener("mousedown",function(e){
                emptyDescription();
                frameInDescription();
              });
            }
          }
        }
        autoImage(image,template);
      }
    }
  }

  function autoImage(image,template){
      if(image){
          var autoimg = document.createElement("img");
          autoimg.setAttribute("src",image);
          template.querySelector(":scope > h2 + div").prepend(autoimg);
      }
  }

} // end function renderMap

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
      }else{
        x = x.flat();
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
            .domain(data[this._items].data[col].flat())
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
            .domain(data[this._items].data[col].flat())
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
  this.closeButton = document.createElement("div");
  this.closeButton.classList.add("close-button");
  this.panelContent = document.createElement("div");
  this.panelContent.classList.add("panel-content");
  var contentDiv = this.panelContentDiv = document.createElement("div");
  this.panel.appendChild(this.closeButton);
  this.panel.appendChild(this.panelContent);
  this.panelContent.appendChild(this.panelContentDiv);

  var background = this.background = document.createElement("div");
  background.classList.add("infopanel-background");
  background.appendChild(this.panel);
  document.body.appendChild(background);

  var panelstyle = window.getComputedStyle(this.panel),
      mt = parseInt(panelstyle.marginTop),
      wh = window.innerHeight-(mt*2),
      mh = parseInt(panelstyle.maxHeight),
      h = wh<mh ? wh : mh;

  this.panel.style.height = h+"px";

  if(wh>h){
    var nmt = mt + ((wh-h)/2);
    this.panel.style.marginTop = nmt+"px";
  }

  function closePanel(){
    background.style.display = "none";
  }

  this.closeButton.onclick = closePanel;

    this.left2Button = document.createElement("button");
    this.left2Button.classList.add("left2-button");
    this.leftButton = document.createElement("button");
    this.leftButton.classList.add("left-button");
    this.rightButton = document.createElement("button");
    this.rightButton.classList.add("right-button");

    this.panel.appendChild(this.left2Button);
    this.panel.appendChild(this.leftButton);
    this.panel.appendChild(this.rightButton);

    this.leftButton.onclick = function(){};
    this.rightButton.onclick = function(){};

  this.location = document.createElement("button");
  this.location.classList.add("location-button");
  this.panel.appendChild(this.location);
  var locationimage = document.createElement("img");
  locationimage.setAttribute("src",getIconMarkerURI("#000000"));
  this.location.appendChild(locationimage);
}

InfoPanel.prototype = {
  openNavigation: function(dataitems,index,navigation,infocolumn,checkTemplate,goToMarker){
    if(typeof navigation == "undefined"){
      navigation = dataitems.map(function(d,i){ return i; });
    }

    openMainFrame(this,index);

    function openMainFrame(obj,index){

    var leftindex = navigation.indexOf(index)-1,
        rightindex = navigation.indexOf(index)+1;
    if(leftindex<=-1){
        leftindex = false;
    }else{
        leftindex = navigation[leftindex];
    }
    if(rightindex>=navigation.length){
        rightindex = false;
    }else{
        rightindex = navigation[rightindex];
    }

    obj.background.style.display = "block";
    obj.left2Button.style.display = "";
    obj.leftButton.style.display = "";
    obj.rightButton.style.display = "";
    obj.location.style.display = "";

    if(leftindex!==false){
      obj.leftButton.style.display = "block";
      obj.leftButton.onclick = function(){
        openMainFrame(obj,leftindex);
      };
    }

    if(rightindex!==false){
      obj.rightButton.style.display = "block";
      obj.rightButton.onclick = function(){
        openMainFrame(obj,rightindex);
      };
    }

    obj.panelContentDiv.innerHTML = dataitems[index].properties[infocolumn];
    checkTemplate(obj,dataitems[index].image);

      if(dataitems[index].marker){
        obj.location.style.display = "block";
        obj.location.onclick = function(){
          goToMarker(dataitems[index]);
          obj.closeButton.click();
        };
      }
    }
  },

  open: function(content){
    if(typeof content == "string"){
      this.panelContentDiv.innerHTML = content;
    }else if(content instanceof HTMLElement){
      this.panelContentDiv.appendChild(content);
    }
    this.background.style.display = "block";
    this.left2Button.style.display = "";
    this.leftButton.style.display = "";
    this.rightButton.style.display = "";
    this.location.style.display = "";
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

function updateFiltersButtonCounter(){
  var showPanelButtonSpan = document.querySelector(".show-panel-button > span");
  showPanelButtonSpan.textContent = filter_criteria.filter.size;
  showPanelButtonSpan.style.display = filter_criteria.filter.size ? "" : "none";
}

function displayItemFilter(div,items,filter_selected,remove_filters,update_items,select_none,center_selection){
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
            filter_criteria.selection.delete(value);
            data.storeItems[items].forEach(function(item){
              delete item._selected;
              if(!(item._hidden || item._outoftime) && (item.properties[value]>=selectedValues[0] && item.properties[value]<=selectedValues[1])){
                filter_criteria.selection.add(value);
                item._selected = true;
              }
            });
            update_items();
          })
        slider(valueSelector);
      }else{
        var crosstab = {};
        if(type != 'string'){
          values = values.reduce(function(a,b) { return b ? a.concat(b) : a; }, []);
        }
        values.forEach(function(d){
          if(d){
            if(!crosstab.hasOwnProperty(d)){
              crosstab[d] = 1;
            }else{
              crosstab[d] += 1;
            }
          }
        });
        values = Object.keys(crosstab).sort(sortAsc);

        if(values.length>20){
          var simpleSearch = L.DomUtil.create('div','simple-search',valueSelector);
          var searchBox = L.DomUtil.create('input','search-box',simpleSearch)
          searchBox.addEventListener("input",function(){
              hideTags(this.value);
            })
          searchBox.addEventListener("keyup",function(event){
              L.DomEvent.stopPropagation(event);
            })
          L.DomUtil.create('button','search-icon disabled',simpleSearch)
            .appendChild(getSVG("search"))
        }

        valueSelector.querySelectorAll(".tag").forEach(function(e){ e.remove(); });
        values.forEach(function(v){
            var tag = L.DomUtil.create('span','tag'+(allItemsSelectedByValue(items,value,v)?" tag-selected":""),valueSelector);
            tag.textContent = v+" ("+crosstab[v]+")";
            tag.setAttribute("tag-value",v);
            tag.addEventListener("click",function(){
              valueSelector.querySelectorAll(".tag").forEach(function(e){ e.style.display = ""; });
              tag.classList.toggle("tag-selected");
              var selectedvalues = Array.from(valueSelector.querySelectorAll(".tag.tag-selected")).map(function(d){
                return d.getAttribute("tag-value");

              });
              filter_criteria.selection.delete(value);
              data.storeItems[items].forEach(function(item){
                delete item._selected;
                if(isItemSelected(items,item,value,selectedvalues)){
                  filter_criteria.selection.add(value);
                  item._selected = true;
                }
              });
              update_items();
            })
        });

        function hideTags(filter){
          valueSelector.querySelectorAll(".tag").forEach(function(tag){
            var v = tag.getAttribute("tag-value");
            if(filter && !v.toLowerCase().includes(filter.toLowerCase())){
              tag.style.display = "none";
              return;
            }
            tag.style.display = "";
          });
        }
      }
    }

    var columns = getItemsColumns(items);
    displaySelectWrapper(div,columns,selectChangeFunction,columns[0]);

    var valueSelector = L.DomUtil.create('div','value-selector',div);

    var filterButtons = L.DomUtil.create('div','filter-buttons',div);

    var filter = L.DomUtil.create('button','primary filter-button',filterButtons);
    filter.textContent = texts["filter"];
    filter.addEventListener("click",function(){
      filter_selected(items);
      center_selection();
      select_none();
    });

    var clear = L.DomUtil.create('button','primary-outline clear resetfilter-button',filterButtons);
    clear.style.marginLeft = "16px";
    clear.textContent = texts["clear"];
    clear.addEventListener("click",function(){
      remove_filters();
      select_none();
    });

    var select = div.querySelector(".items-filter > .select-wrapper > select");
    select.value = '';
    var listVariables = L.DomUtil.create('div','list-variables');
    columns.forEach(function(d){
      var item = L.DomUtil.create('div','item-variable',listVariables);
      var span = L.DomUtil.create('span','text',item);
      L.DomUtil.create('span','',span).textContent = d;
      item.addEventListener("click",function(){
        Array.from(listVariables.querySelectorAll(".item-variable.active")).forEach(function(d){
          d.classList.remove("active");
        });
        if(select.value == d){
          select.value = "";
          select.parentNode.after(valueSelector);
        }else{
          item.classList.add("active");
          item.after(valueSelector);
          select.value = d;
          select.dispatchEvent(new Event('change'));
        }
      })
      L.DomUtil.create('span','plus',item);
    });
    select.parentNode.before(listVariables);
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
    winContent.style.maxHeight = (window.innerHeight/2) + "px";
  }

  return winContent;
}

// create panel functions
function createCollapsiblePanel(name,controls,update,parent){
    var panel = L.DomUtil.create('div', 'leaflet-bar '+name+'-panel panel-style',parent);
    panelStopPropagation(panel);

    if(controls){
        panel.parentNode.classList.add("collapsible-panel");
        var header = L.DomUtil.create('div','highlight-header',panel);
        var span = L.DomUtil.create('span','',header);
        span.textContent = texts[name];
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
    var margin = {top: 32, right: 40, bottom: 0, left: 32},
        width = sel.clientWidth - margin.left - margin.right,
        height = 24;

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
function b64IconsColor(iconColor,iconSize){
  var contrast = contrastColor(iconColor);

  var iconFilter = function(color){
    return "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="'+iconSize+'" viewBox="0 0 24 24" width="'+iconSize+'" fill="'+color+'"><path d="M7,6h10l-5.01,6.3L7,6z M4.25,5.61C6.27,8.2,10,13,10,13v6c0,0.55,0.45,1,1,1h2c0.55,0,1-0.45,1-1v-6 c0,0,3.72-4.8,5.74-7.39C20.25,4.95,19.78,4,18.95,4H5.04C4.21,4,3.74,4.95,4.25,5.61z"/></svg>');
  }

  var iconHome = function(color){
    return "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="'+iconSize+'" width="'+iconSize+'" viewBox="0 0 24 24" fill="'+color+'"><path d="M6 19h3v-6h6v6h3v-9l-6-4.5L6 10Zm-2 2V9l8-6 8 6v12h-7v-6h-2v6Zm8-8.75Z"/></svg>');
  }

  return {
  netcoin: "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBoZWlnaHQ9IjMwIiB3aWR0aD0iNDAiIHZlcnNpb249IjEuMSIgdmlld0JveD0iMCAwIDQwIDMwIj4KIDxnIHRyYW5zZm9ybT0ibWF0cml4KC4yNSAwIDAgLjI1IC0xOS4wNSAzNS44MjUpIj4KICA8ZyBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2U9IiNjMWMxYzEiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSI+CiAgIDxsaW5lIHkxPSItMTA0LjkiIHgyPSIxMTYuMiIgeDE9IjEyNC4xIiB5Mj0iLTExMy40Ii8+CiAgIDxsaW5lIHkxPSItOTQuNiIgeDI9IjExMy45IiB4MT0iMTIzLjQiIHkyPSItODAuNCIvPgogICA8bGluZSB5MT0iLTc0LjgiIHgyPSIxMjAuOSIgeDE9IjE0OC45IiB5Mj0iLTcwLjgiLz4KICAgPGxpbmUgeTE9Ii04OC45IiB4Mj0iMTYxLjIiIHgxPSIxNjIuMyIgeTI9Ii0xMDcuNCIvPgogICA8bGluZSB5MT0iLTY4LjkiIHgyPSIyMTIuNCIgeDE9IjE3My4zIiB5Mj0iLTQyLjEiLz4KICAgPGxpbmUgeTE9Ii05OC42IiB4Mj0iMTYwIiB4MT0iMTI4LjQiIHkyPSItMTIyLjMiLz4KICA8L2c+CiAgPGNpcmNsZSBjeT0iLTEyMy44IiBjeD0iMTU4LjgiIHI9IjE2LjUiIGZpbGw9IiMzYjkwZGYiLz4KICA8Y2lyY2xlIGN5PSItMTE5LjgiIGN4PSIxMDguNyIgcj0iOS45IiBmaWxsPSIjNGZhNmY3Ii8+CiAgPGNpcmNsZSBjeT0iLTY3LjgiIGN4PSIxMDYuNyIgcj0iMTQuNSIgZmlsbD0iI2Y5MCIvPgogIDxjaXJjbGUgY3k9Ii05OS40IiBjeD0iMTI3LjgiIHI9IjYuNiIgZmlsbD0iI2ZmYjcyYiIvPgogIDxjaXJjbGUgY3k9Ii03NS43IiBjeD0iMTYyLjEiIHI9IjEzLjIiIGZpbGw9IiM0ZmE2ZjYiLz4KICA8Y2lyY2xlIGN5PSItMzYuMyIgY3g9IjIxOS4yIiByPSI5IiBmaWxsPSIjZmZhMjE3Ii8+CiA8L2c+Cjwvc3ZnPg==",

  chart: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="'+iconSize+'" viewBox="0 0 24 24" width="'+iconSize+'"><path fill="'+iconColor+'" d="M5 9.2h3V19H5V9.2zM10.6 5h2.8v14h-2.8V5zm5.6 8H19v6h-2.8v-6z"/></svg>'),

  table: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="'+iconSize+'" viewBox="0 0 24 24" width="'+iconSize+'"><path fill="'+iconColor+'" d="M19,7H9C7.9,7,7,7.9,7,9v10c0,1.1,0.9,2,2,2h10c1.1,0,2-0.9,2-2V9C21,7.9,20.1,7,19,7z M19,9v2H9V9H19z M13,15v-2h2v2H13z M15,17v2h-2v-2H15z M11,15H9v-2h2V15z M17,13h2v2h-2V13z M9,17h2v2H9V17z M17,19v-2h2v2H17z M6,17H5c-1.1,0-2-0.9-2-2V5 c0-1.1,0.9-2,2-2h10c1.1,0,2,0.9,2,2v1h-2V5H5v10h1V17z"/></svg>'),

  drop: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="'+iconSize+'" viewBox="0 0 24 24" width="'+iconSize+'"><path fill="'+iconColor+'" d="M12,2c-5.33,4.55-8,8.48-8,11.8c0,4.98,3.8,8.2,8,8.2s8-3.22,8-8.2C20,10.48,17.33,6.55,12,2z M12,20c-3.35,0-6-2.57-6-6.2 c0-2.34,1.95-5.44,6-9.14c4.05,3.7,6,6.79,6,9.14C18,17.43,15.35,20,12,20z M7.83,14c0.37,0,0.67,0.26,0.74,0.62 c0.41,2.22,2.28,2.98,3.64,2.87c0.43-0.02,0.79,0.32,0.79,0.75c0,0.4-0.32,0.73-0.72,0.75c-2.13,0.13-4.62-1.09-5.19-4.12 C7.01,14.42,7.37,14,7.83,14z"/></svg>'),

  location: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="'+iconSize+'" viewBox="0 0 24 24" width="'+iconSize+'" fill="#000000"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z"/><circle cx="12" cy="9" r="2.5"/></svg>'),


  pentagon: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="'+iconSize+'" viewBox="0 0 24 24" width="'+iconSize+'" fill="#000000"><path d="M19.63,9.78L16.56,19H7.44L4.37,9.78L12,4.44L19.63,9.78z M2,9l4,12h12l4-12L12,2L2,9z"/></svg>'),

  hexagon: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="'+iconSize+'" viewBox="0 0 24 24" width="'+iconSize+'" fill="#000000"><path d="M17.2,3H6.8l-5.2,9l5.2,9h10.4l5.2-9L17.2,3z M16.05,19H7.95l-4.04-7l4.04-7h8.09l4.04,7L16.05,19z"/></svg>'),

  links: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="'+iconSize+'" viewBox="0 -960 960 960" width="'+iconSize+'" fill="#000000"><path d="M680-80q-50 0-85-35t-35-85q0-6 3-28L282-392q-16 15-37 23.5t-45 8.5q-50 0-85-35t-35-85q0-50 35-85t85-35q24 0 45 8.5t37 23.5l281-164q-2-7-2.5-13.5T560-760q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35q-24 0-45-8.5T598-672L317-508q2 7 2.5 13.5t.5 14.5q0 8-.5 14.5T317-452l281 164q16-15 37-23.5t45-8.5q50 0 85 35t35 85q0 50-35 85t-85 35Zm0-80q17 0 28.5-11.5T720-200q0-17-11.5-28.5T680-240q-17 0-28.5 11.5T640-200q0 17 11.5 28.5T680-160ZM200-440q17 0 28.5-11.5T240-480q0-17-11.5-28.5T200-520q-17 0-28.5 11.5T160-480q0 17 11.5 28.5T200-440Zm480-280q17 0 28.5-11.5T720-760q0-17-11.5-28.5T680-800q-17 0-28.5 11.5T640-760q0 17 11.5 28.5T680-720Zm0 520ZM200-480Zm480-280Z"/></svg>'),

  wordcloud: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="'+iconSize+'" viewBox="0 0 24 24" width="'+iconSize+'" fill="'+iconColor+'"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6m0-2C9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96C18.67 6.59 15.64 4 12 4z"/><path d="m7.2385 10.065h1.6467l1.1513 4.8418 1.1424-4.8418h1.6556l1.1424 4.8418 1.1513-4.8418h1.6333l-1.5708 6.6625h-1.9814l-1.2093-5.065-1.196 5.065h-1.9814z"/></svg>'),

  edit: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="'+iconSize+'" viewBox="0 0 24 24" width="'+iconSize+'" ><path d="M0 0H24V24H0V0Z" fill="none"/><path d="M14.06 9.02L14.98 9.94L5.92 19H5V18.08L14.06 9.02V9.02ZM17.66 3C17.41 3 17.15 3.1 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C18.17 3.09 17.92 3 17.66 3V3ZM14.06 6.19L3 17.25V21H6.75L17.81 9.94L14.06 6.19V6.19Z" fill="'+iconColor+'"/></svg>'),

  settings: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="'+iconSize+'" viewBox="0 -960 960 960" width="'+iconSize+'" fill="'+iconColor+'"><path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z"/></svg>'),

  filter: iconFilter(iconColor),

  filterContrast: iconFilter(contrast),

  removefilter: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="'+iconSize+'" viewBox="0 0 24 24" width="'+iconSize+'"><g fill="'+iconColor+'"><path d="M7,6h10l-5.01,6.3L7,6z M4.25,5.61C6.27,8.2,10,13,10,13v6c0,0.55,0.45,1,1,1h2c0.55,0,1-0.45,1-1v-6 c0,0,3.72-4.8,5.74-7.39C20.25,4.95,19.78,4,18.95,4H5.04C4.21,4,3.74,4.95,4.25,5.61z"/><path d="m16.397 15.738-0.70703 0.70703 1.4238 1.4238-1.4238 1.4238 0.70703 0.70703 1.4238-1.4238 1.4238 1.4238 0.70703-0.70703-1.4238-1.4238 1.4238-1.4238-0.70703-0.70703-1.4238 1.4238z"/></g></svg>'),

  xlsx: "data:image/svg+xml;base64,PHN2ZyB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgaGVpZ2h0PSIxNCIgd2lkdGg9IjE0IiB2ZXJzaW9uPSIxLjEiIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgdmlld0JveD0iMCAwIDE0IDE0Ij4KPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMCAtMTAzOC40KSI+CjxnPgo8cmVjdCBoZWlnaHQ9IjEwLjQ3MiIgc3Ryb2tlPSIjMjA3MjQ1IiBzdHJva2Utd2lkdGg9Ii41MDIwMSIgZmlsbD0iI2ZmZiIgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIuNTM2OTYiIHdpZHRoPSI3Ljg2NDYiIHk9IjEwNDAiIHg9IjUuODc4OCIvPgo8ZyBmaWxsPSIjMjA3MjQ1Ij4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0MS4yIiB4PSIxMC4xNjUiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0Mi45IiB4PSIxMC4xNjUiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0NC43IiB4PSIxMC4xNjUiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0Ni40IiB4PSIxMC4xNjUiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0OC4yIiB4PSIxMC4xNjUiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0MS4yIiB4PSI3LjI0NzgiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0Mi45IiB4PSI3LjI0NzgiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0NC43IiB4PSI3LjI0NzgiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0Ni40IiB4PSI3LjI0NzgiLz4KPHJlY3Qgc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIHJ5PSIwIiBoZWlnaHQ9IjEuMDYwNyIgd2lkdGg9IjIuMjA5NyIgeT0iMTA0OC4yIiB4PSI3LjI0NzgiLz4KPHBhdGggc3R5bGU9ImNvbG9yLXJlbmRlcmluZzphdXRvO2NvbG9yOiMwMDAwMDA7aXNvbGF0aW9uOmF1dG87bWl4LWJsZW5kLW1vZGU6bm9ybWFsO3NoYXBlLXJlbmRlcmluZzphdXRvO3NvbGlkLWNvbG9yOiMwMDAwMDA7aW1hZ2UtcmVuZGVyaW5nOmF1dG8iIGQ9Im0wIDEwMzkuNyA4LjIzMDEtMS4zN3YxNGwtOC4yMzAxLTEuNHoiLz4KPC9nPgo8L2c+CjxnIGZpbGw9IiNmZmYiIHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEuMzI1OCAuMDYyNSAtMzM5LjcyKSI+CjxwYXRoIGQ9Im00LjQwNiAxMDQ0LjZsMS4zNzUzIDIuMDU2OC0xLjA3MjUtMC4wNjEtMC44OTAzLTEuMzU2LTAuODQ1NjYgMS4yNTc4LTAuOTQxNTYtMC4wNTMgMS4yMTg3LTEuODU0NC0xLjE3My0xLjgwMDggMC45NDE0MS0wLjAzNSAwLjgwMDE0IDEuMjAxMSAwLjgzMDQzLTEuMjYyNiAxLjA3NzUtMC4wNDFzLTEuMzIwNSAxLjk0ODItMS4zMjA1IDEuOTQ4MiIgZmlsbD0iI2ZmZiIvPgo8L2c+CjwvZz4KPC9zdmc+Cg==",

  home: iconHome(iconColor),
  
  homeContrast: iconHome(contrast),

  zoomreset: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="'+iconSize+'" viewBox="0 0 16 16" width="'+iconSize+'"><path fill="'+contrast+'" d="m9.1504 0.003906c-0.5261-0.01666-1.0639 0.03781-1.6016 0.17187-3.2061 0.79954-5.1705 4.0693-4.3711 7.2754 0.1447 0.5801 0.3727 1.1176 0.6641 1.6074l-3.5234 3.5234c-0.42548 0.42548-0.42548 1.1097 0 1.5352l0.56445 0.56445c0.42548 0.42548 1.1097 0.42548 1.5352 0l3.5273-3.5273c1.3126 0.77848 2.9169 1.0646 4.5078 0.66797 1.4626-0.36467 2.6168-1.2835 3.418-2.4355 0 0 0.20923-0.23241-0.2168-0.41602-0.426-0.1833-0.544-0.243-0.904-0.4002s-0.543 0.0879-0.543 0.0879c-0.556 0.6698-1.265 1.2212-2.18 1.4488-2.2801 0.569-4.5678-0.8031-5.1364-3.0836-0.5685-2.2802 0.8057-4.5662 3.086-5.1347 1.4153-0.35297 2.807 0.0633 3.8066 0.96484-0.70666 0.33006-1.2344 0.42773-1.2344 0.42773-0.08258 0.04919-0.13933 0.12297-0.16992 0.20703-0.0444 0.1006-0.03894 0.20452 0.01367 0.30274 0.0062 0.01315 0.0097 0.02782 0.01758 0.04102 0.03002 0.04973 0.07383 0.08777 0.11914 0.11914l-0.0039 0.002 0.07031 0.04297c0.01106 0.0076 0.02038 0.01428 0.0332 0.02148l0.10938 0.06055 1.6738 0.93164 0.54297 0.30273 0.23828 0.13281 0.83398 0.46289c0.37446 0.20818 0.67392 0.0293 0.66602-0.39844l-0.002-0.20703-0.0098-0.64258-0.01172-0.72656-0.03711-2.3125c0.001-0.0529-0.006-0.1022-0.016-0.1464l-0.002-0.002c-0.008-0.0511-0.022-0.1021-0.051-0.1485-0.075-0.1268-0.209-0.1954-0.345-0.1953-0.0033-0.000198-0.0066 0.000231-0.0098 0-0.02796 0.00072-0.05453 0.0034-0.08203 0.0098-0.0091 0.0023-0.01574 0.0029-0.02344 0.0059-0.03113 0.0087-0.06483 0.0215-0.09375 0.03906-0.01075 0.0071-0.02328 0.01702-0.03516 0.02734-0.03229 0.02515-0.06072 0.05213-0.08398 0.08398-0.03355 0.039-0.05055 0.0642-0.02344 0.03516-0.02888 0.0305-0.22976 0.23848-0.51758 0.49023-0.02507 0.01933-0.04231 0.03037-0.06641 0.04883-1.076-1.1231-2.553-1.8152-4.1308-1.8652z"/></svg>'),

  menu: "data:image/svg+xml;base64,"+btoa('<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none"/><path fill="'+iconColor+'" d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>'),

  chevron: "data:image/svg+xml;base64,"+btoa('<svg width="'+iconSize+'" height="'+iconSize+'" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M18 9L12 15L6 9" stroke="'+iconColor+'" stroke-width="2" fill="none"/></svg>')
  }
}

var b64Icons = b64IconsColor("#000000",32);

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
        if(items=="entities" && d==data.options.entityInfo){
          return false;
        }
        if(!data.options.showCoords && (d==data.options.markerLatitude || d==data.options.markerLongitude)){
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
    var aa = a.slice(), bb = b.slice();
    aa.sort();
    bb.sort();

    var ai=0, bi=0;
    var result = [];

    while( ai < aa.length && bi < bb.length ){
       if      (aa[ai] < bb[bi] ){ ai++; }
       else if (aa[ai] > bb[bi] ){ bi++; }
       else{
         result.push(aa[ai]);
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

  controls.filter = showControls(data.options,1);
  controls.buttons = showControls(data.options,2);
  controls.legends = showControls(data.options,3);
  controls.search = showControls(data.options,4);

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
