create_map <- function(center = c(0,0), zoom = 3, provider = "OpenStreetMap", defaultColor = "#2f7bee", controls = 1:3, language = c("en","es","ca")){

  object <- list(options=list())

  if(length(center)==2 && is.numeric(center)){
    object$options$center <- center
  }else{
    warning("center: must be 2 numbers (latitude and longitude)")
    object$options$center <- formals(create_map)$zoom
  }

  if(is.numeric(zoom) && zoom>=0){
    object$options$zoom <- zoom
  }else{
    warning("zoom: must be a number greater than or equal to 0")
    object$options$zoom <- formals(create_map)$zoom
  }

providers <- list_providers()
if(provider %in% providers){
  object$options$provider <- provider
}else{
  object$options$provider <- providers[1]
}

if(isColor(defaultColor)){
  object$options$defaultColor <- col2hex(defaultColor)
}else{
  warning("defaultColor: invalid color")
  object$options$defaultColor <- formals(create_map)$defaultColor
}

  if(!is.null(controls)){
    object$options[["controls"]] <- as.numeric(controls)
  }

  object$options$language <- checkLanguage(language)

  return(structure(object, class="evolMap"))
}

add_markers <- function(map, data, latitude = NULL, longitude = NULL,
  name = NULL, label = NULL, image = NULL, color = NULL, shape = NULL, text = NULL, info = NULL,
  start = NULL, end = NULL, period = NULL, markerCluster = FALSE, roundedIcons = TRUE, jitteredPoints = 0){

  if(!inherits(map, "evolMap")){
    stop("map: must be an object of class 'evolMap'")
  }

if(is.null(latitude)){
 latitude <- colnames(data)[1]
}
map$options$markerLatitude <- latitude

if(is.null(longitude)){
 longitude <- colnames(data)[2]
}
map$options$markerLongitude <- longitude

# clean missing locations
data <- data[!is.na(data[[latitude]]) & !is.na(data[[longitude]]),]

data[[latitude]] <- as.numeric(data[[latitude]])
data[[longitude]] <- as.numeric(data[[longitude]])

if(is.numeric(jitteredPoints) && jitteredPoints>0){
  data[[latitude]] <- jitter(data[[latitude]], amount = jitteredPoints)
  data[[longitude]] <- jitter(data[[longitude]], amount = jitteredPoints)
}

if(!is.null(name)){
  data[[name]] <- cleanNames(data[[name]])
}else{
  name <- "_name_"
  data[[name]] <- paste0("marker_",seq_len(nrow(data)))
}
map$options$markerName <- name

map$options$markerCluster <- NULL
if(!is.null(markerCluster) && markerCluster){
  map$options$markerCluster <- TRUE
}

map$options$roundedIcons <- NULL
if(!is.null(roundedIcons) && roundedIcons){
  map$options$roundedIcons <- TRUE
}

map$options$markerLabel <- NULL
if(!is.null(label)){
  data[[label]] <- as.character(data[[label]])
  map$options$markerLabel <- label
}

map$options$markerText <- NULL
if(!is.null(text)){
  data[[text]] <- as.character(data[[text]])
  map$options$markerText <- text
}

map$options$image <- NULL
if(!is.null(image)){
  data[[image]] <- as.character(data[[image]])
  missing <- !file.exists(data[[image]])
  if(sum(missing)!=0){
    data[missing,image] <- NA
    warning("Some images are missing!")
  }
  map$options$image <- image
}

map$options$markerInfo <- NULL
if(!is.null(info)){
  data[[info]] <- as.character(data[[info]])
  map$options$markerInfo <- info
}

map$options$markerPeriod <- NULL
if(!is.null(period)){
  data[[period]] <- as.character(data[[period]])
  map$options$markerPeriod <- period
}

  map$markers <- data

  map <- checkItemValue(map,"markers","markerColor",color,"color",isColor,applyCategoryColors,col2hex)
  if(identical(shape,"_none_")){
    map$options[["markerShape"]] <- "_none_"
  }else{
    map <- checkItemValue(map,"markers","markerShape",shape,"shape",isShape,getShapes,capitalize)
  }
  map <- checkTime(map,"markers",start,end)

  return(map)
}

add_links <- function(map, links, color = NULL, start = NULL, end = NULL, period = NULL){

  if(!inherits(map, "evolMap")){
    stop("map: must be an object of class 'evolMap'")
  }

  if(is.null(map$markers)){
    stop("You must provide markers before links")
  }

  if(is.null(map$options$markerName)){
    stop("Markers must be provided with a 'name' in order to identify each link with his source and target")
  }

  source <- 1
  links[[source]] <- as.character(links[[source]])
  target <- 2
  links[[target]] <- as.character(links[[target]])

  map$options$linkName <- "_name_"
  links[[map$options$linkName]] <- paste0(links[[source]],"_",links[[target]])

  map$options$linkPeriod <- NULL
  if(!is.null(period)){
    links[[period]] <- as.character(links[[period]])
    map$options$linkPeriod <- period
  }

  links <- links[links[[source]] %in% map$markers[[map$options$markerName]] & links[[target]] %in% map$markers[[map$options$markerName]],]
  map$links <- NULL
  if(nrow(links)){
    map$links <- links
  }

  map <- checkItemValue(map,"links","linkColor",color,"color",isColor,applyCategoryColors,col2hex)
  map <- checkTime(map,"links",start,end)

  return(map)
}

add_entities <- function(map, entities, attributes = NULL, name = NULL, label = NULL, color = NULL, text = NULL, info = NULL, start = NULL, end = NULL, period = NULL, opacity = 0.2){

  if(!inherits(map, "evolMap")){
    stop("map: must be an object of class 'evolMap'")
  }

  if(inherits(entities,"SpatialPolygonsDataFrame") || inherits(entities,"SpatialPolygons")){
    entities <- sf::st_as_sf(entities)
  }
  attr <- NULL
  geonames <- NULL
  if(inherits(entities,"sf") || inherits(entities,"sfc")){
    entities <- entities[!sf::st_is_empty(entities),]

    if(inherits(entities,"sf")){
      attr <- entities
      sf::st_geometry(attr) <- NULL
      entities <- sf::st_geometry(entities)
      if(!is.null(name)){
        geonames <- cleanNames(attr[[name]])
      }
    }

    if(identical(sf::st_is_longlat(entities),FALSE)){
      stop("entities: coordinates must be longlat degrees")
    }

    if(!is.null(attributes)){
      attr <- attributes
    }

    if(is.null(name)){
      name <- "_name_"
      geonames <- paste0("entity_",seq_along(entities))
    }else{
      if(is.null(geonames)){
        if(is.null(attr)){
          stop("name: unable to find names, missing attributes")
        }else{
          stop("name: entities are not identified by name")
        }
      }
    }
    if(length(geonames)!=length(entities)){
      stop("name: unable to uniquely match with entities")
    }
    map$geometries <- sf::st_sf(name=geonames, geom=entities)
    colnames(map$geometries)[1] <- name

    map$entities <- NULL
    if(!is.null(attr)){
      if(!(name %in% colnames(attr))){
        if(length(geonames)==nrow(attr) || length(geonames)==1){
          attr[[name]] <- geonames
        }else{
          warning("attributes: missing name column")
        }
      }
      map$entities <- as.data.frame(attr)
    }

    map$options$entityInfo <- NULL
    if(!is.null(info)){
      if(length(map$entities) && length(map$entities[[info]])){
        map$entities[[info]] <- as.character(map$entities[[info]])
        map$options$entityInfo <- info
      }else{
        warning("info: column missing in attributes")
      }
    }

    map$options$entityName <- name

    map$options$entityLabel <- NULL
    if(!is.null(label)){
      map$entities[[label]] <- as.character(map$entities[[label]])
      map$options$entityLabel <- label
    }

    map$options$entityText <- NULL
    if(!is.null(text)){
      map$entities[[text]] <- as.character(map$entities[[text]])
      map$options$entityText <- text
    }

    map$options$entityPeriod <- NULL
    if(!is.null(period)){
      data[[period]] <- as.character(data[[period]])
      map$options$entityPeriod <- period
    }

    map$options$entityOpacity <- NULL
    if(is.numeric(opacity) && opacity<=1 && opacity>=0){
      map$options$entityOpacity <- opacity
    }else{
      warning("opacity: must be numeric between 0 and 1")
    }

    map <- checkItemValue(map,"entities","entityColor",color,"color",isColor,applyCategoryColors,col2hex)
    map <- checkTime(map,"entities",start,end)
  }else{
    warning("entities: must be a spatial object")
  }

  return(map)
}

add_periods <- function(map, periods, name = NULL, start = NULL, end = NULL, latitude = NULL, longitude = NULL, zoom = NULL, description = NULL, duration = NULL, periodrep = TRUE){
  if(!inherits(map, "evolMap")){
    stop("map: must be an object of class 'evolMap'")
  }

  if(is.null(name)){
    name <- colnames(periods)[1]
  }
  periods[,name] <- cleanNames(periods[,name])
  map$options$periodName <- name

  if(is.null(start)){
    start <- colnames(periods)[2]
  }
  periods[,start] <- as.numeric(periods[,start])
  map$options$periodStart <- start

  if(is.null(end)){
    end <- colnames(periods)[3]
  }
  periods[,end] <- as.numeric(periods[,end])
  map$options$periodEnd <- end

  map$options$periodLatitude <- NULL
  if(!is.null(latitude)){
    periods[,latitude] <- as.numeric(periods[,latitude])
    map$options$periodLatitude <- latitude
  }

  map$options$periodLongitude <- NULL
  if(!is.null(longitude)){
    periods[,longitude] <- as.numeric(periods[,longitude])
    map$options$periodLongitude <- longitude
  }

  map$options$periodZoom <- NULL
  if(!is.null(zoom)){
    periods[,zoom] <- as.numeric(periods[,zoom])
    map$options$periodZoom <- zoom
  }

  map$options$periodDescription <- NULL
  if(!is.null(description)){
    periods[,description] <- as.character(periods[,description])
    map$options$periodDescription <- description
  }

  map$options$periodDuration <- NULL
  if(!is.null(duration)){
    periods[,duration] <- as.numeric(periods[,duration])
    map$options$periodDuration <- duration
  }

  map$options$byperiod <- NULL
  if(!is.null(periodrep) && periodrep){
    map$options$byperiod <- TRUE
  }

  map$periods <- periods

  return(map)
}

add_description <- function(map, content = "", width = NULL){
  if(!inherits(map, "evolMap")){
    stop("map: must be an object of class 'evolMap'")
  }

  map$options[["description"]] <- content
  map$options[["descriptionWidth"]] <- NULL
  if (!is.null(width)){
    if(is.numeric(width) && width>=0 && width<=100){
      map$options[["descriptionWidth"]] <- width
    }else{
      warning("width: not a valid percentage.")
    }
  }

  return(map)
}

map_html <- function(object, directory){
  language <- checkLanguage(object$options$language)
  language <- paste0(language,".js")

  styles <- "leaflet.css"
  scripts <- c("d3.min.js", "d3.layout.cloud.js", "leaflet.js", "leaflet-providers.js")
  if(!is.null(object$options$markerCluster) && object$options$markerCluster){
    styles <- c(styles, "MarkerCluster.css", "MarkerCluster.Default.css")
    scripts <- c(scripts, "leaflet.markercluster.js")
  }
  if(length(object$links)){
    scripts <- c(scripts, "leaflet.curve.js")
  }
  styles <- c(styles, "styles.css")
  scripts <- c(scripts, "jszip.min.js","iro.min.js", language, "create_map.js")

  indexfile <- paste0(directory,"/index.html")
  if(file.exists(directory)){
    if(file.exists(indexfile)){
      content <- scan(file = indexfile, what = character(0), sep = "\n", quiet = TRUE)
      if(sum(content=="<!--netCoin Project-->")==1){
        unlink(directory, recursive = TRUE)
      }else{
        stop(paste0("directory: '",directory,"' already exists"))
      }
    }else{
      stop(paste0("directory: '",directory,"' already exists"))
    }
  }
  dir.create(directory)

  if(!is.null(object$options$image)){
    dir.create(paste0(directory,"/images"))
    for(i in seq_along(object$markers[[object$options$image]])){
      imagefile <- object$markers[[i,object$options$image]]
      if(!is.na(imagefile)){
        rawname <- getRawName(basename(imagefile))
        file.copy(imagefile,paste0(directory,"/images/",rawname))
        object$markers[i,object$options$image] <- paste0("images/",rawname)
      }
    }
  }

  #prepare data and parse to json
  data <- list(colors = list(categoryColors = categoryColors, colorScales = colorScales), shapes = symbolTypes(), options = object$options)

  #markers
  if(length(object$markers)){
    data$markers <- DFdecompose(object$markers)
  }

  #links
  if(length(object$links)){
    data$links <- DFdecompose(object$links)
  }

  #geometry attributes
  if(length(object$entities)){
    data$entities <- DFdecompose(object$entities)
  }

  #periods
  if(length(object$periods)){
    data$periods <- DFdecompose(object$periods)
  }

  json <- toJSON(data,na='null',auto_unbox=TRUE)
  json <- check_utf8(json)
  con <- file(paste0(directory,"/data.js"), encoding = "UTF-8")
  writeLines(paste0("var data = ",json,";"),con)
  close(con)

  www <- system.file("www",package="evolMap")

  dir.create(paste0(directory,"/lib"))

  indexhtml <- c('<!DOCTYPE html>',
'<html>',
'<head>',
'<meta charset="UTF-8">',
'<!--netCoin Project-->',
paste0('<title>',basename(directory),'</title>'))
for(style in styles){
  file.copy(paste0(www,"/",style),paste0(directory,"/lib"))
  indexhtml <- c(indexhtml,paste0('<link rel="stylesheet" href="lib/',style,'" />'))
}
for(script in scripts){
  file.copy(paste0(www,"/",script),paste0(directory,"/lib"))
  indexhtml <- c(indexhtml,paste0('<script src="lib/',script,'"></script>'))
}
indexhtml <- c(indexhtml, '<script src="data.js"></script>')
if(length(object$geometries)){
  temp_file <- tempfile(fileext = ".geojson")
  sf::st_write(object$geometries, temp_file, quiet=TRUE)
  geojson <- paste0(scan(file = temp_file, what = character(0), sep = "\n", quiet = TRUE), collapse="")
  write(paste0("var geojson = ",geojson,";"),file=paste0(directory,"/geojson.js"))
  indexhtml <- c(indexhtml, '<script src="geojson.js"></script>')
}
indexhtml <- c(indexhtml,
'</head>',
'<body>',
'</body>',
'</html>')

  write(paste0(indexhtml,collapse="\n"),indexfile)
}

printTable <- function(x, name){
  cat("\n",name,"(",nrow(x),"):\n",sep="")
  row.names(x)<-NULL
  print(as.data.frame(head(x)),row.names=F)
  if (nrow(x)>6) cat("...\n")
}

print.evolMap <- function(x, ...) {
  printTable(x$markers,"Markers")
}

plot.evolMap <- function(x, directory = tempdir(), ...){
  map_html(x, directory)
  browseURL(normalizePath(paste(directory, "index.html", sep = "/")))
}
